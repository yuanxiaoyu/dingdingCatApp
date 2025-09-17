import SQLite from 'react-native-sqlite-storage';
import { logger } from '../utils/logger';

// 启用调试模式
SQLite.DEBUG(false);
SQLite.enablePromise(true);

/**
 * 离线广告数据接口
 */
export interface OfflineAdData {
  id?: number;
  userId: number;
  appKey: string;
  adId: string;
  adType: 'splash' | 'video' | 'interstitial' | 'banner';
  eventType: 'show' | 'click' | 'complete' | 'skip' | 'close';
  playData: string; // JSON string
  timestamp: number;
  synced: boolean;
  retryCount: number;
  createdAt: number;
}

/**
 * 数据库查询选项
 */
interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

/**
 * DatabaseService - 处理 SQLite 数据库操作
 * 主要用于离线数据存储和管理
 */
export class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLite.SQLiteDatabase | null = null;
  private readonly dbName = 'dingding_cat.db';
  private readonly dbVersion = '1.0';
  private readonly dbDisplayName = 'DingDing Cat Database';
  private readonly dbSize = 200000;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    try {
      if (this.db) {
        return; // 已经初始化
      }

      this.db = await SQLite.openDatabase({
        name: this.dbName,
        version: this.dbVersion,
        displayName: this.dbDisplayName,
        size: this.dbSize,
        location: 'default'
      });

      await this.createTables();
      logger.info('DatabaseService', 'Database initialized successfully');
    } catch (error) {
      logger.error('DatabaseService', 'Failed to initialize database', error);
      throw new Error(`Database initialization failed: ${error}`);
    }
  }

  /**
   * 创建数据表
   */
  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // 创建离线广告数据表
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS offline_ad_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          appKey TEXT NOT NULL,
          adId TEXT NOT NULL,
          adType TEXT NOT NULL CHECK (adType IN ('splash', 'video', 'interstitial', 'banner')),
          eventType TEXT NOT NULL CHECK (eventType IN ('show', 'click', 'complete', 'skip', 'close')),
          playData TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          synced BOOLEAN DEFAULT FALSE,
          retryCount INTEGER DEFAULT 0,
          createdAt INTEGER NOT NULL,
          INDEX idx_synced (synced),
          INDEX idx_userId (userId),
          INDEX idx_timestamp (timestamp),
          INDEX idx_adType (adType)
        )
      `);

      // 创建配置缓存表
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS config_cache (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          configKey TEXT UNIQUE NOT NULL,
          configData TEXT NOT NULL,
          version TEXT NOT NULL,
          checksum TEXT,
          createdAt INTEGER NOT NULL,
          updatedAt INTEGER NOT NULL,
          INDEX idx_configKey (configKey),
          INDEX idx_version (version)
        )
      `);

      // 创建用户会话表
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          sessionId TEXT UNIQUE NOT NULL,
          startTime INTEGER NOT NULL,
          endTime INTEGER,
          deviceInfo TEXT,
          appVersion TEXT,
          INDEX idx_userId (userId),
          INDEX idx_sessionId (sessionId)
        )
      `);

      logger.info('DatabaseService', 'Database tables created successfully');
    } catch (error) {
      logger.error('DatabaseService', 'Failed to create tables', error);
      throw error;
    }
  }

  /**
   * 插入离线广告数据
   */
  async insertOfflineAdData(data: Omit<OfflineAdData, 'id' | 'createdAt'>): Promise<number> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const result = await this.db!.executeSql(
        `INSERT INTO offline_ad_data 
         (userId, appKey, adId, adType, eventType, playData, timestamp, synced, retryCount, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.userId,
          data.appKey,
          data.adId,
          data.adType,
          data.eventType,
          data.playData,
          data.timestamp,
          data.synced ? 1 : 0,
          data.retryCount,
          Date.now()
        ]
      );

      const insertId = result[0].insertId;
      logger.debug('DatabaseService', `Inserted offline ad data with ID: ${insertId}`);
      return insertId;
    } catch (error) {
      logger.error('DatabaseService', 'Failed to insert offline ad data', error);
      throw error;
    }
  }

  /**
   * 获取未同步的离线数据
   */
  async getUnsyncedAdData(options: QueryOptions = {}): Promise<OfflineAdData[]> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const {
        limit = 100,
        offset = 0,
        orderBy = 'createdAt',
        orderDirection = 'ASC'
      } = options;

      const result = await this.db!.executeSql(
        `SELECT * FROM offline_ad_data 
         WHERE synced = FALSE 
         ORDER BY ${orderBy} ${orderDirection}
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      const data: OfflineAdData[] = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        const row = result[0].rows.item(i);
        data.push({
          ...row,
          synced: Boolean(row.synced)
        });
      }

      return data;
    } catch (error) {
      logger.error('DatabaseService', 'Failed to get unsynced ad data', error);
      return [];
    }
  }

  /**
   * 标记数据为已同步
   */
  async markAsSynced(ids: number[]): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const placeholders = ids.map(() => '?').join(',');
      await this.db!.executeSql(
        `UPDATE offline_ad_data SET synced = TRUE WHERE id IN (${placeholders})`,
        ids
      );

      logger.debug('DatabaseService', `Marked ${ids.length} records as synced`);
    } catch (error) {
      logger.error('DatabaseService', 'Failed to mark records as synced', error);
      throw error;
    }
  }

  /**
   * 增加重试次数
   */
  async incrementRetryCount(ids: number[]): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const placeholders = ids.map(() => '?').join(',');
      await this.db!.executeSql(
        `UPDATE offline_ad_data SET retryCount = retryCount + 1 WHERE id IN (${placeholders})`,
        ids
      );

      logger.debug('DatabaseService', `Incremented retry count for ${ids.length} records`);
    } catch (error) {
      logger.error('DatabaseService', 'Failed to increment retry count', error);
      throw error;
    }
  }

  /**
   * 删除已同步的旧数据
   */
  async cleanupSyncedData(olderThanDays: number = 7): Promise<number> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
      const result = await this.db!.executeSql(
        'DELETE FROM offline_ad_data WHERE synced = TRUE AND createdAt < ?',
        [cutoffTime]
      );

      const deletedCount = result[0].rowsAffected;
      logger.info('DatabaseService', `Cleaned up ${deletedCount} synced records`);
      return deletedCount;
    } catch (error) {
      logger.error('DatabaseService', 'Failed to cleanup synced data', error);
      return 0;
    }
  }

  /**
   * 获取数据库统计信息
   */
  async getDatabaseStats(): Promise<{
    totalRecords: number;
    unsyncedRecords: number;
    syncedRecords: number;
    failedRecords: number;
    oldestRecord: number | null;
    newestRecord: number | null;
  }> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      // 总记录数
      const totalResult = await this.db!.executeSql(
        'SELECT COUNT(*) as count FROM offline_ad_data'
      );
      const totalRecords = totalResult[0].rows.item(0).count;

      // 未同步记录数
      const unsyncedResult = await this.db!.executeSql(
        'SELECT COUNT(*) as count FROM offline_ad_data WHERE synced = FALSE'
      );
      const unsyncedRecords = unsyncedResult[0].rows.item(0).count;

      // 已同步记录数
      const syncedResult = await this.db!.executeSql(
        'SELECT COUNT(*) as count FROM offline_ad_data WHERE synced = TRUE'
      );
      const syncedRecords = syncedResult[0].rows.item(0).count;

      // 失败记录数（重试次数 > 3）
      const failedResult = await this.db!.executeSql(
        'SELECT COUNT(*) as count FROM offline_ad_data WHERE retryCount > 3'
      );
      const failedRecords = failedResult[0].rows.item(0).count;

      // 最老和最新记录时间
      const timeResult = await this.db!.executeSql(
        'SELECT MIN(createdAt) as oldest, MAX(createdAt) as newest FROM offline_ad_data'
      );
      const timeRow = timeResult[0].rows.item(0);

      return {
        totalRecords,
        unsyncedRecords,
        syncedRecords,
        failedRecords,
        oldestRecord: timeRow.oldest,
        newestRecord: timeRow.newest
      };
    } catch (error) {
      logger.error('DatabaseService', 'Failed to get database stats', error);
      return {
        totalRecords: 0,
        unsyncedRecords: 0,
        syncedRecords: 0,
        failedRecords: 0,
        oldestRecord: null,
        newestRecord: null
      };
    }
  }

  /**
   * 执行数据库维护
   */
  async performMaintenance(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      // 清理旧的已同步数据
      await this.cleanupSyncedData(7);

      // 执行 VACUUM 优化数据库
      await this.db!.executeSql('VACUUM');

      // 分析表以优化查询性能
      await this.db!.executeSql('ANALYZE');

      logger.info('DatabaseService', 'Database maintenance completed');
    } catch (error) {
      logger.error('DatabaseService', 'Failed to perform database maintenance', error);
      throw error;
    }
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    if (this.db) {
      try {
        await this.db.close();
        this.db = null;
        logger.info('DatabaseService', 'Database connection closed');
      } catch (error) {
        logger.error('DatabaseService', 'Failed to close database', error);
        throw error;
      }
    }
  }

  /**
   * 删除数据库
   */
  async deleteDatabase(): Promise<void> {
    try {
      if (this.db) {
        await this.close();
      }
      
      await SQLite.deleteDatabase({
        name: this.dbName,
        location: 'default'
      });
      
      logger.info('DatabaseService', 'Database deleted successfully');
    } catch (error) {
      logger.error('DatabaseService', 'Failed to delete database', error);
      throw error;
    }
  }
}

// 导出单例实例
export default DatabaseService.getInstance();