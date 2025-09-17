/**
 * PersistenceUsageExample - 展示如何在现有服务中集成持久化功能
 * 
 * 这个文件展示了如何在 AuthService、ConfigService、AdService 等服务中
 * 使用新的持久化服务来存储和管理数据
 */

import persistenceService from '../PersistenceService';
import { OfflineAdData } from '../DatabaseService';

/**
 * AuthService 中的持久化使用示例
 */
export class AuthServicePersistenceExample {
  
  /**
   * 存储用户登录信息
   */
  async storeUserSession(userInfo: any, accessToken: string, refreshToken: string): Promise<void> {
    try {
      // 存储用户信息（非敏感数据）
      await persistenceService.storeUserData('user_info', userInfo);
      
      // 存储访问令牌（敏感数据，使用加密存储）
      await persistenceService.storeAccessToken(accessToken);
      await persistenceService.storeRefreshToken(refreshToken);
      
      // 存储登录时间戳
      await persistenceService.storeUserData('last_login', Date.now());
      
      console.log('User session stored successfully');
    } catch (error) {
      console.error('Failed to store user session:', error);
      throw error;
    }
  }

  /**
   * 获取用户会话信息
   */
  async getUserSession(): Promise<{
    userInfo: any | null;
    accessToken: string | null;
    refreshToken: string | null;
    lastLogin: number | null;
  }> {
    try {
      const [userInfo, accessToken, refreshToken, lastLogin] = await Promise.all([
        persistenceService.getUserData('user_info'),
        persistenceService.getAccessToken(),
        persistenceService.getRefreshToken(),
        persistenceService.getUserData<number>('last_login')
      ]);

      return {
        userInfo,
        accessToken,
        refreshToken,
        lastLogin
      };
    } catch (error) {
      console.error('Failed to get user session:', error);
      return {
        userInfo: null,
        accessToken: null,
        refreshToken: null,
        lastLogin: null
      };
    }
  }

  /**
   * 清除用户会话
   */
  async clearUserSession(): Promise<void> {
    try {
      await persistenceService.clearUserData();
      console.log('User session cleared successfully');
    } catch (error) {
      console.error('Failed to clear user session:', error);
      throw error;
    }
  }
}

/**
 * ConfigService 中的持久化使用示例
 */
export class ConfigServicePersistenceExample {

  /**
   * 存储应用配置
   */
  async storeAppConfig(config: any, version: string): Promise<void> {
    try {
      // 计算配置的校验和（可选）
      const checksum = this.calculateChecksum(config);
      
      await persistenceService.storeConfig('app_config', config, version, checksum);
      console.log(`App config stored with version: ${version}`);
    } catch (error) {
      console.error('Failed to store app config:', error);
      throw error;
    }
  }

  /**
   * 获取应用配置
   */
  async getAppConfig(): Promise<any | null> {
    try {
      return await persistenceService.getConfig('app_config');
    } catch (error) {
      console.error('Failed to get app config:', error);
      return null;
    }
  }

  /**
   * 检查配置是否需要更新
   */
  async checkConfigUpdate(serverVersion: string): Promise<boolean> {
    try {
      return await persistenceService.shouldUpdateConfig('app_config', serverVersion);
    } catch (error) {
      console.error('Failed to check config update:', error);
      return true; // 出错时默认需要更新
    }
  }

  /**
   * 存储广告配置
   */
  async storeAdConfig(adConfig: any, version: string): Promise<void> {
    try {
      await persistenceService.storeConfig('ad_config', adConfig, version);
      console.log(`Ad config stored with version: ${version}`);
    } catch (error) {
      console.error('Failed to store ad config:', error);
      throw error;
    }
  }

  /**
   * 获取广告配置
   */
  async getAdConfig(): Promise<any | null> {
    try {
      return await persistenceService.getConfig('ad_config');
    } catch (error) {
      console.error('Failed to get ad config:', error);
      return null;
    }
  }

  private calculateChecksum(data: any): string {
    // 简单的校验和计算示例
    return JSON.stringify(data).length.toString();
  }
}

/**
 * AdService 中的持久化使用示例
 */
export class AdServicePersistenceExample {

