import SQLite from 'react-native-sqlite-storage';
import { DatabaseService, OfflineAdData } from '../DatabaseService';

// Mock SQLite
jest.mock('react-native-sqlite-storage', () => ({
  DEBUG: jest.fn(),
  enablePromise: jest.fn(),
  openDatabase: jest.fn(),
  deleteDatabase: jest.fn(),
}));

describe('DatabaseService', () => {
  let databaseService: DatabaseService;
  let mockDb: any;

  beforeEach(() => {
    // Reset the singleton instance for testing
    (DatabaseService as any).instance = null;
    databaseService = DatabaseService.getInstance();
    
    mockDb = {
      executeSql: jest.fn(),
      close: jest.fn(),
    };
    
    (SQLite.openDatabase as jest.Mock).mockResolvedValue(mockDb);
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize database and create tables', async () => {
      mockDb.executeSql.mockResolvedValue([{ insertId: 1, rowsAffected: 1 }]);
      
      await databaseService.initialize();
      
      expect(SQLite.openDatabase).toHaveBeenCalledWith({
        name: 'dingding_cat.db',
        version: '1.0',
        displayName: 'DingDing Cat Database',
        size: 200000,
        location: 'default'
      });
      
      // Should create tables
      expect(mockDb.executeSql).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS offline_ad_data')
      );
      expect(mockDb.executeSql).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS config_cache')
      );
      expect(mockDb.executeSql).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS user_sessions')
      );
    });

    it('should not reinitialize if already initialized', async () => {
      mockDb.executeSql.mockResolvedValue([{ insertId: 1, rowsAffected: 1 }]);
      
      await databaseService.initialize();
      jest.clearAllMocks(); // Clear mocks after first initialization
      await databaseService.initialize(); // Second call
      
      expect(SQLite.openDatabase).not.toHaveBeenCalled();
    });
  });

  describe('insertOfflineAdData', () => {
    beforeEach(async () => {
      mockDb.executeSql.mockResolvedValue([{ insertId: 1, rowsAffected: 1 }]);
      await databaseService.initialize();
      jest.clearAllMocks();
    });

    it('should insert offline ad data', async () => {
      const adData: Omit<OfflineAdData, 'id' | 'createdAt'> = {
        userId: 123,
        appKey: 'test_app',
        adId: 'ad_123',
        adType: 'video',
        eventType: 'complete',
        playData: JSON.stringify({ duration: 30 }),
        timestamp: Date.now(),
        synced: false,
        retryCount: 0
      };

      mockDb.executeSql.mockResolvedValue([{ insertId: 5, rowsAffected: 1 }]);
      
      const insertId = await databaseService.insertOfflineAdData(adData);
      
      expect(insertId).toBe(5);
      expect(mockDb.executeSql).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO offline_ad_data'),
        expect.arrayContaining([
          adData.userId,
          adData.appKey,
          adData.adId,
          adData.adType,
          adData.eventType,
          adData.playData,
          adData.timestamp,
          0, // synced as boolean -> integer
          adData.retryCount,
          expect.any(Number) // createdAt
        ])
      );
    });
  });

  describe('getUnsyncedAdData', () => {
    beforeEach(async () => {
      mockDb.executeSql.mockResolvedValue([{ insertId: 1, rowsAffected: 1 }]);
      await databaseService.initialize();
      jest.clearAllMocks();
    });

    it('should retrieve unsynced ad data', async () => {
      const mockRows = {
        length: 2,
        item: jest.fn()
          .mockReturnValueOnce({
            id: 1,
            userId: 123,
            appKey: 'test_app',
            adId: 'ad_123',
            adType: 'video',
            eventType: 'complete',
            playData: '{"duration":30}',
            timestamp: Date.now(),
            synced: 0,
            retryCount: 0,
            createdAt: Date.now()
          })
          .mockReturnValueOnce({
            id: 2,
            userId: 123,
            appKey: 'test_app',
            adId: 'ad_456',
            adType: 'splash',
            eventType: 'show',
            playData: '{"duration":5}',
            timestamp: Date.now(),
            synced: 0,
            retryCount: 1,
            createdAt: Date.now()
          })
      };

      mockDb.executeSql.mockResolvedValue([{ rows: mockRows }]);
      
      const result = await databaseService.getUnsyncedAdData({ limit: 10 });
      
      expect(result).toHaveLength(2);
      expect(result[0].synced).toBe(false); // Converted from 0 to boolean
      expect(result[1].synced).toBe(false);
      expect(mockDb.executeSql).toHaveBeenCalledWith(
        expect.stringContaining('WHERE synced = FALSE'),
        [10, 0]
      );
    });
  });

  describe('markAsSynced', () => {
    beforeEach(async () => {
      mockDb.executeSql.mockResolvedValue([{ insertId: 1, rowsAffected: 1 }]);
      await databaseService.initialize();
      jest.clearAllMocks();
    });

    it('should mark records as synced', async () => {
      const ids = [1, 2, 3];
      mockDb.executeSql.mockResolvedValue([{ rowsAffected: 3 }]);
      
      await databaseService.markAsSynced(ids);
      
      expect(mockDb.executeSql).toHaveBeenCalledWith(
        'UPDATE offline_ad_data SET synced = TRUE WHERE id IN (?,?,?)',
        ids
      );
    });
  });

  describe('incrementRetryCount', () => {
    beforeEach(async () => {
      mockDb.executeSql.mockResolvedValue([{ insertId: 1, rowsAffected: 1 }]);
      await databaseService.initialize();
      jest.clearAllMocks();
    });

    it('should increment retry count for records', async () => {
      const ids = [1, 2];
      mockDb.executeSql.mockResolvedValue([{ rowsAffected: 2 }]);
      
      await databaseService.incrementRetryCount(ids);
      
      expect(mockDb.executeSql).toHaveBeenCalledWith(
        'UPDATE offline_ad_data SET retryCount = retryCount + 1 WHERE id IN (?,?)',
        ids
      );
    });
  });

  describe('cleanupSyncedData', () => {
    beforeEach(async () => {
      mockDb.executeSql.mockResolvedValue([{ insertId: 1, rowsAffected: 1 }]);
      await databaseService.initialize();
      jest.clearAllMocks();
    });

    it('should cleanup old synced data', async () => {
      mockDb.executeSql.mockResolvedValue([{ rowsAffected: 5 }]);
      
      const deletedCount = await databaseService.cleanupSyncedData(7);
      
      expect(deletedCount).toBe(5);
      expect(mockDb.executeSql).toHaveBeenCalledWith(
        'DELETE FROM offline_ad_data WHERE synced = TRUE AND createdAt < ?',
        [expect.any(Number)]
      );
    });
  });

  describe('getDatabaseStats', () => {
    beforeEach(async () => {
      mockDb.executeSql.mockResolvedValue([{ insertId: 1, rowsAffected: 1 }]);
      await databaseService.initialize();
      jest.clearAllMocks();
    });

    it('should return database statistics', async () => {
      mockDb.executeSql
        .mockResolvedValueOnce([{ rows: { item: () => ({ count: 100 }) } }]) // total
        .mockResolvedValueOnce([{ rows: { item: () => ({ count: 25 }) } }])  // unsynced
        .mockResolvedValueOnce([{ rows: { item: () => ({ count: 75 }) } }])  // synced
        .mockResolvedValueOnce([{ rows: { item: () => ({ count: 5 }) } }])   // failed
        .mockResolvedValueOnce([{ rows: { item: () => ({ oldest: 1000000, newest: 2000000 }) } }]); // time range
      
      const stats = await databaseService.getDatabaseStats();
      
      expect(stats).toEqual({
        totalRecords: 100,
        unsyncedRecords: 25,
        syncedRecords: 75,
        failedRecords: 5,
        oldestRecord: 1000000,
        newestRecord: 2000000
      });
    });
  });

  describe('performMaintenance', () => {
    beforeEach(async () => {
      mockDb.executeSql.mockResolvedValue([{ insertId: 1, rowsAffected: 1 }]);
      await databaseService.initialize();
      jest.clearAllMocks();
    });

    it('should perform database maintenance', async () => {
      mockDb.executeSql.mockResolvedValue([{ rowsAffected: 0 }]);
      
      await databaseService.performMaintenance();
      
      expect(mockDb.executeSql).toHaveBeenCalledWith('VACUUM');
      expect(mockDb.executeSql).toHaveBeenCalledWith('ANALYZE');
    });
  });

  describe('close', () => {
    beforeEach(async () => {
      mockDb.executeSql.mockResolvedValue([{ insertId: 1, rowsAffected: 1 }]);
      await databaseService.initialize();
      jest.clearAllMocks();
    });

    it('should close database connection', async () => {
      await databaseService.close();
      
      expect(mockDb.close).toHaveBeenCalled();
    });
  });

  describe('deleteDatabase', () => {
    it('should delete database', async () => {
      (SQLite.deleteDatabase as jest.Mock).mockResolvedValue(true);
      
      await databaseService.deleteDatabase();
      
      expect(SQLite.deleteDatabase).toHaveBeenCalledWith({
        name: 'dingding_cat.db',
        location: 'default'
      });
    });
  });
});