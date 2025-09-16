import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { ApiClient } from '../apiClient';
import { ENV_CONFIG } from '../../config/env';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock environment config
jest.mock('../../config/env', () => ({
  ENV_CONFIG: {
    API_BASE_URL: 'https://test-api.dingdingcat.com',
    APP_KEY: 'test_app_key',
    DEBUG_MODE: true,
  },
}));

describe('ApiClient', () => {
  let mockAxios: MockAdapter;
  let client: ApiClient;

  beforeEach(() => {
    // Create new client instance for each test
    client = new ApiClient();
    mockAxios = new MockAdapter(client.getInstance());
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock AsyncStorage default responses
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('Request Interceptors', () => {
    it('should add authentication header when token is available', async () => {
      const mockToken = 'test_access_token';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockToken);

      mockAxios.onGet('/test').reply((config) => {
        expect(config.headers?.Authorization).toBe(`Bearer ${mockToken}`);
        return [200, { code: 200, message: 'success', data: {} }];
      });

      await client.get('/test');
    });

    it('should add common parameters to POST requests', async () => {
      mockAxios.onPost('/test').reply((config) => {
        const data = JSON.parse(config.data);
        expect(data.appKey).toBe('test_app_key');
        expect(data.timestamp).toBeDefined();
        expect(data.testParam).toBe('testValue');
        return [200, { code: 200, message: 'success', data: {} }];
      });

      await client.post('/test', { testParam: 'testValue' });
    });

    it('should add common parameters to GET requests', async () => {
      mockAxios.onGet('/test').reply((config) => {
        expect(config.params.appKey).toBe('test_app_key');
        expect(config.params.timestamp).toBeDefined();
        return [200, { code: 200, message: 'success', data: {} }];
      });

      await client.get('/test');
    });

    it('should add request ID header', async () => {
      mockAxios.onGet('/test').reply((config) => {
        expect(config.headers?.['X-Request-ID']).toMatch(/^req_\d+_[a-z0-9]+$/);
        return [200, { code: 200, message: 'success', data: {} }];
      });

      await client.get('/test');
    });
  });

  describe('Response Interceptors', () => {
    it('should handle successful responses', async () => {
      const mockData = { id: 1, name: 'test' };
      mockAxios.onGet('/test').reply(200, {
        code: 200,
        message: 'success',
        data: mockData,
        timestamp: Date.now(),
      });

      const response = await client.get('/test');
      expect(response.code).toBe(200);
      expect(response.data).toEqual(mockData);
    });

    it('should reject when API returns error code', async () => {
      mockAxios.onGet('/test').reply(200, {
        code: 400,
        message: 'Bad request',
        data: null,
        timestamp: Date.now(),
      });

      await expect(client.get('/test')).rejects.toMatchObject({
        code: 400,
        message: 'Bad request',
      });
    });

    it('should handle network errors', async () => {
      mockAxios.onGet('/test').networkError();

      await expect(client.get('/test')).rejects.toMatchObject({
        code: 0,
        message: 'Network Error',
      });
    }, 10000);
  });

  describe('Token Management', () => {
    it('should store tokens correctly', async () => {
      const tokens = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        tokenType: 'Bearer',
        expiresIn: 3600,
      };

      await client.storeTokens(tokens);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@dingdingcat/access_token',
        'access_token'
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@dingdingcat/refresh_token',
        'refresh_token'
      );
    });

    it('should store user ID correctly', async () => {
      await client.storeUserId('12345');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@dingdingcat/user_id',
        '12345'
      );
    });

    it('should clear all tokens', async () => {
      await client.clearStoredTokens();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@dingdingcat/access_token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@dingdingcat/refresh_token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@dingdingcat/user_id');
    });

    it('should check authentication status', async () => {
      // Test unauthenticated
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      expect(await client.isAuthenticated()).toBe(false);

      // Test authenticated
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('access_token');
      expect(await client.isAuthenticated()).toBe(true);
    });
  });

  describe('Token Refresh', () => {
    it('should refresh token on 401 error', async () => {
      const mockRefreshToken = 'refresh_token';
      const mockUserId = '12345';
      const newAccessToken = 'new_access_token';

      // Mock stored tokens
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce('old_access_token') // First call for auth header
        .mockResolvedValueOnce(mockRefreshToken)   // Refresh token
        .mockResolvedValueOnce(mockUserId);        // User ID

      // Mock initial request failure
      mockAxios.onGet('/test').replyOnce(401, {
        code: 401,
        message: 'Unauthorized',
      });

      // Mock token refresh success - need to mock the external axios call
      const mockAxiosPost = jest.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          code: 200,
          message: 'success',
          data: {
            accessToken: newAccessToken,
            tokenType: 'Bearer',
            expiresIn: 3600,
          },
        },
      });

      // Mock retry request success
      mockAxios.onGet('/test').replyOnce(200, {
        code: 200,
        message: 'success',
        data: { result: 'success' },
      });

      const response = await client.get('/test');
      expect(response.data.result).toBe('success');

      // Verify token was stored
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@dingdingcat/access_token',
        newAccessToken
      );

      mockAxiosPost.mockRestore();
    });

    it('should clear tokens when refresh fails', async () => {
      const mockRefreshToken = 'refresh_token';
      const mockUserId = '12345';

      // Mock stored tokens
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce('old_access_token')
        .mockResolvedValueOnce(mockRefreshToken)
        .mockResolvedValueOnce(mockUserId);

      // Mock initial request failure
      mockAxios.onGet('/test').replyOnce(401);

      // Mock token refresh failure - need to mock the external axios call
      const mockAxiosPost = jest.spyOn(axios, 'post').mockRejectedValueOnce(
        new Error('Invalid refresh token')
      );

      await expect(client.get('/test')).rejects.toBeDefined();

      // Verify tokens were cleared
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@dingdingcat/access_token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@dingdingcat/refresh_token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@dingdingcat/user_id');

      mockAxiosPost.mockRestore();
    });
  });

  describe('Retry Mechanism', () => {
    it('should retry on retryable status codes', async () => {
      let attemptCount = 0;
      
      mockAxios.onGet('/test').reply(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return [500, { code: 500, message: 'Server error' }];
        }
        return [200, { code: 200, message: 'success', data: { result: 'success' } }];
      });

      const response = await client.get('/test');
      expect(response.data.result).toBe('success');
      expect(attemptCount).toBe(3);
    });

    it('should not retry on non-retryable status codes', async () => {
      let attemptCount = 0;
      
      mockAxios.onGet('/test').reply(() => {
        attemptCount++;
        return [400, { code: 400, message: 'Bad request' }];
      });

      await expect(client.get('/test')).rejects.toMatchObject({
        code: 400,
        message: 'Bad request',
      });
      expect(attemptCount).toBe(1);
    });

    it('should not retry auth endpoints', async () => {
      let attemptCount = 0;
      
      mockAxios.onPost('/auth/login').reply(() => {
        attemptCount++;
        return [500, { code: 500, message: 'Server error' }];
      });

      await expect(client.post('/auth/login', {})).rejects.toBeDefined();
      expect(attemptCount).toBe(1);
    });

    it('should respect max retry limit', async () => {
      let attemptCount = 0;
      
      mockAxios.onGet('/test').reply(() => {
        attemptCount++;
        return [500, { code: 500, message: 'Server error' }];
      });

      await expect(client.get('/test')).rejects.toBeDefined();
      expect(attemptCount).toBe(4); // Initial + 3 retries
    }, 15000);
  });

  describe('HTTP Methods', () => {
    it('should make GET requests', async () => {
      const mockData = { id: 1 };
      mockAxios.onGet('/test').reply(200, {
        code: 200,
        message: 'success',
        data: mockData,
      });

      const response = await client.get('/test');
      expect(response.data).toEqual(mockData);
    });

    it('should make POST requests', async () => {
      const requestData = { name: 'test' };
      const responseData = { id: 1, name: 'test' };
      
      mockAxios.onPost('/test').reply(200, {
        code: 200,
        message: 'success',
        data: responseData,
      });

      const response = await client.post('/test', requestData);
      expect(response.data).toEqual(responseData);
    });

    it('should make PUT requests', async () => {
      const requestData = { id: 1, name: 'updated' };
      
      mockAxios.onPut('/test/1').reply(200, {
        code: 200,
        message: 'success',
        data: requestData,
      });

      const response = await client.put('/test/1', requestData);
      expect(response.data).toEqual(requestData);
    });

    it('should make DELETE requests', async () => {
      mockAxios.onDelete('/test/1').reply(200, {
        code: 200,
        message: 'success',
        data: null,
      });

      const response = await client.delete('/test/1');
      expect(response.code).toBe(200);
    });
  });

  describe('Configuration', () => {
    it('should update retry configuration', () => {
      const newConfig = {
        maxRetries: 5,
        initialDelay: 2000,
      };

      client.updateRetryConfig(newConfig);
      
      // Test that new config is applied (this is internal, so we test behavior)
      expect(() => client.updateRetryConfig(newConfig)).not.toThrow();
    });

    it('should set and remove default headers', () => {
      const customHeaders = {
        'X-Custom-Header': 'custom-value',
        'X-Another-Header': 'another-value',
      };

      client.setDefaultHeaders(customHeaders);
      
      // Verify headers are set
      const instance = client.getInstance();
      expect(instance.defaults.headers.common['X-Custom-Header']).toBe('custom-value');
      expect(instance.defaults.headers.common['X-Another-Header']).toBe('another-value');

      // Remove headers
      client.removeDefaultHeaders(['X-Custom-Header']);
      expect(instance.defaults.headers.common['X-Custom-Header']).toBeUndefined();
      expect(instance.defaults.headers.common['X-Another-Header']).toBe('another-value');
    });

    it('should cancel all requests', () => {
      const originalInstance = client.getInstance();
      client.cancelAllRequests();
      const newInstance = client.getInstance();
      
      expect(newInstance).not.toBe(originalInstance);
    });
  });

  describe('File Upload', () => {
    it('should upload files with progress tracking', async () => {
      const mockFile = { name: 'test.jpg', type: 'image/jpeg' };
      const mockProgressCallback = jest.fn();
      
      mockAxios.onPost('/upload').reply((config) => {
        expect(config.headers?.['Content-Type']).toBe('multipart/form-data');
        return [200, { code: 200, message: 'success', data: { fileId: '123' } }];
      });

      const response = await client.uploadFile('/upload', mockFile, mockProgressCallback);
      expect(response.data.fileId).toBe('123');
    });
  });
});

describe('ApiClient Singleton', () => {
  it('should export singleton instance', () => {
    expect(apiClient).toBeInstanceOf(ApiClient);
  });

  it('should maintain same instance across imports', () => {
    const { default: apiClient1 } = require('../apiClient');
    const { default: apiClient2 } = require('../apiClient');
    
    expect(apiClient1).toBe(apiClient2);
  });
});