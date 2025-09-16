import SQLite from 'react-native-sqlite-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';
import { 
  OfflineAdData, 
  AdEventType, 
  AdType, 
  AdPlayData,
  BatchReportRequest,
  BatchReportPlayData,
  ApiResponse 
} from '../types';

// Storage keys
const STORAGE_KEYS = {
  LAST_SYNC_TIME: '@dingdingcat/last_sync_time',
  SYNC_QUEUE_SIZE: '@dingdingcat/sync_queue_size',
} as const;

// Database configuration
const DB_CONFIG = {
  name: 'DingDingCat.db',
  version: '1.0',
  displayName: 'DingDingCat Database',
  size: 200000, // 200KB
} as const;

// Sync configuration
interface SyncConfig {
  maxRetries: number;
  batchSize: number;
  syncInterval: number; // milliseconds
  maxQueueSize: number;
  autoSyncEnabled: boolean;
}

const DEFAULT_SYNC_CONFIG: SyncConfig = {
  maxRetries: 3,
  batchSize: 50,
  syncInterval: 30000, // 30 seconds
  maxQueueSize: 1000,
  autoSyncEnabled: true,
};

/**
 * SyncService - Handles offline data storage and synchronization
 * 
 * Features:
 * - SQLite database for offline data storage
 * - Network state monitoring
 * - Automatic batch synchronization
 * - Retry mechanism with exponential backoff
 * - Queue size management
 */
class SyncService {
  private database: SQLite.SQLiteDatabase | null = null;
  private syncConfig: SyncConfig;
  private isSyncing = false;
  private syncTimer: NodeJS.Timeout | null = null;
  private networkUnsubscribe: (() => void) | null = null;
  private isNetworkConnected = false;

  constructor(config?: Partial<SyncConfig>) {
    this.syncConfig = { ...DEFAULT_SYNC_CONFIG, ...config };
    // Don't auto-initialize in constructor to allow for proper testing
    // Call initialize() manually when needed
  }

  /**
   * Initialize the sync service
   */
  public async initialize(): Promise<void> {
    try {
      await this.initializeDatabase();
      await this.setupNetworkMonitoring();
      
      if (this.syncConfig.autoSyncEnabled) {
        this.startAutoSync();
      }

      console.log('SyncService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SyncService:', error);
      throw error;
    }
  }

  /**
   * Initialize SQLite database
   */
  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      SQLite.DEBUG(false);
      SQLite.enablePromise(true);