  /**
   * 存储离线广告数据
   */
  async storeOfflineAdEvent(
    userId: number,
    appKey: string,
    adId: string,
    adType: 'splash' | 'video' | 'interstitial' | 'banner',
    eventType: 'show' | 'click' | 'complete' | 'skip' | 'close',
    playData: any
  ): Promise<void> {
    try {
      const offlineData: Omit<OfflineAdData, 'id' | 'createdAt'> = {
        userId,
        appKey,
        adId,
        adType,
        eventType,
        playData: JSON.stringify(playData),
        timestamp: Date.now(),
        synced: false,
        retryCount: 0
      };

      const insertId = await persistenceService.storeOfflineAdData(offlineData);
      console.log(`Offline ad event stored with ID: ${insertId}`);
    } catch (error) {
      console.error('Failed to store offline ad event:', error);
      throw error;
    }
  }

  /**
   * 获取未同步的广告数据
   */
  async getUnsyncedAdEvents(limit: number = 50): Promise<OfflineAdData[]> {
    try {
      return await persistenceService.getUnsyncedAdData(limit);
    } catch (error) {
      console.error('Failed to get unsynced ad events:', error);
      return [];
    }
  }

  /**
   * 标记广告数据为已同步
   */
  async markAdEventsAsSynced(ids: number[]): Promise<void> {
    try {
      await persistenceService.markAdDataAsSynced(ids);
      console.log(`Marked ${ids.length} ad events as synced`);
    } catch (error) {
      console.error('Failed to mark ad events as synced:', error);
      throw error;
    }
  }

  /**
   * 批量同步离线广告数据
   */
  async syncOfflineAdData(): Promise<void> {
    try {
      const unsyncedData = await this.getUnsyncedAdEvents(100);
      
      if (unsyncedData.length === 0) {
        console.log('No unsynced ad data to process');
        return;
      }

      console.log(`Processing ${unsyncedData.length} unsynced ad events`);

      // 这里应该调用实际的 API 上报数据
      // const response = await apiClient.post('/ad/batchReport', { events: unsyncedData });
      
      // 模拟 API 调用成功
      const syncedIds = unsyncedData.map(data => data.id!);
      await this.markAdEventsAsSynced(syncedIds);
      
      console.log('Offline ad data synced successfully');
    } catch (error) {
      console.error('Failed to sync offline ad data:', error);
      throw error;
    }
  }
}

/**
 * 应用初始化时的持久化使用示例
 */
export class AppInitializationPersistenceExample {

  /**
   * 应用启动时初始化持久化服务
   */
  async initializePersistence(): Promise<void> {
    try {
      console.log('Initializing persistence services...');
      
      // 初始化持久化服务
      await persistenceService.initialize();
      
      // 执行维护任务
      await persistenceService.performMaintenance();
      
      // 获取存储统计信息
      const stats = await persistenceService.getStorageStats();
      console.log('Storage statistics:', stats);
      
      console.log('Persistence services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize persistence services:', error);
      throw error;
    }
  }

  /**
   * 应用升级时的数据迁移示例
   */
  async migrateDataOnUpgrade(oldVersion: string, newVersion: string): Promise<void> {
    try {
      console.log(`Migrating data from version ${oldVersion} to ${newVersion}`);
      
      // 导出现有数据
      const exportedData = await persistenceService.exportData();
      
      // 执行数据迁移逻辑
      // ... 数据转换逻辑 ...
      
      // 导入迁移后的数据
      await persistenceService.importData(exportedData);
      
      console.log('Data migration completed successfully');
    } catch (error) {
      console.error('Failed to migrate data:', error);
      throw error;
    }
  }

  /**
   * 应用重置时清除所有数据
   */
  async resetAppData(): Promise<void> {
    try {
      console.log('Resetting all app data...');
      
      await persistenceService.clearAllData();
      
      console.log('All app data cleared successfully');
    } catch (error) {
      console.error('Failed to reset app data:', error);
      throw error;
    }
  }
}

/**
 * 使用示例
 */
export const persistenceUsageExamples = {
  auth: new AuthServicePersistenceExample(),
  config: new ConfigServicePersistenceExample(),
  ad: new AdServicePersistenceExample(),
  app: new AppInitializationPersistenceExample()
};

// 导出使用示例
export default persistenceUsageExamples;