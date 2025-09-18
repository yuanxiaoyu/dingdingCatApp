import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV_CONFIG } from '../config/env';
import {
  User,
  LoginResponse,
  AdConfig,
  AppConfig,
  RiskConfig,
  ChannelConfigResponse,
  AdResponse,
  RevenueData,
  AdHistoryResponse,
  AdType
} from '../types';

// Mock storage keys
const MOCK_STORAGE_KEYS = {
  MOCK_MODE: '@dingdingcat/mock_mode',
  MOCK_USER_STATE: '@dingdingcat/mock_user_state',
  MOCK_LOGIN_STATE: '@dingdingcat/mock_login_state',
} as const;

// Mock user states
export enum MockUserState {
  NOT_LOGGED_IN = 'not_logged_in',
  LOGGED_IN = 'logged_in',
  FIRST_TIME_USER = 'first_time_user',
}

/**
 * MockService - Provides mock data and functionality for development
 * 
 * This service allows developers to:
 * - Simulate different user login states
 * - Mock API responses for testing
 * - Control splash ad behavior
 * - Test different configuration scenarios
 */
class MockService {
  private isInitialized = false;
  private currentMockState: MockUserState = MockUserState.NOT_LOGGED_IN;

  /**
   * Initialize mock service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Check if mock mode is enabled (synchronous check)
      const isMockEnabled = ENV_CONFIG.MOCK_ENABLED;
      
      if (isMockEnabled) {
        // Use environment variable to set initial state
        const envUserState = ENV_CONFIG.MOCK_USER_STATE;
        this.currentMockState = envUserState === 0 ? MockUserState.NOT_LOGGED_IN : MockUserState.LOGGED_IN;
        
        console.log('MockService initialized with env state:', {
          mockEnabled: isMockEnabled,
          envUserState: envUserState,
          currentState: this.currentMockState,
        });
        
        // Save to storage asynchronously (don't wait for it)
        AsyncStorage.setItem(MOCK_STORAGE_KEYS.MOCK_USER_STATE, this.currentMockState).catch(error => {
          console.warn('Failed to save mock state to storage:', error);
        });
      } else {
        // Load saved state if mock is disabled but was previously enabled
        try {
          const savedState = await AsyncStorage.getItem(MOCK_STORAGE_KEYS.MOCK_USER_STATE);
          if (savedState && Object.values(MockUserState).includes(savedState as MockUserState)) {
            this.currentMockState = savedState as MockUserState;
          }
        } catch (error) {
          console.warn('Failed to load saved mock state:', error);
        }
        
        console.log('MockService initialized with mock disabled, saved state:', this.currentMockState);
      }

      this.isInitialized = true;

    } catch (error) {
      console.error('Failed to initialize MockService:', error);
      this.isInitialized = true; // Continue even if initialization fails
    }
  }

  /**
   * Check if mock mode is enabled
   */
  public isMockModeEnabled(): boolean {
    try {
      // Mock mode is controlled by environment variable
      return ENV_CONFIG.MOCK_ENABLED;
    } catch (error) {
      console.error('Error checking mock mode:', error);
      return false;
    }
  }

  /**
   * Get current mock user state
   */
  public getCurrentMockState(): MockUserState {
    return this.currentMockState;
  }

