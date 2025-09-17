/**
 * IntegratedAdService - Combines Pangle SDK with API Service
 * 
 * This service integrates the Pangle Ad SDK with the backend API service
 * to provide a complete ad management solution that handles:
 * - Ad requests from server
 * - Pangle SDK ad loading and display
 * - API event reporting for all ad lifecycle events
 */

import PangleAdService from './PangleAdService';
import AdService from './AdService';
import { AdType, AdResponse, User } from '../types';
import { ENV_CONFIG } from '../config/env';

interface AdEventCallbacks {
  onAdLoaded?: (adId: string, adType: AdType) => void;
  onAdShown?: (adId: string, adType: AdType) => void;
  onAdClicked?: (adId: string, adType: AdType) => void;
  onAdCompleted?: (adId: string, adType: AdType, reward: number) => void;
  onAdSkipped?: (adId: string, adType: AdType) => void;
  onAdClosed?: (adId: string, adType: AdType) => void;
  onAdError?: (adId: string, adType: AdType, error: Error) => void;
}

class IntegratedAdService {
  private currentUser: User | null = null;
  private adStartTimes: Map<string, number> = new Map();
  private adClickStates: Map<string, boolean> = new Map();

  /**
   * Set current user for API calls
   */
  public setCurrentUser(user: User): void {
    this.currentUser = user;
  }

  /**
   * Initialize Pangle SDK
   */
  public async initializeSDK(appId: string): Promise<void> {
    try {
      await PangleAdService.initializeAndStartSDK(appId);
      console.log('IntegratedAdService: Pangle SDK initialized successfully');
    } catch (error) {
      console.error('IntegratedAdService: Failed to initialize Pangle SDK:', error);
      throw error;
    }
  }

  /**
   * Load and show splash ad with full API integration
   */
  public async loadAndShowSplashAd(callbacks?: AdEventCallbacks): Promise<void> {
    if (!this.currentUser) {
      throw new Error('User not set. Call setCurrentUser() first.');
    }

    try {
      // Step 1: Request ad from server
      const adResponse = await AdService.requestSplashAd(this.currentUser.userId);
      console.log('IntegratedAdService: Splash ad requested from server:', adResponse);

      // Step 2: Load ad in Pangle SDK
      const loadResult = await PangleAdService.loadSplashAd(adResponse.adId);
      console.log('IntegratedAdService: Splash ad loaded in SDK:', loadResult);

      callbacks?.onAdLoaded?.(adResponse.adId, AdType.SPLASH);

      // Step 3: Show ad and track events
      await this.showSplashAdWithTracking(adResponse, callbacks);

    } catch (error) {
      console.error('IntegratedAdService: Splash ad error:', error);
      callbacks?.onAdError?.('unknown', AdType.SPLASH, error as Error);
      throw error;
    }
  }

  /**
   * Load and show reward video ad with full API integration
   */
  public async loadAndShowRewardVideoAd(callbacks?: AdEventCallbacks): Promise<void> {
    if (!this.currentUser) {
      throw new Error('User not set. Call setCurrentUser() first.');
    }

    try {
      // Step 1: Request ad from server
      const adResponse = await AdService.requestRewardVideoAd(this.currentUser.userId);
      console.log('IntegratedAdService: Reward video ad requested from server:', adResponse);

      // Step 2: Load ad in Pangle SDK
      const loadResult = await PangleAdService.loadRewardVideoAd(adResponse.adId);
      console.log('IntegratedAdService: Reward video ad loaded in SDK:', loadResult);

      callbacks?.onAdLoaded?.(adResponse.adId, AdType.REWARD_VIDEO);

      // Step 3: Show ad and track events
      await this.showRewardVideoAdWithTracking(adResponse, callbacks);

    } catch (error) {
      console.error('IntegratedAdService: Reward video ad error:', error);
      callbacks?.onAdError?.('unknown', AdType.REWARD_VIDEO, error as Error);
      throw error;
    }
  }

