/**
 * API Client Usage Examples
 * 
 * This file demonstrates how to use the API client for various operations.
 * These examples show the proper way to integrate with the DingDingCat API.
 */

import apiClient from './apiClient';
import { 
  LoginRequest, 
  LoginResponse, 
  AdRequest, 
  AdResponse, 
  AdShowRequest,
  AdCompleteRequest,
  RevenueData,

  DeviceInfo 
} from '../types';

/**
 * Authentication Examples
 */
export class AuthExamples {
  /**
   * Example: WeChat Login
   */
  static async wechatLogin(wechatCode: string): Promise<LoginResponse> {
    try {
      const loginRequest: LoginRequest = {
        appKey: 'your_app_key', // This will be added automatically by interceptor
        code: wechatCode,
      };

      const response = await apiClient.post<LoginResponse>('/auth/wechat/login', loginRequest);
      
      // Store tokens after successful login
      await apiClient.storeTokens({
        accessToken: response.data.accessToken,
        refreshToken: '', // If provided by API
        tokenType: response.data.tokenType,
        expiresIn: response.data.expiresIn,
      });

      // Store user ID for token refresh
      await apiClient.storeUserId(response.data.userId.toString());

      return response.data;
    } catch (error) {
      console.error('WeChat login failed:', error);
      throw error;
    }
  }

  /**
   * Example: Get User Info
   */
  static async getUserInfo() {
    try {
      const response = await apiClient.get('/auth/userInfo');
      return response.data;
    } catch (error) {
      console.error('Get user info failed:', error);
      throw error;
    }
  }

  /**
   * Example: Logout
   */
  static async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
      // Clear stored tokens
      await apiClient.clearStoredTokens();
    } catch (error) {
      console.error('Logout failed:', error);
      // Clear tokens even if logout request fails
      await apiClient.clearStoredTokens();
      throw error;
    }
  }
}

/**
 * Configuration Examples
 */
export class ConfigExamples {
  /**
   * Example: Get App Configuration
   */
  static async getAppConfig() {
    try {
      const response = await apiClient.get('/config');
      return response.data;
    } catch (error) {
      console.error('Get app config failed:', error);
      throw error;
    }
  }

  /**
   * Example: Get Ad Configuration
   */
  static async getAdConfig() {
    try {
      const response = await apiClient.get('/config/ad');
      return response.data;
    } catch (error) {
      console.error('Get ad config failed:', error);
      throw error;
    }
  }

  /**
   * Example: Get Risk Configuration
   */
  static async getRiskConfig() {
    try {
      const response = await apiClient.get('/config/risk');
      return response.data;
    } catch (error) {
      console.error('Get risk config failed:', error);
      throw error;
    }
  }
}

/**
 * Ad Management Examples
 */
export class AdExamples {
  /**
   * Example: Request Ad
   */
  static async requestAd(userId: number, adType: string = 'video'): Promise<AdResponse> {
    try {
      const adRequest: AdRequest = {
        userId,
        appKey: 'your_app_key', // This will be added automatically by interceptor
        adType: adType as any,
        deviceType: 'android', // or 'ios'
      };

      const response = await apiClient.post<AdResponse>('/ad/request', adRequest);
      return response.data;
    } catch (error) {
      console.error('Request ad failed:', error);
      throw error;
    }
  }

  /**
   * Example: Report Ad Show
   */
  static async reportAdShow(userId: number, adId: string, adType: string): Promise<void> {
    try {
      const showRequest: AdShowRequest = {
        userId,
        appKey: 'your_app_key', // This will be added automatically by interceptor
        adId,
        adType: adType as any,
        showTime: Date.now(),
      };

      await apiClient.post('/ad/show', showRequest);
    } catch (error) {
      console.error('Report ad show failed:', error);
      throw error;
    }
  }

  /**
   * Example: Report Ad Complete (with reward)
   */
  static async reportAdComplete(
    userId: number, 
    adId: string, 
    adType: string, 
    playDuration: number,
    isClicked: boolean = false,
    stayDuration?: number
  ): Promise<number> {
    try {
      const completeRequest: AdCompleteRequest = {
        userId,
        appKey: 'your_app_key', // This will be added automatically by interceptor
        adId,
        adType: adType as any,
        playDuration,
        isClicked: isClicked ? '1' : '0',
        stayDuration,
        completeTime: Date.now(),
      };

      const response = await apiClient.post<number>('/ad/complete', completeRequest);
      return response.data; // Returns reward amount
    } catch (error) {
      console.error('Report ad complete failed:', error);
      throw error;
    }
  }

  /**
   * Example: Get User Revenue
   */
  static async getUserRevenue(userId: number): Promise<RevenueData> {
    try {
      const response = await apiClient.get<RevenueData>(`/ad/revenue?userId=${userId}`);
      return response.data;
    } catch (error) {
      console.error('Get user revenue failed:', error);
      throw error;
    }
  }



