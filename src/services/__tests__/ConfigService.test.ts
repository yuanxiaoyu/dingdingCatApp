import AsyncStorage from '@react-native-async-storage/async-storage';
import configService, { ConfigService } from '../ConfigService';
import apiClient from '../apiClient';
import { ENV_CONFIG } from '../../config/env';
import { AppConfig, AdConfig, RiskConfig, ChannelConfigResponse } from '../../types';

// Mock dependencies
jest.mock('../apiClient');
jest.mock('../../config/env', () => ({
  ENV_CONFIG: {
    APP_KEY: 'test_app_key',
    DEBUG_MODE: true,
  },
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock data
const mockAppConfig: AppConfig = {
  appKey: 'test_app_key',
  appName: 'Test App',
  wechatAppId: 'wx_test_123',
  serverTime: 1640995200000,
  configVersion: '1.0.0',
  channels: [
    {
      channelCode: 'pangle_001',
      channelName: 'Test Channel',
      channelType: 'PANGLE',
      status: '0',
    },
  ],
};

const mockAdConfig: AdConfig = {
  appKey: 'test_app_key',
  serverTime: 1640995200000,
  configVersion: '1.0.0',
  adInterval: 30,
  adIntervalEnabled: true,
  singleRewardLimit: 1.0,
  singleRewardLimitEnabled: true,
  dailyRewardVideoLimit: 100,
  dailyRewardAmountLimit: 50.0,
  dailyRewardLimitEnabled: true,
  dailyAdViewLimit: 200,
  dailyAdViewLimitEnabled: true,
  adTypeConfig: 'splash,video,interstitial,banner',
  adDisplayStrategy: 'auto',
};

const mockRiskConfig: RiskConfig = {
  appKey: 'test_app_key',
  serverTime: 1640995200000,
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
};

const mockChannelConfig: ChannelConfigResponse = {
  appKey: 'test_app_key',
  channelConfig: '{"defaultChannel":"pangle"}',
  serverTime: 1640995200000,
  configVersion: '1.0.0',
  defaultChannelCode: 'pangle_001',
  channels: [
    {
      channelId: 1,
      channelCode: 'pangle_001',
      channelName: 'Test Channel',
      channelType: 'PANGLE',
      status: '0',
      isDefault: true,
    },
  ],
};

describe('ConfigService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await configService.initialize();
      expect(configService).toBeDefined();
    });

    it('should handle initialization errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      
      await expect(configService.initialize()).resolves.not.toThrow();
    });
  });

  describe('getAppConfig', () => {
    it('should fetch app config from API when not cached', async () => {
      mockApiClient.get.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: mockAppConfig,
        timestamp: Date.now(),
      });

      const result = await configService.getAppConfig();

      expect(mockApiClient.get).toHaveBeenCalledWith('/config', {
        params: { appKey: 'test_app_key' },
      });
      expect(result).toEqual(mockAppConfig);
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should return cached config when available and not expired', async () => {
      // Mock cached config with recent timestamp
      const recentTime = Date.now();
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@dingdingcat/app_config') {
          return Promise.resolve(JSON.stringify(mockAppConfig));
        }
        if (key === '@dingdingcat/config_last_update') {
          return Promise.resolve(recentTime.toString());
        }
        return Promise.resolve(null);
      });

      // Mock Date.now to return a time that makes cache not expired
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => recentTime + 500); // 500ms later, within 1 second

      const result = await configService.getAppConfig();

      expect(result).toEqual(mockAppConfig);
      expect(mockApiClient.get).not.toHaveBeenCalled();

      // Restore Date.now
      Date.now = originalDateNow;
    });

    it('should force refresh when requested', async () => {
      mockApiClient.get.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: mockAppConfig,
        timestamp: Date.now(),
      });

      const result = await configService.getAppConfig(true);

      expect(mockApiClient.get).toHaveBeenCalled();
      expect(result).toEqual(mockAppConfig);
    });

    it('should return cached config as fallback when API fails', async () => {
      mockApiClient.get.mockRejectedValue(new Error('API Error'));
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@dingdingcat/app_config') {
          return Promise.resolve(JSON.stringify(mockAppConfig));
        }
        return Promise.resolve(null);
      });

      const result = await configService.getAppConfig();

      expect(result).toEqual(mockAppConfig);
    });

    it('should return null when API fails and no cache available', async () => {
      mockApiClient.get.mockRejectedValue(new Error('API Error'));

      const result = await configService.getAppConfig();

      expect(result).toBeNull();
    });
  });

  describe('getAdConfig', () => {
    it('should fetch ad config from API', async () => {
      mockApiClient.get.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: mockAdConfig,
        timestamp: Date.now(),
      });

      const result = await configService.getAdConfig();

      expect(mockApiClient.get).toHaveBeenCalledWith('/config/ad', {
        params: { appKey: 'test_app_key' },
      });
      expect(result).toEqual(mockAdConfig);
    });

    it('should handle API errors gracefully', async () => {
      mockApiClient.get.mockRejectedValue(new Error('API Error'));

      const result = await configService.getAdConfig();

      expect(result).toBeNull();
    });
  });

  describe('getRiskConfig', () => {
    it('should fetch risk config from API', async () => {
      mockApiClient.get.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: mockRiskConfig,
        timestamp: Date.now(),
      });

      const result = await configService.getRiskConfig();

      expect(mockApiClient.get).toHaveBeenCalledWith('/config/risk', {
        params: { appKey: 'test_app_key' },
      });
      expect(result).toEqual(mockRiskConfig);
    });

    it('should handle API errors gracefully', async () => {
      mockApiClient.get.mockRejectedValue(new Error('API Error'));

      const result = await configService.getRiskConfig();

      expect(result).toBeNull();
    });
  });

  describe('getChannelConfig', () => {
    it('should fetch channel config from API', async () => {
      mockApiClient.get.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: mockChannelConfig,
        timestamp: Date.now(),
      });

      const result = await configService.getChannelConfig();

      expect(mockApiClient.get).toHaveBeenCalledWith('/config/channel', {
        params: { appKey: 'test_app_key' },
      });
      expect(result).toEqual(mockChannelConfig);
    });

    it('should handle API errors gracefully', async () => {
      mockApiClient.get.mockRejectedValue(new Error('API Error'));

      const result = await configService.getChannelConfig();

      expect(result).toBeNull();
    });
  });

  describe('checkConfigUpdates', () => {
    it('should detect configuration updates', async () => {
      // Mock stored versions
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@dingdingcat/config_versions') {
          return Promise.resolve(JSON.stringify({
            appConfigVersion: '0.9.0',
            adConfigVersion: '0.9.0',
          }));
        }
        return Promise.resolve(null);
      });

      // Mock API responses with new versions
      mockApiClient.get.mockImplementation((url) => {
        if (url === '/config') {
          return Promise.resolve({
            code: 200,
            data: { ...mockAppConfig, configVersion: '1.0.0' },
            message: 'Success',
            timestamp: Date.now(),
          });
        }
        if (url === '/config/ad') {
          return Promise.resolve({
            code: 200,
            data: { ...mockAdConfig, configVersion: '1.0.0' },
            message: 'Success',
            timestamp: Date.now(),
          });
        }
        return Promise.resolve({
          code: 200,
          data: { configVersion: '0.9.0' },
          message: 'Success',
          timestamp: Date.now(),
        });
      });

      const result = await configService.checkConfigUpdates();

      expect(result.hasUpdates).toBe(true);
      expect(result.updatedConfigs).toContain('app');
      expect(result.updatedConfigs).toContain('ad');
    });

    it('should handle check errors gracefully', async () => {
      mockApiClient.get.mockRejectedValue(new Error('API Error'));

      const result = await configService.checkConfigUpdates();

      expect(result.hasUpdates).toBe(false);
      expect(result.updatedConfigs).toEqual([]);
    });
  });

  describe('refreshAllConfigs', () => {
    it('should refresh all configurations successfully', async () => {
      mockApiClient.get.mockImplementation((url) => {
        const responses = {
          '/config': { code: 200, data: mockAppConfig, message: 'Success', timestamp: Date.now() },
          '/config/ad': { code: 200, data: mockAdConfig, message: 'Success', timestamp: Date.now() },
          '/config/risk': { code: 200, data: mockRiskConfig, message: 'Success', timestamp: Date.now() },
          '/config/channel': { code: 200, data: mockChannelConfig, message: 'Success', timestamp: Date.now() },
        };
        return Promise.resolve(responses[url as keyof typeof responses]);
      });

      const result = await configService.refreshAllConfigs();

      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should handle partial failures', async () => {
      mockApiClient.get.mockImplementation((url) => {
        if (url === '/config') {
          return Promise.reject(new Error('API Error'));
        }
        if (url === '/config/ad') {
          return Promise.resolve({
            code: 200,
            data: mockAdConfig,
            message: 'Success',
            timestamp: Date.now(),
          });
        }
        if (url === '/config/risk') {
          return Promise.resolve({
            code: 200,
            data: mockRiskConfig,
            message: 'Success',
            timestamp: Date.now(),
          });
        }
        if (url === '/config/channel') {
          return Promise.resolve({
            code: 200,
            data: mockChannelConfig,
            message: 'Success',
            timestamp: Date.now(),
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      const result = await configService.refreshAllConfigs();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Failed to refresh app config');
    });
  });

  describe('clearCache', () => {
    it('should clear all cached configurations', async () => {
      await configService.clearCache();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledTimes(6);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@dingdingcat/app_config');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@dingdingcat/ad_config');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@dingdingcat/risk_config');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@dingdingcat/channel_config');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@dingdingcat/config_versions');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@dingdingcat/config_last_update');
    });

    it('should handle clear errors gracefully', async () => {
      mockAsyncStorage.removeItem.mockRejectedValue(new Error('Storage error'));

      await expect(configService.clearCache()).resolves.not.toThrow();
    });
  });

  describe('getCacheStatus', () => {
    it('should return cache status for all configurations', async () => {
      mockAsyncStorage.getItem.mockImplementation((key) => {
        const responses = {
          '@dingdingcat/app_config': JSON.stringify(mockAppConfig),
          '@dingdingcat/ad_config': JSON.stringify(mockAdConfig),
          '@dingdingcat/config_last_update': Date.now().toString(),
        };
        return Promise.resolve(responses[key as keyof typeof responses] || null);
      });

      const status = await configService.getCacheStatus();

      expect(status.appConfig.cached).toBe(true);
      expect(status.appConfig.version).toBe('1.0.0');
      expect(status.adConfig.cached).toBe(true);
      expect(status.adConfig.version).toBe('1.0.0');
      expect(status.riskConfig.cached).toBe(false);
      expect(status.channelConfig.cached).toBe(false);
    });

    it('should handle status check errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const status = await configService.getCacheStatus();

      expect(status.appConfig.cached).toBe(false);
      expect(status.adConfig.cached).toBe(false);
      expect(status.riskConfig.cached).toBe(false);
      expect(status.channelConfig.cached).toBe(false);
    });
  });

  describe('updateCacheConfig', () => {
    it('should update cache configuration', () => {
      const newConfig = {
        maxAge: 60 * 60 * 1000, // 1 hour
        forceRefreshInterval: 48 * 60 * 60 * 1000, // 48 hours
      };

      configService.updateCacheConfig(newConfig);

      // Since we can't directly test private properties, we test the behavior
      expect(() => configService.updateCacheConfig(newConfig)).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle malformed cached data', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid json');

      const result = await configService.getAppConfig();

      expect(result).toBeNull();
    });

    it('should handle API response with non-200 code', async () => {
      mockApiClient.get.mockResolvedValue({
        code: 400,
        message: 'Bad Request',
        data: null,
        timestamp: Date.now(),
      });

      const result = await configService.getAppConfig();

      expect(result).toBeNull();
    });

    it('should handle network timeouts', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network timeout'));

      const result = await configService.getAppConfig();

      expect(result).toBeNull();
    });
  });
});