  /**
   * Load and show interstitial ad with full API integration
   */
  public async loadAndShowInterstitialAd(callbacks?: AdEventCallbacks): Promise<void> {
    if (!this.currentUser) {
      throw new Error('User not set. Call setCurrentUser() first.');
    }

    try {
      // Step 1: Request ad from server
      const adResponse = await AdService.requestInterstitialAd(this.currentUser.userId);
      console.log('IntegratedAdService: Interstitial ad requested from server:', adResponse);

      // Step 2: Load ad in Pangle SDK
      const loadResult = await PangleAdService.loadInterstitialAd(adResponse.adId);
      console.log('IntegratedAdService: Interstitial ad loaded in SDK:', loadResult);

      callbacks?.onAdLoaded?.(adResponse.adId, AdType.INTERSTITIAL);

      // Step 3: Show ad and track events
      await this.showInterstitialAdWithTracking(adResponse, callbacks);

    } catch (error) {
      console.error('IntegratedAdService: Interstitial ad error:', error);
      callbacks?.onAdError?.('unknown', AdType.INTERSTITIAL, error as Error);
      throw error;
    }
  }

  /**
   * Load and show banner ad with full API integration
   */
  public async loadAndShowBannerAd(callbacks?: AdEventCallbacks): Promise<void> {
    if (!this.currentUser) {
      throw new Error('User not set. Call setCurrentUser() first.');
    }

    try {
      // Step 1: Request ad from server
      const adResponse = await AdService.requestBannerAd(this.currentUser.userId);
      console.log('IntegratedAdService: Banner ad requested from server:', adResponse);

      // Step 2: Load ad in Pangle SDK
      const loadResult = await PangleAdService.loadBannerAd(adResponse.adId);
      console.log('IntegratedAdService: Banner ad loaded in SDK:', loadResult);

      callbacks?.onAdLoaded?.(adResponse.adId, AdType.BANNER);

      // Step 3: Show ad and track events
      await this.showBannerAdWithTracking(adResponse, callbacks);

    } catch (error) {
      console.error('IntegratedAdService: Banner ad error:', error);
      callbacks?.onAdError?.('unknown', AdType.BANNER, error as Error);
      throw error;
    }
  }

  /**
   * Show splash ad with event tracking
   */
  private async showSplashAdWithTracking(
    adResponse: AdResponse, 
    callbacks?: AdEventCallbacks
  ): Promise<void> {
    const startTime = Date.now();
    this.adStartTimes.set(adResponse.adId, startTime);
    this.adClickStates.set(adResponse.adId, false);

    try {
      // Report ad show
      await AdService.reportAdShowNow(
        this.currentUser!.userId,
        adResponse.adId,
        AdType.SPLASH
      );
      console.log('IntegratedAdService: Splash ad show reported');
      callbacks?.onAdShown?.(adResponse.adId, AdType.SPLASH);

      // Show ad in SDK
      const showResult = await PangleAdService.showSplashAd();
      console.log('IntegratedAdService: Splash ad shown:', showResult);

      // Handle ad completion based on result
      if (showResult && showResult.status === 'completed') {
        await this.handleAdCompletion(adResponse, AdType.SPLASH, callbacks);
      } else if (showResult && showResult.status === 'skipped') {
        await this.handleAdSkip(adResponse, AdType.SPLASH, callbacks);
      } else if (showResult && showResult.status === 'clicked') {
        this.adClickStates.set(adResponse.adId, true);
        await this.handleAdClick(adResponse, AdType.SPLASH, callbacks);
        await this.handleAdCompletion(adResponse, AdType.SPLASH, callbacks);
      }

    } catch (error) {
      console.error('IntegratedAdService: Error showing splash ad:', error);
      await this.handleAdClose(adResponse, AdType.SPLASH, callbacks, 'error');
      throw error;
    }
  }

  /**
   * Show reward video ad with event tracking
   */
  private async showRewardVideoAdWithTracking(
    adResponse: AdResponse, 
    callbacks?: AdEventCallbacks
  ): Promise<void> {
    const startTime = Date.now();
    this.adStartTimes.set(adResponse.adId, startTime);
    this.adClickStates.set(adResponse.adId, false);

    try {
      // Report ad show
      await AdService.reportAdShowNow(
        this.currentUser!.userId,
        adResponse.adId,
        AdType.REWARD_VIDEO
      );
      console.log('IntegratedAdService: Reward video ad show reported');
      callbacks?.onAdShown?.(adResponse.adId, AdType.REWARD_VIDEO);

      // Show ad in SDK
      const showResult = await PangleAdService.showRewardVideoAd();
      console.log('IntegratedAdService: Reward video ad shown:', showResult);

      // Handle ad completion based on result
      if (showResult && showResult.status === 'completed') {
        await this.handleAdCompletion(adResponse, AdType.REWARD_VIDEO, callbacks);
      } else if (showResult && showResult.status === 'skipped') {
        await this.handleAdSkip(adResponse, AdType.REWARD_VIDEO, callbacks);
      } else if (showResult && showResult.status === 'clicked') {
        this.adClickStates.set(adResponse.adId, true);
        await this.handleAdClick(adResponse, AdType.REWARD_VIDEO, callbacks);
        await this.handleAdCompletion(adResponse, AdType.REWARD_VIDEO, callbacks);
      }

    } catch (error) {
      console.error('IntegratedAdService: Error showing reward video ad:', error);
      await this.handleAdClose(adResponse, AdType.REWARD_VIDEO, callbacks, 'error');
      throw error;
    }
  }

