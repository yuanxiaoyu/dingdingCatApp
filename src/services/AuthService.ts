// Import WeChat with proper error handling
let WeChat: any = null;
try {
  WeChat = require('react-native-wechat-lib');
} catch (error) {
  console.warn('WeChat SDK not available:', error);
  // Create a mock WeChat object for development
  WeChat = {
    registerApp: () => Promise.resolve(false),
    isWXAppInstalled: () => Promise.resolve(false),
    sendAuthRequest: () => Promise.reject(new Error('WeChat not available')),
  };
}
import apiClient from './apiClient';
import persistenceService from './PersistenceService';
import mockService from './MockService';
import { ENV_CONFIG } from '../config/env';
import { 
  User, 
  AuthTokens, 
  LoginRequest, 
  RegisterRequest, 
  LoginResponse,
  RefreshTokenRequest
} from '../types';

// Storage keys for secure token storage
const KEYCHAIN_SERVICE = 'DingDingCat';
const KEYCHAIN_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

// AsyncStorage keys for user data
const STORAGE_KEYS = {
  USER_INFO: '@dingdingcat/user_info',
  USER_ID: '@dingdingcat/user_id',
  LAST_LOGIN_TIME: '@dingdingcat/last_login_time',
} as const;



/**
 * Authentication Service
 * Handles WeChat login, user registration, token management
 */
