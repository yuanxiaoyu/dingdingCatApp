import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../apiClient';
import { ENV_CONFIG } from '../../config/env';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Simple integration test to verify API client basic functionality
describe('ApiClient Integration', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock AsyncStorage default responses
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  it('should create instance with correct base URL', () => {
    const instance = apiClient.getInstance();
    expect(instance.defaults.baseURL).toBe(`${ENV_CONFIG.API_BASE_URL}/api/app`);
  });

  it('should have correct default headers', () => {
    const instance = apiClient.getInstance();
    // Check the headers that are set in the axios instance creation
    expect(instance.defaults.headers['Content-Type']).toBe('application/json');
    expect(instance.defaults.headers['Accept']).toBe('application/json');
    expect(instance.defaults.headers['User-Agent']).toBe('DingDingCat/1.0.0 (React Native)');
  });

  it('should have 30 second timeout', () => {
    const instance = apiClient.getInstance();
    expect(instance.defaults.timeout).toBe(30000);
  });

  it('should be able to update retry configuration', () => {
    expect(() => {
      apiClient.updateRetryConfig({
        maxRetries: 5,
        initialDelay: 2000,
      });
    }).not.toThrow();
  });

  it('should be able to set and remove custom headers', () => {
    const customHeaders = {
      'X-Custom-Header': 'test-value',
    };

    apiClient.setDefaultHeaders(customHeaders);
    const instance = apiClient.getInstance();
    expect(instance.defaults.headers.common['X-Custom-Header']).toBe('test-value');

    apiClient.removeDefaultHeaders(['X-Custom-Header']);
    expect(instance.defaults.headers.common['X-Custom-Header']).toBeUndefined();
  });

  it('should be able to cancel all requests', () => {
    const originalInstance = apiClient.getInstance();
    apiClient.cancelAllRequests();
    const newInstance = apiClient.getInstance();
    
    // Should create a new instance
    expect(newInstance).not.toBe(originalInstance);
    // But should maintain same configuration
    expect(newInstance.defaults.baseURL).toBe(originalInstance.defaults.baseURL);
  });

  it('should handle authentication status correctly', async () => {
    // Initially not authenticated
    expect(await apiClient.isAuthenticated()).toBe(false);

    // Mock AsyncStorage to return a token
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('test_token');

    // Should be authenticated now
    expect(await apiClient.isAuthenticated()).toBe(true);

    // Mock AsyncStorage to return null (no token)
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    // Should not be authenticated
    expect(await apiClient.isAuthenticated()).toBe(false);
  });
});