  /**
   * Show interstitial ad with event tracking
   */
  private async showInterstitialAdWithTracking(
    adResponse: AdResponse, 
    callbacks?: AdEventCallbacks
  ): Promise<void> {
    const startTime = Date.now();
    this.adStartTimes.set(adResponse.adId, startTime);
    this.adClickStates.set(adResponse.adId, false);

    try {
      // Report ad show
      await AdService.reportAdShowNow(
        this.currentUser!.userId,
        adResponse.adId,
        AdType.INTERSTITIAL
      );
      console.log('IntegratedAdService: Interstitial ad show reported');
      callbacks?.onAdShown?.(adResponse.adId, AdType.INTERSTITIAL);

      // Show ad in SDK
      const showResult = await PangleAdService.showInterstitialAd();
      console.log('IntegratedAdService: Interstitial ad shown:', showResult);

      // Handle ad completion based on result
      if (showResult && showResult.status === 'completed') {
        await this.handleAdCompletion(adResponse, AdType.INTERSTITIAL, callbacks);
      } else if (showResult && showResult.status === 'skipped') {
        await this.handleAdSkip(adResponse, AdType.INTERSTITIAL, callbacks);
      } else if (showResult && showResult.status === 'clicked') {
        this.adClickStates.set(adResponse.adId, true);
        await this.handleAdClick(adResponse, AdType.INTERSTITIAL, callbacks);
        await this.handleAdCompletion(adResponse, AdType.INTERSTITIAL, callbacks);
      }

    } catch (error) {
      console.error('IntegratedAdService: Error showing interstitial ad:', error);
      await this.handleAdClose(adResponse, AdType.INTERSTITIAL, callbacks, 'error');
      throw error;
    }
  }

  /**
   * Show banner ad with event tracking
   */
  private async showBannerAdWithTracking(
    adResponse: AdResponse, 
    callbacks?: AdEventCallbacks
  ): Promise<void> {
    const startTime = Date.now();
    this.adStartTimes.set(adResponse.adId, startTime);
    this.adClickStates.set(adResponse.adId, false);

    try {
      // Report ad show
      await AdService.reportAdShowNow(
        this.currentUser!.userId,
        adResponse.adId,
        AdType.BANNER
      );
      console.log('IntegratedAdService: Banner ad show reported');
      callbacks?.onAdShown?.(adResponse.adId, AdType.BANNER);

      // Show ad in SDK
      const showResult = await PangleAdService.showBannerAd();
      console.log('IntegratedAdService: Banner ad shown:', showResult);

      // Handle ad completion based on result
      if (showResult && showResult.status === 'completed') {
        await this.handleAdCompletion(adResponse, AdType.BANNER, callbacks);
      } else if (showResult && showResult.status === 'clicked') {
        this.adClickStates.set(adResponse.adId, true);
        await this.handleAdClick(adResponse, AdType.BANNER, callbacks);
        await this.handleAdCompletion(adResponse, AdType.BANNER, callbacks);
      }

    } catch (error) {
      console.error('IntegratedAdService: Error showing banner ad:', error);
      await this.handleAdClose(adResponse, AdType.BANNER, callbacks, 'error');
      throw error;
    }
  }

  /**
   * Handle ad click event
   */
  private async handleAdClick(
    adResponse: AdResponse,
    adType: AdType,
    callbacks?: AdEventCallbacks
  ): Promise<void> {
    try {
      await AdService.reportAdClickNow(
        this.currentUser!.userId,
        adResponse.adId,
        adType
      );
      console.log(`IntegratedAdService: ${adType} ad click reported`);
      callbacks?.onAdClicked?.(adResponse.adId, adType);
    } catch (error) {
      console.error(`IntegratedAdService: Error reporting ${adType} ad click:`, error);
    }
  }

