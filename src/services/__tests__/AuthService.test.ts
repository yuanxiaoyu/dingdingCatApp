// Mock dependencies before importing
jest.mock('react-native-wechat-lib', () => ({
  registerApp: jest.fn(),
  isWXAppInstalled: jest.fn(),
  sendAuthRequest: jest.fn(),
}));

jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn(),
  getInternetCredentials: jest.fn(),
  resetInternetCredentials: jest.fn(),
  ACCESS_CONTROL: {
    BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE: 'BiometryCurrentSetOrDevicePasscode',
  },
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WhenUnlockedThisDeviceOnly',
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../apiClient', () => ({
  post: jest.fn(),
  get: jest.fn(),
  storeTokens: jest.fn(),
  storeUserId: jest.fn(),
  clearStoredTokens: jest.fn(),
  isAuthenticated: jest.fn(),
}));

import { AuthService } from '../AuthService';
import * as WeChat from 'react-native-wechat-lib';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../apiClient';
import { ENV_CONFIG } from '../../config/env';

const mockWeChat = WeChat as jest.Mocked<typeof WeChat>;
const mockKeychain = Keychain as jest.Mocked<typeof Keychain>;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  describe('WeChat Integration', () => {
    it('should initialize WeChat SDK successfully', async () => {
      mockWeChat.registerApp.mockResolvedValue(true);
      
      const service = new AuthService();
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockWeChat.registerApp).toHaveBeenCalledWith(ENV_CONFIG.WECHAT_APP_ID, '');
    });

    it('should check WeChat availability', async () => {
      mockWeChat.isWXAppInstalled.mockResolvedValue(true);
      
      const isAvailable = await authService.isWeChatAvailable();
      
      expect(isAvailable).toBe(true);
      expect(mockWeChat.isWXAppInstalled).toHaveBeenCalled();
    });

    it('should handle WeChat not installed', async () => {
      mockWeChat.isWXAppInstalled.mockResolvedValue(false);
      
      const isAvailable = await authService.isWeChatAvailable();
      
      expect(isAvailable).toBe(false);
    });
  });

  describe('WeChat Login Flow', () => {
    beforeEach(() => {
      mockWeChat.registerApp.mockResolvedValue(true);
      mockWeChat.isWXAppInstalled.mockResolvedValue(true);
    });

    it('should perform successful WeChat login', async () => {
      const mockAuthCode = 'wx_auth_code_123';
      const mockLoginResponse = {
        code: 200,
        message: 'Login successful',
        data: {
          accessToken: 'access_token_123',
          tokenType: 'Bearer',
          expiresIn: 1800,
          userId: 1001,
          userName: 'wx_user123',
          nickName: 'Test User',
          avatar: 'https://example.com/avatar.jpg',
          appKey: ENV_CONFIG.APP_KEY,
          wechatOpenId: 'openid_123',
        },
      };

      mockWeChat.sendAuthRequest.mockResolvedValue({
        errCode: 0,
        errStr: 'success',
        code: mockAuthCode,
      });

      mockApiClient.post.mockResolvedValue(mockLoginResponse);
      mockKeychain.setInternetCredentials.mockResolvedValue(true);
      mockAsyncStorage.setItem.mockResolvedValue();
      mockApiClient.storeTokens.mockResolvedValue();
      mockApiClient.storeUserId.mockResolvedValue();

      const result = await authService.wechatLogin();

      expect(result).toEqual(mockLoginResponse.data);
      expect(mockWeChat.sendAuthRequest).toHaveBeenCalledWith('snsapi_userinfo', 'dingdingcat_auth');
      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/wechat/login', {
        appKey: ENV_CONFIG.APP_KEY,
        code: mockAuthCode,
      });
    });

    it('should auto-register when user does not exist', async () => {
      const mockAuthCode = 'wx_auth_code_123';
      const mockRegisterResponse = {
        code: 200,
        message: 'Registration successful',
        data: {
          userId: 1002,
          userName: 'wx_user124',
          nickName: 'user_abcd',
          avatar: 'https://example.com/avatar.jpg',
          appKey: ENV_CONFIG.APP_KEY,
          wechatOpenId: 'openid_124',
        },
      };
      const mockLoginResponse = {
        code: 200,
        message: 'Login successful',
        data: {
          accessToken: 'access_token_124',
          tokenType: 'Bearer',
          expiresIn: 1800,
          ...mockRegisterResponse.data,
        },
      };

      mockWeChat.sendAuthRequest.mockResolvedValue({
        errCode: 0,
        errStr: 'success',
        code: mockAuthCode,
      });

      // First login call fails (user not found)
      mockApiClient.post
        .mockRejectedValueOnce({ code: 404, message: '用户不存在' })
        .mockResolvedValueOnce(mockRegisterResponse) // Register call
        .mockResolvedValueOnce(mockLoginResponse); // Second login call

      mockKeychain.setInternetCredentials.mockResolvedValue(true);
      mockAsyncStorage.setItem.mockResolvedValue();
      mockApiClient.storeTokens.mockResolvedValue();
      mockApiClient.storeUserId.mockResolvedValue();

      const result = await authService.wechatLogin();

      expect(result).toEqual(mockLoginResponse.data);
      expect(mockApiClient.post).toHaveBeenCalledTimes(3); // login, register, login
      expect(mockApiClient.post).toHaveBeenNthCalledWith(2, '/auth/wechat/register', {
        appKey: ENV_CONFIG.APP_KEY,
        code: mockAuthCode,
        nickName: expect.stringMatching(/^user_[a-z0-9]{4}$/),
      });
    });

    it('should handle WeChat authorization failure', async () => {
      mockWeChat.sendAuthRequest.mockResolvedValue({
        errCode: -2,
        errStr: 'User cancelled',
        code: null,
      });

      await expect(authService.wechatLogin()).rejects.toThrow('Failed to get WeChat authorization');
    });

    it('should handle WeChat not installed', async () => {
      mockWeChat.isWXAppInstalled.mockResolvedValue(false);

      await expect(authService.wechatLogin()).rejects.toThrow('WeChat is not installed');
    });
  });

  describe('Token Management', () => {
    it('should store tokens securely in Keychain', async () => {
      const mockTokens = {
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_123',
        tokenType: 'Bearer',
        expiresIn: 1800,
      };

      mockKeychain.setInternetCredentials.mockResolvedValue(true);

      // Use reflection to access private method for testing
      const storeTokensSecurely = (authService as any).storeTokensSecurely.bind(authService);
      await storeTokensSecurely(mockTokens);

      expect(mockKeychain.setInternetCredentials).toHaveBeenCalledTimes(2);
      expect(mockKeychain.setInternetCredentials).toHaveBeenCalledWith(
        'access_token',
        'access_token',
        'access_token_123',
        expect.objectContaining({
          service: 'DingDingCat',
        })
      );
    });

    it('should fallback to AsyncStorage if Keychain fails', async () => {
      const mockTokens = {
        accessToken: 'access_token_123',
        tokenType: 'Bearer',
        expiresIn: 1800,
      };

      mockKeychain.setInternetCredentials.mockRejectedValue(new Error('Keychain error'));
      mockApiClient.storeTokens.mockResolvedValue();

      const storeTokensSecurely = (authService as any).storeTokensSecurely.bind(authService);
      await storeTokensSecurely(mockTokens);

      expect(mockApiClient.storeTokens).toHaveBeenCalledWith(mockTokens);
    });

    it('should refresh access token successfully', async () => {
      const mockRefreshResponse = {
        code: 200,
        message: 'Token refreshed',
        data: {
          accessToken: 'new_access_token',
          tokenType: 'Bearer',
          expiresIn: 1800,
          userId: 1001,
          userName: 'wx_user123',
          nickName: 'Test User',
          avatar: 'https://example.com/avatar.jpg',
          appKey: ENV_CONFIG.APP_KEY,
        },
      };

      mockKeychain.getInternetCredentials
        .mockResolvedValueOnce({ username: 'access_token', password: 'old_access_token' })
        .mockResolvedValueOnce({ username: 'refresh_token', password: 'refresh_token_123' });
      
      mockAsyncStorage.getItem.mockResolvedValue('1001');
      mockApiClient.post.mockResolvedValue(mockRefreshResponse);
      mockKeychain.setInternetCredentials.mockResolvedValue(true);
      mockApiClient.storeTokens.mockResolvedValue();

      const newToken = await authService.refreshToken();

      expect(newToken).toBe('new_access_token');
      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/refresh', {
        appKey: ENV_CONFIG.APP_KEY,
        refreshToken: 'refresh_token_123',
        userId: '1001',
      });
    });

    it('should clear tokens on refresh failure', async () => {
      mockKeychain.getInternetCredentials.mockResolvedValue({ username: 'refresh_token', password: 'refresh_token_123' });
      mockAsyncStorage.getItem.mockResolvedValue('1001');
      mockApiClient.post.mockRejectedValue(new Error('Refresh failed'));
      mockKeychain.resetInternetCredentials.mockResolvedValue(true);
      mockAsyncStorage.removeItem.mockResolvedValue();
      mockApiClient.clearStoredTokens.mockResolvedValue();

      const newToken = await authService.refreshToken();

      expect(newToken).toBeNull();
      expect(mockKeychain.resetInternetCredentials).toHaveBeenCalled();
      expect(mockAsyncStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('User Information', () => {
    it('should get user info from local storage', async () => {
      const mockUser = {
        userId: 1001,
        userName: 'wx_user123',
        nickName: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
        appKey: ENV_CONFIG.APP_KEY,
        wechatOpenId: 'openid_123',
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockUser));

      const userInfo = await authService.getUserInfo();

      expect(userInfo).toEqual(mockUser);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@dingdingcat/user_info');
    });

    it('should fetch user info from API if not in local storage', async () => {
      const mockUser = {
        userId: 1001,
        userName: 'wx_user123',
        nickName: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
        appKey: ENV_CONFIG.APP_KEY,
        wechatOpenId: 'openid_123',
      };

      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockApiClient.isAuthenticated.mockResolvedValue(true);
      mockApiClient.get.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: mockUser,
      });
      mockAsyncStorage.setItem.mockResolvedValue();

      const userInfo = await authService.getUserInfo();

      expect(userInfo).toEqual(mockUser);
      expect(mockApiClient.get).toHaveBeenCalledWith('/auth/userInfo');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('@dingdingcat/user_info', JSON.stringify(mockUser));
    });

    it('should update user info locally', async () => {
      const mockUser = {
        userId: 1001,
        userName: 'wx_user123',
        nickName: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
        appKey: ENV_CONFIG.APP_KEY,
        wechatOpenId: 'openid_123',
      };

      const updates = { nickName: 'Updated User' };
      const expectedUpdatedUser = { ...mockUser, ...updates };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockUser));
      mockAsyncStorage.setItem.mockResolvedValue();

      const updatedUser = await authService.updateUserInfo(updates);

      expect(updatedUser).toEqual(expectedUpdatedUser);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('@dingdingcat/user_info', JSON.stringify(expectedUpdatedUser));
    });
  });

  describe('Authentication Status', () => {
    it('should check authentication status correctly', async () => {
      mockKeychain.getInternetCredentials.mockResolvedValue({ username: 'access_token', password: 'access_token_123' });
      mockApiClient.isAuthenticated.mockResolvedValue(true);

      const isAuthenticated = await authService.isAuthenticated();

      expect(isAuthenticated).toBe(true);
    });

    it('should return false when no tokens stored', async () => {
      mockKeychain.getInternetCredentials.mockResolvedValue(false);

      const isAuthenticated = await authService.isAuthenticated();

      expect(isAuthenticated).toBe(false);
    });

    it('should initialize auth and refresh token if needed', async () => {
      const pastTime = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 minutes ago
      
      // Mock isAuthenticated to return true
      mockKeychain.getInternetCredentials.mockResolvedValue({ username: 'access_token', password: 'access_token_123' });
      mockApiClient.isAuthenticated.mockResolvedValue(true);
      
      // Mock shouldRefreshToken to return true
      mockAsyncStorage.getItem.mockResolvedValue(pastTime); // last login time
      
      // Mock refreshToken to succeed
      mockKeychain.getInternetCredentials
        .mockResolvedValueOnce({ username: 'access_token', password: 'access_token_123' })
        .mockResolvedValueOnce({ username: 'refresh_token', password: 'refresh_token_123' });
      
      mockAsyncStorage.getItem
        .mockResolvedValueOnce(pastTime) // for shouldRefreshToken
        .mockResolvedValueOnce('1001'); // for refreshToken userId
      
      mockApiClient.post.mockResolvedValue({
        code: 200,
        data: {
          accessToken: 'new_access_token',
          tokenType: 'Bearer',
          expiresIn: 1800,
        },
      });
      
      mockKeychain.setInternetCredentials.mockResolvedValue(true);
      mockApiClient.storeTokens.mockResolvedValue();

      const result = await authService.initializeAuth();

      expect(result).toBe(true);
      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/refresh', expect.any(Object));
    });
  });

  describe('Logout', () => {
    it('should logout successfully', async () => {
      mockKeychain.getInternetCredentials.mockResolvedValue({ username: 'access_token', password: 'access_token_123' });
      mockApiClient.isAuthenticated.mockResolvedValue(true);
      mockApiClient.post.mockResolvedValue({ code: 200, message: 'Logout successful' });
      mockKeychain.resetInternetCredentials.mockResolvedValue(true);
      mockAsyncStorage.removeItem.mockResolvedValue();
      mockApiClient.clearStoredTokens.mockResolvedValue();

      await authService.logout();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(mockKeychain.resetInternetCredentials).toHaveBeenCalled();
      expect(mockAsyncStorage.removeItem).toHaveBeenCalled();
      expect(mockApiClient.clearStoredTokens).toHaveBeenCalled();
    });

    it('should clear local data even if API call fails', async () => {
      mockKeychain.getInternetCredentials.mockResolvedValue({ username: 'access_token', password: 'access_token_123' });
      mockApiClient.isAuthenticated.mockResolvedValue(true);
      mockApiClient.post.mockRejectedValue(new Error('API error'));
      mockKeychain.resetInternetCredentials.mockResolvedValue(true);
      mockAsyncStorage.removeItem.mockResolvedValue();
      mockApiClient.clearStoredTokens.mockResolvedValue();

      await authService.logout(); // Should not throw
      
      // Should still clear local data
      expect(mockKeychain.resetInternetCredentials).toHaveBeenCalled();
      expect(mockAsyncStorage.removeItem).toHaveBeenCalled();
      expect(mockApiClient.clearStoredTokens).toHaveBeenCalled();
    });
  });

  describe('Utility Methods', () => {
    it('should generate random nickname in correct format', () => {
      // Access private method for testing
      const generateRandomNickname = (authService as any).generateRandomNickname.bind(authService);
      const nickname = generateRandomNickname();

      expect(nickname).toMatch(/^user_[a-z0-9]{4}$/);
    });

    it('should get access token from Keychain', async () => {
      mockKeychain.getInternetCredentials.mockResolvedValue({ username: 'access_token', password: 'access_token_123' });

      const token = await authService.getAccessToken();

      expect(token).toBe('access_token_123');
    });

    it('should get last login time', async () => {
      const mockTime = '2024-01-01T10:00:00Z';
      mockAsyncStorage.getItem.mockResolvedValue(mockTime);

      const lastLoginTime = await authService.getLastLoginTime();

      expect(lastLoginTime).toBe(mockTime);
    });

    it('should determine if token needs refresh', async () => {
      const oldTime = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 minutes ago
      mockAsyncStorage.getItem.mockResolvedValue(oldTime);

      const shouldRefresh = await authService.shouldRefreshToken();

      expect(shouldRefresh).toBe(true);
    });
  });
});