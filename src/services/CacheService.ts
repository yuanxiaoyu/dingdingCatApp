import storageService from './StorageService';
import { logger } from '../utils/logger';

/**
 * 缓存项接口
 */
interface CacheItem<T> {
  data: T;
  timestamp: number;
  version?: string;
  expiresAt?: number;
}

/**
 * 配置缓存项接口
 */
interface ConfigCacheItem<T> extends CacheItem<T> {
  version: string;
  lastUpdated: number;
  checksum?: string;
}

/**
 * CacheService - 处理配置数据的缓存和版本管理
 * 提供智能缓存策略和版本控制
 */
export class CacheService {
  private static instance: CacheService;
  private readonly cacheKeyPrefix = 'cache_';
  private readonly configKeyPrefix = 'config_';
  private readonly defaultTTL = 24 * 60 * 60 * 1000; // 24小时

  private constructor() {}

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(key: string): string {
    return `${this.cacheKeyPrefix}${key}`;
  }

  /**
   * 生成配置键
   */
  private getConfigKey(key: string): string {
    return `${this.configKeyPrefix}${key}`;
  }

  /**
   * 设置缓存数据
   */
  async setCache<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      const expiresAt = ttl ? Date.now() + ttl : Date.now() + this.defaultTTL;
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiresAt
      };
      
      await storageService.setItem(this.getCacheKey(key), cacheItem);
      logger.debug('CacheService', `Cached data for key: ${key}, expires at: ${new Date(expiresAt)}`);
    } catch (error) {
      logger.error('CacheService', `Failed to cache data for key: ${key}`, error);
      throw error;
    }
  }

  /**
   * 获取缓存数据
   */
  async getCache<T>(key: string): Promise<T | null> {
    try {
      const cacheItem = await storageService.getItem<CacheItem<T>>(this.getCacheKey(key));
      
      if (!cacheItem) {
        return null;
      }

      // 检查是否过期
      if (cacheItem.expiresAt && Date.now() > cacheItem.expiresAt) {
        await this.removeCache(key);
        logger.debug('CacheService', `Cache expired for key: ${key}`);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      logger.error('CacheService', `Failed to get cache for key: ${key}`, error);
      return null;
    }
  }

  /**
   * 删除缓存数据
   */
  async removeCache(key: string): Promise<void> {
    try {
      await storageService.removeItem(this.getCacheKey(key));
      logger.debug('CacheService', `Removed cache for key: ${key}`);
    } catch (error) {
      logger.error('CacheService', `Failed to remove cache for key: ${key}`, error);
      throw error;
    }
  }

  /**
   * 检查缓存是否存在且有效
   */
  async isCacheValid(key: string): Promise<boolean> {
    try {
      const cacheItem = await storageService.getItem<CacheItem<any>>(this.getCacheKey(key));
      
      if (!cacheItem) {
        return false;
      }

      // 检查是否过期
      if (cacheItem.expiresAt && Date.now() > cacheItem.expiresAt) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('CacheService', `Failed to check cache validity for key: ${key}`, error);
      return false;
    }
  }

  /**
   * 设置配置数据（带版本管理）
   */
  async setConfig<T>(key: string, data: T, version: string, checksum?: string): Promise<void> {
    try {
      const configItem: ConfigCacheItem<T> = {
        data,
        timestamp: Date.now(),
        version,
        lastUpdated: Date.now(),
        checksum
      };
      
      await storageService.setItem(this.getConfigKey(key), configItem);
      logger.info('CacheService', `Stored config for key: ${key}, version: ${version}`);
    } catch (error) {
      logger.error('CacheService', `Failed to store config for key: ${key}`, error);
      throw error;
    }
  }

  /**
   * 获取配置数据
   */
  async getConfig<T>(key: string): Promise<T | null> {
    try {
      const configItem = await storageService.getItem<ConfigCacheItem<T>>(this.getConfigKey(key));
      return configItem ? configItem.data : null;
    } catch (error) {
      logger.error('CacheService', `Failed to get config for key: ${key}`, error);
      return null;
    }
  }

  /**
   * 获取配置版本
   */
  async getConfigVersion(key: string): Promise<string | null> {
    try {
      const configItem = await storageService.getItem<ConfigCacheItem<any>>(this.getConfigKey(key));
      return configItem ? configItem.version : null;
    } catch (error) {
      logger.error('CacheService', `Failed to get config version for key: ${key}`, error);
      return null;
    }
  }

  /**
   * 检查配置是否需要更新
   */
  async shouldUpdateConfig(key: string, serverVersion: string): Promise<boolean> {
    try {
      const localVersion = await this.getConfigVersion(key);
      
      if (!localVersion) {
        return true; // 本地没有配置，需要更新
      }

      return localVersion !== serverVersion;
    } catch (error) {
      logger.error('CacheService', `Failed to check config update for key: ${key}`, error);
      return true; // 出错时默认需要更新
    }
  }

  /**
   * 获取配置的最后更新时间
   */
  async getConfigLastUpdated(key: string): Promise<number | null> {
    try {
      const configItem = await storageService.getItem<ConfigCacheItem<any>>(this.getConfigKey(key));
      return configItem ? configItem.lastUpdated : null;
    } catch (error) {
      logger.error('CacheService', `Failed to get config last updated for key: ${key}`, error);
      return null;
    }
  }

  /**
   * 验证配置完整性（通过校验和）
   */
  async validateConfigIntegrity(key: string, expectedChecksum: string): Promise<boolean> {
    try {
      const configItem = await storageService.getItem<ConfigCacheItem<any>>(this.getConfigKey(key));
      
      if (!configItem || !configItem.checksum) {
        return false;
      }

      return configItem.checksum === expectedChecksum;
    } catch (error) {
      logger.error('CacheService', `Failed to validate config integrity for key: ${key}`, error);
      return false;
    }
  }

  /**
   * 清理过期缓存
   */
  async cleanExpiredCache(): Promise<number> {
    try {
      const allKeys = await storageService.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith(this.cacheKeyPrefix));
      let cleanedCount = 0;

      for (const key of cacheKeys) {
        const originalKey = key.replace(this.cacheKeyPrefix, '');
        const isValid = await this.isCacheValid(originalKey);
        
        if (!isValid) {
          await this.removeCache(originalKey);
          cleanedCount++;
        }
      }

      logger.info('CacheService', `Cleaned ${cleanedCount} expired cache items`);
      return cleanedCount;
    } catch (error) {
      logger.error('CacheService', 'Failed to clean expired cache', error);
      return 0;
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getCacheStats(): Promise<{
    totalCacheItems: number;
    totalConfigItems: number;
    expiredItems: number;
    totalSize: number;
  }> {
    try {
      const allKeys = await storageService.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith(this.cacheKeyPrefix));
      const configKeys = allKeys.filter(key => key.startsWith(this.configKeyPrefix));
      
      let expiredItems = 0;
      let totalSize = 0;

      // 检查过期项
      for (const key of cacheKeys) {
        const originalKey = key.replace(this.cacheKeyPrefix, '');
        const isValid = await this.isCacheValid(originalKey);
        if (!isValid) {
          expiredItems++;
        }
      }

      // 估算总大小
      const storageStats = await storageService.getStorageStats();
      totalSize = storageStats.estimatedSize;

      return {
        totalCacheItems: cacheKeys.length,
        totalConfigItems: configKeys.length,
        expiredItems,
        totalSize
      };
    } catch (error) {
      logger.error('CacheService', 'Failed to get cache stats', error);
      return {
        totalCacheItems: 0,
        totalConfigItems: 0,
        expiredItems: 0,
        totalSize: 0
      };
    }
  }

  /**
   * 清除所有缓存
   */
  async clearAllCache(): Promise<void> {
    try {
      const allKeys = await storageService.getAllKeys();
      const cacheKeys = allKeys.filter(key => 
        key.startsWith(this.cacheKeyPrefix) || key.startsWith(this.configKeyPrefix)
      );

      for (const key of cacheKeys) {
        await storageService.removeItem(key);
      }

      logger.info('CacheService', `Cleared ${cacheKeys.length} cache items`);
    } catch (error) {
      logger.error('CacheService', 'Failed to clear all cache', error);
      throw error;
    }
  }

  /**
   * 预热缓存（预加载常用配置）
   */
  async warmupCache(configKeys: string[]): Promise<void> {
    try {
      logger.info('CacheService', `Warming up cache for ${configKeys.length} configs`);
      
      // 这里可以预加载一些常用配置
      // 实际实现会依赖于具体的配置服务
      for (const key of configKeys) {
        const config = await this.getConfig(key);
        if (config) {
          logger.debug('CacheService', `Warmed up cache for: ${key}`);
        }
      }
    } catch (error) {
      logger.error('CacheService', 'Failed to warmup cache', error);
    }
  }
}

// 导出单例实例
export default CacheService.getInstance();