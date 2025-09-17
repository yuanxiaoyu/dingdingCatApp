import { PersistenceService } from '../PersistenceService';
import storageService from '../StorageService';
import secureStorageService from '../SecureStorageService';
import cacheService from '../CacheService';
import databaseService from '../DatabaseService';

// Mock all services
jest.mock('../StorageService');
jest.mock('../SecureStorageService');
jest.mock('../CacheService');
jest.mock('../DatabaseService');

describe('PersistenceService', () => {
  let persistenceService: PersistenceService;

  beforeEach(() => {
    // Reset the singleton instance for testing
    (PersistenceService as any).instance = null;
    persistenceService = PersistenceService.getInstance();
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize all services', async () => {
      (databaseService.initialize as jest.Mock).mockResolvedValue(undefined);
      (secureStorageService.isKeychainAvailable as jest.Mock).mockResolvedValue(true);
      (cacheService.cleanExpiredCache as jest.Mock).mockResolvedValue(5);
      
      await persistenceService.initialize();
      
      expect(databaseService.initialize).toHaveBeenCalled();
      expect(secureStorageService.isKeychainAvailable).toHaveBeenCalled();
      expect(cacheService.cleanExpiredCache).toHaveBeenCalled();
    });

    it('should handle keychain unavailability gracefully', async () => {
      (databaseService.initialize as jest.Mock).mockResolvedValue(undefined);
      (secureStorageService.isKeychainAvailable as jest.Mock).mockResolvedValue(false);
      (cacheService.cleanExpiredCache as jest.Mock).mockResolvedValue(0);
      
      await persistenceService.initialize();
      
      expect(databaseService.initialize).toHaveBeenCalled();
    });

    it('should not reinitialize if already initialized', async () => {
      (databaseService.initialize as jest.Mock).mockResolvedValue(undefined);
      (secureStorageService.isKeychainAvailable as jest.Mock).mockResolvedValue(true);
      (cacheService.cleanExpiredCache as jest.Mock).mockResolvedValue(0);
      
      await persistenceService.initialize();
      await persistenceService.initialize(); // Second call
      
      expect(databaseService.initialize).toHaveBeenCalledTimes(1);
    });
  });

  describe('storeUserData', () => {
    it('should store data using secure storage when encryption is enabled', async () => {
      const testData = { userId: 123, name: 'test' };
      
      await persistenceService.storeUserData('user_info', testData, { useEncryption: true });
      
      expect(secureStorageService.setSecureItem).toHaveBeenCalledWith(
        'user_info',
        JSON.stringify(testData)
      );
    });

    it('should store data using regular storage when encryption is disabled', async () => {
      const testData = { userId: 123, name: 'test' };
      
      await persistenceService.storeUserData('user_info', testData);
      
      expect(storageService.setItem).toHaveBeenCalledWith('user_info', testData);
    });
  });

  describe('getUserData', () => {
    it('should retrieve data from secure storage when encryption is enabled', async () => {
      const testData = { userId: 123, name: 'test' };
      (secureStorageService.getSecureItem as jest.Mock).mockResolvedValue(JSON.stringify(testData));
      
      const result = await persistenceService.getUserData('user_info', true);
      
      expect(secureStorageService.getSecureItem).toHaveBeenCalledWith('user_info');
      expect(result).toEqual(testData);
    });

    it('should retrieve data from regular storage when encryption is disabled', async () => {
      const testData = { userId: 123, name: 'test' };
      (storageService.getItem as jest.Mock).mockResolvedValue(testData);
      
      const result = await persistenceService.getUserData('user_info');
      
      expect(storageService.getItem).toHaveBeenCalledWith('user_info');
      expect(result).toEqual(testData);
    });
  });

  describe('config management', () => {
    it('should store config data', async () => {
      const configData = { setting1: 'value1' };
      const version = '1.0.0';
      const checksum = 'abc123';
      
      await persistenceService.storeConfig('app_config', configData, version, checksum);
      
      expect(cacheService.setConfig).toHaveBeenCalledWith('app_config', configData, version, checksum);
    });

    it('should retrieve config data', async () => {
      const configData = { setting1: 'value1' };
      (cacheService.getConfig as jest.Mock).mockResolvedValue(configData);
      
      const result = await persistenceService.getConfig('app_config');
      
      expect(cacheService.getConfig).toHaveBeenCalledWith('app_config');
      expect(result).toEqual(configData);
    });

    it('should check if config needs update', async () => {
      (cacheService.shouldUpdateConfig as jest.Mock).mockResolvedValue(true);
      
      const result = await persistenceService.shouldUpdateConfig('app_config', '1.1.0');
      
      expect(cacheService.shouldUpdateConfig).toHaveBeenCalledWith('app_config', '1.1.0');
      expect(result).toBe(true);
    });
  });

  describe('offline ad data management', () => {
    it('should store offline ad data', async () => {
      const adData = {
        userId: 123,
        appKey: 'test_app',
        adId: 'ad_123',
        adType: 'video' as const,
        eventType: 'complete' as const,
        playData: '{"duration":30}',
        timestamp: Date.now(),
        synced: false,
        retryCount: 0
      };
      
      (databaseService.initialize as jest.Mock).mockResolvedValue(undefined);
      (databaseService.insertOfflineAdData as jest.Mock).mockResolvedValue(5);
      
      const result = await persistenceService.storeOfflineAdData(adData);
      
      expect(databaseService.insertOfflineAdData).toHaveBeenCalledWith(adData);
      expect(result).toBe(5);
    });

    it('should retrieve unsynced ad data', async () => {
      const mockData = [
        {
          id: 1,
          userId: 123,
          appKey: 'test_app',
          adId: 'ad_123',
          adType: 'video' as const,
          eventType: 'complete' as const,
          playData: '{"duration":30}',
          timestamp: Date.now(),
          synced: false,
          retryCount: 0,
          createdAt: Date.now()
        }
      ];
      
      (databaseService.initialize as jest.Mock).mockResolvedValue(undefined);
      (databaseService.getUnsyncedAdData as jest.Mock).mockResolvedValue(mockData);
      
      const result = await persistenceService.getUnsyncedAdData(50);
      
      expect(databaseService.getUnsyncedAdData).toHaveBeenCalledWith({ limit: 50 });
      expect(result).toEqual(mockData);
    });

    it('should mark ad data as synced', async () => {
      const ids = [1, 2, 3];
      
      (databaseService.initialize as jest.Mock).mockResolvedValue(undefined);
      (databaseService.markAsSynced as jest.Mock).mockResolvedValue(undefined);
      
      await persistenceService.markAdDataAsSynced(ids);
      
      expect(databaseService.markAsSynced).toHaveBeenCalledWith(ids);
    });
  });

  describe('token management', () => {
    it('should store and retrieve access token', async () => {
      const token = 'access_token_123';
      
      await persistenceService.storeAccessToken(token);
      expect(secureStorageService.setAccessToken).toHaveBeenCalledWith(token);

      (secureStorageService.getAccessToken as jest.Mock).mockResolvedValue(token);
      const result = await persistenceService.getAccessToken();
      expect(result).toBe(token);
    });

    it('should store and retrieve refresh token', async () => {
      const token = 'refresh_token_123';
      
      await persistenceService.storeRefreshToken(token);
      expect(secureStorageService.setRefreshToken).toHaveBeenCalledWith(token);

      (secureStorageService.getRefreshToken as jest.Mock).mockResolvedValue(token);
      const result = await persistenceService.getRefreshToken();
      expect(result).toBe(token);
    });
  });

  describe('clearUserData', () => {
    it('should clear all user-related data', async () => {
      await persistenceService.clearUserData();
      
      expect(secureStorageService.removeAccessToken).toHaveBeenCalled();
      expect(secureStorageService.removeRefreshToken).toHaveBeenCalled();
      expect(storageService.removeItem).toHaveBeenCalledWith('user_info');
      expect(storageService.removeItem).toHaveBeenCalledWith('user_preferences');
      expect(storageService.removeItem).toHaveBeenCalledWith('user_settings');
    });
  });

  describe('performMaintenance', () => {
    it('should perform maintenance on all services', async () => {
      (databaseService.initialize as jest.Mock).mockResolvedValue(undefined);
      (cacheService.cleanExpiredCache as jest.Mock).mockResolvedValue(10);
      (databaseService.performMaintenance as jest.Mock).mockResolvedValue(undefined);
      
      await persistenceService.performMaintenance();
      
      expect(cacheService.cleanExpiredCache).toHaveBeenCalled();
      expect(databaseService.performMaintenance).toHaveBeenCalled();
    });
  });

  describe('getStorageStats', () => {
    it('should return comprehensive storage statistics', async () => {
      const mockStats = {
        storage: { totalKeys: 10, estimatedSize: 1024 },
        secureStorage: { totalServices: 5, services: ['token1', 'token2'] },
        cache: { totalCacheItems: 8, totalConfigItems: 3, expiredItems: 1, totalSize: 512 },
        database: { totalRecords: 100, unsyncedRecords: 25, syncedRecords: 75, failedRecords: 5, oldestRecord: 1000000, newestRecord: 2000000 }
      };
      
      (databaseService.initialize as jest.Mock).mockResolvedValue(undefined);
      (storageService.getStorageStats as jest.Mock).mockResolvedValue(mockStats.storage);
      (secureStorageService.getSecureStorageStats as jest.Mock).mockResolvedValue(mockStats.secureStorage);
      (cacheService.getCacheStats as jest.Mock).mockResolvedValue(mockStats.cache);
      (databaseService.getDatabaseStats as jest.Mock).mockResolvedValue(mockStats.database);
      
      const result = await persistenceService.getStorageStats();
      
      expect(result).toEqual(mockStats);
    });
  });

  describe('clearAllData', () => {
    it('should clear all data from all services', async () => {
      (databaseService.initialize as jest.Mock).mockResolvedValue(undefined);
      
      await persistenceService.clearAllData();
      
      expect(storageService.clear).toHaveBeenCalled();
      expect(secureStorageService.clearAll).toHaveBeenCalled();
      expect(cacheService.clearAllCache).toHaveBeenCalled();
      expect(databaseService.deleteDatabase).toHaveBeenCalled();
    });
  });

  describe('data export/import', () => {
    it('should export data', async () => {
      const mockStorageData = { key1: 'value1', key2: 'value2' };
      const mockConfigData = { config1: 'configValue1' };
      
      (storageService.getAllKeys as jest.Mock).mockResolvedValue(['key1', 'key2', 'config_config1']);
      (storageService.multiGet as jest.Mock).mockResolvedValue(mockStorageData);
      (cacheService.getConfig as jest.Mock).mockResolvedValue('configValue1');
      
      const result = await persistenceService.exportData();
      
      expect(result).toEqual({
        storage: mockStorageData,
        configs: { 'config_config1': 'configValue1' },
        timestamp: expect.any(Number)
      });
    });

    it('should import data', async () => {
      const importData = {
        storage: { key1: 'value1', key2: 'value2' },
        configs: { 'config_config1': 'configValue1' },
        timestamp: Date.now()
      };
      
      await persistenceService.importData(importData);
      
      expect(storageService.multiSet).toHaveBeenCalledWith([
        ['key1', 'value1'],
        ['key2', 'value2']
      ]);
      expect(cacheService.setConfig).toHaveBeenCalledWith('config1', 'configValue1', 'imported');
    });
  });
});