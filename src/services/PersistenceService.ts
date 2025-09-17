import storageService from './StorageService';
import secureStorageService from './SecureStorageService';
import cacheService from './CacheService';
import databaseService, { OfflineAdData } from './DatabaseService';
import { logger } from '../utils/logger';

/**
 * 持久化配置选项
 */
interface PersistenceOptions {
  useEncryption?: boolean;
  ttl?: number;
  version?: string;
  checksum?: string;
}

/**
 * 存储统计信息
 */
interface StorageStats {
  storage: {
    totalKeys: number;
    estimatedSize: number;
  };
  secureStorage: {
    totalServices: number;
    services: string[];
  };
  cache: {
    totalCacheItems: number;
    totalConfigItems: number;
    expiredItems: number;
    totalSize: number;
  };
  database: {
    totalRecords: number;
    unsyncedRecords: number;
    syncedRecords: number;
    failedRecords: number;
    oldestRecord: number | null;
    newestRecord: number | null;
  };
}

/**
 * PersistenceService - 统一的数据持久化服务
 * 协调 StorageService、SecureStorageService、CacheService 和 DatabaseService
 */
export class PersistenceService {
  private static instance: PersistenceService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): PersistenceService {
    if (!PersistenceService.instance) {
      PersistenceService.instance = new PersistenceService();
    }
    return PersistenceService.instance;
  }

  /**
   * 初始化持久化服务
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 初始化数据库
      await databaseService.initialize();
      
      // 检查安全存储可用性
      const isKeychainAvailable = await secureStorageService.isKeychainAvailable();
      if (!isKeychainAvailable) {
        logger.warn('PersistenceService', 'Keychain not available, secure storage disabled');
      }

      // 清理过期缓存
      await cacheService.cleanExpiredCache();

      this.initialized = true;
      logger.info('PersistenceService', 'Persistence service initialized successfully');
    } catch (error) {
      logger.error('PersistenceService', 'Failed to initialize persistence service', error);
      throw error;
    }
  }

  /**
   * 存储用户数据
   */
  async storeUserData(key: string, data: any, options: PersistenceOptions = {}): Promise<void> {
    try {
      if (options.useEncryption) {
        // 敏感数据使用安全存储
        await secureStorageService.setSecureItem(key, JSON.stringify(data));
      } else {
        // 普通数据使用常规存储
        await storageService.setItem(key, data);
      }
      
      logger.debug('PersistenceService', `Stored user data for key: ${key}`);
    } catch (error) {
      logger.error('PersistenceService', `Failed to store user data for key: ${key}`, error);
      throw error;
    }
  }

  /**
   * 获取用户数据
   */
  async getUserData<T>(key: string, useEncryption: boolean = false): Promise<T | null> {
    try {
      if (useEncryption) {
        const data = await secureStorageService.getSecureItem(key);
        return data ? JSON.parse(data) : null;
      } else {
        return await storageService.getItem<T>(key);
      }
    } catch (error) {
      logger.error('PersistenceService', `Failed to get user data for key: ${key}`, error);
      return null;
    }
  }

  /**
   * 存储配置数据
   */
  async storeConfig<T>(key: string, data: T, version: string, checksum?: string): Promise<void> {
    try {
      await cacheService.setConfig(key, data, version, checksum);
      logger.debug('PersistenceService', `Stored config for key: ${key}, version: ${version}`);
    } catch (error) {
      logger.error('PersistenceService', `Failed to store config for key: ${key}`, error);
      throw error;
    }
  }

  /**
   * 获取配置数据
   */
  async getConfig<T>(key: string): Promise<T | null> {
    try {
      return await cacheService.getConfig<T>(key);
    } catch (error) {
      logger.error('PersistenceService', `Failed to get config for key: ${key}`, error);
      return null;
    }
  }

  /**
   * 检查配置是否需要更新
   */
  async shouldUpdateConfig(key: string, serverVersion: string): Promise<boolean> {
    try {
      return await cacheService.shouldUpdateConfig(key, serverVersion);
    } catch (error) {
      logger.error('PersistenceService', `Failed to check config update for key: ${key}`, error);
      return true;
    }
  }

  /**
   * 存储离线广告数据
   */
  async storeOfflineAdData(data: Omit<OfflineAdData, 'id' | 'createdAt'>): Promise<number> {
    try {
      await this.initialize();
      return await databaseService.insertOfflineAdData(data);
    } catch (error) {
      logger.error('PersistenceService', 'Failed to store offline ad data', error);
      throw error;
    }
  }

  /**
   * 获取未同步的离线数据
   */
  async getUnsyncedAdData(limit: number = 100): Promise<OfflineAdData[]> {
    try {
      await this.initialize();
      return await databaseService.getUnsyncedAdData({ limit });
    } catch (error) {
      logger.error('PersistenceService', 'Failed to get unsynced ad data', error);
      return [];
    }
  }

  /**
   * 标记数据为已同步
   */
  async markAdDataAsSynced(ids: number[]): Promise<void> {
    try {
      await this.initialize();
      await databaseService.markAsSynced(ids);
    } catch (error) {
      logger.error('PersistenceService', 'Failed to mark ad data as synced', error);
      throw error;
    }
  }

  /**
   * 存储访问令牌
   */
  async storeAccessToken(token: string): Promise<void> {
    try {
      await secureStorageService.setAccessToken(token);
    } catch (error) {
      logger.error('PersistenceService', 'Failed to store access token', error);
      throw error;
    }
  }

  /**
   * 获取访问令牌
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await secureStorageService.getAccessToken();
    } catch (error) {
      logger.error('PersistenceService', 'Failed to get access token', error);
      return null;
    }
  }

  /**
   * 存储刷新令牌
   */
  async storeRefreshToken(token: string): Promise<void> {
    try {
      await secureStorageService.setRefreshToken(token);
    } catch (error) {
      logger.error('PersistenceService', 'Failed to store refresh token', error);
      throw error;
    }
  }

  /**
   * 获取刷新令牌
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await secureStorageService.getRefreshToken();
    } catch (error) {
      logger.error('PersistenceService', 'Failed to get refresh token', error);
      return null;
    }
  }

  /**
   * 清除用户相关数据
   */
  async clearUserData(): Promise<void> {
    try {
      // 清除访问令牌和刷新令牌
      await secureStorageService.removeAccessToken();
      await secureStorageService.removeRefreshToken();

      // 清除用户相关的存储数据
      const userKeys = ['user_info', 'user_preferences', 'user_settings'];
      for (const key of userKeys) {
        await storageService.removeItem(key);
      }

      logger.info('PersistenceService', 'Cleared user data');
    } catch (error) {
      logger.error('PersistenceService', 'Failed to clear user data', error);
      throw error;
    }
  }

  /**
   * 执行数据维护
   */
  async performMaintenance(): Promise<void> {
    try {
      await this.initialize();

      // 清理过期缓存
      const cleanedCacheCount = await cacheService.cleanExpiredCache();
      
      // 执行数据库维护
      await databaseService.performMaintenance();

      logger.info('PersistenceService', `Maintenance completed. Cleaned ${cleanedCacheCount} cache items`);
    } catch (error) {
      logger.error('PersistenceService', 'Failed to perform maintenance', error);
      throw error;
    }
  }

  /**
   * 获取存储统计信息
   */
  async getStorageStats(): Promise<StorageStats> {
    try {
      await this.initialize();

      const [storageStats, secureStorageStats, cacheStats, databaseStats] = await Promise.all([
        storageService.getStorageStats(),
        secureStorageService.getSecureStorageStats(),
        cacheService.getCacheStats(),
        databaseService.getDatabaseStats()
      ]);

      return {
        storage: storageStats,
        secureStorage: secureStorageStats,
        cache: cacheStats,
        database: databaseStats
      };
    } catch (error) {
      logger.error('PersistenceService', 'Failed to get storage stats', error);
      return {
        storage: { totalKeys: 0, estimatedSize: 0 },
        secureStorage: { totalServices: 0, services: [] },
        cache: { totalCacheItems: 0, totalConfigItems: 0, expiredItems: 0, totalSize: 0 },
        database: { totalRecords: 0, unsyncedRecords: 0, syncedRecords: 0, failedRecords: 0, oldestRecord: null, newestRecord: null }
      };
    }
  }

  /**
   * 清除所有数据
   */
  async clearAllData(): Promise<void> {
    try {
      await this.initialize();

      // 清除所有存储数据
      await storageService.clear();
      
      // 清除所有安全存储数据
      await secureStorageService.clearAll();
      
      // 清除所有缓存
      await cacheService.clearAllCache();
      
      // 删除数据库
      await databaseService.deleteDatabase();

      logger.info('PersistenceService', 'Cleared all data');
    } catch (error) {
      logger.error('PersistenceService', 'Failed to clear all data', error);
      throw error;
    }
  }

  /**
   * 导出数据（用于备份）
   */
  async exportData(): Promise<{
    storage: Record<string, any>;
    configs: Record<string, any>;
    timestamp: number;
  }> {
    try {
      const allKeys = await storageService.getAllKeys();
      const storageData = await storageService.multiGet(allKeys);
      
      // 获取配置数据（不包含敏感信息）
      const configKeys = allKeys.filter(key => key.startsWith('config_'));
      const configData: Record<string, any> = {};
      
      for (const key of configKeys) {
        const config = await cacheService.getConfig(key.replace('config_', ''));
        if (config) {
          configData[key] = config;
        }
      }

      return {
        storage: storageData,
        configs: configData,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('PersistenceService', 'Failed to export data', error);
      throw error;
    }
  }

  /**
   * 导入数据（用于恢复）
   */
  async importData(data: {
    storage: Record<string, any>;
    configs: Record<string, any>;
    timestamp: number;
  }): Promise<void> {
    try {
      // 导入存储数据
      const storageEntries = Object.entries(data.storage);
      if (storageEntries.length > 0) {
        await storageService.multiSet(storageEntries);
      }

      // 导入配置数据
      for (const [key, config] of Object.entries(data.configs)) {
        const configKey = key.replace('config_', '');
        await cacheService.setConfig(configKey, config, 'imported');
      }

      logger.info('PersistenceService', `Imported data from ${new Date(data.timestamp)}`);
    } catch (error) {
      logger.error('PersistenceService', 'Failed to import data', error);
      throw error;
    }
  }
}

// 导出单例实例
export default PersistenceService.getInstance();