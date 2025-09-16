import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import riskControlService, { RiskControlService, RiskViolationType, RiskViolationError } from '../RiskControlService';
import apiClient from '../apiClient';
import { RiskConfig } from '../../types';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('react-native-device-info');
jest.mock('../apiClient');

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockDeviceInfo = DeviceInfo as jest.Mocked<typeof DeviceInfo>;
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('RiskControlService', () => {
  const mockRiskConfig: RiskConfig = {
    appKey: 'test_app_key',
    serverTime: Date.now(),
    configVersion: '1.0.0',
    rootDetectionEnabled: true,
    emulatorDetectionEnabled: true,
    deviceFingerprintEnabled: true,
    adIntervalCheckEnabled: true,
    adIntervalSeconds: 30,
    sameIpUserLimit: 5,
    sameIpLimitEnabled: true,
    ipLocationCheckEnabled: false,
    loginFrequencyLimit: 10,
    loginFrequencyWindow: 10,
    loginFrequencyEnabled: true,
    blacklistCheckEnabled: true,
    riskLevel: 2,
    dailyRewardVideoLimit: 100,
    singleRevenueLimit: 1.0,
  };

  const mockDeviceInfoData = {
    brand: 'Apple',
    model: 'iPhone 13',
    systemName: 'iOS',
    systemVersion: '15.0',
    deviceId: 'test-device-id',
    uniqueId: 'test-unique-id',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Clear service state
    await riskControlService.clearCache();
    
    // Setup default mocks
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
    
    // Setup DeviceInfo mocks - only use methods that exist in the mock
    mockDeviceInfo.getBrand.mockResolvedValue(mockDeviceInfoData.brand);
    mockDeviceInfo.getModel.mockResolvedValue(mockDeviceInfoData.model);
    mockDeviceInfo.getSystemName.mockResolvedValue(mockDeviceInfoData.systemName);
    mockDeviceInfo.getSystemVersion.mockResolvedValue(mockDeviceInfoData.systemVersion);
    mockDeviceInfo.getDeviceId.mockResolvedValue(mockDeviceInfoData.deviceId);
    mockDeviceInfo.getUniqueId.mockResolvedValue(mockDeviceInfoData.uniqueId);
    mockDeviceInfo.isEmulator.mockResolvedValue(false);
    
    // Reset any additional methods that might have been added
    delete (DeviceInfo as any).getTags;
  });

  describe('getRiskConfig', () => {
    it('should fetch risk config from API successfully', async () => {
      mockApiClient.get.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: mockRiskConfig,
        timestamp: Date.now(),
      });

      const result = await riskControlService.getRiskConfig();

      expect(mockApiClient.get).toHaveBeenCalledWith('/config/risk', {
        params: { appKey: expect.any(String) },
      });
      expect(result).toEqual(mockRiskConfig);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@dingdingcat/risk_config',
        JSON.stringify(mockRiskConfig)
      );
    });

    it('should return cached config when API fails', async () => {
      // Setup cached config
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@dingdingcat/risk_config') {
          return Promise.resolve(JSON.stringify(mockRiskConfig));
        }
        return Promise.resolve(null);
      });

      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      // Initialize to load cached config
      await riskControlService.initialize();

      const result = await riskControlService.getRiskConfig();

      expect(result).toEqual(mockRiskConfig);
    });

    it('should throw error when API fails and no cache available', async () => {
      // Clear any cached config first
      await riskControlService.clearCache();
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      await expect(riskControlService.getRiskConfig()).rejects.toThrow('Network error');
    });
  });

  describe('detectDeviceEnvironment', () => {
    it('should detect normal device environment', async () => {
      const result = await riskControlService.detectDeviceEnvironment();

      expect(result.isRooted).toBe(false);
      expect(result.isEmulator).toBe(false);
      expect(result.deviceFingerprint).toBeTruthy();
      expect(result.detectionDetails.deviceInfo).toEqual(expect.objectContaining(mockDeviceInfoData));
    });

    it('should detect rooted device', async () => {
      // Mock a method that exists and add getTags
      (DeviceInfo as any).getTags = jest.fn().mockResolvedValue('test-keys');

      const result = await riskControlService.detectDeviceEnvironment();

      expect(result.isRooted).toBe(true);
      expect(result.detectionDetails.rootDetectionMethods).toContain('test-keys-detected');
    });

    it('should detect emulator', async () => {
      mockDeviceInfo.isEmulator.mockResolvedValue(true);

      const result = await riskControlService.detectDeviceEnvironment();

      expect(result.isEmulator).toBe(true);
      expect(result.detectionDetails.emulatorDetectionMethods).toContain('device-info-api');
    });

    it('should detect emulator by suspicious identifiers', async () => {
      mockDeviceInfo.getBrand.mockResolvedValue('generic');
      mockDeviceInfo.isEmulator.mockResolvedValue(false);

      const result = await riskControlService.detectDeviceEnvironment();

      expect(result.isEmulator).toBe(true);
      expect(result.detectionDetails.emulatorDetectionMethods).toContain('suspicious-identifiers');
    });

    it('should handle detection errors gracefully', async () => {
      // Clear cache first
      await riskControlService.clearCache();
      mockDeviceInfo.getBrand.mockRejectedValue(new Error('Device info error'));

      const result = await riskControlService.detectDeviceEnvironment();

      expect(result.isRooted).toBe(false);
      expect(result.isEmulator).toBe(false);
      expect(result.deviceFingerprint).toBeTruthy();
    });
  });

  describe('checkAdInterval', () => {
    beforeEach(async () => {
      // Initialize with risk config
      mockApiClient.get.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: mockRiskConfig,
        timestamp: Date.now(),
      });
      await riskControlService.initialize();
    });

    it('should pass when no previous ad time', async () => {
      const result = await riskControlService.checkAdInterval('video');
      expect(result).toBe(true);
    });

    it('should pass when interval is sufficient', async () => {
      const pastTime = Date.now() - 35000; // 35 seconds ago
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@dingdingcat/last_ad_time_video') {
          return Promise.resolve(pastTime.toString());
        }
        return Promise.resolve(null);
      });

      const result = await riskControlService.checkAdInterval('video');
      expect(result).toBe(true);
    });

    it('should throw violation when interval is insufficient', async () => {
      const recentTime = Date.now() - 10000; // 10 seconds ago
      
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@dingdingcat/last_ad_time_video') {
          return Promise.resolve(recentTime.toString());
        }
        return Promise.resolve(null);
      });

      await expect(riskControlService.checkAdInterval('video')).rejects.toThrow(RiskViolationError);
    });

    it('should skip check when disabled', async () => {
      const configWithDisabledCheck = { ...mockRiskConfig, adIntervalCheckEnabled: false };
      mockApiClient.get.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: configWithDisabledCheck,
        timestamp: Date.now(),
      });
      await riskControlService.getRiskConfig();

      const result = await riskControlService.checkAdInterval('video');
      expect(result).toBe(true);
    });
  });

  describe('validateRevenueLimit', () => {
    beforeEach(async () => {
      mockApiClient.get.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: mockRiskConfig,
        timestamp: Date.now(),
      });
      await riskControlService.initialize();
    });

    it('should pass when amount is within limit', () => {
      const result = riskControlService.validateRevenueLimit(0.5);
      expect(result).toBe(true);
    });

    it('should throw violation when amount exceeds limit', () => {
      expect(() => riskControlService.validateRevenueLimit(2.0)).toThrow(RiskViolationError);
    });

    it('should pass when limit is not configured', async () => {
      const configWithoutLimit = { ...mockRiskConfig, singleRevenueLimit: undefined };
      mockApiClient.get.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: configWithoutLimit,
        timestamp: Date.now(),
      });
      await riskControlService.getRiskConfig();

      const result = riskControlService.validateRevenueLimit(5.0);
      expect(result).toBe(true);
    });
  });

  describe('checkDailyLimits', () => {
    const configWithLimitsEnabled = { 
      ...mockRiskConfig, 
      dailyRewardLimitEnabled: true, 
      dailyAdViewLimitEnabled: true,
      dailyAdViewLimit: 200,
      dailyRewardVideoLimit: 100
    };

    beforeEach(async () => {
      mockApiClient.get.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: configWithLimitsEnabled,
        timestamp: Date.now(),
      });
      await riskControlService.initialize();
    });

    it('should pass when limits are not reached', async () => {
      const result = await riskControlService.checkDailyLimits(1001, 'video');
      expect(result).toBe(true);
    });

    it('should throw violation when daily ad view limit reached', async () => {
      // Setup daily stats with high count
      const dailyStats = {
        date: new Date().toISOString().split('T')[0],
        adViewCount: 200,
        rewardVideoCount: 50,
        totalRevenue: 10.0,
        lastResetTime: Date.now(),
      };
      
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@dingdingcat/daily_ad_count') {
          return Promise.resolve(JSON.stringify(dailyStats));
        }
        return Promise.resolve(null);
      });

      await expect(riskControlService.checkDailyLimits(1001, 'video')).rejects.toThrow(RiskViolationError);
    });

    it('should throw violation when daily reward video limit reached', async () => {
      const dailyStats = {
        date: new Date().toISOString().split('T')[0],
        adViewCount: 50,
        rewardVideoCount: 100,
        totalRevenue: 10.0,
        lastResetTime: Date.now(),
      };
      
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@dingdingcat/daily_ad_count') {
          return Promise.resolve(JSON.stringify(dailyStats));
        }
        return Promise.resolve(null);
      });

      await expect(riskControlService.checkDailyLimits(1001, 'video')).rejects.toThrow(RiskViolationError);
    });

    it('should reset stats for new day', async () => {
      const yesterdayStats = {
        date: '2023-12-31', // Yesterday
        adViewCount: 200,
        rewardVideoCount: 100,
        totalRevenue: 20.0,
        lastResetTime: Date.now() - 86400000, // 24 hours ago
      };
      
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@dingdingcat/daily_ad_count') {
          return Promise.resolve(JSON.stringify(yesterdayStats));
        }
        return Promise.resolve(null);
      });

      const result = await riskControlService.checkDailyLimits(1001, 'video');
      expect(result).toBe(true);
      
      // Verify stats were reset - check the last call to setItem
      const setItemCalls = mockAsyncStorage.setItem.mock.calls;
      const dailyStatsCall = setItemCalls.find(call => call[0] === '@dingdingcat/daily_ad_count');
      expect(dailyStatsCall).toBeTruthy();
      expect(dailyStatsCall[1]).toContain(new Date().toISOString().split('T')[0]);
    });
  });

  describe('updateDailyStats', () => {
    beforeEach(async () => {
      await riskControlService.initialize();
    });

    it('should update ad view count', async () => {
      await riskControlService.updateDailyStats('banner', 0.01);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@dingdingcat/daily_ad_count',
        expect.stringContaining('"adViewCount":1')
      );
    });

    it('should update reward video count for video ads', async () => {
      await riskControlService.updateDailyStats('video', 0.05);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@dingdingcat/daily_ad_count',
        expect.stringContaining('"rewardVideoCount":1')
      );
    });

    it('should update total revenue', async () => {
      // Clear all previous mock calls
      mockAsyncStorage.setItem.mockClear();
      
      await riskControlService.updateDailyStats('video', 0.05);

      // Check the calls to setItem for daily stats
      const setItemCalls = mockAsyncStorage.setItem.mock.calls;
      const dailyStatsCall = setItemCalls.find(call => call[0] === '@dingdingcat/daily_ad_count');
      expect(dailyStatsCall).toBeTruthy();
      expect(dailyStatsCall[1]).toContain('"totalRevenue":0.05');
    });
  });

  describe('performRiskCheck', () => {
    beforeEach(async () => {
      mockApiClient.get.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: mockRiskConfig,
        timestamp: Date.now(),
      });
      await riskControlService.initialize();
    });

    it('should pass comprehensive risk check for normal user', async () => {
      // Clear cache and reset device environment to normal
      await riskControlService.clearCache();
      
      // Re-initialize with normal device
      mockApiClient.get.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: mockRiskConfig,
        timestamp: Date.now(),
      });
      await riskControlService.initialize();

      const result = await riskControlService.performRiskCheck({
        userId: 1001,
        adType: 'video',
        expectedRevenue: 0.05,
        ipAddress: '192.168.1.1',
      });

      expect(result).toBe(true);
    });

    it('should fail when device is rooted', async () => {
      // Clear cache and setup rooted device
      await riskControlService.clearCache();
      
      // Add getTags method that indicates root
      (DeviceInfo as any).getTags = jest.fn().mockResolvedValue('test-keys');
      
      await riskControlService.detectDeviceEnvironment();

      await expect(riskControlService.performRiskCheck({
        userId: 1001,
        adType: 'video',
      })).rejects.toThrow(RiskViolationError);
    });

    it('should fail when device is emulator', async () => {
      mockDeviceInfo.isEmulator.mockResolvedValue(true);
      await riskControlService.detectDeviceEnvironment();

      await expect(riskControlService.performRiskCheck({
        userId: 1001,
        adType: 'video',
      })).rejects.toThrow(RiskViolationError);
    });

    it('should fail when revenue exceeds limit', async () => {
      await expect(riskControlService.performRiskCheck({
        userId: 1001,
        adType: 'video',
        expectedRevenue: 2.0, // Exceeds limit of 1.0
      })).rejects.toThrow(RiskViolationError);
    });
  });

  describe('getRiskViolationMessage', () => {
    it('should return appropriate message for each violation type', () => {
      const rootError = new RiskViolationError(RiskViolationType.ROOT_DETECTED, 'Root detected');
      const emulatorError = new RiskViolationError(RiskViolationType.EMULATOR_DETECTED, 'Emulator detected');
      const intervalError = new RiskViolationError(RiskViolationType.AD_INTERVAL_VIOLATION, 'Interval violation');

      expect(riskControlService.getRiskViolationMessage(rootError)).toContain('ROOT');
      expect(riskControlService.getRiskViolationMessage(emulatorError)).toContain('模拟器');
      expect(riskControlService.getRiskViolationMessage(intervalError)).toBe('Interval violation');
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', async () => {
      await riskControlService.clearCache();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@dingdingcat/risk_config');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@dingdingcat/last_ad_time');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@dingdingcat/daily_ad_count');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@dingdingcat/daily_revenue');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@dingdingcat/device_fingerprint');
    });
  });

  describe('validateIpLimits', () => {
    beforeEach(async () => {
      mockApiClient.get.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: mockRiskConfig,
        timestamp: Date.now(),
      });
      await riskControlService.initialize();
    });

    it('should pass IP validation (client-side placeholder)', () => {
      const result = riskControlService.validateIpLimits('192.168.1.1');
      expect(result).toBe(true);
    });

    it('should pass when IP limit check is disabled', async () => {
      const configWithDisabledIpCheck = { ...mockRiskConfig, sameIpLimitEnabled: false };
      mockApiClient.get.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: configWithDisabledIpCheck,
        timestamp: Date.now(),
      });
      await riskControlService.getRiskConfig();

      const result = riskControlService.validateIpLimits('192.168.1.1');
      expect(result).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle AsyncStorage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      // Should not throw
      await expect(riskControlService.initialize()).resolves.not.toThrow();
    });

    it('should handle DeviceInfo errors gracefully', async () => {
      // Clear cache first
      await riskControlService.clearCache();
      mockDeviceInfo.getBrand.mockRejectedValue(new Error('Device info error'));

      const result = await riskControlService.detectDeviceEnvironment();
      expect(result.isRooted).toBe(false);
      expect(result.isEmulator).toBe(false);
    });

    it('should allow operations on unexpected errors to avoid blocking users', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Unexpected error'));

      const result = await riskControlService.checkAdInterval('video');
      expect(result).toBe(true);
    });
  });
});