class AuthService {
  private isWeChatRegistered = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Don't initialize WeChat in constructor to avoid blocking
    // Initialize lazily when needed
  }

  /**
   * Ensure WeChat is initialized (lazy initialization)
   */
  private async ensureWeChatInitialized(): Promise<void> {
    if (this.initializationPromise === null) {
      this.initializationPromise = this.initializeWeChat();
    }
    return this.initializationPromise;
  }

  /**
   * Initialize WeChat SDK
   */
  private async initializeWeChat(): Promise<void> {
    try {
      if (!ENV_CONFIG.WECHAT_APP_ID) {
        console.warn('WeChat App ID not configured');
        this.isWeChatRegistered = false;
        return;
      }

      // Check if WeChat SDK is available
      if (!WeChat || typeof WeChat.registerApp !== 'function') {
        console.warn('WeChat SDK is not properly initialized, using mock mode');
        this.isWeChatRegistered = false;
        return;
      }

      // Skip WeChat initialization in development if using placeholder ID
      if (ENV_CONFIG.WECHAT_APP_ID.includes('_dev_') || ENV_CONFIG.WECHAT_APP_ID.includes('_prod_')) {
        console.warn('Using placeholder WeChat App ID, skipping WeChat initialization');
        this.isWeChatRegistered = false;
        return;
      }

      // Add timeout for WeChat registration
      const registrationPromise = WeChat.registerApp(ENV_CONFIG.WECHAT_APP_ID, '');
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error('WeChat registration timeout')), 5000);
      });

      const isRegistered = await Promise.race([registrationPromise, timeoutPromise]);
      this.isWeChatRegistered = isRegistered;
      
      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('WeChat SDK initialized:', isRegistered);
      }
    } catch (error) {
      console.error('Failed to initialize WeChat SDK:', error);
      this.isWeChatRegistered = false;
    }
  }

  /**
   * Check if WeChat is installed and available
   */
  public async isWeChatAvailable(): Promise<boolean> {
    try {
      // Ensure WeChat is initialized first
      await this.ensureWeChatInitialized();

      // Check if WeChat SDK is available
      if (!WeChat || typeof WeChat.isWXAppInstalled !== 'function') {
        console.warn('WeChat SDK is not properly initialized');
        return false;
      }
      
      return await WeChat.isWXAppInstalled();
    } catch (error) {
      console.error('Error checking WeChat availability:', error);
      return false;
    }
  }

  /**
   * Initialize authentication service
   */
  public async initializeAuth(): Promise<boolean> {
    try {
      // Initialize WeChat SDK
      await this.ensureWeChatInitialized();

      // Check if user is already authenticated
      const isAuthenticated = await this.isAuthenticated();
      
      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('Auth service initialized, authenticated:', isAuthenticated);
      }

      return isAuthenticated;
    } catch (error) {
      console.error('Failed to initialize auth service:', error);
      return false;
    }
  }

  /**
   * Mock WeChat login for development
   */
  private async mockWeChatLogin(): Promise<LoginResponse> {
    console.log('Using mock WeChat login for development');
    
    // Return a mock user for development
    const mockUser: LoginResponse = {
      userId: 12345,
      userName: 'dev_user',
      nickName: '开发测试用户',
      avatar: 'https://via.placeholder.com/100',
      phoneNumber: '13800138000',
      email: 'dev@example.com',
      sex: '1',
      wechatOpenId: 'mock_openid_12345',
      registerChannel: 'wechat',
      appKey: ENV_CONFIG.APP_KEY,
      registerTime: new Date().toISOString(),
      lastLoginTime: new Date().toISOString(),
      accessToken: 'mock_access_token_' + Date.now(),
      tokenType: 'Bearer',
      expiresIn: 7200,
    };

    // Store mock auth data
    await this.storeAuthData(mockUser);
    return mockUser;
  }

  /**
   * Get WeChat authorization code
   */
  private async getWeChatAuthCode(): Promise<string> {
    if (!this.isWeChatRegistered) {
      throw new Error('WeChat SDK not initialized');
    }

    const isInstalled = await this.isWeChatAvailable();
    if (!isInstalled) {
      throw new Error('WeChat is not installed');
    }

    // Check if WeChat SDK is available
    if (!WeChat || typeof WeChat.sendAuthRequest !== 'function') {
      throw new Error('WeChat SDK is not properly initialized');
    }

    try {
      const response = await WeChat.sendAuthRequest('snsapi_userinfo', 'dingdingcat_auth');
      
      if (response.errCode !== 0) {
        throw new Error(`WeChat auth failed: ${response.errStr}`);
      }

      if (!response.code) {
        throw new Error('No authorization code received from WeChat');
      }

      return response.code;
    } catch (error) {
      console.error('WeChat authorization error:', error);
      throw new Error('Failed to get WeChat authorization');
    }
  }

  /**
   * Generate random nickname in user_xxxx format
   */
  private generateRandomNickname(): string {
    const randomSuffix = Math.random().toString(36).substr(2, 4);
    return `user_${randomSuffix}`;
  }

  /**
   * WeChat login flow
   */
  public async wechatLogin(): Promise<LoginResponse> {
    try {
      // Check if mock mode is enabled via environment variable
      if (ENV_CONFIG.MOCK_ENABLED) {
        console.log('Using mock WeChat login (env controlled)');
        return this.mockWeChatLogin();
      }

      // Ensure WeChat is initialized first
      await this.ensureWeChatInitialized();

      // In development mode with placeholder WeChat ID, return mock login
      if (ENV_CONFIG.DEBUG_MODE && (ENV_CONFIG.WECHAT_APP_ID.includes('_dev_') || ENV_CONFIG.WECHAT_APP_ID.includes('_prod_'))) {
        console.warn('Using mock WeChat login for development');
        return this.mockWeChatLogin();
      }

      // Step 1: Get WeChat authorization code
      const authCode = await this.getWeChatAuthCode();

      // Step 2: Call login API
      const loginRequest: LoginRequest = {
        appKey: ENV_CONFIG.APP_KEY,
        code: authCode,
      };

      try {
        const response = await apiClient.post<LoginResponse>('/auth/wechat/login', loginRequest);
        
        if (response.code === 200 && response.data) {
          // Login successful - store tokens and user info
          await this.storeAuthData(response.data);
          return response.data;
        } else {
          throw new Error(response.message || 'Login failed');
        }
      } catch (loginError: any) {
        // Check if user doesn't exist (should auto-register)
        if (loginError.code === 404 || loginError.message?.includes('用户不存在')) {
          if (ENV_CONFIG.DEBUG_MODE) {
            console.log('User not found, attempting auto-registration...');
          }
          
          // Auto-register new user
          return await this.autoRegister(authCode);
        } else {
          throw loginError;
        }
      }
    } catch (error: any) {
      console.error('WeChat login error:', error);
      throw error;
    }
  }

  /**
   * Auto-register new user with WeChat info
   */
  public async autoRegister(request: RegisterRequest | string): Promise<LoginResponse> {
    // Handle both old string parameter and new RegisterRequest parameter
    const authCode = typeof request === 'string' ? request : request.code;
    try {
      const registerRequest: RegisterRequest = {
        appKey: ENV_CONFIG.APP_KEY,
        code: authCode,
        nickName: this.generateRandomNickname(), // Generate random nickname
      };

      const response = await apiClient.post<User>('/auth/wechat/register', registerRequest);
      
      if (response.code === 200 && response.data) {
        // Registration successful, now login
        const loginRequest: LoginRequest = {
          appKey: ENV_CONFIG.APP_KEY,
          code: authCode,
        };

        const loginResponse = await apiClient.post<LoginResponse>('/auth/wechat/login', loginRequest);
        
        if (loginResponse.code === 200 && loginResponse.data) {
          await this.storeAuthData(loginResponse.data);
          return loginResponse.data;
        } else {
          throw new Error('Auto-login after registration failed');
        }
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Auto-registration error:', error);
      throw new Error(error.message || 'Auto-registration failed');
    }
  }

  /**
   * Store authentication data securely
   */
  private async storeAuthData(loginData: LoginResponse): Promise<void> {
    try {
      // Store tokens securely using persistence service
      await persistenceService.storeAccessToken(loginData.accessToken);
      if (loginData.refreshToken) {
        await persistenceService.storeRefreshToken(loginData.refreshToken);
      }

      // Store user info using persistence service
      const userInfo: User = {
        userId: loginData.userId,
        userName: loginData.userName,
        nickName: loginData.nickName,
        avatar: loginData.avatar,
        phoneNumber: loginData.phoneNumber || undefined,
        email: loginData.email || undefined,
        sex: loginData.sex || undefined,
        wechatOpenId: loginData.wechatOpenId,
        registerChannel: loginData.registerChannel || undefined,
        appKey: loginData.appKey,
        registerTime: loginData.registerTime || undefined,
        lastLoginTime: loginData.lastLoginTime || undefined,
      };

      await Promise.all([
        persistenceService.storeUserData('user_info', userInfo),
        persistenceService.storeUserData('user_id', loginData.userId.toString()),
        persistenceService.storeUserData('last_login_time', new Date().toISOString()),
        // Also store in apiClient for immediate use
        apiClient.storeTokens({
          accessToken: loginData.accessToken,
          refreshToken: loginData.refreshToken,
          tokenType: loginData.tokenType,
          expiresIn: loginData.expiresIn,
        }),
        apiClient.storeUserId(loginData.userId.toString()),
      ]);

      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('Auth data stored successfully');
      }
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw new Error('Failed to store authentication data');
    }
  }

  /**
   * Get stored tokens using persistence service
   */
  private async getStoredTokensSecurely(): Promise<AuthTokens | null> {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        persistenceService.getAccessToken(),
        persistenceService.getRefreshToken(),
      ]);

      if (accessToken) {
        return {
          accessToken,
          refreshToken: refreshToken || undefined,
          tokenType: 'Bearer',
          expiresIn: 1800, // Default expiry
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting tokens from persistence service:', error);
      return null;
    }
  }

  /**
   * Refresh access token
   */
  public async refreshToken(request?: RefreshTokenRequest): Promise<string | null> {
    try {
      const storedTokens = await this.getStoredTokensSecurely();
      const userId = await persistenceService.getUserData<string>('user_id');

      if (!storedTokens?.refreshToken || !userId) {
        throw new Error('No refresh token or user ID available');
      }

      const refreshRequest = {
        appKey: ENV_CONFIG.APP_KEY,
        refreshToken: storedTokens.refreshToken,
        userId: userId,
      };

      const response = await apiClient.post<LoginResponse>('/auth/refresh', refreshRequest);

      if (response.code === 200 && response.data) {
        // Store new tokens using persistence service
        await persistenceService.storeAccessToken(response.data.accessToken);
        if (response.data.refreshToken) {
          await persistenceService.storeRefreshToken(response.data.refreshToken);
        }

        // Also update apiClient
        const newTokens: AuthTokens = {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken || storedTokens.refreshToken,
          tokenType: response.data.tokenType,
          expiresIn: response.data.expiresIn,
        };
        await apiClient.storeTokens(newTokens);

        return response.data.accessToken;
      }

      throw new Error('Token refresh failed');
    } catch (error: any) {
      console.error('Token refresh error:', error);
      // If refresh fails, clear stored tokens
      await this.clearStoredTokens();
      return null;
    }
  }

  /**
   * User logout
   */
  public async logout(): Promise<void> {
    try {
      // Call logout API if authenticated
      const isAuthenticated = await this.isAuthenticated();
      if (isAuthenticated) {
        try {
          await apiClient.post('/auth/logout');
        } catch (error) {
          // Continue with local logout even if API call fails
          console.warn('Logout API call failed:', error);
        }
      }

      // Clear all stored data
      await this.clearStoredTokens();
      
      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('User logged out successfully');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local data even if there's an error
      await this.clearStoredTokens();
      // Don't throw error for logout - always succeed locally
    }
  }

  /**
   * Clear all stored authentication data
   */
  private async clearStoredTokens(): Promise<void> {
    try {
      await Promise.all([
        // Clear user data using persistence service
        persistenceService.clearUserData(),
        // Clear apiClient tokens
        apiClient.clearStoredTokens(),
      ]);
    } catch (error) {
      console.error('Error clearing stored tokens:', error);
    }
  }

  /**
   * Get current user information
   */
  public async getUserInfo(): Promise<User | null> {
    try {
      const userInfo = await persistenceService.getUserData<User>('user_info');
      if (userInfo) {
        return userInfo;
      }

      // If no local user info, try to fetch from API
      const isAuthenticated = await this.isAuthenticated();
      if (isAuthenticated) {
        try {
          const response = await apiClient.get<User>('/auth/userInfo');
          if (response.code === 200 && response.data) {
            // Store fetched user info locally
            await persistenceService.storeUserData('user_info', response.data);
            return response.data;
          }
        } catch (error) {
          console.error('Error fetching user info from API:', error);
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  public async isAuthenticated(): Promise<boolean> {
    try {
      // If mock mode is enabled, use environment variable
      if (ENV_CONFIG.MOCK_ENABLED) {
        const shouldBeLoggedIn = ENV_CONFIG.MOCK_USER_STATE === 1;
        console.log('Auth check (mock mode):', {
          mockEnabled: ENV_CONFIG.MOCK_ENABLED,
          mockUserState: ENV_CONFIG.MOCK_USER_STATE,
          shouldBeLoggedIn,
        });
        
        // Simply return the environment variable state without generating data
        // Data will be generated when actually needed (e.g., during login flow)
        return shouldBeLoggedIn;
      }

      // Check if we have stored tokens
      const storedTokens = await this.getStoredTokensSecurely();
      if (!storedTokens?.accessToken) {
        return false;
      }

      // Also check apiClient authentication status
      return await apiClient.isAuthenticated();
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }

  /**
   * Get current access token
   */
  public async getAccessToken(): Promise<string | null> {
    try {
      const storedTokens = await this.getStoredTokensSecurely();
      return storedTokens?.accessToken || null;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Update user profile information
   */
  public async updateUserInfo(updates: Partial<User>): Promise<User | null> {
    try {
      const currentUser = await this.getUserInfo();
      if (!currentUser) {
        throw new Error('No current user found');
      }

      const updatedUser = { ...currentUser, ...updates };
      await persistenceService.storeUserData('user_info', updatedUser);
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user info:', error);
      return null;
    }
  }

  /**
   * Get last login time
   */
  public async getLastLoginTime(): Promise<string | null> {
    try {
      return await persistenceService.getUserData<string>('last_login_time');
    } catch (error) {
      console.error('Error getting last login time:', error);
      return null;
    }
  }

  /**
   * Check if tokens need refresh (called by apiClient)
   */
  public async shouldRefreshToken(): Promise<boolean> {
    try {
      const lastLoginTime = await this.getLastLoginTime();
      if (!lastLoginTime) {
        return false;
      }

      const lastLogin = new Date(lastLoginTime);
      const now = new Date();
      const timeDiff = now.getTime() - lastLogin.getTime();
      
      // Refresh if token is older than 25 minutes (5 minutes before expiry)
      return timeDiff > (25 * 60 * 1000);
    } catch (error) {
      console.error('Error checking token refresh need:', error);
      return false;
    }
  }

  /**
   * Initialize authentication on app start
   */
  public async initializeAuth(): Promise<boolean> {
    try {
      const isAuthenticated = await this.isAuthenticated();
      
      if (isAuthenticated) {
        // Check if token needs refresh
        const shouldRefresh = await this.shouldRefreshToken();
        if (shouldRefresh) {
          const newToken = await this.refreshToken();
          return !!newToken;
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error initializing auth:', error);
      return false;
    }
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
export { AuthService };