      SQLite.openDatabase(
        DB_CONFIG.name,
        DB_CONFIG.version,
        DB_CONFIG.displayName,
        DB_CONFIG.size
      )
        .then((db) => {
          this.database = db;
          return this.createTables();
        })
        .then(() => {
          console.log('Database initialized successfully');
          resolve();
        })
        .catch((error) => {
          console.error('Database initialization failed:', error);
          reject(error);
        });
    });
  }

  /**
   * Create database tables
   */
  private async createTables(): Promise<void> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS offline_ad_data (
        id TEXT PRIMARY KEY,
        userId INTEGER NOT NULL,
        appKey TEXT NOT NULL,
        adId TEXT NOT NULL,
        adType TEXT NOT NULL,
        eventType TEXT NOT NULL,
        playData TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        synced INTEGER DEFAULT 0,
        retryCount INTEGER DEFAULT 0,
        createdAt INTEGER DEFAULT (strftime('%s', 'now')),
        updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `;

    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_offline_ad_data_synced 
      ON offline_ad_data(synced);
      
      CREATE INDEX IF NOT EXISTS idx_offline_ad_data_timestamp 
      ON offline_ad_data(timestamp);
      
      CREATE INDEX IF NOT EXISTS idx_offline_ad_data_user 
      ON offline_ad_data(userId);
    `;

    try {
      await this.database.executeSql(createTableSQL);
      await this.database.executeSql(createIndexSQL);
      console.log('Database tables created successfully');
    } catch (error) {
      console.error('Failed to create database tables:', error);
      throw error;
    }
  }

  /**
   * Setup network state monitoring
   */
  private async setupNetworkMonitoring(): Promise<void> {
    // Get initial network state
    const netInfo = await NetInfo.fetch();
    this.isNetworkConnected = netInfo.isConnected ?? false;

    // Subscribe to network state changes
    this.networkUnsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const wasConnected = this.isNetworkConnected;
      this.isNetworkConnected = state.isConnected ?? false;

      console.log('Network state changed:', {
        isConnected: this.isNetworkConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
      });

      // Trigger sync when network becomes available
      if (!wasConnected && this.isNetworkConnected) {
        console.log('Network reconnected, triggering sync...');
        this.syncOfflineData();
      }
    });
  }

  /**
   * Start automatic synchronization timer
   */
  private startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.isNetworkConnected && !this.isSyncing) {
        this.syncOfflineData();
      }
    }, this.syncConfig.syncInterval);

    console.log(`Auto sync started with interval: ${this.syncConfig.syncInterval}ms`);
  }

  /**
   * Stop automatic synchronization
   */
  private stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('Auto sync stopped');
    }
  }

  /**
   * Queue offline ad data for later synchronization
   */
  public async queueOfflineData(
    userId: number,
    appKey: string,
    adId: string,
    adType: AdType,
    eventType: AdEventType,
    playData: AdPlayData
  ): Promise<string> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    // Check queue size limit
    const queueSize = await this.getQueueSize();
    if (queueSize >= this.syncConfig.maxQueueSize) {
      console.warn('Queue size limit reached, removing oldest entries');
      await this.cleanupOldEntries();
    }

    const offlineData: OfflineAdData = {
      id: this.generateId(),
      userId,
      appKey,
      adId,
      adType,
      eventType,
      playData,
      timestamp: Date.now(),
      synced: false,
      retryCount: 0,
    };

    try {
      const insertSQL = `
        INSERT INTO offline_ad_data 
        (id, userId, appKey, adId, adType, eventType, playData, timestamp, synced, retryCount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await this.database.executeSql(insertSQL, [
        offlineData.id,
        offlineData.userId,
        offlineData.appKey,
        offlineData.adId,
        offlineData.adType,
        offlineData.eventType,
        JSON.stringify(offlineData.playData),
        offlineData.timestamp,
        offlineData.synced ? 1 : 0,
        offlineData.retryCount,
      ]);

      console.log('Offline data queued:', {
        id: offlineData.id,
        adType: offlineData.adType,
        eventType: offlineData.eventType,
      });

      // Update queue size in storage
      await this.updateQueueSize();

      // Trigger immediate sync if network is available
      if (this.isNetworkConnected && !this.isSyncing) {
        setTimeout(() => this.syncOfflineData(), 1000);
      }

      return offlineData.id;
    } catch (error) {
      console.error('Failed to queue offline data:', error);
      throw error;
    }
  }

  /**
   * Synchronize offline data with server
   */
  public async syncOfflineData(): Promise<void> {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    if (!this.isNetworkConnected) {
      console.log('No network connection, skipping sync');
      return;
    }

    if (!this.database) {
      throw new Error('Database not initialized');
    }

    this.isSyncing = true;

    try {
      console.log('Starting offline data synchronization...');

      // Get unsynced data
      const unsyncedData = await this.getUnsyncedData();
      
      if (unsyncedData.length === 0) {
        console.log('No data to sync');
        return;
      }

      console.log(`Found ${unsyncedData.length} items to sync`);

      // Group data by user for batch reporting
      const userGroups = this.groupDataByUser(unsyncedData);

      let totalSynced = 0;
      let totalFailed = 0;

      // Process each user group
      for (const [userId, userData] of userGroups.entries()) {
        try {
          const result = await this.batchReportUserData(userId, userData);
          if (result.success) {
            await this.markDataAsSynced(result.syncedIds);
            totalSynced += result.syncedIds.length;
          } else {
            await this.incrementRetryCount(result.failedIds);
            totalFailed += result.failedIds.length;
          }
        } catch (error) {
          console.error(`Failed to sync data for user ${userId}:`, error);
          await this.incrementRetryCount(userData.map(d => d.id));
          totalFailed += userData.length;
        }
      }

      // Update last sync time
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_SYNC_TIME,
        Date.now().toString()
      );

      // Update queue size
      await this.updateQueueSize();

      console.log(`Sync completed: ${totalSynced} synced, ${totalFailed} failed`);

    } catch (error) {
      console.error('Sync process failed:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Get unsynced data from database
   */
  private async getUnsyncedData(): Promise<OfflineAdData[]> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    const selectSQL = `
      SELECT * FROM offline_ad_data 
      WHERE synced = 0 AND retryCount < ?
      ORDER BY timestamp ASC
      LIMIT ?
    `;

    try {
      const [results] = await this.database.executeSql(selectSQL, [
        this.syncConfig.maxRetries,
        this.syncConfig.batchSize * 10, // Get more data to group by users
      ]);

      const data: OfflineAdData[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        data.push({
          id: row.id,
          userId: row.userId,
          appKey: row.appKey,
          adId: row.adId,
          adType: row.adType as AdType,
          eventType: row.eventType as AdEventType,
          playData: JSON.parse(row.playData),
          timestamp: row.timestamp,
          synced: row.synced === 1,
          retryCount: row.retryCount,
        });
      }

      return data;
    } catch (error) {
      console.error('Failed to get unsynced data:', error);
      throw error;
    }
  }

  /**
   * Group data by user ID
   */
  private groupDataByUser(data: OfflineAdData[]): Map<number, OfflineAdData[]> {
    const groups = new Map<number, OfflineAdData[]>();

    data.forEach(item => {
      if (!groups.has(item.userId)) {
        groups.set(item.userId, []);
      }
      groups.get(item.userId)!.push(item);
    });

    return groups;
  }

  /**
   * Batch report user data to server
   */
  private async batchReportUserData(
    userId: number,
    userData: OfflineAdData[]
  ): Promise<{ success: boolean; syncedIds: string[]; failedIds: string[] }> {
    try {
      // Limit batch size
      const batchData = userData.slice(0, this.syncConfig.batchSize);
      
      // Convert to batch report format
      const playDataList: BatchReportPlayData[] = batchData.map(item => ({
        adType: item.adType,
        playDuration: item.playData.playDuration,
        isClicked: item.playData.isClicked ? '1' : '0',
        isSkipped: item.playData.isSkipped ? '1' : '0',
        stayDuration: item.playData.stayDuration,
      }));

      const batchRequest: BatchReportRequest = {
        userId,
        appKey: batchData[0].appKey,
        playDataList,
      };

      console.log(`Batch reporting ${batchData.length} items for user ${userId}`);

      // Call batch report API
      const response: ApiResponse = await apiClient.post('/ad/batchReport', batchRequest);

      if (response.code === 200) {
        console.log(`Batch report successful for user ${userId}`);
        return {
          success: true,
          syncedIds: batchData.map(d => d.id),
          failedIds: [],
        };
      } else {
        console.error(`Batch report failed for user ${userId}:`, response.message);
        return {
          success: false,
          syncedIds: [],
          failedIds: batchData.map(d => d.id),
        };
      }
    } catch (error) {
      console.error(`Batch report error for user ${userId}:`, error);
      return {
        success: false,
        syncedIds: [],
        failedIds: userData.map(d => d.id),
      };
    }
  }

  /**
   * Mark data as synced in database
   */
  private async markDataAsSynced(ids: string[]): Promise<void> {
    if (!this.database || ids.length === 0) {
      return;
    }

    const placeholders = ids.map(() => '?').join(',');
    const updateSQL = `
      UPDATE offline_ad_data 
      SET synced = 1, updatedAt = strftime('%s', 'now')
      WHERE id IN (${placeholders})
    `;

    try {
      await this.database.executeSql(updateSQL, ids);
      console.log(`Marked ${ids.length} items as synced`);
    } catch (error) {
      console.error('Failed to mark data as synced:', error);
      throw error;
    }
  }

  /**
   * Increment retry count for failed items
   */
  private async incrementRetryCount(ids: string[]): Promise<void> {
    if (!this.database || ids.length === 0) {
      return;
    }

    const placeholders = ids.map(() => '?').join(',');
    const updateSQL = `
      UPDATE offline_ad_data 
      SET retryCount = retryCount + 1, updatedAt = strftime('%s', 'now')
      WHERE id IN (${placeholders})
    `;

    try {
      await this.database.executeSql(updateSQL, ids);
      console.log(`Incremented retry count for ${ids.length} items`);
    } catch (error) {
      console.error('Failed to increment retry count:', error);
      throw error;
    }
  }

  /**
   * Get current queue size
   */
  public async getQueueSize(): Promise<number> {
    if (!this.database) {
      return 0;
    }

    const countSQL = 'SELECT COUNT(*) as count FROM offline_ad_data WHERE synced = 0';

    try {
      const [results] = await this.database.executeSql(countSQL);
      return results.rows.item(0).count;
    } catch (error) {
      console.error('Failed to get queue size:', error);
      return 0;
    }
  }

  /**
   * Update queue size in storage
   */
  private async updateQueueSize(): Promise<void> {
    try {
      const size = await this.getQueueSize();
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE_SIZE, size.toString());
    } catch (error) {
      console.error('Failed to update queue size:', error);
    }
  }

  /**
   * Clean up old entries when queue is full
   */
  private async cleanupOldEntries(): Promise<void> {
    if (!this.database) {
      return;
    }

    const deleteSQL = `
      DELETE FROM offline_ad_data 
      WHERE id IN (
        SELECT id FROM offline_ad_data 
        WHERE synced = 0 
        ORDER BY timestamp ASC 
        LIMIT ?
      )
    `;

    const cleanupCount = Math.floor(this.syncConfig.maxQueueSize * 0.1); // Remove 10%

    try {
      await this.database.executeSql(deleteSQL, [cleanupCount]);
      console.log(`Cleaned up ${cleanupCount} old entries`);
    } catch (error) {
      console.error('Failed to cleanup old entries:', error);
    }
  }

  /**
   * Clear all synced data
   */
  public async clearSyncedData(): Promise<void> {
    if (!this.database) {
      return;
    }

    const deleteSQL = 'DELETE FROM offline_ad_data WHERE synced = 1';

    try {
      const [result] = await this.database.executeSql(deleteSQL);
      console.log(`Cleared ${result.rowsAffected} synced entries`);
      await this.updateQueueSize();
    } catch (error) {
      console.error('Failed to clear synced data:', error);
      throw error;
    }
  }

  /**
   * Get sync statistics
   */
  public async getSyncStats(): Promise<{
    totalQueued: number;
    synced: number;
    pending: number;
    failed: number;
    lastSyncTime: number | null;
  }> {
    if (!this.database) {
      return {
        totalQueued: 0,
        synced: 0,
        pending: 0,
        failed: 0,
        lastSyncTime: null,
      };
    }

    try {
      const statsSQL = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN synced = 1 THEN 1 ELSE 0 END) as synced,
          SUM(CASE WHEN synced = 0 AND retryCount < ? THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN synced = 0 AND retryCount >= ? THEN 1 ELSE 0 END) as failed
        FROM offline_ad_data
      `;

      const [results] = await this.database.executeSql(statsSQL, [
        this.syncConfig.maxRetries,
        this.syncConfig.maxRetries,
      ]);

      const stats = results.rows.item(0);
      const lastSyncTimeStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC_TIME);

      return {
        totalQueued: stats.total,
        synced: stats.synced,
        pending: stats.pending,
        failed: stats.failed,
        lastSyncTime: lastSyncTimeStr ? parseInt(lastSyncTimeStr) : null,
      };
    } catch (error) {
      console.error('Failed to get sync stats:', error);
      throw error;
    }
  }

  /**
   * Force sync all pending data
   */
  public async forceSyncAll(): Promise<void> {
    console.log('Force syncing all pending data...');
    
    if (!this.isNetworkConnected) {
      throw new Error('No network connection available');
    }

    // Reset retry counts for failed items
    if (this.database) {
      const resetSQL = 'UPDATE offline_ad_data SET retryCount = 0 WHERE synced = 0';
      await this.database.executeSql(resetSQL);
    }

    await this.syncOfflineData();
  }

  /**
   * Update sync configuration
   */
  public updateSyncConfig(config: Partial<SyncConfig>): void {
    this.syncConfig = { ...this.syncConfig, ...config };
    
    if (config.autoSyncEnabled !== undefined) {
      if (config.autoSyncEnabled) {
        this.startAutoSync();
      } else {
        this.stopAutoSync();
      }
    }

    if (config.syncInterval && this.syncConfig.autoSyncEnabled) {
      this.startAutoSync(); // Restart with new interval
    }

    console.log('Sync configuration updated:', this.syncConfig);
  }

  /**
   * Check if sync is currently running
   */
  public isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Check network connectivity status
   */
  public isNetworkAvailable(): boolean {
    return this.isNetworkConnected;
  }

  /**
   * Generate unique ID for offline data
   */
  private generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup and close database connection
   */
  public async cleanup(): Promise<void> {
    console.log('Cleaning up SyncService...');

    // Stop auto sync
    this.stopAutoSync();

    // Unsubscribe from network events
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = null;
    }

    // Close database connection
    if (this.database) {
      try {
        await this.database.close();
        this.database = null;
        console.log('Database connection closed');
      } catch (error) {
        console.error('Failed to close database:', error);
      }
    }

    console.log('SyncService cleanup completed');
  }
}

// Create singleton instance
const syncService = new SyncService();

export default syncService;
export { SyncService };