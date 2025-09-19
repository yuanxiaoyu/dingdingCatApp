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

  /**
   * 模拟微信登录接口 (/auth/wechat/login)
   */
  public async mockWechatLogin(appKey: string, code: string): Promise<LoginResponse> {
    await this.simulateNetworkDelay(500, 1000);
    
    const mockUser = this.generateMockUser();
    
    return {
      accessToken: `mock_access_token_${Date.now()}`,
      tokenType: 'Bearer',
      expiresIn: 1800,
      userId: mockUser.userId,
      userName: mockUser.userName,
      nickName: mockUser.nickName,
      avatar: mockUser.avatar,
      appKey: appKey,
    };
  }

  /**
   * 模拟微信注册接口 (/auth/wechat/register)
   */
  public async mockWechatRegister(appKey: string, code: string, nickName?: string, phoneNumber?: string): Promise<User> {
    await this.simulateNetworkDelay(800, 1200);
    
    const mockUser = this.generateMockUser();
    
    return {
      userId: mockUser.userId,
      userName: mockUser.userName,
      nickName: nickName || mockUser.nickName,
      avatar: mockUser.avatar,
      phoneNumber: phoneNumber || mockUser.phoneNumber,
      email: mockUser.email,
      sex: mockUser.sex,
      wechatOpenId: mockUser.wechatOpenId,
      registerChannel: mockUser.registerChannel,
      appKey: appKey,
    };
  }

  /**
   * 模拟获取用户信息接口 (/auth/userInfo)
   */
  public async mockGetUserInfo(): Promise<User> {
    await this.simulateNetworkDelay(200, 400);
    const mockUser = this.generateMockUser();
    
    return {
      userId: mockUser.userId,
      userName: mockUser.userName,
      nickName: mockUser.nickName,
      avatar: mockUser.avatar,
      phoneNumber: mockUser.phoneNumber,
      email: mockUser.email,
      sex: mockUser.sex,
      wechatOpenId: mockUser.wechatOpenId,
      registerChannel: mockUser.registerChannel,
      appKey: mockUser.appKey,
    };
  }

  /**
   * 模拟刷新Token接口 (/auth/refresh)
   */
  public async mockRefreshToken(refreshToken: string): Promise<LoginResponse> {
    await this.simulateNetworkDelay(300, 600);
    
    console.log('MockService: 刷新Token成功');
    
    return {
      user: await this.mockGetUserInfo(),
      accessToken: `mock_access_token_${Date.now()}`,
      refreshToken: `mock_refresh_token_${Date.now()}`,
      tokenType: 'Bearer',
      expiresIn: 7200,
    };
  }

  /**
   * 模拟登出接口 (/auth/logout)
   */
  public async mockLogout(): Promise<void> {
    await this.simulateNetworkDelay(200, 400);
    console.log('MockService: 用户登出成功');
  }

  /**
   * 模拟应用配置接口 (/config)
   */
  public async mockGetAppConfig(appKey?: string): Promise<AppConfig> {
    await this.simulateNetworkDelay(300, 600);
    
    return {
      appKey: appKey,
      appName: '丁丁猫广告收益管理',
      appType: 'mobile',
      appDesc: '专业的广告收益管理应用',
      status: '0',
      wechatAppId: ENV_CONFIG.WECHAT_APP_ID,
      channelConfig: JSON.stringify({ defaultChannel: 'pangle' }),
      riskConfig: JSON.stringify({ rootDetectionEnabled: true }),
      serverTime: Date.now(),
      configVersion: Date.now().toString(),
      channels: [
        {
          channelCode: 'pangle_001',
          channelName: '穿山甲渠道',
          channelType: 'PANGLE',
          status: '0',
        }
      ],
    };
  }

  /**
   * 模拟风控配置接口 (/config/risk)
   */
  public async mockGetRiskConfig(appKey: string): Promise<RiskConfig> {
    await this.simulateNetworkDelay(200, 400);
    
    return {
      appKey: appKey,
      serverTime: Date.now(),
      configVersion: Date.now().toString(),
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
      // 新增单次收益金额配置
      singleRevenueLimit: 100, // 单次最大收益限制（分）
      singleRevenueAmount: 5, // 单次收益金额（分），即0.05元
      dailyRewardVideoLimit: 50,
      dailyAdViewLimit: 200,
    };
  }

  /**
   * 模拟渠道配置接口 (/config/channel)
   */
  public async mockGetChannelConfig(appKey: string): Promise<ChannelConfigResponse> {
    await this.simulateNetworkDelay(200, 400);
    
    return {
      appKey: appKey,
      channelConfig: JSON.stringify({ defaultChannel: 'pangle' }),
      serverTime: Date.now(),
      configVersion: Date.now().toString(),
      defaultChannelCode: 'pangle_001',
      channels: [
        {
          channelId: 1,
          channelCode: 'pangle_001',
          channelName: '穿山甲渠道',
          channelType: 'PANGLE',
          channelDesc: '穿山甲广告渠道',
          status: '0',
          contactPerson: '张三',
          contactPhone: '13800138000',
          contactEmail: 'zhangsan@example.com',
          isDefault: true,
        }
      ],
    };
  }

  /**
   * 模拟广告请求接口 (/ad/request)
   */
  public async mockAdRequest(userId: number, adType: AdType): Promise<AdResponse> {
    await this.simulateNetworkDelay(500, 1000);
    
    const adConfig = await this.getMockAdConfig();
    let adId = '';
    let expectedReward = 0;
    
    switch (adType) {
      case AdType.SPLASH:
        adId = adConfig.splashAdConfig?.adId || 'mock_splash_ad';
        expectedReward = 10;
        break;
      case AdType.REWARD_VIDEO:
        adId = adConfig.rewardVideoAdConfig?.adId || 'mock_video_ad';
        expectedReward = 50;
        break;
      case AdType.INTERSTITIAL:
        adId = adConfig.interstitialAdConfig?.adId || 'mock_interstitial_ad';
        expectedReward = 20;
        break;
      case AdType.BANNER:
        adId = adConfig.bannerAdConfig?.adId || 'mock_banner_ad';
        expectedReward = 5;
        break;
    }
    
    return {
      adId: adId,
      adType: adType,
      adTitle: `丁丁猫${adType}广告 - Mock模拟`,
      adImageUrl: `https://picsum.photos/400/300?random=${Date.now()}`,
      adClickUrl: 'https://www.dingdingcat.com',
      playDuration: adType === AdType.REWARD_VIDEO ? 30 : 5,
      expectedReward: expectedReward,
      configParams: {
        minPlayDuration: adType === AdType.REWARD_VIDEO ? 15 : 0,
        completeRewardMultiplier: 1.0,
        clickRewardMultiplier: 1.2,
        adInterval: 60,
        dailyWatchLimit: 100,
      },
    };
  }

  /**
   * 模拟收益统计接口 (/ad/revenue)
   */
  public async mockGetRevenue(userId: number): Promise<RevenueData> {
    await this.simulateNetworkDelay(300, 600);
    
    // 使用新的收益计算逻辑：完播次数 × 单次收益金额
    const singleRevenueAmount = 0.05; // 单次收益0.05元（从风控配置获取）
    const totalWatchCount = 156 + Math.floor(Math.random() * 50);
    const totalRevenue = totalWatchCount * singleRevenueAmount;
    const todayWatchCount = 23 + Math.floor(Math.random() * 10);
    const todayRevenue = todayWatchCount * singleRevenueAmount;
    
    return {
      userId: userId,
      userName: `用户${userId}`,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalWatchCount: totalWatchCount,
      todayRevenue: Number(todayRevenue.toFixed(2)),
      yesterdayRevenue: Number((Math.floor(todayWatchCount * 0.8) * singleRevenueAmount).toFixed(2)),
      weekRevenue: Number((Math.floor(totalWatchCount * 0.8) * singleRevenueAmount).toFixed(2)),
      monthRevenue: totalRevenue,
      todayWatchCount: todayWatchCount,
      yesterdayWatchCount: Math.floor(todayWatchCount * 0.8),
      weekWatchCount: Math.floor(totalWatchCount * 0.8),
      monthWatchCount: totalWatchCount,
      remainingWatchCount: 100 - todayWatchCount,
      avgRevenuePerWatch: singleRevenueAmount,
      lastWatchTime: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      accountStatus: 'normal',
      withdrawableAmount: totalRevenue,
      frozenAmount: 0.00,
      // 新增字段：完播次数统计
      totalCompletedCount: totalWatchCount,
      todayCompletedCount: todayWatchCount,
      singleRevenueAmount: singleRevenueAmount,
    };
  }



  /**
   * 模拟设备信息上报接口 (/user/device)
   */
  public async mockReportDeviceInfo(userId: number, deviceInfo: any): Promise<{ userId: number; appKey: string; reportTime: number }> {
    await this.simulateNetworkDelay(200, 500);
    
    console.log('MockService: 设备信息上报成功 - 用户:', userId, deviceInfo);
    
    return {
      userId: userId,
      appKey: ENV_CONFIG.APP_KEY,
      reportTime: Date.now(),
    };
  }

  /**
   * 模拟设备信息上报接口 (/user/device) - 别名方法
   */
  public async mockReportDevice(data: any): Promise<{ userId: number; appKey: string; reportTime: number }> {
    return this.mockReportDeviceInfo(data.userId || 1001, data);
  }

  /**
   * 模拟广告展示回调 (/ad/show)
   */
  public async mockAdShow(userId: number, adId: string, adType: AdType): Promise<void> {
    await this.simulateNetworkDelay(100, 300);
    console.log(`MockService: 广告展示上报 - 用户: ${userId}, 广告: ${adId}, 类型: ${adType}`);
  }

  /**
   * 模拟广告点击回调 (/ad/click)
   */
  public async mockAdClick(userId: number, adId: string, adType: AdType): Promise<void> {
    await this.simulateNetworkDelay(100, 300);
    console.log(`MockService: 广告点击上报 - 用户: ${userId}, 广告: ${adId}, 类型: ${adType}`);
  }

  /**
   * 模拟广告完播回调 (/ad/complete)
   */
  public async mockAdComplete(userId: number, adId: string, adType: AdType, playDuration: number, isClicked: boolean): Promise<number> {
    await this.simulateNetworkDelay(200, 500);
    
    // 使用统一的单次收益金额
    const singleRevenueAmount = 0.05; // 每次完播固定收益0.05元
    
    let reward = singleRevenueAmount;
    
    // 点击可能有额外奖励（可选）
    if (isClicked) {
      reward *= 1.1; // 点击奖励倍数降低
    }
    
    console.log(`MockService: 广告完播上报 - 用户: ${userId}, 广告: ${adId}, 类型: ${adType}, 奖励: ${reward.toFixed(3)}`);
    return Number(reward.toFixed(3));
  }

  /**
   * 模拟广告跳过回调 (/ad/skip)
   */
  public async mockAdSkip(userId: number, adId: string, adType: AdType, playDuration: number, skipReason: string): Promise<void> {
    await this.simulateNetworkDelay(100, 300);
    console.log(`MockService: 广告跳过上报 - 用户: ${userId}, 广告: ${adId}, 类型: ${adType}, 时长: ${playDuration}, 原因: ${skipReason}`);
  }

  /**
   * 模拟广告关闭回调 (/ad/close)
   */
  public async mockAdClose(userId: number, adId: string, adType: AdType, playDuration: number, closeReason: string): Promise<void> {
    await this.simulateNetworkDelay(100, 300);
    console.log(`MockService: 广告关闭上报 - 用户: ${userId}, 广告: ${adId}, 类型: ${adType}, 时长: ${playDuration}, 原因: ${closeReason}`);
  }

  /**
   * 模拟批量上报播放数据 (/ad/batchReport)
   */
  public async mockBatchReport(userId: number, playDataList: any[]): Promise<number> {
    await this.simulateNetworkDelay(500, 1000);
    
    console.log(`MockService: 批量上报播放数据 - 用户: ${userId}, 数据条数: ${playDataList.length}`);
    playDataList.forEach((data, index) => {
      console.log(`  ${index + 1}. 类型: ${data.adType}, 时长: ${data.playDuration}s, 点击: ${data.isClicked}, 跳过: ${data.isSkipped}`);
    });
    
    return playDataList.length;
  }

  /**
   * 验证应用启动流程的完整性
   */
  public async validateAppStartupFlow(): Promise<{
    success: boolean;
    message: string;
    steps: Array<{ step: string; success: boolean; message: string; data?: any }>;
  }> {
    const steps = [];
    let allSuccess = true;

    try {
      // 步骤1: 用户认证
      console.log('验证步骤1: 用户认证');
      const loginResult = await this.mockWechatLogin(ENV_CONFIG.APP_KEY, 'mock_code_123');
      steps.push({
        step: '用户认证',
        success: true,
        message: '微信登录模拟成功',
        data: { userId: loginResult.userId, userName: loginResult.userName }
      });

      // 步骤2: 应用配置加载
      console.log('验证步骤2: 应用配置加载');
      const appConfig = await this.mockGetAppConfig(ENV_CONFIG.APP_KEY);
      steps.push({
        step: '应用配置加载',
        success: true,
        message: '应用配置获取成功',
        data: { appName: appConfig.appName, configVersion: appConfig.configVersion }
      });

      // 步骤3: 广告配置加载
      console.log('验证步骤3: 广告配置加载');
      const adConfig = await this.getMockAdConfig();
      steps.push({
        step: '广告配置加载',
        success: true,
        message: '广告配置获取成功',
        data: { 
          splashEnabled: adConfig.splashAdConfig?.enabled,
          bannerEnabled: adConfig.bannerAdConfig?.enabled
        }
      });

      // 步骤4: 风控配置加载
      console.log('验证步骤4: 风控配置加载');
      const riskConfig = await this.mockGetRiskConfig(ENV_CONFIG.APP_KEY);
      steps.push({
        step: '风控配置加载',
        success: true,
        message: '风控配置获取成功',
        data: { riskLevel: riskConfig.riskLevel }
      });

      // 步骤5: 用户信息获取
      console.log('验证步骤5: 用户信息获取');
      const userInfo = await this.mockGetUserInfo();
      steps.push({
        step: '用户信息获取',
        success: true,
        message: '用户信息获取成功',
        data: { nickName: userInfo.nickName }
      });

      // 步骤6: 收益数据获取
      console.log('验证步骤6: 收益数据获取');
      const revenueData = await this.mockGetRevenue(loginResult.userId);
      steps.push({
        step: '收益数据获取',
        success: true,
        message: '收益数据获取成功',
        data: { totalRevenue: revenueData.totalRevenue, todayRevenue: revenueData.todayRevenue }
      });

      // 步骤7: Banner广告请求
      console.log('验证步骤7: Banner广告请求');
      const bannerAd = await this.mockAdRequest(loginResult.userId, AdType.BANNER);
      steps.push({
        step: 'Banner广告请求',
        success: true,
        message: 'Banner广告请求成功',
        data: { adId: bannerAd.adId, adTitle: bannerAd.adTitle }
      });

    } catch (error) {
      allSuccess = false;
      steps.push({
        step: '流程验证',
        success: false,
        message: `验证过程中发生错误: ${(error as Error).message}`
      });
    }

    return {
      success: allSuccess,
      message: allSuccess ? '应用启动流程验证成功，所有Mock接口正常工作' : '应用启动流程验证失败，存在问题',
      steps: steps
    };
  }
}

// 创建单例实例
const mockService = new MockService();

export default mockService;
export { MockService, MockUserState };