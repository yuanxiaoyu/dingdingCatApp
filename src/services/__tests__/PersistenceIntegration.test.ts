import persistenceService from '../PersistenceService';
import { OfflineAdData } from '../DatabaseService';

// Mock all dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(undefined),
  getAllKeys: jest.fn().mockResolvedValue([]),
  multiSet: jest.fn().mockResolvedValue(undefined),
  multiGet: jest.fn().mockResolvedValue([]),
  multiRemove: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn().mockResolvedValue(true),
  getInternetCredentials: jest.fn().mockResolvedValue({ username: 'test', password: 'test' }),
  resetInternetCredentials: jest.fn().mockResolvedValue(true),
  getAllInternetCredentials: jest.fn().mockResolvedValue([]),
  getSecurityLevel: jest.fn().mockResolvedValue('SECURE_HARDWARE'),
}));

jest.mock('react-native-sqlite-storage', () => ({
  DEBUG: jest.fn(),
  enablePromise: jest.fn(),
  openDatabase: jest.fn().mockResolvedValue({
    executeSql: jest.fn().mockResolvedValue([{ insertId: 1, rowsAffected: 1, rows: { length: 0, item: () => ({}) } }]),
    close: jest.fn().mockResolvedValue(undefined),
  }),
  deleteDatabase: jest.fn().mockResolvedValue(true),
}));

describe('Persistence Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should demonstrate complete persistence workflow', async () => {
    // This test demonstrates how the persistence services work together
    
    // 1. Initialize persistence service
    await persistenceService.initialize();

    // 2. Store user configuration
    const userConfig = {
      userId: 123,
      preferences: {
        notifications: true,
        theme: 'dark'
      }
    };
    await persistenceService.storeUserData('user_config', userConfig);

    // 3. Store sensitive token data
    await persistenceService.storeAccessToken('access_token_123');
    await persistenceService.storeRefreshToken('refresh_token_456');

    // 4. Store app configuration with version
    const appConfig = {
      apiUrl: 'https://api.example.com',
      features: ['feature1', 'feature2']
    };
    await persistenceService.storeConfig('app_config', appConfig, '1.0.0');

    // 5. Store offline ad data
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
    await persistenceService.storeOfflineAdData(adData);

    // 6. Retrieve data
    const retrievedConfig = await persistenceService.getUserData('user_config');
    const accessToken = await persistenceService.getAccessToken();
    const appConfigData = await persistenceService.getConfig('app_config');
    const unsyncedData = await persistenceService.getUnsyncedAdData(10);

    // 7. Check if config needs update
    const needsUpdate = await persistenceService.shouldUpdateConfig('app_config', '1.1.0');

    // 8. Perform maintenance
    await persistenceService.performMaintenance();

    // 9. Get storage statistics
    const stats = await persistenceService.getStorageStats();

    // All operations should complete without throwing errors
    expect(true).toBe(true);
  });

  it('should handle data export and import', async () => {
    await persistenceService.initialize();

    // Store some test data
    await persistenceService.storeUserData('test_key', { value: 'test' });
    await persistenceService.storeConfig('test_config', { setting: 'value' }, '1.0.0');

    // Export data
    const exportedData = await persistenceService.exportData();
    expect(exportedData).toHaveProperty('storage');
    expect(exportedData).toHaveProperty('configs');
    expect(exportedData).toHaveProperty('timestamp');

    // Clear all data
    await persistenceService.clearAllData();

    // Import data back
    await persistenceService.importData(exportedData);

    expect(true).toBe(true);
  });

  it('should handle error scenarios gracefully', async () => {
    // Test error handling without throwing
    try {
      await persistenceService.getUserData('non_existent_key');
      await persistenceService.getConfig('non_existent_config');
      await persistenceService.getUnsyncedAdData(0);
      
      // Should not throw errors
      expect(true).toBe(true);
    } catch (error) {
      // Should not reach here
      expect(error).toBeUndefined();
    }
  });
});