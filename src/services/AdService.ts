import apiClient from './apiClient';
import { 
  AdType, 
  AdRequest, 
  AdResponse, 
  AdShowRequest,
  AdClickRequest,
  AdCompleteRequest,
  AdSkipRequest,
  AdCloseRequest,
  BatchReportRequest,
  RevenueData,
  AdHistoryResponse,
  AdHistoryRequest,
  ApiResponse,
  ApiError
} from '../types';
import { ENV_CONFIG } from '../config/env';

/**
 * AdService - Handles all advertisement-related API operations
 * 
 * This service manages the complete ad lifecycle:
 * - Requesting ads from the server
 * - Reporting ad events (show, click, complete, skip, close)
 * - Batch reporting for offline data sync
 * - Retrieving user revenue and history data
 */
class AdService {
  private readonly baseUrl = '/ad';

  /**
   * Request advertisement content from server
   * Supports all 4 ad types: splash, video, interstitial, banner
   * 
   * @param request - Ad request parameters
   * @returns Promise<AdResponse> - Ad content and configuration
   */
  public async requestAd(request: AdRequest): Promise<AdResponse> {
    try {
      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('AdService.requestAd:', request);
      }

      const response = await apiClient.post<AdResponse>(`${this.baseUrl}/request`, {
        userId: request.userId,
        appKey: request.appKey,
        adType: request.adType || AdType.REWARD_VIDEO, // Default to video
        channelCode: request.channelCode,
        deviceType: request.deviceType || 'android',
        ipAddress: request.ipAddress,
      });

      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('AdService.requestAd response:', response.data);
      }

