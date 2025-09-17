import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from '../StorageService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiSet: jest.fn(),
  multiGet: jest.fn(),
  multiRemove: jest.fn(),
}));

describe('StorageService', () => {
  let storageService: StorageService;

  beforeEach(() => {
    storageService = StorageService.getInstance();
    jest.clearAllMocks();
  });

  describe('setItem', () => {
    it('should store data with prefixed key', async () => {
      const testData = { name: 'test', value: 123 };
      
      await storageService.setItem('test_key', testData);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'dingding_cat_test_key',
        JSON.stringify(testData)
      );
    });

    it('should handle storage errors', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      
      await expect(storageService.setItem('test_key', 'data')).rejects.toThrow('Storage write failed');
    });
  });

  describe('getItem', () => {
    it('should retrieve and parse stored data', async () => {
      const testData = { name: 'test', value: 123 };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(testData));
      
      const result = await storageService.getItem('test_key');
      
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('dingding_cat_test_key');
      expect(result).toEqual(testData);
    });

    it('should return null for non-existent keys', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      
      const result = await storageService.getItem('non_existent');
      
      expect(result).toBeNull();
    });

    it('should handle parsing errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid json');
      
      const result = await storageService.getItem('test_key');
      
      expect(result).toBeNull();
    });
  });

  describe('removeItem', () => {
    it('should remove item with prefixed key', async () => {
      await storageService.removeItem('test_key');
      
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('dingding_cat_test_key');
    });
  });

  describe('hasItem', () => {
    it('should return true for existing items', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('some data');
      
      const result = await storageService.hasItem('test_key');
      
      expect(result).toBe(true);
    });

    it('should return false for non-existent items', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      
      const result = await storageService.hasItem('test_key');
      
      expect(result).toBe(false);
    });
  });

  describe('getAllKeys', () => {
    it('should return filtered keys without prefix', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([
        'dingding_cat_key1',
        'dingding_cat_key2',
        'other_app_key',
        'dingding_cat_key3'
      ]);
      
      const result = await storageService.getAllKeys();
      
      expect(result).toEqual(['key1', 'key2', 'key3']);
    });
  });

  describe('multiSet', () => {
    it('should batch set multiple items', async () => {
      const keyValuePairs: Array<[string, any]> = [
        ['key1', { data: 'value1' }],
        ['key2', { data: 'value2' }]
      ];
      
      await storageService.multiSet(keyValuePairs);
      
      expect(AsyncStorage.multiSet).toHaveBeenCalledWith([
        ['dingding_cat_key1', JSON.stringify({ data: 'value1' })],
        ['dingding_cat_key2', JSON.stringify({ data: 'value2' })]
      ]);
    });
  });

  describe('multiGet', () => {
    it('should batch get multiple items', async () => {
      (AsyncStorage.multiGet as jest.Mock).mockResolvedValue([
        ['dingding_cat_key1', JSON.stringify({ data: 'value1' })],
        ['dingding_cat_key2', null],
        ['dingding_cat_key3', JSON.stringify({ data: 'value3' })]
      ]);
      
      const result = await storageService.multiGet(['key1', 'key2', 'key3']);
      
      expect(result).toEqual({
        key1: { data: 'value1' },
        key2: null,
        key3: { data: 'value3' }
      });
    });
  });

  describe('clear', () => {
    it('should clear all app-specific data', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([
        'dingding_cat_key1',
        'dingding_cat_key2',
        'other_app_key'
      ]);
      
      await storageService.clear();
      
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        'dingding_cat_key1',
        'dingding_cat_key2'
      ]);
    });
  });

  describe('getStorageStats', () => {
    it('should return storage statistics', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([
        'dingding_cat_key1',
        'dingding_cat_key2'
      ]);
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce('{"data":"value1"}')
        .mockResolvedValueOnce('{"data":"value2"}');
      
      const stats = await storageService.getStorageStats();
      
      expect(stats.totalKeys).toBe(2);
      expect(stats.estimatedSize).toBeGreaterThan(0);
    });
  });
});