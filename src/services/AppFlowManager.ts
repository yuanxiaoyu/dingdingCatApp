import authService from './AuthService';
import configService from './ConfigService';
import mockService, { MockUserState } from './MockService';
import { ENV_CONFIG } from '../config/env';

// App flow states
export enum AppFlowState {
  INITIALIZING = 'INITIALIZING',
  SPLASH_AD = 'SPLASH_AD',
  LOGIN_REQUIRED = 'LOGIN_REQUIRED',
  MAIN_APP = 'MAIN_APP',
  ERROR = 'ERROR',
}

// App flow result
export interface AppFlowResult {
  state: AppFlowState;
  shouldShowSplashAd: boolean;
  isAuthenticated: boolean;
  userId?: number;
  error?: string;
}

/**
 * AppFlowManager - Manages the application flow based on authentication and configuration
 * 
 * Flow Logic:
 * 1. Check authentication status
 * 2. If not authenticated -> LOGIN_REQUIRED
 * 3. If authenticated -> Check splash ad configuration
 * 4. If splash ad enabled -> SPLASH_AD
 * 5. If splash ad disabled or completed -> MAIN_APP
 */
class AppFlowManager {
  private isInitialized = false;

  /**
   * Initialize the app flow manager
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize mock service if in development
      if (ENV_CONFIG.DEBUG_MODE) {
        await mockService.initialize();
      }

      this.isInitialized = true;

      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('AppFlowManager initialized');
      }
    } catch (error) {
      console.error('Failed to initialize AppFlowManager:', error);
      this.isInitialized = true; // Continue even if initialization fails
    }
  }

  /**
   * Determine the current app flow state
   */
  public async determineAppFlow(): Promise<AppFlowResult> {
    try {
      console.log('AppFlowManager: Determining app flow...');

      // Ensure manager is initialized
      await this.initialize();

      // Check if mock mode is enabled
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
   * Determine app flow for mock mode
   */
  private async determineMockFlow(): Promise<AppFlowResult> {
    try {
      console.log('AppFlowManager: Using mock flow');

      // Get mock state from environment variable
      const mockState = mockService.getCurrentMockStateFromEnv();
      const envConfig = mockService.getEnvConfig();
      
      console.log('AppFlowManager: Mock state from env:', {
        mockState,
        envConfig,
      });

      // Handle different mock states based on environment variable
      if (envConfig.mockUserState === 0) {
        // 未登录状态
        return {
          state: AppFlowState.LOGIN_REQUIRED,
          shouldShowSplashAd: false,
          isAuthenticated: false,
        };
      } else {
        // 登录状态 (envConfig.mockUserState === 1)
        // Check if splash ad should be shown
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
   * Determine app flow for real mode
   */
  private async determineRealFlow(): Promise<AppFlowResult> {
    try {
      console.log('AppFlowManager: Using real flow');

      // Check authentication status
      const isAuthenticated = await authService.isAuthenticated();
      console.log('AppFlowManager: Authentication status:', isAuthenticated);

      if (!isAuthenticated) {
        return {
          state: AppFlowState.LOGIN_REQUIRED,
          shouldShowSplashAd: false,
          isAuthenticated: false,
        };
      }

      // Get user info
      const userInfo = await authService.getUserInfo();
      if (!userInfo) {
        console.warn('AppFlowManager: No user info available, requiring login');
        return {
          state: AppFlowState.LOGIN_REQUIRED,
          shouldShowSplashAd: false,
          isAuthenticated: false,
        };
      }

      // Check splash ad configuration
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
   * Check if splash ad should be shown based on server configuration
   */
  private async shouldShowSplashAd(): Promise<boolean> {
    try {
      // Get ad configuration from server
      const adConfig = await configService.getAdConfig();
      
      if (!adConfig) {
        console.log('AppFlowManager: No ad config available, skipping splash ad');
        return false;
      }

      // Check if splash ads are enabled
      const splashEnabled = adConfig.splashAdConfig?.enabled || false;
      console.log('AppFlowManager: Splash ad enabled in config:', splashEnabled);

      return splashEnabled;

    } catch (error) {
      console.error('AppFlowManager: Error checking splash ad config:', error);
      // Default to not showing splash ad if config check fails
      return false;
    }
  }

  /**
   * Handle splash ad completion
   */
  public async handleSplashAdComplete(): Promise<AppFlowResult> {
    try {
      console.log('AppFlowManager: Splash ad completed');

      // After splash ad completion, go to main app
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
   * Handle splash ad skip
   */
  public async handleSplashAdSkip(): Promise<AppFlowResult> {
    try {
      console.log('AppFlowManager: Splash ad skipped');

      // After splash ad skip, go to main app (same as completion)
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
   * Handle splash ad error
   */
  public async handleSplashAdError(error: Error): Promise<AppFlowResult> {
    try {
      console.log('AppFlowManager: Splash ad error:', error.message);

      // On splash ad error, continue to main app (graceful degradation)
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
   * Handle login completion
   */
  public async handleLoginComplete(): Promise<AppFlowResult> {
    try {
      console.log('AppFlowManager: Login completed, re-determining flow');

      // After login, re-determine the flow (might show splash ad)
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
   * Force refresh app flow (useful for testing)
   */
  public async refreshAppFlow(): Promise<AppFlowResult> {
    console.log('AppFlowManager: Refreshing app flow');
    return await this.determineAppFlow();
  }

  /**
   * Get current flow status for debugging
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
   * Toggle mock state for testing (development only)
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

// Create singleton instance
const appFlowManager = new AppFlowManager();

export default appFlowManager;
export { AppFlowManager, AppFlowState };