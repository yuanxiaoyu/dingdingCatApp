/**
 * IntegratedAdService Tests
 * 
 * Tests for the integrated Pangle SDK + API service functionality
 */

import IntegratedAdService from '../IntegratedAdService';
import PangleAdService from '../PangleAdService';
import AdService from '../AdService';
import { AdType, User, AdResponse } from '../../types';

// Mock the dependencies
jest.mock('../PangleAdService');
jest.mock('../AdService');

const mockPangleAdService = PangleAdService as jest.Mocked<typeof PangleAdService>;
const mockAdService = AdService as jest.Mocked<typeof AdService>;

describe('IntegratedAdService', () => {
  const mockUser: User = {
    userId: 123,
    userName: 'testuser',
    nickName: 'Test User',
    avatar: 'https://example.com/avatar.jpg',
    wechatOpenId: 'wx123456',
    appKey: 'test-app-key',
  };

  const mockAdResponse: AdResponse = {
    adId: 'test-ad-123',
    adType: AdType.REWARD_VIDEO,
    adTitle: 'Test Ad',
    expectedReward: 0.05,
    configParams: {
      minPlayDuration: 30,
      completeRewardMultiplier: 1.0,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    IntegratedAdService.setCurrentUser(mockUser);
  });

  describe('SDK Initialization', () => {
    it('should initialize SDK successfully', async () => {
      mockPangleAdService.initializeAndStartSDK.mockResolvedValue('SDK initialized and started');

      await IntegratedAdService.initializeSDK('test-app-id');

      expect(mockPangleAdService.initializeAndStartSDK).toHaveBeenCalledWith('test-app-id');
    });

    it('should handle SDK initialization failure', async () => {
      const error = new Error('SDK initialization failed');
      mockPangleAdService.initializeAndStartSDK.mockRejectedValue(error);

      await expect(IntegratedAdService.initializeSDK('test-app-id')).rejects.toThrow(error);
    });

    it('should check SDK readiness', async () => {
      mockPangleAdService.isSDKInitialized.mockResolvedValue(true);
      mockPangleAdService.isSDKStarted.mockResolvedValue(true);

      const isReady = await IntegratedAdService.isSDKReady();

      expect(isReady).toBe(true);
      expect(mockPangleAdService.isSDKInitialized).toHaveBeenCalled();
      expect(mockPangleAdService.isSDKStarted).toHaveBeenCalled();
    });

    it('should get SDK version', async () => {
      mockPangleAdService.getSDKVersion.mockResolvedValue('4.5.0');

      const version = await IntegratedAdService.getSDKVersion();

      expect(version).toBe('4.5.0');
      expect(mockPangleAdService.getSDKVersion).toHaveBeenCalled();
    });
  });

  describe('Splash Ad Integration', () => {
    it('should load and show splash ad successfully', async () => {
      // Mock API responses
      mockAdService.requestSplashAd.mockResolvedValue(mockAdResponse);
      mockAdService.reportAdShowNow.mockResolvedValue();
      mockAdService.reportAdCompleteNow.mockResolvedValue(0.05);

      // Mock SDK responses
      mockPangleAdService.loadSplashAd.mockResolvedValue({ status: 'loaded' });
      mockPangleAdService.showSplashAd.mockResolvedValue({ status: 'completed' });

      const callbacks = {
        onAdLoaded: jest.fn(),
        onAdShown: jest.fn(),
        onAdCompleted: jest.fn(),
      };

      await IntegratedAdService.loadAndShowSplashAd(callbacks);

      // Verify API calls
      expect(mockAdService.requestSplashAd).toHaveBeenCalledWith(mockUser.userId);
      expect(mockAdService.reportAdShowNow).toHaveBeenCalledWith(
        mockUser.userId,
        mockAdResponse.adId,
        AdType.SPLASH
      );
      expect(mockAdService.reportAdCompleteNow).toHaveBeenCalledWith(
        mockUser.userId,
        mockAdResponse.adId,
        AdType.SPLASH,
        expect.any(Number),
        false
      );

      // Verify SDK calls
      expect(mockPangleAdService.loadSplashAd).toHaveBeenCalledWith(mockAdResponse.adId);
      expect(mockPangleAdService.showSplashAd).toHaveBeenCalled();

      // Verify callbacks
      expect(callbacks.onAdLoaded).toHaveBeenCalledWith(mockAdResponse.adId, AdType.SPLASH);
      expect(callbacks.onAdShown).toHaveBeenCalledWith(mockAdResponse.adId, AdType.SPLASH);
      expect(callbacks.onAdCompleted).toHaveBeenCalledWith(mockAdResponse.adId, AdType.SPLASH, 0.05);
    });

    it('should handle splash ad with click', async () => {
      // Mock API responses
      mockAdService.requestSplashAd.mockResolvedValue(mockAdResponse);
      mockAdService.reportAdShowNow.mockResolvedValue();
      mockAdService.reportAdClickNow.mockResolvedValue();
      mockAdService.reportAdCompleteNow.mockResolvedValue(0.05);

      // Mock SDK responses
      mockPangleAdService.loadSplashAd.mockResolvedValue({ status: 'loaded' });
      mockPangleAdService.showSplashAd.mockResolvedValue({ status: 'clicked' });

      const callbacks = {
        onAdClicked: jest.fn(),
        onAdCompleted: jest.fn(),
      };

      await IntegratedAdService.loadAndShowSplashAd(callbacks);

      // Verify click was reported
      expect(mockAdService.reportAdClickNow).toHaveBeenCalledWith(
        mockUser.userId,
        mockAdResponse.adId,
        AdType.SPLASH
      );
      expect(callbacks.onAdClicked).toHaveBeenCalledWith(mockAdResponse.adId, AdType.SPLASH);
      expect(callbacks.onAdCompleted).toHaveBeenCalledWith(mockAdResponse.adId, AdType.SPLASH, 0.05);
    });

    it('should handle splash ad skip', async () => {
      // Mock API responses
      mockAdService.requestSplashAd.mockResolvedValue(mockAdResponse);
      mockAdService.reportAdShowNow.mockResolvedValue();
      mockAdService.reportAdSkipNow.mockResolvedValue();

      // Mock SDK responses
      mockPangleAdService.loadSplashAd.mockResolvedValue({ status: 'loaded' });
      mockPangleAdService.showSplashAd.mockResolvedValue({ status: 'skipped' });

      const callbacks = {
        onAdSkipped: jest.fn(),
      };

      await IntegratedAdService.loadAndShowSplashAd(callbacks);

      // Verify skip was reported
      expect(mockAdService.reportAdSkipNow).toHaveBeenCalledWith(
        mockUser.userId,
        mockAdResponse.adId,
        AdType.SPLASH,
        expect.any(Number),
        'user_skip'
      );
      expect(callbacks.onAdSkipped).toHaveBeenCalledWith(mockAdResponse.adId, AdType.SPLASH);
    });
  });

  describe('Reward Video Ad Integration', () => {
    it('should load and show reward video ad successfully', async () => {
      // Mock API responses
      mockAdService.requestRewardVideoAd.mockResolvedValue({
        ...mockAdResponse,
        adType: AdType.REWARD_VIDEO,
      });
      mockAdService.reportAdShowNow.mockResolvedValue();
      mockAdService.reportAdCompleteNow.mockResolvedValue(0.10);

      // Mock SDK responses
      mockPangleAdService.loadRewardVideoAd.mockResolvedValue({ status: 'loaded' });
      mockPangleAdService.showRewardVideoAd.mockResolvedValue({ status: 'completed' });

      const callbacks = {
        onAdCompleted: jest.fn(),
      };

      await IntegratedAdService.loadAndShowRewardVideoAd(callbacks);

      // Verify API calls
      expect(mockAdService.requestRewardVideoAd).toHaveBeenCalledWith(mockUser.userId);
      expect(mockAdService.reportAdCompleteNow).toHaveBeenCalledWith(
        mockUser.userId,
        mockAdResponse.adId,
        AdType.REWARD_VIDEO,
        expect.any(Number),
        false
      );

      // Verify SDK calls
      expect(mockPangleAdService.loadRewardVideoAd).toHaveBeenCalledWith(mockAdResponse.adId);
      expect(mockPangleAdService.showRewardVideoAd).toHaveBeenCalled();

      // Verify callback
      expect(callbacks.onAdCompleted).toHaveBeenCalledWith(
        mockAdResponse.adId,
        AdType.REWARD_VIDEO,
        0.10
      );
    });
  });

  describe('Interstitial Ad Integration', () => {
    it('should load and show interstitial ad successfully', async () => {
      // Mock API responses
      mockAdService.requestInterstitialAd.mockResolvedValue({
        ...mockAdResponse,
        adType: AdType.INTERSTITIAL,
      });
      mockAdService.reportAdShowNow.mockResolvedValue();
      mockAdService.reportAdCompleteNow.mockResolvedValue(0.03);

      // Mock SDK responses
      mockPangleAdService.loadInterstitialAd.mockResolvedValue({ status: 'loaded' });
      mockPangleAdService.showInterstitialAd.mockResolvedValue({ status: 'completed' });

      const callbacks = {
        onAdCompleted: jest.fn(),
      };

      await IntegratedAdService.loadAndShowInterstitialAd(callbacks);

      // Verify API calls
      expect(mockAdService.requestInterstitialAd).toHaveBeenCalledWith(mockUser.userId);
      expect(mockAdService.reportAdCompleteNow).toHaveBeenCalledWith(
        mockUser.userId,
        mockAdResponse.adId,
        AdType.INTERSTITIAL,
        expect.any(Number),
        false
      );

      // Verify SDK calls
      expect(mockPangleAdService.loadInterstitialAd).toHaveBeenCalledWith(mockAdResponse.adId);
      expect(mockPangleAdService.showInterstitialAd).toHaveBeenCalled();

      // Verify callback
      expect(callbacks.onAdCompleted).toHaveBeenCalledWith(
        mockAdResponse.adId,
        AdType.INTERSTITIAL,
        0.03
      );
    });
  });

  describe('Banner Ad Integration', () => {
    it('should load and show banner ad successfully', async () => {
      // Mock API responses
      mockAdService.requestBannerAd.mockResolvedValue({
        ...mockAdResponse,
        adType: AdType.BANNER,
      });
      mockAdService.reportAdShowNow.mockResolvedValue();
      mockAdService.reportAdCompleteNow.mockResolvedValue(0.01);

      // Mock SDK responses
      mockPangleAdService.loadBannerAd.mockResolvedValue({ status: 'loaded' });
      mockPangleAdService.showBannerAd.mockResolvedValue({ status: 'completed' });

      const callbacks = {
        onAdCompleted: jest.fn(),
      };

      await IntegratedAdService.loadAndShowBannerAd(callbacks);

      // Verify API calls
      expect(mockAdService.requestBannerAd).toHaveBeenCalledWith(mockUser.userId);
      expect(mockAdService.reportAdCompleteNow).toHaveBeenCalledWith(
        mockUser.userId,
        mockAdResponse.adId,
        AdType.BANNER,
        expect.any(Number),
        false
      );

      // Verify SDK calls
      expect(mockPangleAdService.loadBannerAd).toHaveBeenCalledWith(mockAdResponse.adId);
      expect(mockPangleAdService.showBannerAd).toHaveBeenCalled();

      // Verify callback
      expect(callbacks.onAdCompleted).toHaveBeenCalledWith(
        mockAdResponse.adId,
        AdType.BANNER,
        0.01
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle API request errors', async () => {
      const error = new Error('API request failed');
      mockAdService.requestSplashAd.mockRejectedValue(error);

      const callbacks = {
        onAdError: jest.fn(),
      };

      await expect(IntegratedAdService.loadAndShowSplashAd(callbacks)).rejects.toThrow(error);
    });

    it('should handle SDK loading errors', async () => {
      mockAdService.requestSplashAd.mockResolvedValue(mockAdResponse);
      const error = new Error('SDK loading failed');
      mockPangleAdService.loadSplashAd.mockRejectedValue(error);

      const callbacks = {
        onAdError: jest.fn(),
      };

      await expect(IntegratedAdService.loadAndShowSplashAd(callbacks)).rejects.toThrow(error);
    });

    it('should require user to be set', async () => {
      // Create a new instance without user
      const service = new (IntegratedAdService as any).constructor();

      await expect(service.loadAndShowSplashAd()).rejects.toThrow(
        'User not set. Call setCurrentUser() first.'
      );
    });
  });

  describe('Cleanup', () => {
    it('should destroy all ads and clear tracking data', async () => {
      mockPangleAdService.destroySplashAd.mockResolvedValue('destroyed');
      mockPangleAdService.destroyRewardVideoAd.mockResolvedValue('destroyed');
      mockPangleAdService.destroyInterstitialAd.mockResolvedValue('destroyed');
      mockPangleAdService.destroyBannerAd.mockResolvedValue('destroyed');

      await IntegratedAdService.destroyAllAds();

      expect(mockPangleAdService.destroySplashAd).toHaveBeenCalled();
      expect(mockPangleAdService.destroyRewardVideoAd).toHaveBeenCalled();
      expect(mockPangleAdService.destroyInterstitialAd).toHaveBeenCalled();
      expect(mockPangleAdService.destroyBannerAd).toHaveBeenCalled();
    });

    it('should handle destroy errors gracefully', async () => {
      mockPangleAdService.destroySplashAd.mockRejectedValue(new Error('Destroy failed'));
      mockPangleAdService.destroyRewardVideoAd.mockResolvedValue('destroyed');
      mockPangleAdService.destroyInterstitialAd.mockResolvedValue('destroyed');
      mockPangleAdService.destroyBannerAd.mockResolvedValue('destroyed');

      // Should not throw error
      await expect(IntegratedAdService.destroyAllAds()).resolves.toBeUndefined();
    });
  });
});