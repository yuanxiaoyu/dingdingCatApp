import authService from './AuthService';
import configService from './ConfigService';
import mockService, { MockUserState } from './MockService';
import { ENV_CONFIG } from '../config/env';

// 应用流程状态
export enum AppFlowState {
  INITIALIZING = 'INITIALIZING',
  SPLASH_AD = 'SPLASH_AD',
  LOGIN_REQUIRED = 'LOGIN_REQUIRED',
  MAIN_APP = 'MAIN_APP',
  ERROR = 'ERROR',
}

// 应用流程结果
export interface AppFlowResult {
  state: AppFlowState;
  shouldShowSplashAd: boolean;
  isAuthenticated: boolean;
  userId?: number;
  error?: string;
}

/**
 * 应用流程管理器 - 基于认证和配置管理应用流程
 * 
 * 流程逻辑：
 * 1. 检查认证状态
 * 2. 如果未认证 -> 需要登录
 * 3. 如果已认证 -> 检查开屏广告配置
 * 4. 如果开屏广告启用 -> 显示开屏广告
 * 5. 如果开屏广告禁用或已完成 -> 进入主应用
 */
class AppFlowManager {
  private isInitialized = false;

  /**
   * 初始化应用流程管理器
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // 如果在开发环境中则初始化模拟服务
      if (ENV_CONFIG.DEBUG_MODE) {
        await mockService.initialize();
      }

      this.isInitialized = true;

      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('AppFlowManager initialized');
      }
    } catch (error) {
      console.error('Failed to initialize AppFlowManager:', error);
      this.isInitialized = true; // 即使初始化失败也继续
    }
  }

  /**
   * 确定当前应用流程状态
   */
  public async determineAppFlow(): Promise<AppFlowResult> {
    try {
      console.log('AppFlowManager: Determining app flow...');

      // 确保管理器已初始化
      await this.initialize();

      // 检查是否启用模拟模式
      const isMockMode = mockService.isMockModeEnabled();

      if (isMockMode) {
        return await this.determineMockFlow();
      } else {
        return await this.determineRealFlow();
      }

    } catch (error) {
      console.error('AppFlowManager: Error determining app flow:', error);
      return {
        state: AppFlowState.ERROR,
        shouldShowSplashAd: false,
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 确定模拟模式的应用流程
   */
  private async determineMockFlow(): Promise<AppFlowResult> {
    try {
      console.log('AppFlowManager: Using mock flow');

      // 从环境变量获取模拟状态
      const mockState = mockService.getCurrentMockStateFromEnv();
      const envConfig = mockService.getEnvConfig();

      console.log('AppFlowManager: Mock state from env:', {
        mockState,
        envConfig,
      });

      // 根据环境变量处理不同的模拟状态
      if (envConfig.mockUserState === 0) {
        // 未登录状态
        return {
          state: AppFlowState.LOGIN_REQUIRED,
          shouldShowSplashAd: false,
          isAuthenticated: false,
        };
      } else {
        // 登录状态 (envConfig.mockUserState === 1)
        // 检查是否应该显示开屏广告
        const shouldShowSplashAd = await mockService.shouldShowSplashAd();
        const mockUser = mockService.generateMockUser();

        if (shouldShowSplashAd) {
          return {
            state: AppFlowState.SPLASH_AD,
            shouldShowSplashAd: true,
            isAuthenticated: true,
            userId: mockUser.userId,
          };
        } else {
          return {
            state: AppFlowState.MAIN_APP,
            shouldShowSplashAd: false,
            isAuthenticated: true,
            userId: mockUser.userId,
          };
        }
      }

    } catch (error) {
      console.error('AppFlowManager: Error in mock flow:', error);
      return {
        state: AppFlowState.ERROR,
        shouldShowSplashAd: false,
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Mock flow error',
      };
    }
  }

  /**
   * 确定真实模式的应用流程
   */
  private async determineRealFlow(): Promise<AppFlowResult> {
    try {
      console.log('AppFlowManager: Using real flow');

      // 检查认证状态
      const isAuthenticated = await authService.isAuthenticated();
      console.log('AppFlowManager: Authentication status:', isAuthenticated);

      if (!isAuthenticated) {
        return {
          state: AppFlowState.LOGIN_REQUIRED,
          shouldShowSplashAd: false,
          isAuthenticated: false,
        };
      }

      // 获取用户信息
      const userInfo = await authService.getUserInfo();
      if (!userInfo) {
        console.warn('AppFlowManager: No user info available, requiring login');
        return {
          state: AppFlowState.LOGIN_REQUIRED,
          shouldShowSplashAd: false,
          isAuthenticated: false,
        };
      }

      // 检查开屏广告配置
      const shouldShowSplashAd = await this.shouldShowSplashAd();
      console.log('AppFlowManager: Should show splash ad:', shouldShowSplashAd);

      if (shouldShowSplashAd) {
        return {
          state: AppFlowState.SPLASH_AD,
          shouldShowSplashAd: true,
          isAuthenticated: true,
          userId: userInfo.userId,
        };
      } else {
        return {
          state: AppFlowState.MAIN_APP,
          shouldShowSplashAd: false,
          isAuthenticated: true,
          userId: userInfo.userId,
        };
      }

    } catch (error) {
      console.error('AppFlowManager: Error in real flow:', error);
      return {
        state: AppFlowState.ERROR,
        shouldShowSplashAd: false,
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Real flow error',
      };
    }
  }

  /**
   * 根据服务器配置检查是否应该显示开屏广告
   */
  private async shouldShowSplashAd(): Promise<boolean> {
    try {
      // 从服务器获取广告配置
      const adConfig = await configService.getAdConfig();

      if (!adConfig) {
        console.log('AppFlowManager: No ad config available, skipping splash ad');
        return false;
      }

      // 检查是否启用开屏广告
      const splashEnabled = adConfig.splashAdConfig?.enabled || false;
      console.log('AppFlowManager: Splash ad enabled in config:', splashEnabled);

      return splashEnabled;

    } catch (error) {
      console.error('AppFlowManager: Error checking splash ad config:', error);
      // 如果配置检查失败，默认不显示开屏广告
      return false;
    }
  }

  /**
   * 处理开屏广告完成
   */
  public async handleSplashAdComplete(): Promise<AppFlowResult> {
    try {
      console.log('AppFlowManager: Splash ad completed');

      // 开屏广告完成后，进入主应用
      const isMockMode = mockService.isMockModeEnabled();

      if (isMockMode) {
        const mockUser = mockService.generateMockUser();
        return {
          state: AppFlowState.MAIN_APP,
          shouldShowSplashAd: false,
          isAuthenticated: true,
          userId: mockUser.userId,
        };
      } else {
        const userInfo = await authService.getUserInfo();
        return {
          state: AppFlowState.MAIN_APP,
          shouldShowSplashAd: false,
          isAuthenticated: true,
          userId: userInfo?.userId,
        };
      }

    } catch (error) {
      console.error('AppFlowManager: Error handling splash ad completion:', error);
      return {
        state: AppFlowState.ERROR,
        shouldShowSplashAd: false,
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Splash ad completion error',
      };
    }
  }

  /**
   * 处理开屏广告跳过
   */
  public async handleSplashAdSkip(): Promise<AppFlowResult> {
    try {
      console.log('AppFlowManager: Splash ad skipped');

      // 跳过开屏广告后，进入主应用（与完成相同）
      return await this.handleSplashAdComplete();

    } catch (error) {
      console.error('AppFlowManager: Error handling splash ad skip:', error);
      return {
        state: AppFlowState.ERROR,
        shouldShowSplashAd: false,
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Splash ad skip error',
      };
    }
  }

  /**
   * 处理开屏广告错误
   */
  public async handleSplashAdError(error: Error): Promise<AppFlowResult> {
    try {
      console.log('AppFlowManager: Splash ad error:', error.message);

      // 开屏广告出错时，继续进入主应用（优雅降级）
      return await this.handleSplashAdComplete();

    } catch (handlingError) {
      console.error('AppFlowManager: Error handling splash ad error:', handlingError);
      return {
        state: AppFlowState.ERROR,
        shouldShowSplashAd: false,
        isAuthenticated: false,
        error: error.message,
      };
    }
  }

  /**
   * 处理登录完成
   */
  public async handleLoginComplete(): Promise<AppFlowResult> {
    try {
      console.log('AppFlowManager: Login completed, re-determining flow');

      // 登录后，重新确定流程（可能显示开屏广告）
      return await this.determineAppFlow();

    } catch (error) {
      console.error('AppFlowManager: Error handling login completion:', error);
      return {
        state: AppFlowState.ERROR,
        shouldShowSplashAd: false,
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Login completion error',
      };
    }
  }

  /**
   * 强制刷新应用流程（用于测试）
   */
  public async refreshAppFlow(): Promise<AppFlowResult> {
    console.log('AppFlowManager: Refreshing app flow');
    return await this.determineAppFlow();
  }

  /**
   * 获取当前流程状态用于调试
   */
  public async getFlowStatus(): Promise<{
    isInitialized: boolean;
    isMockMode: boolean;
    mockState?: MockUserState;
    isAuthenticated: boolean;
    hasAdConfig: boolean;
  }> {
    try {
      const isMockMode = mockService.isMockModeEnabled();
      const isAuthenticated = await authService.isAuthenticated();

      let hasAdConfig = false;
      try {
        const adConfig = await configService.getAdConfig();
        hasAdConfig = !!adConfig;
      } catch {
        hasAdConfig = false;
      }

      return {
        isInitialized: this.isInitialized,
        isMockMode,
        mockState: isMockMode ? mockService.getCurrentMockState() : undefined,
        isAuthenticated,
        hasAdConfig,
      };

    } catch (error) {
      console.error('AppFlowManager: Error getting flow status:', error);
      return {
        isInitialized: this.isInitialized,
        isMockMode: false,
        isAuthenticated: false,
        hasAdConfig: false,
      };
    }
  }

  /**
   * 切换模拟状态用于测试（仅开发环境）
   */
  public async toggleMockState(): Promise<MockUserState | null> {
    if (!ENV_CONFIG.DEBUG_MODE) {
      console.warn('AppFlowManager: Mock state toggle only available in debug mode');
      return null;
    }

    try {
      const newState = await mockService.toggleMockState();
      console.log('AppFlowManager: Mock state toggled to:', newState);
      return newState;
    } catch (error) {
      console.error('AppFlowManager: Error toggling mock state:', error);
      return null;
    }
  }
}

// 创建单例实例
const appFlowManager = new AppFlowManager();

export default appFlowManager;
export { AppFlowManager, AppFlowState };