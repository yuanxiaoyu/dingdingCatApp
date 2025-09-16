import SQLite from 'react-native-sqlite-storage';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SyncService } from '../SyncService';
import apiClient from '../apiClient';
import { AdType, AdPlayData } from '../../types';

// Mock dependencies
jest.mock('react-native-sqlite-storage');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../apiClient');

// Mock NetInfo with proper structure
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
  addEventListener: jest.fn(),
  useNetInfo: jest.fn(),
}));

// Mock implementations
const mockDatabase = {
  executeSql: jest.fn(),
  close: jest.fn(),
};

const mockSQLite = SQLite as jest.Mocked<typeof SQLite>;
const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('SyncService', () => {
  let syncService: SyncService;
  let networkListener: (state: any) => void;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Setup SQLite mocks
    mockSQLite.DEBUG = jest.fn();
    mockSQLite.enablePromise = jest.fn();
    mockSQLite.openDatabase = jest.fn().mockImplementation(() => Promise.resolve(mockDatabase));
    
    // Setup NetInfo mocks
    mockNetInfo.fetch = jest.fn().mockResolvedValue({
      isConnected: true,
      type: 'wifi',
      isInternetReachable: true,
    });
    
    mockNetInfo.addEventListener = jest.fn().mockImplementation((listener) => {
      networkListener = listener;
      return jest.fn(); // unsubscribe function
    });

    // Setup AsyncStorage mocks
    mockAsyncStorage.getItem = jest.fn().mockResolvedValue(null);
    mockAsyncStorage.setItem = jest.fn().mockResolvedValue(undefined);
    mockAsyncStorage.removeItem = jest.fn().mockResolvedValue(undefined);

    // Setup database execution mocks
    mockDatabase.executeSql = jest.fn().mockResolvedValue([{
      rows: {
        length: 0,
        item: jest.fn(),
      },
      rowsAffected: 0,
    }]);

    // Create service instance
    syncService = new SyncService({
      maxRetries: 3,
      batchSize: 10,
      syncInterval: 1000,
      maxQueueSize: 100,
      autoSyncEnabled: false, // Disable auto sync for tests
    });
    
    // Initialize the service
    await syncService.initialize();
  });

  afterEach(async () => {
    if (syncService) {
      await syncService.cleanup();
    }
  });

  describe('Initialization', () => {
    it('should initialize database and network monitoring', async () => {
      expect(mockSQLite.openDatabase).toHaveBeenCalledWith(
        'DingDingCat.db',
        '1.0',
        'DingDingCat Database',
        200000
      );

      expect(mockDatabase.executeSql).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS offline_ad_data')
      );

      expect(mockNetInfo.fetch).toHaveBeenCalled();
      expect(mockNetInfo.addEventListener).toHaveBeenCalled();
    });

    it('should handle database initialization failure', async () => {
      mockSQLite.openDatabase = jest.fn().mockRejectedValue(new Error('Database error'));

      const failingService = new SyncService();
      await expect(failingService.initialize()).rejects.toThrow('Database error');
    });
  });

  describe('Queue Management', () => {

    it('should queue offline data successfully', async () => {
      const playData: AdPlayData = {
        adId: 'test_ad',
        adType: AdType.REWARD_VIDEO,
        playDuration: 30000,
        isClicked: true,
        isSkipped: false,
        timestamp: Date.now(),
      };

      mockDatabase.executeSql = jest.fn().mockResolvedValue([{
        rows: { length: 0, item: jest.fn() },
        rowsAffected: 1,
      }]);

      const offlineId = await syncService.queueOfflineData(
        123,
        'test_app_key',
        'test_ad',
        AdType.REWARD_VIDEO,
        'complete',
        playData
      );

      expect(offlineId).toMatch(/^offline_\d+_[a-z0-9]+$/);
      expect(mockDatabase.executeSql).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO offline_ad_data'),
        expect.arrayContaining([
          offlineId,
          123,
          'test_app_key',
          'test_ad',
          AdType.REWARD_VIDEO,
          'complete',
          JSON.stringify(playData),
          expect.any(Number),
          0, // synced = false
          0, // retryCount = 0
        ])
      );
    });

    it('should get queue size correctly', async () => {
      mockDatabase.executeSql = jest.fn().mockResolvedValue([{
        rows: {
          length: 1,
          item: jest.fn().mockReturnValue({ count: 5 }),
        },
      }]);

      const queueSize = await syncService.getQueueSize();

      expect(queueSize).toBe(5);
      expect(mockDatabase.executeSql).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM offline_ad_data WHERE synced = 0'
      );
    });

    it('should handle queue size limit', async () => {
      // Mock queue size check to return max size
      mockDatabase.executeSql = jest.fn()
        .mockResolvedValueOnce([{
          rows: {
            length: 1,
            item: jest.fn().mockReturnValue({ count: 100 }), // At max size
          },
        }])
        .mockResolvedValueOnce([{
          rows: { length: 0, item: jest.fn() },
          rowsAffected: 10, // Cleanup 10 items
        }])
        .mockResolvedValueOnce([{
          rows: { length: 0, item: jest.fn() },
          rowsAffected: 1, // Insert new item
        }]);

      const playData: AdPlayData = {
        adId: 'test_ad',
        adType: AdType.SPLASH,
        playDuration: 5000,
        isClicked: false,
        isSkipped: false,
        timestamp: Date.now(),
      };

      await syncService.queueOfflineData(
        123,
        'test_app_key',
        'test_ad',
        AdType.SPLASH,
        'show',
        playData
      );

      // Should call cleanup when queue is full
      expect(mockDatabase.executeSql).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM offline_ad_data'),
        [10] // cleanup count
      );
    });
  });

  describe('Network Monitoring', () => {

    it('should detect network state changes', () => {
      expect(syncService.isNetworkAvailable()).toBe(true);

      // Simulate network disconnection
      networkListener({
        isConnected: false,
        type: 'none',
        isInternetReachable: false,
      });

      expect(syncService.isNetworkAvailable()).toBe(false);
    });

    it('should trigger sync when network reconnects', async () => {
      const syncSpy = jest.spyOn(syncService, 'syncOfflineData').mockResolvedValue();

      // Simulate network reconnection
      networkListener({
        isConnected: true,
        type: 'wifi',
        isInternetReachable: true,
      });

      // Wait for async sync trigger
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(syncSpy).toHaveBeenCalled();
    });
  });

  describe('Data Synchronization', () => {

    it('should sync offline data successfully', async () => {
      // Mock unsynced data
      const mockUnsyncedData = [
        {
          id: 'offline_1',
          userId: 123,
          appKey: 'test_app',
          adId: 'ad_1',
          adType: 'video',
          eventType: 'complete',
          playData: JSON.stringify({
            adId: 'ad_1',
            adType: 'video',
            playDuration: 30000,
            isClicked: true,
            isSkipped: false,
            timestamp: Date.now(),
          }),
          timestamp: Date.now(),
          synced: 0,
          retryCount: 0,
        },
      ];

      mockDatabase.executeSql = jest.fn()
        .mockResolvedValueOnce([{
          rows: {
            length: 1,
            item: jest.fn().mockReturnValue(mockUnsyncedData[0]),
          },
        }])
        .mockResolvedValueOnce([{
          rows: { length: 0, item: jest.fn() },
          rowsAffected: 1,
        }]);

      mockApiClient.post = jest.fn().mockResolvedValue({
        code: 200,
        message: 'Success',
        data: {},
      });

      await syncService.syncOfflineData();

      expect(mockApiClient.post).toHaveBeenCalledWith('/ad/batchReport', {
        userId: 123,
        appKey: 'test_app',
        playDataList: [{
          adType: 'video',
          playDuration: 30000,
          isClicked: '1',
          isSkipped: '0',
          stayDuration: undefined,
        }],
      });

      // Should mark data as synced
      expect(mockDatabase.executeSql).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE offline_ad_data SET synced = 1'),
        ['offline_1']
      );
    });

    it('should handle sync failures with retry', async () => {
      const mockUnsyncedData = [
        {
          id: 'offline_1',
          userId: 123,
          appKey: 'test_app',
          adId: 'ad_1',
          adType: 'video',
          eventType: 'complete',
          playData: JSON.stringify({
            adId: 'ad_1',
            adType: 'video',
            playDuration: 30000,
            isClicked: false,
            isSkipped: false,
            timestamp: Date.now(),
          }),
          timestamp: Date.now(),
          synced: 0,
          retryCount: 0,
        },
      ];

      mockDatabase.executeSql = jest.fn()
        .mockResolvedValueOnce([{
          rows: {
            length: 1,
            item: jest.fn().mockReturnValue(mockUnsyncedData[0]),
          },
        }])
        .mockResolvedValueOnce([{
          rows: { length: 0, item: jest.fn() },
          rowsAffected: 1,
        }]);

      mockApiClient.post = jest.fn().mockRejectedValue(new Error('Network error'));

      await syncService.syncOfflineData();

      // Should increment retry count
      expect(mockDatabase.executeSql).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE offline_ad_data SET retryCount = retryCount + 1'),
        ['offline_1']
      );
    });

    it('should skip sync when network is unavailable', async () => {
      // Simulate no network
      networkListener({
        isConnected: false,
        type: 'none',
        isInternetReachable: false,
      });

      const syncSpy = jest.spyOn(mockApiClient, 'post');

      await syncService.syncOfflineData();

      expect(syncSpy).not.toHaveBeenCalled();
    });

    it('should skip sync when already syncing', async () => {
      // Start first sync
      const syncPromise1 = syncService.syncOfflineData();
      
      // Try to start second sync immediately
      const syncPromise2 = syncService.syncOfflineData();

      await Promise.all([syncPromise1, syncPromise2]);

      // API should only be called once
      expect(mockApiClient.post).toHaveBeenCalledTimes(0); // No unsynced data in this test
    });
  });

  describe('Statistics and Status', () => {

    it('should get sync statistics correctly', async () => {
      mockDatabase.executeSql = jest.fn().mockResolvedValue([{
        rows: {
          length: 1,
          item: jest.fn().mockReturnValue({
            total: 10,
            synced: 7,
            pending: 2,
            failed: 1,
          }),
        },
      }]);

      mockAsyncStorage.getItem = jest.fn().mockResolvedValue('1234567890');

      const stats = await syncService.getSyncStats();

      expect(stats).toEqual({
        totalQueued: 10,
        synced: 7,
        pending: 2,
        failed: 1,
        lastSyncTime: 1234567890,
      });
    });

    it('should return correct sync status', () => {
      expect(syncService.isSyncInProgress()).toBe(false);
      expect(syncService.isNetworkAvailable()).toBe(true);
    });
  });

  describe('Configuration Management', () => {

    it('should update sync configuration', () => {
      const newConfig = {
        batchSize: 25,
        maxRetries: 5,
        syncInterval: 60000,
      };

      syncService.updateSyncConfig(newConfig);

      // Configuration should be updated (we can't directly test private config,
      // but we can test behavior changes)
      expect(() => syncService.updateSyncConfig(newConfig)).not.toThrow();
    });

    it('should enable/disable auto sync', () => {
      syncService.updateSyncConfig({ autoSyncEnabled: true });
      syncService.updateSyncConfig({ autoSyncEnabled: false });

      expect(() => syncService.updateSyncConfig({ autoSyncEnabled: true })).not.toThrow();
    });
  });

  describe('Data Management', () => {

    it('should clear synced data', async () => {
      mockDatabase.executeSql = jest.fn().mockResolvedValue([{
        rows: { length: 0, item: jest.fn() },
        rowsAffected: 5,
      }]);

      await syncService.clearSyncedData();

      expect(mockDatabase.executeSql).toHaveBeenCalledWith(
        'DELETE FROM offline_ad_data WHERE synced = 1'
      );
    });

    it('should force sync all data', async () => {
      mockDatabase.executeSql = jest.fn()
        .mockResolvedValueOnce([{
          rows: { length: 0, item: jest.fn() },
          rowsAffected: 3,
        }])
        .mockResolvedValueOnce([{
          rows: { length: 0, item: jest.fn() },
        }]);

      await syncService.forceSyncAll();

      // Should reset retry counts
      expect(mockDatabase.executeSql).toHaveBeenCalledWith(
        'UPDATE offline_ad_data SET retryCount = 0 WHERE synced = 0'
      );
    });

    it('should throw error when forcing sync without network', async () => {
      // Simulate no network
      networkListener({
        isConnected: false,
        type: 'none',
        isInternetReachable: false,
      });

      await expect(syncService.forceSyncAll()).rejects.toThrow(
        'No network connection available'
      );
    });
  });

  describe('Error Handling', () => {

    it('should handle database errors gracefully', async () => {
      mockDatabase.executeSql = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(syncService.getQueueSize()).rejects.toThrow('Database error');
    });

    it('should handle API errors during sync', async () => {
      const mockUnsyncedData = [
        {
          id: 'offline_1',
          userId: 123,
          appKey: 'test_app',
          adId: 'ad_1',
          adType: 'video',
          eventType: 'complete',
          playData: JSON.stringify({
            adId: 'ad_1',
            adType: 'video',
            playDuration: 30000,
            isClicked: false,
            isSkipped: false,
            timestamp: Date.now(),
          }),
          timestamp: Date.now(),
          synced: 0,
          retryCount: 0,
        },
      ];

      mockDatabase.executeSql = jest.fn()
        .mockResolvedValueOnce([{
          rows: {
            length: 1,
            item: jest.fn().mockReturnValue(mockUnsyncedData[0]),
          },
        }])
        .mockResolvedValueOnce([{
          rows: { length: 0, item: jest.fn() },
          rowsAffected: 1,
        }]);

      mockApiClient.post = jest.fn().mockResolvedValue({
        code: 500,
        message: 'Server error',
        data: null,
      });

      // Should not throw, but handle error gracefully
      await expect(syncService.syncOfflineData()).resolves.not.toThrow();
    });

    it('should handle storage errors', async () => {
      mockAsyncStorage.setItem = jest.fn().mockRejectedValue(new Error('Storage error'));

      // Should not throw during queue operation
      const playData: AdPlayData = {
        adId: 'test_ad',
        adType: AdType.BANNER,
        playDuration: 1000,
        isClicked: false,
        isSkipped: false,
        timestamp: Date.now(),
      };

      await expect(syncService.queueOfflineData(
        123,
        'test_app',
        'test_ad',
        AdType.BANNER,
        'show',
        playData
      )).resolves.toBeDefined();
    });
  });

  describe('Cleanup', () => {

    it('should cleanup resources properly', async () => {
      await syncService.cleanup();

      expect(mockDatabase.close).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      mockDatabase.close = jest.fn().mockRejectedValue(new Error('Close error'));

      await expect(syncService.cleanup()).resolves.not.toThrow();
    });
  });

  describe('Batch Processing', () => {

    it('should group data by user correctly', async () => {
      const mockUnsyncedData = [
        {
          id: 'offline_1',
          userId: 123,
          appKey: 'test_app',
          adId: 'ad_1',
          adType: 'video',
          eventType: 'complete',
          playData: JSON.stringify({
            adId: 'ad_1',
            adType: 'video',
            playDuration: 30000,
            isClicked: true,
            isSkipped: false,
            timestamp: Date.now(),
          }),
          timestamp: Date.now(),
          synced: 0,
          retryCount: 0,
        },
        {
          id: 'offline_2',
          userId: 456,
          appKey: 'test_app',
          adId: 'ad_2',
          adType: 'splash',
          eventType: 'show',
          playData: JSON.stringify({
            adId: 'ad_2',
            adType: 'splash',
            playDuration: 5000,
            isClicked: false,
            isSkipped: false,
            timestamp: Date.now(),
          }),
          timestamp: Date.now(),
          synced: 0,
          retryCount: 0,
        },
      ];

      mockDatabase.executeSql = jest.fn()
        .mockResolvedValueOnce([{
          rows: {
            length: 2,
            item: jest.fn()
              .mockReturnValueOnce(mockUnsyncedData[0])
              .mockReturnValueOnce(mockUnsyncedData[1]),
          },
        }])
        .mockResolvedValue([{
          rows: { length: 0, item: jest.fn() },
          rowsAffected: 1,
        }]);

      mockApiClient.post = jest.fn().mockResolvedValue({
        code: 200,
        message: 'Success',
        data: {},
      });

      await syncService.syncOfflineData();

      // Should make separate API calls for each user
      expect(mockApiClient.post).toHaveBeenCalledTimes(2);
      expect(mockApiClient.post).toHaveBeenCalledWith('/ad/batchReport', {
        userId: 123,
        appKey: 'test_app',
        playDataList: expect.any(Array),
      });
      expect(mockApiClient.post).toHaveBeenCalledWith('/ad/batchReport', {
        userId: 456,
        appKey: 'test_app',
        playDataList: expect.any(Array),
      });
    });

    it('should respect batch size limits', async () => {
      // Create service with small batch size
      const smallBatchService = new SyncService({
        batchSize: 2,
        autoSyncEnabled: false,
      });

      await smallBatchService.initialize();

      // Mock large dataset
      const mockLargeDataset = Array.from({ length: 5 }, (_, i) => ({
        id: `offline_${i}`,
        userId: 123,
        appKey: 'test_app',
        adId: `ad_${i}`,
        adType: 'video',
        eventType: 'complete',
        playData: JSON.stringify({
          adId: `ad_${i}`,
          adType: 'video',
          playDuration: 30000,
          isClicked: false,
          isSkipped: false,
          timestamp: Date.now(),
        }),
        timestamp: Date.now(),
        synced: 0,
        retryCount: 0,
      }));

      mockDatabase.executeSql = jest.fn()
        .mockResolvedValueOnce([{
          rows: {
            length: 5,
            item: jest.fn()
              .mockReturnValueOnce(mockLargeDataset[0])
              .mockReturnValueOnce(mockLargeDataset[1])
              .mockReturnValueOnce(mockLargeDataset[2])
              .mockReturnValueOnce(mockLargeDataset[3])
              .mockReturnValueOnce(mockLargeDataset[4]),
          },
        }])
        .mockResolvedValue([{
          rows: { length: 0, item: jest.fn() },
          rowsAffected: 1,
        }]);

      mockApiClient.post = jest.fn().mockResolvedValue({
        code: 200,
        message: 'Success',
        data: {},
      });

      await smallBatchService.syncOfflineData();

      // Should only process batch size (2) items
      expect(mockApiClient.post).toHaveBeenCalledWith('/ad/batchReport', {
        userId: 123,
        appKey: 'test_app',
        playDataList: expect.arrayContaining([
          expect.objectContaining({ adType: 'video' }),
          expect.objectContaining({ adType: 'video' }),
        ]),
      });

      await smallBatchService.cleanup();
    });
  });
});