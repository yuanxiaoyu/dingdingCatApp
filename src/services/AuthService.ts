import * as WeChat from 'react-native-wechat-lib';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';
import { ENV_CONFIG } from '../config/env';
import { 
  User, 
  AuthTokens, 
  LoginRequest, 
  RegisterRequest, 
  LoginResponse
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

  constructor() {
    this.initializeWeChat();
  }

  /**
   * Initialize WeChat SDK
   */
  private async initializeWeChat(): Promise<void> {
    try {
      if (!ENV_CONFIG.WECHAT_APP_ID) {
        console.warn('WeChat App ID not configured');
        return;
      }

      const isRegistered = await WeChat.registerApp(ENV_CONFIG.WECHAT_APP_ID, '');
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
      return await WeChat.isWXAppInstalled();
    } catch (error) {
      console.error('Error checking WeChat availability:', error);
      return false;
    }
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
  public async autoRegister(authCode: string): Promise<LoginResponse> {
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
      // Store tokens securely in Keychain
      const tokens: AuthTokens = {
        accessToken: loginData.accessToken,
        tokenType: loginData.tokenType,
        expiresIn: loginData.expiresIn,
      };

      await this.storeTokensSecurely(tokens);

      // Store user info in AsyncStorage
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
        AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo)),
        AsyncStorage.setItem(STORAGE_KEYS.USER_ID, loginData.userId.toString()),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_LOGIN_TIME, new Date().toISOString()),
        // Also store in apiClient for immediate use
        apiClient.storeTokens(tokens),
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
   * Store tokens securely using Keychain
   */
  private async storeTokensSecurely(tokens: AuthTokens): Promise<void> {
    try {
      await Promise.all([
        Keychain.setInternetCredentials(
          KEYCHAIN_KEYS.ACCESS_TOKEN,
          KEYCHAIN_KEYS.ACCESS_TOKEN,
          tokens.accessToken,
          {
            service: KEYCHAIN_SERVICE,
            accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE,
            accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          }
        ),
        tokens.refreshToken ? Keychain.setInternetCredentials(
          KEYCHAIN_KEYS.REFRESH_TOKEN,
          KEYCHAIN_KEYS.REFRESH_TOKEN,
          tokens.refreshToken,
          {
            service: KEYCHAIN_SERVICE,
            accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE,
            accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          }
        ) : Promise.resolve(),
      ]);
    } catch (error) {
      console.error('Error storing tokens in Keychain:', error);
      // Fallback to AsyncStorage if Keychain fails
      await apiClient.storeTokens(tokens);
    }
  }

  /**
   * Get stored tokens from Keychain
   */
  private async getStoredTokensSecurely(): Promise<AuthTokens | null> {
    try {
      const [accessTokenResult, refreshTokenResult] = await Promise.all([
        Keychain.getInternetCredentials(KEYCHAIN_KEYS.ACCESS_TOKEN),
        Keychain.getInternetCredentials(KEYCHAIN_KEYS.REFRESH_TOKEN).catch(() => null),
      ]);

      if (accessTokenResult && accessTokenResult.password) {
        return {
          accessToken: accessTokenResult.password,
          refreshToken: refreshTokenResult && refreshTokenResult.password ? refreshTokenResult.password : undefined,
          tokenType: 'Bearer',
          expiresIn: 1800, // Default expiry
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting tokens from Keychain:', error);
      return null;
    }
  }

  /**
   * Refresh access token
   */
  public async refreshToken(): Promise<string | null> {
    try {
      const storedTokens = await this.getStoredTokensSecurely();
      const userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);

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
        // Store new tokens
        const newTokens: AuthTokens = {
          accessToken: response.data.accessToken,
          refreshToken: storedTokens.refreshToken, // Keep existing refresh token
          tokenType: response.data.tokenType,
          expiresIn: response.data.expiresIn,
        };

        await this.storeTokensSecurely(newTokens);
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
        // Clear Keychain
        Keychain.resetInternetCredentials(KEYCHAIN_KEYS.ACCESS_TOKEN).catch(() => {}),
        Keychain.resetInternetCredentials(KEYCHAIN_KEYS.REFRESH_TOKEN).catch(() => {}),
        // Clear AsyncStorage
        AsyncStorage.removeItem(STORAGE_KEYS.USER_INFO),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_ID),
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_LOGIN_TIME),
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
      const userInfoStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_INFO);
      if (userInfoStr) {
        return JSON.parse(userInfoStr) as User;
      }

      // If no local user info, try to fetch from API
      const isAuthenticated = await this.isAuthenticated();
      if (isAuthenticated) {
        try {
          const response = await apiClient.get<User>('/auth/userInfo');
          if (response.code === 200 && response.data) {
            // Store fetched user info locally
            await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(response.data));
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
      await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(updatedUser));
      
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
      return await AsyncStorage.getItem(STORAGE_KEYS.LAST_LOGIN_TIME);
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