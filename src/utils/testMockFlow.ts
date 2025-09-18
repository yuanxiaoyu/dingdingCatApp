import mockService, { MockUserState } from '../services/MockService';
import appFlowManager, { AppFlowState } from '../services/AppFlowManager';
import configService from '../services/ConfigService';
import { ENV_CONFIG } from '../config/env';

/**
 * Test utility for mock flow functionality
 * Only available in debug mode
 */
export class MockFlowTester {

  /**
   * Test all mock states and their corresponding app flows
   */
  public static async testAllMockStates(): Promise<void> {
    if (!ENV_CONFIG.DEBUG_MODE) {
      console.warn('Mock flow testing only available in debug mode');
      return;
    }

    console.log('🧪 Starting Mock Flow Test Suite...');

    const states = Object.values(MockUserState);

    for (const state of states) {
      await this.testMockState(state);
    }

    console.log('✅ Mock Flow Test Suite completed');
  }

  /**
   * Test a specific mock state
   */
  public static async testMockState(state: MockUserState): Promise<void> {
    try {
      console.log(`\n🔄 Testing mock state: ${state}`);

      // Set mock state
      await mockService.setMockState(state);
      console.log(`   ✓ Mock state set to: ${state}`);

      // Determine app flow
      const flowResult = await appFlowManager.determineAppFlow();
      console.log(`   ✓ App flow determined: ${flowResult.state}`);
      console.log(`   ✓ Should show splash ad: ${flowResult.shouldShowSplashAd}`);
      console.log(`   ✓ Is authenticated: ${flowResult.isAuthenticated}`);

      // Validate expected behavior
      this.validateFlowResult(state, flowResult);

      // Test splash ad configuration if applicable
      if (flowResult.shouldShowSplashAd) {
        await this.testSplashAdConfig();
      }

    } catch (error) {
      console.error(`   ❌ Error testing mock state ${state}:`, error);
    }
  }

  /**
   * Test splash ad configuration
   */
  private static async testSplashAdConfig(): Promise<void> {
    try {
      const adConfig = await configService.getAdConfig();

      if (adConfig?.splashAdConfig) {
        console.log(`   ✓ Splash ad config loaded:`);
        console.log(`     - Enabled: ${adConfig.splashAdConfig.enabled}`);
        console.log(`     - Ad ID: ${adConfig.splashAdConfig.adId}`);
        console.log(`     - Timeout: ${adConfig.splashAdConfig.timeout}ms`);
        console.log(`     - Skip delay: ${adConfig.splashAdConfig.skipDelay}ms`);
      } else {
        console.log(`   ⚠️  No splash ad config found`);
      }

    } catch (error) {
      console.error(`   ❌ Error testing splash ad config:`, error);
    }
  }

  /**
   * Validate flow result against expected behavior
   */
  private static validateFlowResult(state: MockUserState, flowResult: any): void {
    const expectations = this.getExpectedBehavior(state);

    // Validate authentication status
    if (flowResult.isAuthenticated !== expectations.shouldBeAuthenticated) {
      console.warn(`   ⚠️  Authentication mismatch: expected ${expectations.shouldBeAuthenticated}, got ${flowResult.isAuthenticated}`);
    }

    // Validate flow state
    if (!expectations.allowedFlowStates.includes(flowResult.state)) {
      console.warn(`   ⚠️  Flow state mismatch: expected one of ${expectations.allowedFlowStates.join(', ')}, got ${flowResult.state}`);
    }

    // Validate splash ad behavior
    if (flowResult.shouldShowSplashAd !== expectations.shouldShowSplashAd) {
      console.warn(`   ⚠️  Splash ad mismatch: expected ${expectations.shouldShowSplashAd}, got ${flowResult.shouldShowSplashAd}`);
    }

    console.log(`   ✓ Flow validation passed`);
  }

