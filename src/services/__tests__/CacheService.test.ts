import { CacheService } from '../CacheService';
import storageService from '../StorageService';

// Mock StorageService
jest.mock('../StorageService', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    getAllKeys: jest.fn(),
    getStorageStats: jest.fn(),
  }
}));

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = CacheService.getInstance();
    jest.clearAllMocks();
  });

  describe('setCache', () => {
    it('should store cache data with expiration', async () => {
      const testData = { name: 'test', value: 123 };
      const ttl = 60000; // 1 minute
      
      await cacheService.setCache('test_key', testData, ttl);
      
      expect(storageService.setItem).toHaveBeenCalledWith(
        'cache_test_key',
        expect.objectContaining({
          data: testData,
          timestamp: expect.any(Number),
          expiresAt: expect.any(Number)
        })
      );
    });

    it('should use default TTL when not specified', async () => {
      const testData = { name: 'test' };
      
      await cacheService.setCache('test_key', testData);
      
      expect(storageService.setItem).toHaveBeenCalledWith(
        'cache_test_key',
        expect.objectContaining({
          data: testData,
          expiresAt: expect.any(Number)
        })
      );
    });
  });

  describe('getCache', () => {
    it('should retrieve valid cache data', async () => {
      const testData = { name: 'test', value: 123 };
      const cacheItem = {
        data: testData,
        timestamp: Date.now(),
        expiresAt: Date.now() + 60000
      };
      
      (storageService.getItem as jest.Mock).mockResolvedValue(cacheItem);
      
      const result = await cacheService.getCache('test_key');
      
      expect(result).toEqual(testData);
    });

    it('should return null for expired cache', async () => {
      const cacheItem = {
        data: { name: 'test' },
        timestamp: Date.now() - 120000,
        expiresAt: Date.now() - 60000 // Expired 1 minute ago
      };
      
      (storageService.getItem as jest.Mock).mockResolvedValue(cacheItem);
      
      const result = await cacheService.getCache('test_key');
      
      expect(result).toBeNull();
      expect(storageService.removeItem).toHaveBeenCalledWith('cache_test_key');
    });

    it('should return null for non-existent cache', async () => {
      (storageService.getItem as jest.Mock).mockResolvedValue(null);
      
      const result = await cacheService.getCache('test_key');
      
      expect(result).toBeNull();
    });
  });

  describe('isCacheValid', () => {
    it('should return true for valid cache', async () => {
      const cacheItem = {
        data: { name: 'test' },
        timestamp: Date.now(),
        expiresAt: Date.now() + 60000
      };
      
      (storageService.getItem as jest.Mock).mockResolvedValue(cacheItem);
      
      const result = await cacheService.isCacheValid('test_key');
      
      expect(result).toBe(true);
    });

    it('should return false for expired cache', async () => {
      const cacheItem = {
        data: { name: 'test' },
        timestamp: Date.now() - 120000,
        expiresAt: Date.now() - 60000
      };
      
      (storageService.getItem as jest.Mock).mockResolvedValue(cacheItem);
      
      const result = await cacheService.isCacheValid('test_key');
      
      expect(result).toBe(false);
    });
  });

  describe('config management', () => {
    it('should store config with version', async () => {
      const configData = { setting1: 'value1', setting2: 'value2' };
      const version = '1.0.0';
      const checksum = 'abc123';
      
      await cacheService.setConfig('app_config', configData, version, checksum);
      
      expect(storageService.setItem).toHaveBeenCalledWith(
        'config_app_config',
        expect.objectContaining({
          data: configData,
          version,
          checksum,
          timestamp: expect.any(Number),
          lastUpdated: expect.any(Number)
        })
      );
    });

    it('should retrieve config data', async () => {
      const configData = { setting1: 'value1' };
      const configItem = {
        data: configData,
        version: '1.0.0',
        timestamp: Date.now(),
        lastUpdated: Date.now()
      };
      
      (storageService.getItem as jest.Mock).mockResolvedValue(configItem);
      
      const result = await cacheService.getConfig('app_config');
      
      expect(result).toEqual(configData);
    });

    it('should get config version', async () => {
      const configItem = {
        data: { setting1: 'value1' },
        version: '1.0.0',
        timestamp: Date.now(),
        lastUpdated: Date.now()
      };
      
      (storageService.getItem as jest.Mock).mockResolvedValue(configItem);
      
      const result = await cacheService.getConfigVersion('app_config');
      
      expect(result).toBe('1.0.0');
    });
  });

  describe('shouldUpdateConfig', () => {
    it('should return true when local version differs from server version', async () => {
      const configItem = {
        data: { setting1: 'value1' },
        version: '1.0.0',
        timestamp: Date.now(),
        lastUpdated: Date.now()
      };
      
      (storageService.getItem as jest.Mock).mockResolvedValue(configItem);
      
      const result = await cacheService.shouldUpdateConfig('app_config', '1.1.0');
      
      expect(result).toBe(true);
    });

    it('should return false when versions match', async () => {
      const configItem = {
        data: { setting1: 'value1' },
        version: '1.0.0',
        timestamp: Date.now(),
        lastUpdated: Date.now()
      };
      
      (storageService.getItem as jest.Mock).mockResolvedValue(configItem);
      
      const result = await cacheService.shouldUpdateConfig('app_config', '1.0.0');
      
      expect(result).toBe(false);
    });

    it('should return true when no local config exists', async () => {
      (storageService.getItem as jest.Mock).mockResolvedValue(null);
      
      const result = await cacheService.shouldUpdateConfig('app_config', '1.0.0');
      
      expect(result).toBe(true);
    });
  });

  describe('validateConfigIntegrity', () => {
    it('should return true for matching checksum', async () => {
      const configItem = {
        data: { setting1: 'value1' },
        version: '1.0.0',
        checksum: 'abc123',
        timestamp: Date.now(),
        lastUpdated: Date.now()
      };
      
      (storageService.getItem as jest.Mock).mockResolvedValue(configItem);
      
      const result = await cacheService.validateConfigIntegrity('app_config', 'abc123');
      
      expect(result).toBe(true);
    });

    it('should return false for mismatched checksum', async () => {
      const configItem = {
        data: { setting1: 'value1' },
        version: '1.0.0',
        checksum: 'abc123',
        timestamp: Date.now(),
        lastUpdated: Date.now()
      };
      
      (storageService.getItem as jest.Mock).mockResolvedValue(configItem);
      
      const result = await cacheService.validateConfigIntegrity('app_config', 'def456');
      
      expect(result).toBe(false);
    });
  });

  describe('cleanExpiredCache', () => {
    it('should clean expired cache items', async () => {
      (storageService.getAllKeys as jest.Mock).mockResolvedValue([
        'cache_key1',
        'cache_key2',
        'config_key1',
        'other_key'
      ]);

      // Mock cache validity checks
      (storageService.getItem as jest.Mock)
        .mockResolvedValueOnce({ // key1 - expired
          data: { name: 'test1' },
          expiresAt: Date.now() - 60000
        })
        .mockResolvedValueOnce({ // key2 - valid
          data: { name: 'test2' },
          expiresAt: Date.now() + 60000
        });

      const cleanedCount = await cacheService.cleanExpiredCache();
      
      expect(cleanedCount).toBe(1);
      expect(storageService.removeItem).toHaveBeenCalledWith('cache_key1');
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      (storageService.getAllKeys as jest.Mock).mockResolvedValue([
        'cache_key1',
        'cache_key2',
        'config_key1',
        'config_key2',
        'other_key'
      ]);

      (storageService.getStorageStats as jest.Mock).mockResolvedValue({
        totalKeys: 5,
        estimatedSize: 1024
      });

      // Mock expired cache check
      (storageService.getItem as jest.Mock)
        .mockResolvedValueOnce({ // key1 - expired
          data: { name: 'test1' },
          expiresAt: Date.now() - 60000
        })
        .mockResolvedValueOnce({ // key2 - valid
          data: { name: 'test2' },
          expiresAt: Date.now() + 60000
        });

      const stats = await cacheService.getCacheStats();
      
      expect(stats.totalCacheItems).toBe(2);
      expect(stats.totalConfigItems).toBe(2);
      expect(stats.expiredItems).toBe(1);
      expect(stats.totalSize).toBe(1024);
    });
  });
});