  /**
   * Example: Batch Report (for offline sync)
   */
  static async batchReport(userId: number, playDataList: any[]): Promise<number> {
    try {
      const batchRequest = {
        userId,
        appKey: 'your_app_key', // This will be added automatically by interceptor
        playDataList,
      };

      const response = await apiClient.post<number>('/ad/batchReport', batchRequest);
      return response.data; // Returns number of processed records
    } catch (error) {
      console.error('Batch report failed:', error);
      throw error;
    }
  }
}

/**
 * Device Management Examples
 */
export class DeviceExamples {
  /**
   * Example: Report Device Info
   */
  static async reportDeviceInfo(userId: number, deviceInfo: Partial<DeviceInfo>): Promise<void> {
    try {
      const deviceRequest: DeviceInfo = {
        userId,
        appKey: 'your_app_key', // This will be added automatically by interceptor
        deviceModel: deviceInfo.deviceModel || 'Unknown',
        deviceBrand: deviceInfo.deviceBrand || 'Unknown',
        osName: deviceInfo.osName || 'Unknown',
        osVersion: deviceInfo.osVersion || 'Unknown',
        deviceId: deviceInfo.deviceId || 'Unknown',
        isRooted: deviceInfo.isRooted || false,
        isEmulator: deviceInfo.isEmulator || false,
        ...deviceInfo,
      };

      await apiClient.post('/user/device', deviceRequest);
    } catch (error) {
      console.error('Report device info failed:', error);
      throw error;
    }
  }
}

/**
 * Error Handling Examples
 */
export class ErrorHandlingExamples {
  /**
   * Example: Handle API Errors with Retry
   */
  static async handleApiCallWithRetry<T>(
    apiCall: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on authentication errors
        if (error.code === 401) {
          throw error;
        }

        // Don't retry on client errors (4xx)
        if (error.code >= 400 && error.code < 500) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Example: Check Network Status Before API Call
   */
  static async safeApiCall<T>(apiCall: () => Promise<T>): Promise<T | null> {
    try {
      // Check if user is authenticated
      const isAuthenticated = await apiClient.isAuthenticated();
      if (!isAuthenticated) {
        console.warn('User not authenticated, skipping API call');
        return null;
      }

      return await apiCall();
    } catch (error: any) {
      console.error('API call failed:', error);
      
      // Handle specific error types
      switch (error.code) {
        case 401:
          console.log('Authentication failed, redirecting to login');
          // Handle authentication error
          break;
        case 403:
          console.log('Access forbidden, check permissions');
          // Handle authorization error
          break;
        case 429:
          console.log('Rate limited, please try again later');
          // Handle rate limiting
          break;
        default:
          console.log('Unknown error occurred');
      }

      return null;
    }
  }
}

/**
 * Complete Usage Example
 */
export class CompleteUsageExample {
  /**
   * Example: Complete Ad Watching Flow
   */
  static async completeAdWatchingFlow(userId: number): Promise<number | null> {
    try {
      // 1. Request ad
      console.log('Requesting ad...');
      const ad = await AdExamples.requestAd(userId, 'video');
      
      // 2. Report ad show
      console.log('Reporting ad show...');
      await AdExamples.reportAdShow(userId, ad.adId, ad.adType);
      
      // 3. Simulate ad watching (in real app, this would be actual ad playback)
      console.log('Watching ad...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 4. Report ad complete and get reward
      console.log('Reporting ad complete...');
      const reward = await AdExamples.reportAdComplete(
        userId, 
        ad.adId, 
        ad.adType, 
        30, // 30 seconds watched
        false, // not clicked
        35 // stayed for 35 seconds
      );
      
      console.log(`Ad watching completed! Earned: ${reward}`);
      return reward;
      
    } catch (error) {
      console.error('Ad watching flow failed:', error);
      return null;
    }
  }

  /**
   * Example: App Initialization Flow
   */
  static async initializeApp(): Promise<boolean> {
    try {
      // 1. Check if user is authenticated
      const isAuthenticated = await apiClient.isAuthenticated();
      if (!isAuthenticated) {
        console.log('User not authenticated');
        return false;
      }

      // 2. Get app configuration
      console.log('Loading app configuration...');
      const appConfig = await ConfigExamples.getAppConfig();
      console.log('App config loaded:', appConfig);

      // 3. Get ad configuration
      console.log('Loading ad configuration...');
      const adConfig = await ConfigExamples.getAdConfig();
      console.log('Ad config loaded:', adConfig);

      // 4. Get risk configuration
      console.log('Loading risk configuration...');
      const riskConfig = await ConfigExamples.getRiskConfig();
      console.log('Risk config loaded:', riskConfig);

      console.log('App initialization completed successfully');
      return true;

    } catch (error) {
      console.error('App initialization failed:', error);
      return false;
    }
  }
}

// Export all examples
export default {
  AuthExamples,
  ConfigExamples,
  AdExamples,
  DeviceExamples,
  ErrorHandlingExamples,
  CompleteUsageExample,
};