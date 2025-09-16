import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import deviceService, { DeviceService } from '../DeviceService';
import apiClient from '../apiClient';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('react-native-device-info');
jest.mock('@react-native-community/netinfo');
jest.mock('../apiClient');

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockDeviceInfo = DeviceInfo as jest.Mocked<typeof DeviceInfo>;
const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

describe('DeviceService', () => {
  let service: DeviceService;

  const mockDeviceInfoData = {
    model: 'iPhone 13',
    brand: 'Apple',
    systemName: 'iOS',
    systemVersion: '15.0',
    deviceId: 'test-device-id',
    uniqueId: 'test-unique-id',
    version: '1.0.0',
    buildNumber: '100',
    totalMemory: 6442450944, // 6GB in bytes
    usedMemory: 3221225472, // 3GB in bytes
    totalDiskCapacity: 137438953472, // 128GB in bytes
    freeDiskStorage: 68719476736, // 64GB in bytes
    carrier: 'Test Carrier',
    batteryLevel: 0.85,
    isCharging: false,
    deviceLocale: 'en-US',
    timezone: 'America/New_York',
    userAgent: 'Test User Agent',
  };

  const mockNetworkInfo = {
    type: 'wifi',
    isConnected: true,
    isInternetReachable: true,
    details: {
      ipAddress: '192.168.1.100',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DeviceService();

    // Setup AsyncStorage mocks
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
    
    // Setup DeviceInfo mocks - only mock methods that exist
    mockDeviceInfo.getModel = jest.fn().mockResolvedValue(mockDeviceInfoData.model);
    mockDeviceInfo.getBrand = jest.fn().mockResolvedValue(mockDeviceInfoData.brand);
    mockDeviceInfo.getSystemName = jest.fn().mockResolvedValue(mockDeviceInfoData.systemName);
    mockDeviceInfo.getSystemVersion = jest.fn().mockResolvedValue(mockDeviceInfoData.systemVersion);
    mockDeviceInfo.getDeviceId = jest.fn().mockResolvedValue(mockDeviceInfoData.deviceId);
    mockDeviceInfo.getUniqueId = jest.fn().mockResolvedValue(mockDeviceInfoData.uniqueId);
    mockDeviceInfo.getVersion = jest.fn().mockResolvedValue(mockDeviceInfoData.version);
    mockDeviceInfo.getBuildNumber = jest.fn().mockResolvedValue(mockDeviceInfoData.buildNumber);
    mockDeviceInfo.getTotalMemory = jest.fn().mockResolvedValue(mockDeviceInfoData.totalMemory);
    mockDeviceInfo.getUsedMemory = jest.fn().mockResolvedValue(mockDeviceInfoData.usedMemory);
    mockDeviceInfo.getTotalDiskCapacity = jest.fn().mockResolvedValue(mockDeviceInfoData.totalDiskCapacity);
    mockDeviceInfo.getFreeDiskStorage = jest.fn().mockResolvedValue(mockDeviceInfoData.freeDiskStorage);
    mockDeviceInfo.getCarrier = jest.fn().mockResolvedValue(mockDeviceInfoData.carrier);
    mockDeviceInfo.getBatteryLevel = jest.fn().mockResolvedValue(mockDeviceInfoData.batteryLevel);
    mockDeviceInfo.isBatteryCharging = jest.fn().mockResolvedValue(mockDeviceInfoData.isCharging);
    mockDeviceInfo.isEmulator = jest.fn().mockResolvedValue(false);
    
    // Setup optional methods
    (mockDeviceInfo as any).getDeviceLocale = jest.fn().mockResolvedValue(mockDeviceInfoData.deviceLocale);
    (mockDeviceInfo as any).getTimezone = jest.fn().mockResolvedValue(mockDeviceInfoData.timezone);
    (mockDeviceInfo as any).getUserAgent = jest.fn().mockResolvedValue(mockDeviceInfoData.userAgent);

    // Setup NetInfo mocks
    mockNetInfo.fetch.mockResolvedValue(mockNetworkInfo as any);
    mockNetInfo.addEventListener.mockImplementation(() => () => {});

    // Setup API client mocks
    mockApiClient.post.mockResolvedValue({
      code: 200,
      message: 'Success',
      data: {
        userId: 1001,
        appKey: 'test_app_key',
        reportTime: Date.now(),
      },
      timestamp: Date.now(),
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await expect(service.initialize()).resolves.not.toThrow();
      
      expect(mockAsyncStorage.getItem).toHaveBeenCalled();
      expect(mockNetInfo.addEventListener).toHaveBeenCalled();
    });

    it('should load cached device info on initialization', async () => {
      const cachedInfo = {
        userId: 1001,
        deviceModel: 'iPhone 12',
        collectionTime: Date.now() - 1000,
      };
      
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(cachedInfo));
      
      await service.initialize();
      
      const cached = service.getCachedDeviceInfo();
      expect(cached).toEqual(cachedInfo);
    });
  });

  describe('collectDeviceInfo', () => {
    it('should collect comprehensive device information', async () => {
      const deviceInfo = await service.collectDeviceInfo();

      expect(deviceInfo).toEqual(expect.objectContaining({
        deviceModel: mockDeviceInfoData.model,
        deviceBrand: mockDeviceInfoData.brand,
        osName: mockDeviceInfoData.systemName,
        osVersion: mockDeviceInfoData.systemVersion,
        deviceId: mockDeviceInfoData.deviceId,
        isRooted: false,
        isEmulator: false,
        appVersion: mockDeviceInfoData.version,
        appVersionCode: 100,
        networkType: mockNetworkInfo.type,
        totalMemory: 6144, // Converted to MB
        availableMemory: 3072, // Converted to MB
        totalStorage: 131072, // Converted to MB
        availableStorage: 65536, // Converted to MB
        carrier: mockDeviceInfoData.carrier,
        batteryLevel: 85, // Converted to percentage
        isCharging: false,
      }));

      expect(deviceInfo.collectionTime).toBeGreaterThan(0);
      expect(deviceInfo.networkInfo).toEqual({
        type: mockNetworkInfo.type,
        isConnected: mockNetworkInfo.isConnected,
        isInternetReachable: mockNetworkInfo.isInternetReachable,
      });
    });

    it('should handle device info collection errors gracefully', async () => {
      mockDeviceInfo.getModel.mockRejectedValue(new Error('Device info error'));
      
      const deviceInfo = await service.collectDeviceInfo();
      
      expect(deviceInfo.deviceModel).toBe('Unknown');
      expect(deviceInfo.collectionTime).toBeGreaterThan(0);
    });

    it('should cache collected device info', async () => {
      await service.collectDeviceInfo();
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@dingdingcat/device_info',
        expect.stringContaining(mockDeviceInfoData.model)
      );
    });

    it('should not collect if already collecting', async () => {
      // Start first collection
      const promise1 = service.collectDeviceInfo();
      
      // Start second collection immediately
      const promise2 = service.collectDeviceInfo();
      
      const [result1, result2] = await Promise.all([promise1, promise2]);
      
      // Both should return results, but second should use cached/empty data
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });

  describe('detectDeviceEnvironment', () => {
    it('should detect normal device environment', async () => {
      const result = await service.detectDeviceEnvironment();

      expect(result.isRooted).toBe(false);
      expect(result.isEmulator).toBe(false);
      expect(result.deviceFingerprint).toBeTruthy();
      expect(result.detectionDetails.deviceInfo).toEqual(expect.objectContaining({
        brand: mockDeviceInfoData.brand,
        model: mockDeviceInfoData.model,
        systemName: mockDeviceInfoData.systemName,
      }));
    });

    it('should detect emulator using device-info API', async () => {
      mockDeviceInfo.isEmulator.mockResolvedValue(true);

      const result = await service.detectDeviceEnvironment();

      expect(result.isEmulator).toBe(true);
      expect(result.detectionDetails.emulatorDetectionMethods).toContain('device-info-api');
    });

    it('should detect emulator by suspicious brand', async () => {
      mockDeviceInfo.getBrand.mockResolvedValue('generic');
      mockDeviceInfo.isEmulator.mockResolvedValue(false);

      const result = await service.detectDeviceEnvironment();

      expect(result.isEmulator).toBe(true);
      expect(result.detectionDetails.emulatorDetectionMethods).toContain('brand-analysis');
      expect(result.detectionDetails.suspiciousIndicators).toContain('suspicious-brand-generic');
    });

    it('should detect emulator by suspicious model', async () => {
      mockDeviceInfo.getModel.mockResolvedValue('sdk_emulator');
      mockDeviceInfo.isEmulator.mockResolvedValue(false);

      const result = await service.detectDeviceEnvironment();

      expect(result.isEmulator).toBe(true);
      expect(result.detectionDetails.emulatorDetectionMethods).toContain('model-analysis');
      expect(result.detectionDetails.suspiciousIndicators).toContain('suspicious-model-sdk_emulator');
    });

    it('should detect rooted Android device', async () => {
      // Mock Platform.OS to be android
      (Platform as any).OS = 'android';
      
      // Add getTags method that indicates root
      (DeviceInfo as any).getTags = jest.fn().mockResolvedValue('test-keys');
      
      const result = await service.detectDeviceEnvironment();

      expect(result.isRooted).toBe(true);
      expect(result.detectionDetails.rootDetectionMethods).toContain('test-keys-detection');
      expect(result.detectionDetails.suspiciousIndicators).toContain('test-keys-found');
      
      // Reset Platform.OS
      (Platform as any).OS = 'ios';
    });

    it('should handle detection errors gracefully', async () => {
      // Clear cache first to ensure fresh detection
      await service.clearCache();
      mockDeviceInfo.getBrand.mockRejectedValue(new Error('Device info error'));

      const result = await service.detectDeviceEnvironment();

      expect(result.isRooted).toBe(false);
      expect(result.isEmulator).toBe(false);
      expect(result.deviceFingerprint).toBeTruthy();
      expect(result.detectionDetails.suspiciousIndicators).toContain('detection-error');
    });
  });

  describe('reportDeviceInfo', () => {
    it('should report device info to server successfully', async () => {
      const userId = 1001;
      
      const result = await service.reportDeviceInfo(userId);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/user/device',
        expect.objectContaining({
          userId,
          appKey: expect.any(String),
          deviceModel: expect.any(String),
          deviceBrand: expect.any(String),
          osName: expect.any(String),
          osVersion: expect.any(String),
          deviceId: expect.any(String),
          isRooted: expect.any(Boolean),
          isEmulator: expect.any(Boolean),
        })
      );

      expect(result).toEqual({
        userId: 1001,
        appKey: 'test_app_key',
        reportTime: expect.any(Number),
      });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@dingdingcat/last_device_report',
        expect.any(String)
      );
    });

    it('should skip reporting due to rate limiting', async () => {
      // Mock recent report time
      const recentTime = Date.now() - 30 * 60 * 1000; // 30 minutes ago
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@dingdingcat/last_device_report') {
          return Promise.resolve(recentTime.toString());
        }
        return Promise.resolve(null);
      });

      await expect(service.reportDeviceInfo(1001)).rejects.toThrow('Rate limited');
      expect(mockApiClient.post).not.toHaveBeenCalled();
    });

    it('should collect fresh device info if cache is expired', async () => {
      // Mock expired cache
      const expiredTime = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
      const expiredInfo = {
        deviceModel: 'Old Model',
        collectionTime: expiredTime,
      };
      
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@dingdingcat/device_info') {
          return Promise.resolve(JSON.stringify(expiredInfo));
        }
        return Promise.resolve(null);
      });

      await service.reportDeviceInfo(1001);

      // Should collect fresh info
      expect(mockDeviceInfo.getModel).toHaveBeenCalled();
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/user/device',
        expect.objectContaining({
          deviceModel: mockDeviceInfoData.model, // Fresh data, not expired
        })
      );
    });

    it('should handle API errors', async () => {
      mockApiClient.post.mockRejectedValue(new Error('API Error'));

      await expect(service.reportDeviceInfo(1001)).rejects.toThrow('API Error');
    });
  });

  describe('hasDeviceInfoChanged', () => {
    it('should detect device info changes', async () => {
      // First collect initial info
      await service.collectDeviceInfo();
      
      // Set initial cached info with different values
      const cachedInfo = {
        deviceModel: 'iPhone 12',
        deviceBrand: 'Apple',
        osName: 'iOS',
        osVersion: '14.0',
        isRooted: false,
        isEmulator: false,
        appVersion: '1.0.0',
        appVersionCode: 100,
        networkType: 'wifi',
        carrier: 'Test Carrier',
        collectionTime: Date.now(),
      };
      
      (service as any).cachedDeviceInfo = cachedInfo;

      // Mock different current info
      mockDeviceInfo.getModel.mockResolvedValue('iPhone 13');

      const hasChanged = await service.hasDeviceInfoChanged();

      expect(hasChanged).toBe(true);
    });

    it('should return true if no cached info exists', async () => {
      // Clear any existing cache
      await service.clearCache();
      (service as any).cachedDeviceInfo = null;

      const hasChanged = await service.hasDeviceInfoChanged();

      expect(hasChanged).toBe(true);
    });

    it('should return false if no significant changes', async () => {
      // Set cached info that matches current info
      const cachedInfo = {
        deviceModel: mockDeviceInfoData.model,
        deviceBrand: mockDeviceInfoData.brand,
        osVersion: mockDeviceInfoData.systemVersion,
        isRooted: false,
        isEmulator: false,
        appVersion: mockDeviceInfoData.version,
        appVersionCode: 100,
        networkType: mockNetworkInfo.type,
        carrier: mockDeviceInfoData.carrier,
        collectionTime: Date.now(),
      };
      
      (service as any).cachedDeviceInfo = cachedInfo;

      const hasChanged = await service.hasDeviceInfoChanged();

      expect(hasChanged).toBe(false);
    });
  });

  describe('change listeners', () => {
    it('should add and notify change listeners', async () => {
      const listener = jest.fn();
      
      service.addChangeListener(listener);
      
      const deviceInfo = await service.collectDeviceInfo();
      
      expect(listener).toHaveBeenCalledWith(deviceInfo);
    });

    it('should remove change listeners', () => {
      const listener = jest.fn();
      
      service.addChangeListener(listener);
      service.removeChangeListener(listener);
      
      // Listener should be removed
      expect((service as any).changeListeners).not.toContain(listener);
    });

    it('should handle listener errors gracefully', async () => {
      const errorListener = jest.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      
      service.addChangeListener(errorListener);
      
      // Should not throw despite listener error
      await expect(service.collectDeviceInfo()).resolves.toBeDefined();
    });
  });

  describe('cache management', () => {
    it('should clear cache successfully', async () => {
      await service.clearCache();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@dingdingcat/device_info');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@dingdingcat/last_device_report');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@dingdingcat/device_fingerprint');
      expect(service.getCachedDeviceInfo()).toBeNull();
    });

    it('should refresh device info by clearing cache and collecting', async () => {
      const refreshedInfo = await service.refreshDeviceInfo();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalled();
      expect(refreshedInfo).toBeDefined();
      expect(refreshedInfo.collectionTime).toBeGreaterThan(0);
    });

    it('should handle cache errors gracefully', async () => {
      mockAsyncStorage.removeItem.mockRejectedValue(new Error('Storage error'));

      await expect(service.clearCache()).resolves.not.toThrow();
    });
  });

  describe('network monitoring', () => {
    it('should start network monitoring on initialization', async () => {
      await service.initialize();

      expect(mockNetInfo.addEventListener).toHaveBeenCalled();
    });

    it('should update cached info when network changes', async () => {
      let networkListener: any;
      mockNetInfo.addEventListener.mockImplementation((listener) => {
        networkListener = listener;
        return () => {};
      });

      await service.initialize();
      await service.collectDeviceInfo();

      // Simulate network change
      const newNetworkState = {
        type: 'cellular',
        isConnected: true,
        isInternetReachable: false,
      };

      networkListener(newNetworkState);

      const cachedInfo = service.getCachedDeviceInfo();
      expect(cachedInfo?.networkInfo?.type).toBe('cellular');
      expect(cachedInfo?.networkInfo?.isInternetReachable).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle DeviceInfo method not available', async () => {
      // Remove optional methods
      delete (mockDeviceInfo as any).getDeviceLocale;
      delete (mockDeviceInfo as any).getTimezone;
      delete (mockDeviceInfo as any).getUserAgent;

      const deviceInfo = await service.collectDeviceInfo();

      expect(deviceInfo).toBeDefined();
      expect(deviceInfo.deviceLanguage).toBeUndefined();
      expect(deviceInfo.deviceTimezone).toBeUndefined();
      expect(deviceInfo.userAgent).toBeUndefined();
    });

    it('should generate fallback device ID when getDeviceId fails', async () => {
      mockDeviceInfo.getDeviceId.mockRejectedValue(new Error('Device ID error'));
      mockDeviceInfo.getUniqueId.mockResolvedValue('fallback-unique-id');

      const deviceInfo = await service.collectDeviceInfo();

      expect(deviceInfo.deviceId).toBe('fallback-unique-id');
    });

    it('should generate fallback device ID when both getDeviceId and getUniqueId fail', async () => {
      mockDeviceInfo.getDeviceId.mockRejectedValue(new Error('Device ID error'));
      mockDeviceInfo.getUniqueId.mockRejectedValue(new Error('Unique ID error'));

      const deviceInfo = await service.collectDeviceInfo();

      expect(deviceInfo.deviceId).toMatch(/^fallback_ios_\d+_[a-z0-9]+$/);
    });
  });
});