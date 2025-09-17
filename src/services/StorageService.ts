import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

/**
 * StorageService - 处理 AsyncStorage 数据存储和缓存
 * 提供类型安全的存储操作和错误处理
 */
export class StorageService {
  private static instance: StorageService;
  private readonly keyPrefix = 'dingding_cat_';

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * 生成带前缀的存储键
   */
  private getKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * 存储数据
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await AsyncStorage.setItem(this.getKey(key), serializedValue);
      logger.debug('StorageService', `Stored data for key: ${key}`);
    } catch (error) {
      logger.error('StorageService', `Failed to store data for key: ${key}`, error);
      throw new Error(`Storage write failed: ${error}`);
    }
  }

  /**
   * 获取数据
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const serializedValue = await AsyncStorage.getItem(this.getKey(key));
      if (serializedValue === null) {
        return null;
      }
      return JSON.parse(serializedValue) as T;
    } catch (error) {
      logger.error('StorageService', `Failed to get data for key: ${key}`, error);
      return null;
    }
  }

  /**
   * 删除数据
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.getKey(key));
      logger.debug('StorageService', `Removed data for key: ${key}`);
    } catch (error) {
      logger.error('StorageService', `Failed to remove data for key: ${key}`, error);
      throw new Error(`Storage remove failed: ${error}`);
    }
  }

  /**
   * 检查键是否存在
   */
  async hasItem(key: string): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(this.getKey(key));
      return value !== null;
    } catch (error) {
      logger.error('StorageService', `Failed to check key existence: ${key}`, error);
      return false;
    }
  }

  /**
   * 获取所有键
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      return allKeys
        .filter(key => key.startsWith(this.keyPrefix))
        .map(key => key.replace(this.keyPrefix, ''));
    } catch (error) {
      logger.error('StorageService', 'Failed to get all keys', error);
      return [];
    }
  }

  /**
   * 清除所有数据
   */
  async clear(): Promise<void> {
    try {
      const allKeys = await this.getAllKeys();
      const prefixedKeys = allKeys.map(key => this.getKey(key));
      await AsyncStorage.multiRemove(prefixedKeys);
      logger.info('StorageService', 'Cleared all storage data');
    } catch (error) {
      logger.error('StorageService', 'Failed to clear storage', error);
      throw new Error(`Storage clear failed: ${error}`);
    }
  }

  /**
   * 批量设置数据
   */
  async multiSet(keyValuePairs: Array<[string, any]>): Promise<void> {
    try {
      const serializedPairs: Array<[string, string]> = keyValuePairs.map(([key, value]) => [
        this.getKey(key),
        JSON.stringify(value)
      ]);
      await AsyncStorage.multiSet(serializedPairs);
      logger.debug('StorageService', `Batch stored ${keyValuePairs.length} items`);
    } catch (error) {
      logger.error('StorageService', 'Failed to batch set data', error);
      throw new Error(`Storage multiSet failed: ${error}`);
    }
  }

  /**
   * 批量获取数据
   */
  async multiGet<T>(keys: string[]): Promise<Record<string, T | null>> {
    try {
      const prefixedKeys = keys.map(key => this.getKey(key));
      const results = await AsyncStorage.multiGet(prefixedKeys);
      
      const data: Record<string, T | null> = {};
      results.forEach(([prefixedKey, value], index) => {
        const originalKey = keys[index];
        if (value !== null) {
          try {
            data[originalKey] = JSON.parse(value) as T;
          } catch {
            data[originalKey] = null;
          }
        } else {
          data[originalKey] = null;
        }
      });
      
      return data;
    } catch (error) {
      logger.error('StorageService', 'Failed to batch get data', error);
      return {};
    }
  }

  /**
   * 获取存储使用情况统计
   */
  async getStorageStats(): Promise<{
    totalKeys: number;
    estimatedSize: number;
  }> {
    try {
      const allKeys = await this.getAllKeys();
      let estimatedSize = 0;
      
      for (const key of allKeys) {
        const value = await AsyncStorage.getItem(this.getKey(key));
        if (value) {
          estimatedSize += value.length;
        }
      }
      
      return {
        totalKeys: allKeys.length,
        estimatedSize
      };
    } catch (error) {
      logger.error('StorageService', 'Failed to get storage stats', error);
      return { totalKeys: 0, estimatedSize: 0 };
    }
  }
}

// 导出单例实例
export default StorageService.getInstance();