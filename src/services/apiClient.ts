import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  AxiosError,
  InternalAxiosRequestConfig 
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV_CONFIG } from '../config/env';
import { ApiResponse, ApiError, AuthTokens } from '../types';

// Storage keys for tokens
const STORAGE_KEYS = {
  ACCESS_TOKEN: '@dingdingcat/access_token',
  REFRESH_TOKEN: '@dingdingcat/refresh_token',
  USER_ID: '@dingdingcat/user_id',
} as const;

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelay: number;
  retryableStatusCodes: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  backoffMultiplier: 2,
  initialDelay: 1000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

// Request retry metadata
interface RetryMetadata {
  retryCount: number;
  lastRetryTime: number;
}

class ApiClient {
  private axiosInstance: AxiosInstance;
  private retryConfig: RetryConfig;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  constructor() {
    this.retryConfig = DEFAULT_RETRY_CONFIG;
    this.axiosInstance = this.createAxiosInstance();
    this.setupInterceptors();
  }

  /**
   * Create axios instance with base configuration
   */
  private createAxiosInstance(): AxiosInstance {
    const instance = axios.create({
      baseURL: ENV_CONFIG.API_BASE_URL + '/api/app',
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'DingDingCat/1.0.0 (React Native)',
      },
    });

    return instance;
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - add auth headers and common parameters
    this.axiosInstance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Add authentication header
        const accessToken = await this.getStoredAccessToken();
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }

        // Add common parameters to request body for POST requests
        if (config.method === 'post' && config.data) {
          config.data = {
            ...config.data,
            appKey: ENV_CONFIG.APP_KEY,
            timestamp: Date.now(),
          };
        }

        // Add common parameters to query string for GET requests
        if (config.method === 'get') {
          config.params = {
            ...config.params,
            appKey: ENV_CONFIG.APP_KEY,
            timestamp: Date.now(),
          };
        }

        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId();

        if (ENV_CONFIG.DEBUG_MODE) {
          console.log('API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            headers: config.headers,
            data: config.data,
            params: config.params,
          });
        }

        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle common errors and token refresh
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        if (ENV_CONFIG.DEBUG_MODE) {
          console.log('API Response:', {
            status: response.status,
            url: response.config.url,
            data: response.data,
          });
        }

        // Check if response indicates success
        if (response.data && response.data.code !== 200) {
          const apiError: ApiError = {
            code: response.data.code,
            message: response.data.message,
            details: response.data,
          };
          return Promise.reject(apiError);
        }

        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { 
          _retry?: boolean;
          _retryMetadata?: RetryMetadata;
        };

        if (ENV_CONFIG.DEBUG_MODE) {
          console.error('API Error:', {
            status: error.response?.status,
            url: error.config?.url,
            message: error.message,
            data: error.response?.data,
          });
        }

        // Handle 401 Unauthorized - token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return this.axiosInstance(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshAccessToken();
            if (newToken) {
              // Process failed queue
              this.processQueue(null, newToken);
              
              // Retry original request with new token
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            // Clear stored tokens and redirect to login
            await this.clearStoredTokens();
            throw refreshError;
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle retryable errors
        if (this.shouldRetry(error, originalRequest)) {
          return this.retryRequest(originalRequest, error);
        }

        // Transform axios error to API error
        const apiError = this.transformError(error);
        return Promise.reject(apiError);
      }
    );
  }

  /**
   * Process queued requests after token refresh
   */
  private processQueue(error: any, token: string | null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  /**
   * Check if request should be retried
   */
  private shouldRetry(error: AxiosError, config?: InternalAxiosRequestConfig): boolean {
    if (!config) return false;

    const retryMetadata = config._retryMetadata || { retryCount: 0, lastRetryTime: 0 };
    
    // Don't retry if max retries exceeded
    if (retryMetadata.retryCount >= this.retryConfig.maxRetries) {
      return false;
    }

    // Don't retry authentication endpoints
    if (config.url?.includes('/auth/')) {
      return false;
    }

    // Check if status code is retryable
    const statusCode = error.response?.status;
    if (statusCode && !this.retryConfig.retryableStatusCodes.includes(statusCode)) {
      return false;
    }

    // Check for network errors
    if (!error.response && error.code !== 'ECONNABORTED') {
      return true;
    }

    return true;
  }

  /**
   * Retry failed request with exponential backoff
   */
  private async retryRequest(
    config: InternalAxiosRequestConfig & { _retryMetadata?: RetryMetadata },
    error: AxiosError
  ): Promise<AxiosResponse> {
    const retryMetadata = config._retryMetadata || { retryCount: 0, lastRetryTime: 0 };
    retryMetadata.retryCount += 1;

    // Calculate delay with exponential backoff
    const delay = this.retryConfig.initialDelay * 
      Math.pow(this.retryConfig.backoffMultiplier, retryMetadata.retryCount - 1);

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    const totalDelay = delay + jitter;

    if (ENV_CONFIG.DEBUG_MODE) {
      console.log(`Retrying request (attempt ${retryMetadata.retryCount}/${this.retryConfig.maxRetries}) after ${totalDelay}ms:`, {
        url: config.url,
        error: error.message,
      });
    }

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, totalDelay));

    // Update retry metadata
    config._retryMetadata = {
      ...retryMetadata,
      lastRetryTime: Date.now(),
    };

    return this.axiosInstance(config);
  }

  /**
   * Transform axios error to API error
   */
  private transformError(error: AxiosError): ApiError {
    if (error.response?.data && typeof error.response.data === 'object') {
      const responseData = error.response.data as any;
      return {
        code: responseData.code || error.response.status,
        message: responseData.message || error.message,
        details: responseData,
      };
    }

    // Network or other errors
    return {
      code: error.response?.status || 0,
      message: error.message || 'Network error',
      details: {
        code: error.code,
        config: error.config,
      },
    };
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);

      if (!refreshToken || !userId) {
        throw new Error('No refresh token or user ID available');
      }

      const response = await axios.post(
        `${ENV_CONFIG.API_BASE_URL}/api/app/auth/refresh`,
        {
          appKey: ENV_CONFIG.APP_KEY,
          refreshToken,
          userId,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.code === 200) {
        const { accessToken, tokenType, expiresIn } = response.data.data;
        
        // Store new tokens
        await this.storeTokens({
          accessToken,
          refreshToken: refreshToken, // Keep existing refresh token
          tokenType,
          expiresIn,
        });

        return accessToken;
      }

      throw new Error('Token refresh failed');
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }

  /**
   * Store authentication tokens
   */
  public async storeTokens(tokens: AuthTokens): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
        tokens.refreshToken ? AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken) : Promise.resolve(),
      ]);
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw error;
    }
  }

  /**
   * Store user ID
   */
  public async storeUserId(userId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, userId);
    } catch (error) {
      console.error('Error storing user ID:', error);
      throw error;
    }
  }

  /**
   * Get stored access token
   */
  private async getStoredAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Clear all stored tokens
   */
  public async clearStoredTokens(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_ID),
      ]);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  /**
   * Generate unique request ID for tracking
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if user is authenticated
   */
  public async isAuthenticated(): Promise<boolean> {
    const accessToken = await this.getStoredAccessToken();
    return !!accessToken;
  }

  /**
   * Update retry configuration
   */
  public updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  /**
   * Get axios instance for direct use
   */
  public getInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  /**
   * Make GET request
   */
  public async get<T = any>(
    url: string, 
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  /**
   * Make POST request
   */
  public async post<T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  /**
   * Make PUT request
   */
  public async put<T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  /**
   * Make DELETE request
   */
  public async delete<T = any>(
    url: string, 
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  /**
   * Upload file with progress tracking
   */
  public async uploadFile<T = any>(
    url: string,
    file: any,
    onUploadProgress?: (progressEvent: any) => void,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.axiosInstance.post<ApiResponse<T>>(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });

    return response.data;
  }

  /**
   * Cancel all pending requests
   */
  public cancelAllRequests(): void {
    // Create new axios instance to cancel all pending requests
    this.axiosInstance = this.createAxiosInstance();
    this.setupInterceptors();
  }

  /**
   * Set custom headers for all requests
   */
  public setDefaultHeaders(headers: Record<string, string>): void {
    Object.assign(this.axiosInstance.defaults.headers.common, headers);
  }

  /**
   * Remove custom headers
   */
  public removeDefaultHeaders(headerNames: string[]): void {
    headerNames.forEach(name => {
      delete this.axiosInstance.defaults.headers.common[name];
    });
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;
export { ApiClient };