  /**
   * Get expected behavior for a mock state
   */
  private static getExpectedBehavior(state: MockUserState) {
    switch (state) {
      case MockUserState.NOT_LOGGED_IN:
        return {
          shouldBeAuthenticated: false,
          allowedFlowStates: [AppFlowState.LOGIN_REQUIRED],
          shouldShowSplashAd: false,
        };

      case MockUserState.LOGGED_IN:
      case MockUserState.FIRST_TIME_USER:
        return {
          shouldBeAuthenticated: true,
          allowedFlowStates: [AppFlowState.SPLASH_AD, AppFlowState.MAIN_APP],
          shouldShowSplashAd: true, // Depends on config, but mock config enables it
        };

      default:
        return {
          shouldBeAuthenticated: false,
          allowedFlowStates: [AppFlowState.LOGIN_REQUIRED, AppFlowState.ERROR],
          shouldShowSplashAd: false,
        };
    }
  }

  /**
   * Test mock ad generation
   */
  public static async testMockAdGeneration(): Promise<void> {
    if (!ENV_CONFIG.DEBUG_MODE) {
      console.warn('Mock ad testing only available in debug mode');
      return;
    }

    console.log('\n🎬 Testing Mock Ad Generation...');

    const adTypes = ['splash', 'video', 'interstitial', 'banner'] as const;

    for (const adType of adTypes) {
      try {
        const mockAd = mockService.generateMockAdResponse(adType as any);
        console.log(`   ✓ ${adType} ad generated:`);
        console.log(`     - ID: ${mockAd.adId}`);
        console.log(`     - Title: ${mockAd.adTitle}`);
        console.log(`     - Reward: ${mockAd.expectedReward}`);

        if (mockAd.adImageUrl) {
          console.log(`     - Image URL: ${mockAd.adImageUrl}`);
        }

        if (mockAd.adVideoUrl) {
          console.log(`     - Video URL: ${mockAd.adVideoUrl}`);
        }

      } catch (error) {
        console.error(`   ❌ Error generating ${adType} ad:`, error);
      }
    }

    console.log('✅ Mock Ad Generation test completed');
  }

  /**
   * Test mock revenue data
   */
  public static async testMockRevenueData(): Promise<void> {
    if (!ENV_CONFIG.DEBUG_MODE) {
      console.warn('Mock revenue testing only available in debug mode');
      return;
    }

    console.log('\n💰 Testing Mock Revenue Data...');

    try {
      const revenueData = await mockService.getMockRevenueData();

      console.log(`   ✓ Revenue data generated:`);
      console.log(`     - Total revenue: ¥${(revenueData.totalRevenue / 100).toFixed(2)}`);
      console.log(`     - Today revenue: ¥${(revenueData.todayRevenue / 100).toFixed(2)}`);
      console.log(`     - Total ad views: ${revenueData.totalAdViews}`);
      console.log(`     - Today ad views: ${revenueData.todayAdViews}`);
      console.log(`     - Remaining daily views: ${revenueData.remainingDailyViews}`);
      console.log(`     - Average per ad: ¥${((revenueData.averageRevenuePerAd || 0) / 100).toFixed(2)}`);

    } catch (error) {
      console.error(`   ❌ Error generating revenue data:`, error);
    }

    console.log('✅ Mock Revenue Data test completed');
  }

  /**
   * Test mock configurations
   */
  public static async testMockConfigurations(): Promise<void> {
    if (!ENV_CONFIG.DEBUG_MODE) {
      console.warn('Mock config testing only available in debug mode');
      return;
    }

    console.log('\n⚙️ Testing Mock Configurations...');

    try {
      // Test app config
      const appConfig = await mockService.getMockAppConfig();
      console.log(`   ✓ App config generated:`);
      console.log(`     - App name: ${appConfig.appName}`);
      console.log(`     - Version: ${appConfig.configVersion}`);
      console.log(`     - Channels: ${appConfig.channels.length}`);

      // Test ad config
      const adConfig = await mockService.getMockAdConfig();
      console.log(`   ✓ Ad config generated:`);
      console.log(`     - Splash enabled: ${adConfig.splashAdConfig?.enabled}`);
      console.log(`     - Video enabled: ${adConfig.rewardVideoAdConfig?.enabled}`);
      console.log(`     - Interstitial enabled: ${adConfig.interstitialAdConfig?.enabled}`);
      console.log(`     - Banner enabled: ${adConfig.bannerAdConfig?.enabled}`);

      // Test risk config
      const riskConfig = await mockService.getMockRiskConfig();
      console.log(`   ✓ Risk config generated:`);
      console.log(`     - Root detection: ${riskConfig.rootDetectionEnabled}`);
      console.log(`     - Emulator detection: ${riskConfig.emulatorDetectionEnabled}`);
      console.log(`     - Ad interval: ${riskConfig.adIntervalSeconds}s`);

    } catch (error) {
      console.error(`   ❌ Error generating configurations:`, error);
    }

    console.log('✅ Mock Configurations test completed');
  }