  /**
   * Handle ad completion event
   */
  private async handleAdCompletion(
    adResponse: AdResponse,
    adType: AdType,
    callbacks?: AdEventCallbacks
  ): Promise<void> {
    try {
      const startTime = this.adStartTimes.get(adResponse.adId) || Date.now();
      const playDuration = Math.floor((Date.now() - startTime) / 1000);
      const isClicked = this.adClickStates.get(adResponse.adId) || false;

      const reward = await AdService.reportAdCompleteNow(
        this.currentUser!.userId,
        adResponse.adId,
        adType,
        playDuration,
        isClicked
      );

      console.log(`IntegratedAdService: ${adType} ad completion reported, reward: ${reward}`);
      callbacks?.onAdCompleted?.(adResponse.adId, adType, reward);

      // Clean up tracking data
      this.adStartTimes.delete(adResponse.adId);
      this.adClickStates.delete(adResponse.adId);

    } catch (error) {
      console.error(`IntegratedAdService: Error reporting ${adType} ad completion:`, error);
    }
  }

  /**
   * Handle ad skip event
   */
  private async handleAdSkip(
    adResponse: AdResponse,
    adType: AdType,
    callbacks?: AdEventCallbacks
  ): Promise<void> {
    try {
      const startTime = this.adStartTimes.get(adResponse.adId) || Date.now();
      const playDuration = Math.floor((Date.now() - startTime) / 1000);

      await AdService.reportAdSkipNow(
        this.currentUser!.userId,
        adResponse.adId,
        adType,
        playDuration,
        'user_skip'
      );

      console.log(`IntegratedAdService: ${adType} ad skip reported`);
      callbacks?.onAdSkipped?.(adResponse.adId, adType);

      // Clean up tracking data
      this.adStartTimes.delete(adResponse.adId);
      this.adClickStates.delete(adResponse.adId);

    } catch (error) {
      console.error(`IntegratedAdService: Error reporting ${adType} ad skip:`, error);
    }
  }

  /**
   * Handle ad close event
   */
  private async handleAdClose(
    adResponse: AdResponse,
    adType: AdType,
    callbacks?: AdEventCallbacks,
    closeReason?: string
  ): Promise<void> {
    try {
      const startTime = this.adStartTimes.get(adResponse.adId) || Date.now();
      const playDuration = Math.floor((Date.now() - startTime) / 1000);

      await AdService.reportAdCloseNow(
        this.currentUser!.userId,
        adResponse.adId,
        adType,
        playDuration,
        undefined,
        closeReason || 'user_close'
      );

      console.log(`IntegratedAdService: ${adType} ad close reported`);
      callbacks?.onAdClosed?.(adResponse.adId, adType);

      // Clean up tracking data
      this.adStartTimes.delete(adResponse.adId);
      this.adClickStates.delete(adResponse.adId);

    } catch (error) {
      console.error(`IntegratedAdService: Error reporting ${adType} ad close:`, error);
    }
  }

  /**
   * Destroy all ads and clean up resources
   */
  public async destroyAllAds(): Promise<void> {
    try {
      await Promise.all([
        PangleAdService.destroySplashAd().catch(e => console.warn('Failed to destroy splash ad:', e)),
        PangleAdService.destroyRewardVideoAd().catch(e => console.warn('Failed to destroy reward video ad:', e)),
        PangleAdService.destroyInterstitialAd().catch(e => console.warn('Failed to destroy interstitial ad:', e)),
        PangleAdService.destroyBannerAd().catch(e => console.warn('Failed to destroy banner ad:', e)),
      ]);

      // Clear tracking data
      this.adStartTimes.clear();
      this.adClickStates.clear();

      console.log('IntegratedAdService: All ads destroyed and tracking data cleared');
    } catch (error) {
      console.error('IntegratedAdService: Error destroying ads:', error);
    }
  }

  /**
   * Check if SDK is ready
   */
  public async isSDKReady(): Promise<boolean> {
    try {
      const isInitialized = await PangleAdService.isSDKInitialized();
      const isStarted = await PangleAdService.isSDKStarted();
      return isInitialized && isStarted;
    } catch (error) {
      console.error('IntegratedAdService: Error checking SDK status:', error);
      return false;
    }
  }

  /**
   * Get SDK version
   */
  public async getSDKVersion(): Promise<string> {
    try {
      return await PangleAdService.getSDKVersion();
    } catch (error) {
      console.error('IntegratedAdService: Error getting SDK version:', error);
      return 'unknown';
    }
  }
}

// Create singleton instance
const integratedAdService = new IntegratedAdService();

export default integratedAdService;
export { IntegratedAdService, AdEventCallbacks };