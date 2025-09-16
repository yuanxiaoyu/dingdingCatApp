import adService, { AdService } from '../AdService';
import apiClient from '../apiClient';
import { AdType, AdRequest, AdResponse, RevenueData, AdHistoryResponse } from '../../types';
import { ENV_CONFIG } from '../../config/env';

// Mock the apiClient
jest.mock('../apiClient');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock ENV_CONFIG
jest.mock('../../config/env', () => ({
  ENV_CONFIG: {
    APP_KEY: 'test_app_key',
    DEBUG_MODE: false,
  },
}));

describe('AdService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestAd', () => {
    it('should request ad successfully', async () => {
      const mockAdResponse: AdResponse = {
        adId: 'AD_123456',
        adType: AdType.REWARD_VIDEO,
        adTitle: 'Test Ad',
        expectedReward: 0.01,
        configParams: {
          minPlayDuration: 15,
          completeRewardMultiplier: 1.0,
        },
      };

      mockedApiClient.post.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: mockAdResponse,
        timestamp: Date.now(),
      });

      const request: AdRequest = {
        userId: 1001,
        appKey: 'test_app_key',
        adType: AdType.REWARD_VIDEO,
      };

      const result = await adService.requestAd(request);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/ad/request', {
        userId: 1001,
        appKey: 'test_app_key',
        adType: AdType.REWARD_VIDEO,
        channelCode: undefined,
        deviceType: 'android',
        ipAddress: undefined,
      });

      expect(result).toEqual(mockAdResponse);
    });

    it('should handle request ad error', async () => {
      const mockError = {
        code: 400,
        message: 'Invalid request',
      };

      mockedApiClient.post.mockRejectedValue(mockError);

      const request: AdRequest = {
        userId: 1001,
        appKey: 'test_app_key',
        adType: AdType.REWARD_VIDEO,
      };

      await expect(adService.requestAd(request)).rejects.toEqual(mockError);
    });
  });

  describe('specific ad type requests', () => {
    it('should request splash ad', async () => {
      const mockAdResponse: AdResponse = {
        adId: 'AD_SPLASH_123',
        adType: AdType.SPLASH,
        adTitle: 'Splash Ad',
        expectedReward: 0.005,
        configParams: { timeout: 5 },
      };

      mockedApiClient.post.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: mockAdResponse,
        timestamp: Date.now(),
      });

      const result = await adService.requestSplashAd(1001, 'channel_001');

      expect(mockedApiClient.post).toHaveBeenCalledWith('/ad/request', {
        userId: 1001,
        appKey: 'test_app_key',
        adType: AdType.SPLASH,
        channelCode: 'channel_001',
        deviceType: 'android',
        ipAddress: undefined,
      });

      expect(result).toEqual(mockAdResponse);
    });

    it('should request reward video ad', async () => {
      const mockAdResponse: AdResponse = {
        adId: 'AD_VIDEO_123',
        adType: AdType.REWARD_VIDEO,
        adTitle: 'Video Ad',
        expectedReward: 0.02,
        configParams: { minPlayDuration: 30 },
      };

      mockedApiClient.post.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: mockAdResponse,
        timestamp: Date.now(),
      });

      const result = await adService.requestRewardVideoAd(1001);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/ad/request', {
        userId: 1001,
        appKey: 'test_app_key',
        adType: AdType.REWARD_VIDEO,
        channelCode: undefined,
        deviceType: 'android',
        ipAddress: undefined,
      });

      expect(result).toEqual(mockAdResponse);
    });

    it('should request interstitial ad', async () => {
      const mockAdResponse: AdResponse = {
        adId: 'AD_INTERSTITIAL_123',
        adType: AdType.INTERSTITIAL,
        adTitle: 'Interstitial Ad',
        expectedReward: 0.01,
        configParams: { showInterval: 60 },
      };

      mockedApiClient.post.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: mockAdResponse,
        timestamp: Date.now(),
      });

      const result = await adService.requestInterstitialAd(1001);

      expect(result).toEqual(mockAdResponse);
    });

    it('should request banner ad', async () => {
      const mockAdResponse: AdResponse = {
        adId: 'AD_BANNER_123',
        adType: AdType.BANNER,
        adTitle: 'Banner Ad',
        expectedReward: 0.005,
        configParams: { position: 'bottom', autoRefresh: true },
      };

      mockedApiClient.post.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: mockAdResponse,
        timestamp: Date.now(),
      });

      const result = await adService.requestBannerAd(1001);

      expect(result).toEqual(mockAdResponse);
    });
  });

  describe('ad event reporting', () => {
    it('should report ad show', async () => {
      mockedApiClient.post.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: null,
        timestamp: Date.now(),
      });

      await adService.reportAdShow({
        userId: 1001,
        appKey: 'test_app_key',
        adId: 'AD_123',
        adType: AdType.REWARD_VIDEO,
        showTime: 1640995200000,
      });

      expect(mockedApiClient.post).toHaveBeenCalledWith('/ad/show', {
        userId: 1001,
        appKey: 'test_app_key',
        adId: 'AD_123',
        adType: AdType.REWARD_VIDEO,
        showTime: 1640995200000,
        ipAddress: undefined,
      });
    });

    it('should report ad click', async () => {
      mockedApiClient.post.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: null,
        timestamp: Date.now(),
      });

      await adService.reportAdClick({
        userId: 1001,
        appKey: 'test_app_key',
        adId: 'AD_123',
        adType: AdType.REWARD_VIDEO,
        clickTime: 1640995200000,
        clickPosition: 'center',
      });

      expect(mockedApiClient.post).toHaveBeenCalledWith('/ad/click', {
        userId: 1001,
        appKey: 'test_app_key',
        adId: 'AD_123',
        adType: AdType.REWARD_VIDEO,
        clickTime: 1640995200000,
        clickPosition: 'center',
        ipAddress: undefined,
      });
    });

    it('should report ad complete and return reward', async () => {
      const expectedReward = 0.015;

      mockedApiClient.post.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: expectedReward,
        timestamp: Date.now(),
      });

      const reward = await adService.reportAdComplete({
        userId: 1001,
        appKey: 'test_app_key',
        adId: 'AD_123',
        adType: AdType.REWARD_VIDEO,
        playDuration: 30,
        isClicked: '1',
        stayDuration: 35,
        completeTime: 1640995200000,
      });

      expect(mockedApiClient.post).toHaveBeenCalledWith('/ad/complete', {
        userId: 1001,
        appKey: 'test_app_key',
        adId: 'AD_123',
        adType: AdType.REWARD_VIDEO,
        playDuration: 30,
        isClicked: '1',
        stayDuration: 35,
        completeTime: 1640995200000,
        ipAddress: undefined,
      });

      expect(reward).toBe(expectedReward);
    });

    it('should report ad skip', async () => {
      mockedApiClient.post.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: null,
        timestamp: Date.now(),
      });

      await adService.reportAdSkip({
        userId: 1001,
        appKey: 'test_app_key',
        adId: 'AD_123',
        adType: AdType.REWARD_VIDEO,
        playDuration: 10,
        skipTime: 1640995200000,
        skipReason: 'user_skip',
      });

      expect(mockedApiClient.post).toHaveBeenCalledWith('/ad/skip', {
        userId: 1001,
        appKey: 'test_app_key',
        adId: 'AD_123',
        adType: AdType.REWARD_VIDEO,
        playDuration: 10,
        skipTime: 1640995200000,
        skipReason: 'user_skip',
        ipAddress: undefined,
      });
    });

    it('should report ad close', async () => {
      mockedApiClient.post.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: null,
        timestamp: Date.now(),
      });

      await adService.reportAdClose({
        userId: 1001,
        appKey: 'test_app_key',
        adId: 'AD_123',
        adType: AdType.REWARD_VIDEO,
        playDuration: 15,
        stayDuration: 20,
        closeTime: 1640995200000,
        closeReason: 'user_close',
      });

      expect(mockedApiClient.post).toHaveBeenCalledWith('/ad/close', {
        userId: 1001,
        appKey: 'test_app_key',
        adId: 'AD_123',
        adType: AdType.REWARD_VIDEO,
        playDuration: 15,
        stayDuration: 20,
        closeTime: 1640995200000,
        closeReason: 'user_close',
        ipAddress: undefined,
      });
    });
  });

  describe('batch reporting', () => {
    it('should batch report ads', async () => {
      const expectedProcessedCount = 2;

      mockedApiClient.post.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: expectedProcessedCount,
        timestamp: Date.now(),
      });

      const result = await adService.batchReportAds({
        userId: 1001,
        appKey: 'test_app_key',
        playDataList: [
          {
            adType: AdType.REWARD_VIDEO,
            playDuration: 30,
            isClicked: '1',
            isSkipped: '0',
            stayDuration: 35,
          },
          {
            adType: AdType.BANNER,
            playDuration: 5,
            isClicked: '0',
            isSkipped: '1',
            stayDuration: 8,
          },
        ],
      });

      expect(mockedApiClient.post).toHaveBeenCalledWith('/ad/batchReport', {
        userId: 1001,
        appKey: 'test_app_key',
        ipAddress: undefined,
        playDataList: [
          {
            adType: AdType.REWARD_VIDEO,
            playDuration: 30,
            isClicked: '1',
            isSkipped: '0',
            stayDuration: 35,
          },
          {
            adType: AdType.BANNER,
            playDuration: 5,
            isClicked: '0',
            isSkipped: '1',
            stayDuration: 8,
          },
        ],
      });

      expect(result).toBe(expectedProcessedCount);
    });
  });

  describe('revenue and history', () => {
    it('should get user revenue', async () => {
      const mockRevenueData: RevenueData = {
        userId: 1001,
        userName: 'user1001',
        totalRevenue: 15.68,
        totalWatchCount: 156,
        todayRevenue: 2.35,
        yesterdayRevenue: 1.89,
        weekRevenue: 12.45,
        monthRevenue: 15.68,
        todayWatchCount: 23,
        yesterdayWatchCount: 18,
        weekWatchCount: 124,
        monthWatchCount: 156,
        remainingWatchCount: 44,
        avgRevenuePerWatch: 0.10,
        lastWatchTime: '2024-01-01T10:30:00Z',
        accountStatus: 'normal',
        withdrawableAmount: 15.68,
        frozenAmount: 0.00,
      };

      mockedApiClient.get.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: mockRevenueData,
        timestamp: Date.now(),
      });

      const result = await adService.getUserRevenue(1001);

      expect(mockedApiClient.get).toHaveBeenCalledWith('/ad/revenue', {
        params: {
          userId: 1001,
          appKey: 'test_app_key',
        },
      });

      expect(result).toEqual(mockRevenueData);
    });

    it('should get ad history', async () => {
      const mockHistoryResponse: AdHistoryResponse = {
        total: 156,
        pageNum: 1,
        pageSize: 20,
        historyList: [
          {
            statId: 1001,
            adId: 'AD_123',
            adType: AdType.REWARD_VIDEO,
            playDuration: 30,
            isClicked: true,
            isSkipped: false,
            isCompleted: true,
            stayDuration: 35,
            rewardAmount: 0.015,
            playTime: '2024-01-01T10:30:00Z',
            deviceType: 'android',
            statusDescription: '完播',
          },
        ],
      };

      mockedApiClient.get.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: mockHistoryResponse,
        timestamp: Date.now(),
      });

      const result = await adService.getAdHistory({
        userId: 1001,
        appKey: 'test_app_key',
        pageNum: 1,
        pageSize: 20,
        adType: AdType.REWARD_VIDEO,
      });

      expect(mockedApiClient.get).toHaveBeenCalledWith('/ad/history', {
        params: {
          userId: 1001,
          appKey: 'test_app_key',
          pageNum: 1,
          pageSize: 20,
          adType: AdType.REWARD_VIDEO,
          startDate: undefined,
          endDate: undefined,
        },
      });

      expect(result).toEqual(mockHistoryResponse);
    });
  });

  describe('convenience methods', () => {
    beforeEach(() => {
      // Mock Date.now() for consistent timestamps
      jest.spyOn(Date, 'now').mockReturnValue(1640995200000);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should report ad show with current timestamp', async () => {
      mockedApiClient.post.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: null,
        timestamp: Date.now(),
      });

      await adService.reportAdShowNow(1001, 'AD_123', AdType.REWARD_VIDEO);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/ad/show', {
        userId: 1001,
        appKey: 'test_app_key',
        adId: 'AD_123',
        adType: AdType.REWARD_VIDEO,
        showTime: 1640995200000,
      });
    });

    it('should report ad complete with current timestamp', async () => {
      mockedApiClient.post.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: 0.015,
        timestamp: Date.now(),
      });

      const reward = await adService.reportAdCompleteNow(
        1001,
        'AD_123',
        AdType.REWARD_VIDEO,
        30,
        true,
        35
      );

      expect(mockedApiClient.post).toHaveBeenCalledWith('/ad/complete', {
        userId: 1001,
        appKey: 'test_app_key',
        adId: 'AD_123',
        adType: AdType.REWARD_VIDEO,
        playDuration: 30,
        isClicked: '1',
        stayDuration: 35,
        completeTime: 1640995200000,
      });

      expect(reward).toBe(0.015);
    });
  });

  describe('utility methods', () => {
    it('should check if ad type is supported', () => {
      expect(adService.isSupportedAdType('video')).toBe(true);
      expect(adService.isSupportedAdType('splash')).toBe(true);
      expect(adService.isSupportedAdType('interstitial')).toBe(true);
      expect(adService.isSupportedAdType('banner')).toBe(true);
      expect(adService.isSupportedAdType('invalid')).toBe(false);
    });

    it('should get supported ad types', () => {
      const supportedTypes = adService.getSupportedAdTypes();
      expect(supportedTypes).toEqual([
        AdType.SPLASH,
        AdType.REWARD_VIDEO,
        AdType.INTERSTITIAL,
        AdType.BANNER,
      ]);
    });

    it('should validate ad request', () => {
      const validRequest: AdRequest = {
        userId: 1001,
        appKey: 'test_app_key',
        adType: AdType.REWARD_VIDEO,
      };

      expect(() => adService.validateAdRequest(validRequest)).not.toThrow();

      const invalidUserIdRequest: AdRequest = {
        userId: 0,
        appKey: 'test_app_key',
        adType: AdType.REWARD_VIDEO,
      };

      expect(() => adService.validateAdRequest(invalidUserIdRequest)).toThrow('Invalid user ID');

      const invalidAppKeyRequest: AdRequest = {
        userId: 1001,
        appKey: '',
        adType: AdType.REWARD_VIDEO,
      };

      expect(() => adService.validateAdRequest(invalidAppKeyRequest)).toThrow('Invalid app key');
    });

    it('should create ad request with defaults', () => {
      const request = adService.createAdRequest(1001, AdType.REWARD_VIDEO, {
        channelCode: 'channel_001',
      });

      expect(request).toEqual({
        userId: 1001,
        appKey: 'test_app_key',
        adType: AdType.REWARD_VIDEO,
        deviceType: 'android',
        channelCode: 'channel_001',
      });
    });
  });
});