  /**
   * Set mock user state
   */
  public async setMockState(state: MockUserState): Promise<void> {
    try {
      this.currentMockState = state;
      await AsyncStorage.setItem(MOCK_STORAGE_KEYS.MOCK_USER_STATE, state);

      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('Mock state updated to:', state);
      }
    } catch (error) {
      console.error('Failed to set mock state:', error);
    }
  }

  /**
   * Check if user should be logged in based on mock state
   */
  public shouldUserBeLoggedIn(): boolean {
    // If mock is enabled, use environment variable directly
    if (ENV_CONFIG.MOCK_ENABLED) {
      return ENV_CONFIG.MOCK_USER_STATE === 1;
    }
    
    // Otherwise use current mock state
    return this.currentMockState === MockUserState.LOGGED_IN || 
           this.currentMockState === MockUserState.FIRST_TIME_USER;
  }

  /**
   * Check if splash ad should be shown based on mock state and config
   */
  public async shouldShowSplashAd(): Promise<boolean> {
    try {
      const isLoggedIn = this.shouldUserBeLoggedIn();
      
      // Only show splash ad for logged in users
      if (!isLoggedIn) {
        return false;
      }

      // Get ad config to check if splash ads are enabled
      const adConfig = await this.getMockAdConfig();
      return adConfig.splashAdConfig?.enabled || false;
    } catch (error) {
      console.error('Error checking splash ad display:', error);
      return false;
    }
  }

  /**
   * Generate mock user data
   */
  public generateMockUser(): LoginResponse {
    const userId = Math.floor(Math.random() * 100000) + 10000;
    const timestamp = new Date().toISOString();

    return {
      userId,
      userName: `mock_user_${userId}`,
      nickName: `测试用户${userId}`,
      avatar: 'https://via.placeholder.com/100x100/1890FF/FFFFFF?text=Mock',
      phoneNumber: '13800138000',
      email: `mock${userId}@example.com`,
      sex: Math.random() > 0.5 ? '1' : '2',
      wechatOpenId: `mock_openid_${userId}`,
      registerChannel: 'wechat',
      appKey: ENV_CONFIG.APP_KEY,
      registerTime: timestamp,
      lastLoginTime: timestamp,
      accessToken: `mock_access_token_${Date.now()}`,
      refreshToken: `mock_refresh_token_${Date.now()}`,
      tokenType: 'Bearer',
      expiresIn: 7200,
    };
  }

  /**
   * Get mock app configuration
   */
  public async getMockAppConfig(): Promise<AppConfig> {
    return {
      appKey: ENV_CONFIG.APP_KEY,
      appName: '丁丁猫开发版',
      wechatAppId: ENV_CONFIG.WECHAT_APP_ID,
      serverTime: Date.now(),
      configVersion: '1.0.0-mock',
      channels: [
        {
          channelCode: 'mock_channel',
          channelName: '模拟渠道',
          isEnabled: true,
        }
      ],
    };
  }

  /**
   * Get mock ad configuration using Pangle test IDs
   */
  public async getMockAdConfig(): Promise<AdConfig> {
    // Import Pangle test configuration
    const PangleAdConfig = require('../config/adConfig.js').default;
    
    return {
      appKey: ENV_CONFIG.APP_KEY,
      configVersion: '1.0.0-pangle-test',
      adInterval: 30, // 30 seconds between ads
      singleRewardLimit: 100, // 1 yuan max per ad
      dailyRewardVideoLimit: 50,
      dailyAdViewLimit: 200,
      adTypeConfig: 'splash,video,interstitial,banner',
      splashAdConfig: {
        enabled: true,
        adId: PangleAdConfig.splashAdId, // 使用穿山甲测试ID: 102117864
        timeout: 5000,
        skipDelay: 3000,
      },
      rewardVideoAdConfig: {
        enabled: true,
        adId: PangleAdConfig.rewardVideoAdId, // 使用穿山甲测试ID: 945700410
        minPlayDuration: 15,
        rewardAmount: 50,
      },
      interstitialAdConfig: {
        enabled: true,
        adId: PangleAdConfig.interstitialAdId, // 使用穿山甲测试ID: 945493675
        showInterval: 60,
        rewardAmount: 20,
      },
      bannerAdConfig: {
        enabled: true,
        adId: PangleAdConfig.bannerAdId, // 使用穿山甲测试ID: 945493677
        position: 'bottom',
        autoRefresh: true,
        refreshInterval: 30,
        rewardAmount: 5,
      },
    };
  }

  /**
   * Get mock risk configuration
   */
  public async getMockRiskConfig(): Promise<RiskConfig> {
    return {
      appKey: ENV_CONFIG.APP_KEY,
      configVersion: '1.0.0-mock',
      rootDetectionEnabled: false, // Disabled for development
      emulatorDetectionEnabled: false, // Disabled for development
      adIntervalCheckEnabled: true,
      adIntervalSeconds: 30,
      sameIpUserLimit: 10,
      dailyRewardVideoLimit: 50,
      singleRevenueLimit: 100,
    };
  }

  /**
   * Get mock channel configuration
   */
  public async getMockChannelConfig(): Promise<ChannelConfigResponse> {
    return {
      appKey: ENV_CONFIG.APP_KEY,
      configVersion: '1.0.0-mock',
      channels: [
        {
          channelCode: 'mock_channel',
          channelName: '模拟渠道',
          isEnabled: true,
        },
        {
          channelCode: 'dev_channel',
          channelName: '开发渠道',
          isEnabled: true,
        }
      ],
    };
  }

  /**
   * Generate mock ad response
   */
  public generateMockAdResponse(adType: AdType): AdResponse {
    const adId = `mock_${adType}_${Date.now()}`;
    
    const baseResponse = {
      adId,
      adType,
      adTitle: `模拟${this.getAdTypeDisplayName(adType)}广告`,
      expectedReward: this.getMockRewardAmount(adType),
      configParams: {
        timeout: 5000,
        skipDelay: 3000,
      },
    };

    // Add type-specific properties
    switch (adType) {
      case AdType.SPLASH:
        return {
          ...baseResponse,
          adImageUrl: 'https://via.placeholder.com/750x1334/1890FF/FFFFFF?text=Splash+Ad',
        };
      case AdType.REWARD_VIDEO:
        return {
          ...baseResponse,
          adVideoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          adImageUrl: 'https://via.placeholder.com/1280x720/1890FF/FFFFFF?text=Video+Ad',
        };
      case AdType.INTERSTITIAL:
        return {
          ...baseResponse,
          adImageUrl: 'https://via.placeholder.com/600x800/1890FF/FFFFFF?text=Interstitial+Ad',
        };
      case AdType.BANNER:
        return {
          ...baseResponse,
          adImageUrl: 'https://via.placeholder.com/320x50/1890FF/FFFFFF?text=Banner+Ad',
        };
      default:
        return baseResponse;
    }
  }

  /**
   * Get mock revenue data
   */
  public async getMockRevenueData(): Promise<RevenueData> {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return {
      userId: 12345,
      totalRevenue: 2580, // 25.8 yuan
      todayRevenue: 150, // 1.5 yuan
      yesterdayRevenue: 200, // 2 yuan
      weekRevenue: 800, // 8 yuan
      monthRevenue: 2580, // 25.8 yuan
      totalAdViews: 86,
      todayAdViews: 5,
      averageRevenuePerAd: 30, // 0.3 yuan per ad
      remainingDailyViews: 45,
      lastUpdateTime: today.toISOString(),
    };
  }

  /**
   * Get mock ad history
   */
  public async getMockAdHistory(pageNum: number = 1, pageSize: number = 20): Promise<AdHistoryResponse> {
    const totalRecords = 86;
    const totalPages = Math.ceil(totalRecords / pageSize);
    
    // Generate mock history items
    const items = [];
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalRecords);

    for (let i = startIndex; i < endIndex; i++) {
      const adTypes = Object.values(AdType);
      const adType = adTypes[i % adTypes.length];
      const date = new Date();
      date.setHours(date.getHours() - i);

      items.push({
        id: `history_${i + 1}`,
        adId: `mock_${adType}_${i + 1}`,
        adType,
        adTitle: `模拟${this.getAdTypeDisplayName(adType)}广告`,
        playTime: date.toISOString(),
        playDuration: this.getMockPlayDuration(adType),
        rewardAmount: this.getMockRewardAmount(adType),
        isCompleted: Math.random() > 0.1, // 90% completion rate
        isClicked: Math.random() > 0.7, // 30% click rate
      });
    }

    return {
      pageNum,
      pageSize,
      totalRecords,
      totalPages,
      items,
    };
  }

  /**
   * Simulate network delay for mock responses
   */
  public async simulateNetworkDelay(minMs: number = 200, maxMs: number = 800): Promise<void> {
    const delay = Math.random() * (maxMs - minMs) + minMs;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Toggle mock user state for testing
   */
  public async toggleMockState(): Promise<MockUserState> {
    const states = Object.values(MockUserState);
    const currentIndex = states.indexOf(this.currentMockState);
    const nextIndex = (currentIndex + 1) % states.length;
    const nextState = states[nextIndex];

    await this.setMockState(nextState);
    return nextState;
  }

  /**
   * Reset mock service to initial state
   */
  public async reset(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        MOCK_STORAGE_KEYS.MOCK_USER_STATE,
        MOCK_STORAGE_KEYS.MOCK_LOGIN_STATE,
      ]);

      this.currentMockState = MockUserState.NOT_LOGGED_IN;

      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('MockService reset to initial state');
      }
    } catch (error) {
      console.error('Failed to reset MockService:', error);
    }
  }

  // Private helper methods

  private getAdTypeDisplayName(adType: AdType): string {
    const displayNames = {
      [AdType.SPLASH]: '开屏',
      [AdType.REWARD_VIDEO]: '激励视频',
      [AdType.INTERSTITIAL]: '插屏',
      [AdType.BANNER]: 'Banner',
    };
    return displayNames[adType] || adType;
  }

  private getMockRewardAmount(adType: AdType): number {
    const rewards = {
      [AdType.SPLASH]: 10, // 0.1 yuan
      [AdType.REWARD_VIDEO]: 50, // 0.5 yuan
      [AdType.INTERSTITIAL]: 20, // 0.2 yuan
      [AdType.BANNER]: 5, // 0.05 yuan
    };
    return rewards[adType] || 10;
  }

  private getMockPlayDuration(adType: AdType): number {
    const durations = {
      [AdType.SPLASH]: 5, // 5 seconds
      [AdType.REWARD_VIDEO]: 30, // 30 seconds
      [AdType.INTERSTITIAL]: 10, // 10 seconds
      [AdType.BANNER]: 0, // No play duration for banner
    };
    return durations[adType] || 0;
  }

  /**
   * Get current mock state based on environment variable
   */
  public getCurrentMockStateFromEnv(): MockUserState {
    if (!ENV_CONFIG.MOCK_ENABLED) {
      return this.currentMockState;
    }
    
    return ENV_CONFIG.MOCK_USER_STATE === 0 ? MockUserState.NOT_LOGGED_IN : MockUserState.LOGGED_IN;
  }

  /**
   * Get environment variable configuration
   */
  public getEnvConfig(): {
    mockEnabled: boolean;
    mockUserState: 0 | 1;
    debugMode: boolean;
  } {
    return {
      mockEnabled: ENV_CONFIG.MOCK_ENABLED,
      mockUserState: ENV_CONFIG.MOCK_USER_STATE,
      debugMode: ENV_CONFIG.DEBUG_MODE,
    };
  }

  /**
   * Get mock service status for debugging
   */
  public getStatus(): {
    isInitialized: boolean;
    currentState: MockUserState;
    envState: MockUserState;
    isMockModeEnabled: boolean;
    shouldUserBeLoggedIn: boolean;
    envConfig: {
      mockEnabled: boolean;
      mockUserState: 0 | 1;
      debugMode: boolean;
    };
  } {
    return {
      isInitialized: this.isInitialized,
      currentState: this.currentMockState,
      envState: this.getCurrentMockStateFromEnv(),
      isMockModeEnabled: ENV_CONFIG.MOCK_ENABLED,
      shouldUserBeLoggedIn: this.shouldUserBeLoggedIn(),
      envConfig: this.getEnvConfig(),
    };
  }
}

// Create singleton instance
const mockService = new MockService();

export default mockService;
export { MockService, MockUserState };