  /**
   * Run complete test suite
   */
  public static async runCompleteTestSuite(): Promise<void> {
    if (!ENV_CONFIG.DEBUG_MODE) {
      console.warn('Mock testing only available in debug mode');
      return;
    }

    console.log('🚀 Starting Complete Mock Test Suite...\n');

    await this.testEnvironmentConfig();
    await this.testAllMockStates();
    await this.testMockAdGeneration();
    await this.testMockRevenueData();
    await this.testMockConfigurations();

    console.log('\n🎉 Complete Mock Test Suite finished!');
  }

  /**
   * Test environment variable configuration
   */
  public static async testEnvironmentConfig(): Promise<void> {
    if (!ENV_CONFIG.DEBUG_MODE) {
      console.warn('Environment config testing only available in debug mode');
      return;
    }

    console.log('\n🔧 Testing Environment Variable Configuration...');

    try {
      const envConfig = mockService.getEnvConfig();

      console.log(`   ✓ Environment configuration:`);
      console.log(`     - MOCK_ENABLED: ${envConfig.mockEnabled}`);
      console.log(`     - MOCK_USER_STATE: ${envConfig.mockUserState} (${envConfig.mockUserState === 0 ? '未登录' : '登录'})`);
      console.log(`     - DEBUG_MODE: ${envConfig.debugMode}`);

      // Test mock mode detection
      const isMockEnabled = await mockService.isMockModeEnabled();
      console.log(`   ✓ Mock mode enabled: ${isMockEnabled}`);

      // Test user state
      const shouldBeLoggedIn = mockService.shouldUserBeLoggedIn();
      console.log(`   ✓ Should be logged in: ${shouldBeLoggedIn}`);

      // Test flow determination
      const flowResult = await appFlowManager.determineAppFlow();
      console.log(`   ✓ App flow result:`);
      console.log(`     - State: ${flowResult.state}`);
      console.log(`     - Authenticated: ${flowResult.isAuthenticated}`);
      console.log(`     - Show splash ad: ${flowResult.shouldShowSplashAd}`);

      // Validate consistency
      if (envConfig.mockEnabled) {
        const expectedAuth = envConfig.mockUserState === 1;
        if (flowResult.isAuthenticated !== expectedAuth) {
          console.warn(`   ⚠️  Authentication mismatch: env expects ${expectedAuth}, flow shows ${flowResult.isAuthenticated}`);
        } else {
          console.log(`   ✅ Authentication state consistent with environment config`);
        }
      }

    } catch (error) {
      console.error(`   ❌ Error testing environment config:`, error);
    }

    console.log('✅ Environment Variable Configuration test completed');
  }

  /**
   * Get current system status for debugging
   */
  public static async getSystemStatus(): Promise<any> {
    try {
      const [mockStatus, flowStatus] = await Promise.all([
        mockService.getStatus(),
        appFlowManager.getFlowStatus(),
      ]);

      return {
        timestamp: new Date().toISOString(),
        environment: {
          debugMode: ENV_CONFIG.DEBUG_MODE,
          mockEnabled: ENV_CONFIG.MOCK_ENABLED,
          mockUserState: ENV_CONFIG.MOCK_USER_STATE,
          apiBaseUrl: ENV_CONFIG.API_BASE_URL,
          wechatAppId: ENV_CONFIG.WECHAT_APP_ID,
          appKey: ENV_CONFIG.APP_KEY,
        },
        mockService: mockStatus,
        appFlowManager: flowStatus,
      };

    } catch (error) {
      console.error('Error getting system status:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export for console debugging
if (ENV_CONFIG.DEBUG_MODE) {
  (global as any).MockFlowTester = MockFlowTester;
  console.log('🛠️ MockFlowTester available globally for debugging');
}

export default MockFlowTester;