      return response.data;
    } catch (error) {
      console.error('AdService.requestAd error:', error);
      throw this.handleError(error, 'Failed to request ad');
    }
  }

  /**
   * Request splash ad specifically
   * 
   * @param userId - User ID
   * @param channelCode - Optional channel code
   * @returns Promise<AdResponse> - Splash ad content
   */
  public async requestSplashAd(userId: number, channelCode?: string): Promise<AdResponse> {
    return this.requestAd({
      userId,
      appKey: ENV_CONFIG.APP_KEY,
      adType: AdType.SPLASH,
      channelCode,
      deviceType: 'android', // TODO: Get from device info
    });
  }

  /**
   * Request reward video ad specifically
   * 
   * @param userId - User ID
   * @param channelCode - Optional channel code
   * @returns Promise<AdResponse> - Video ad content
   */
  public async requestRewardVideoAd(userId: number, channelCode?: string): Promise<AdResponse> {
    return this.requestAd({
      userId,
      appKey: ENV_CONFIG.APP_KEY,
      adType: AdType.REWARD_VIDEO,
      channelCode,
      deviceType: 'android', // TODO: Get from device info
    });
  }

  /**
   * Request interstitial ad specifically
   * 
   * @param userId - User ID
   * @param channelCode - Optional channel code
   * @returns Promise<AdResponse> - Interstitial ad content
   */
  public async requestInterstitialAd(userId: number, channelCode?: string): Promise<AdResponse> {
    return this.requestAd({
      userId,
      appKey: ENV_CONFIG.APP_KEY,
      adType: AdType.INTERSTITIAL,
      channelCode,
      deviceType: 'android', // TODO: Get from device info
    });
  }

  /**
   * Request banner ad specifically
   * 
   * @param userId - User ID
   * @param channelCode - Optional channel code
   * @returns Promise<AdResponse> - Banner ad content
   */
  public async requestBannerAd(userId: number, channelCode?: string): Promise<AdResponse> {
    return this.requestAd({
      userId,
      appKey: ENV_CONFIG.APP_KEY,
      adType: AdType.BANNER,
      channelCode,
      deviceType: 'android', // TODO: Get from device info
    });
  }

  /**
   * Report ad show event when ad starts displaying
   * 
   * @param request - Ad show event data
   * @returns Promise<void>
   */
  public async reportAdShow(request: AdShowRequest): Promise<void> {
    try {
      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('AdService.reportAdShow:', request);
      }

      await apiClient.post(`${this.baseUrl}/show`, {
        userId: request.userId,
        appKey: request.appKey,
        adId: request.adId,
        adType: request.adType,
        showTime: request.showTime,
        ipAddress: request.ipAddress,
      });

      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('AdService.reportAdShow success');
      }
    } catch (error) {
      console.error('AdService.reportAdShow error:', error);
      throw this.handleError(error, 'Failed to report ad show');
    }
  }

  /**
   * Report ad click event when user clicks on ad
   * 
   * @param request - Ad click event data
   * @returns Promise<void>
   */
  public async reportAdClick(request: AdClickRequest): Promise<void> {
    try {
      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('AdService.reportAdClick:', request);
      }

      await apiClient.post(`${this.baseUrl}/click`, {
        userId: request.userId,
        appKey: request.appKey,
        adId: request.adId,
        adType: request.adType,
        clickTime: request.clickTime,
        clickPosition: request.clickPosition,
        ipAddress: request.ipAddress,
      });

      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('AdService.reportAdClick success');
      }
    } catch (error) {
      console.error('AdService.reportAdClick error:', error);
      throw this.handleError(error, 'Failed to report ad click');
    }
  }

  /**
   * Report ad complete event when ad finishes playing
   * Returns the reward amount earned by the user
   * 
   * @param request - Ad complete event data
   * @returns Promise<number> - Reward amount earned
   */
  public async reportAdComplete(request: AdCompleteRequest): Promise<number> {
    try {
      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('AdService.reportAdComplete:', request);
      }

      const response = await apiClient.post<number>(`${this.baseUrl}/complete`, {
        userId: request.userId,
        appKey: request.appKey,
        adId: request.adId,
        adType: request.adType,
        playDuration: request.playDuration,
        isClicked: request.isClicked,
        stayDuration: request.stayDuration,
        completeTime: request.completeTime,
        ipAddress: request.ipAddress,
      });

      const rewardAmount = response.data;

      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('AdService.reportAdComplete success, reward:', rewardAmount);
      }

      return rewardAmount;
    } catch (error) {
      console.error('AdService.reportAdComplete error:', error);
      throw this.handleError(error, 'Failed to report ad complete');
    }
  }

  /**
   * Report ad skip event when user skips the ad
   * 
   * @param request - Ad skip event data
   * @returns Promise<void>
   */
  public async reportAdSkip(request: AdSkipRequest): Promise<void> {
    try {
      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('AdService.reportAdSkip:', request);
      }

      await apiClient.post(`${this.baseUrl}/skip`, {
        userId: request.userId,
        appKey: request.appKey,
        adId: request.adId,
        adType: request.adType,
        playDuration: request.playDuration,
        skipTime: request.skipTime,
        skipReason: request.skipReason,
        ipAddress: request.ipAddress,
      });

      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('AdService.reportAdSkip success');
      }
    } catch (error) {
      console.error('AdService.reportAdSkip error:', error);
      throw this.handleError(error, 'Failed to report ad skip');
    }
  }

  /**
   * Report ad close event when ad is closed
   * 
   * @param request - Ad close event data
   * @returns Promise<void>
   */
  public async reportAdClose(request: AdCloseRequest): Promise<void> {
    try {
      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('AdService.reportAdClose:', request);
      }

      await apiClient.post(`${this.baseUrl}/close`, {
        userId: request.userId,
        appKey: request.appKey,
        adId: request.adId,
        adType: request.adType,
        playDuration: request.playDuration,
        stayDuration: request.stayDuration,
        closeTime: request.closeTime,
        closeReason: request.closeReason,
        ipAddress: request.ipAddress,
      });

      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('AdService.reportAdClose success');
      }
    } catch (error) {
      console.error('AdService.reportAdClose error:', error);
      throw this.handleError(error, 'Failed to report ad close');
    }
  }

  /**
   * Batch report multiple ad play data for offline sync
   * 
   * @param request - Batch report request with multiple play data
   * @returns Promise<number> - Number of successfully processed records
   */
  public async batchReportAds(request: BatchReportRequest): Promise<number> {
    try {
      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('AdService.batchReportAds:', request);
      }

      const response = await apiClient.post<number>(`${this.baseUrl}/batchReport`, {
        userId: request.userId,
        appKey: request.appKey,
        ipAddress: request.ipAddress,
        playDataList: request.playDataList,
      });

      const processedCount = response.data;

      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('AdService.batchReportAds success, processed:', processedCount);
      }

      return processedCount;
    } catch (error) {
      console.error('AdService.batchReportAds error:', error);
      throw this.handleError(error, 'Failed to batch report ads');
    }
  }

  /**
   * Get user revenue statistics
   * 
   * @param userId - User ID
   * @returns Promise<RevenueData> - User revenue information
   */
  public async getUserRevenue(userId: number): Promise<RevenueData> {
    try {
      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('AdService.getUserRevenue:', userId);
      }

      const response = await apiClient.get<RevenueData>(`${this.baseUrl}/revenue`, {
        params: {
          userId,
          appKey: ENV_CONFIG.APP_KEY,
        },
      });

      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('AdService.getUserRevenue response:', response.data);
      }

      return response.data;
    } catch (error) {
      console.error('AdService.getUserRevenue error:', error);
      throw this.handleError(error, 'Failed to get user revenue');
    }
  }

  /**
   * Get user ad watching history with optional filtering
   * 
   * @param request - History request parameters
   * @returns Promise<AdHistoryResponse> - Paginated history data
   */
  public async getAdHistory(request: AdHistoryRequest): Promise<AdHistoryResponse> {
    try {
      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('AdService.getAdHistory:', request);
      }

      const response = await apiClient.get<AdHistoryResponse>(`${this.baseUrl}/history`, {
        params: {
          userId: request.userId,
          appKey: request.appKey,
          pageNum: request.pageNum || 1,
          pageSize: request.pageSize || 20,
          adType: request.adType,
          startDate: request.startDate,
          endDate: request.endDate,
        },
      });

      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('AdService.getAdHistory response:', response.data);
      }

      return response.data;
    } catch (error) {
      console.error('AdService.getAdHistory error:', error);
      throw this.handleError(error, 'Failed to get ad history');
    }
  }

  /**
   * Convenience method to report ad show with current timestamp
   * 
   * @param userId - User ID
   * @param adId - Ad ID
   * @param adType - Ad type
   * @returns Promise<void>
   */
  public async reportAdShowNow(userId: number, adId: string, adType: AdType): Promise<void> {
    return this.reportAdShow({
      userId,
      appKey: ENV_CONFIG.APP_KEY,
      adId,
      adType,
      showTime: Date.now(),
    });
  }

  /**
   * Convenience method to report ad click with current timestamp
   * 
   * @param userId - User ID
   * @param adId - Ad ID
   * @param adType - Ad type
   * @param clickPosition - Optional click position
   * @returns Promise<void>
   */
  public async reportAdClickNow(
    userId: number, 
    adId: string, 
    adType: AdType, 
    clickPosition?: string
  ): Promise<void> {
    return this.reportAdClick({
      userId,
      appKey: ENV_CONFIG.APP_KEY,
      adId,
      adType,
      clickTime: Date.now(),
      clickPosition,
    });
  }

  /**
   * Convenience method to report ad complete with current timestamp
   * 
   * @param userId - User ID
   * @param adId - Ad ID
   * @param adType - Ad type
   * @param playDuration - Play duration in seconds
   * @param isClicked - Whether ad was clicked
   * @param stayDuration - Optional stay duration
   * @returns Promise<number> - Reward amount
   */
  public async reportAdCompleteNow(
    userId: number,
    adId: string,
    adType: AdType,
    playDuration: number,
    isClicked: boolean,
    stayDuration?: number
  ): Promise<number> {
    return this.reportAdComplete({
      userId,
      appKey: ENV_CONFIG.APP_KEY,
      adId,
      adType,
      playDuration,
      isClicked: isClicked ? '1' : '0',
      stayDuration,
      completeTime: Date.now(),
    });
  }

  /**
   * Convenience method to report ad skip with current timestamp
   * 
   * @param userId - User ID
   * @param adId - Ad ID
   * @param adType - Ad type
   * @param playDuration - Play duration before skip
   * @param skipReason - Optional skip reason
   * @returns Promise<void>
   */
  public async reportAdSkipNow(
    userId: number,
    adId: string,
    adType: AdType,
    playDuration: number,
    skipReason?: string
  ): Promise<void> {
    return this.reportAdSkip({
      userId,
      appKey: ENV_CONFIG.APP_KEY,
      adId,
      adType,
      playDuration,
      skipTime: Date.now(),
      skipReason,
    });
  }

  /**
   * Convenience method to report ad close with current timestamp
   * 
   * @param userId - User ID
   * @param adId - Ad ID
   * @param adType - Ad type
   * @param playDuration - Play duration before close
   * @param stayDuration - Optional stay duration
   * @param closeReason - Optional close reason
   * @returns Promise<void>
   */
  public async reportAdCloseNow(
    userId: number,
    adId: string,
    adType: AdType,
    playDuration: number,
    stayDuration?: number,
    closeReason?: string
  ): Promise<void> {
    return this.reportAdClose({
      userId,
      appKey: ENV_CONFIG.APP_KEY,
      adId,
      adType,
      playDuration,
      stayDuration,
      closeTime: Date.now(),
      closeReason,
    });
  }

  /**
   * Handle and transform service errors
   * 
   * @param error - Original error
   * @param defaultMessage - Default error message
   * @returns ApiError - Transformed error
   */
  private handleError(error: any, defaultMessage: string): ApiError {
    if (error && typeof error === 'object' && 'code' in error) {
      // Already an ApiError
      return error as ApiError;
    }

    // Transform other errors
    return {
      code: error?.response?.status || error?.code || 500,
      message: error?.message || defaultMessage,
      details: error,
    };
  }

  /**
   * Check if ad type is supported
   * 
   * @param adType - Ad type to check
   * @returns boolean - Whether ad type is supported
   */
  public isSupportedAdType(adType: string): adType is AdType {
    return Object.values(AdType).includes(adType as AdType);
  }

  /**
   * Get all supported ad types
   * 
   * @returns AdType[] - Array of supported ad types
   */
  public getSupportedAdTypes(): AdType[] {
    return Object.values(AdType);
  }

  /**
   * Validate ad request parameters
   * 
   * @param request - Ad request to validate
   * @throws Error if validation fails
   */
  public validateAdRequest(request: AdRequest): void {
    if (!request.userId || request.userId <= 0) {
      throw new Error('Invalid user ID');
    }

    if (!request.appKey || request.appKey.trim() === '') {
      throw new Error('Invalid app key');
    }

    if (request.adType && !this.isSupportedAdType(request.adType)) {
      throw new Error(`Unsupported ad type: ${request.adType}`);
    }
  }

  /**
   * Create ad request with default values
   * 
   * @param userId - User ID
   * @param adType - Ad type
   * @param options - Optional parameters
   * @returns AdRequest - Complete ad request
   */
  public createAdRequest(
    userId: number,
    adType: AdType,
    options: Partial<AdRequest> = {}
  ): AdRequest {
    return {
      userId,
      appKey: ENV_CONFIG.APP_KEY,
      adType,
      deviceType: 'android', // TODO: Get from device info
      ...options,
    };
  }
}

// Create singleton instance
const adService = new AdService();

export default adService;
export { AdService };