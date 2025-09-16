/**
 * 穿山甲广告服务
 * Pangle Ad Service
 */

import { NativeModules } from 'react-native';

const { PangleAdModule } = NativeModules;

class PangleAdService {
  /**
   * 初始化穿山甲 SDK (第一步)
   * Initialize Pangle SDK (Step 1)
   * @param {string} appId - 应用 ID
   * @returns {Promise<string>} 初始化结果
   */
  static async initializeSDK(appId) {
    try {
      const result = await PangleAdModule.initializeSDK(appId);
      console.log('Pangle SDK initialized:', result);
      return result;
    } catch (error) {
      console.error('Failed to initialize Pangle SDK:', error);
      throw error;
    }
  }

  /**
   * 启动穿山甲 SDK (第二步)
   * Start Pangle SDK (Step 2)
   * @returns {Promise<string>} 启动结果
   */
  static async startSDK() {
    try {
      const result = await PangleAdModule.startSDK();
      console.log('Pangle SDK started:', result);
      return result;
    } catch (error) {
      console.error('Failed to start Pangle SDK:', error);
      throw error;
    }
  }

  /**
   * 两步初始化 SDK (完整流程)
   * Two-step SDK initialization (Complete flow)
   * @param {string} appId - 应用 ID
   * @returns {Promise<string>} 初始化和启动结果
   */
  static async initializeAndStartSDK(appId) {
    try {
      // 第一步：初始化
      await this.initializeSDK(appId);
      
      // 第二步：启动
      await this.startSDK();
      
      console.log('Pangle SDK fully initialized and started');
      return 'SDK fully initialized and started';
    } catch (error) {
      console.error('Failed to initialize and start Pangle SDK:', error);
      throw error;
    }
  }

  /**
   * 检查 SDK 是否已初始化
   * Check if SDK is initialized
   * @returns {Promise<boolean>} 是否已初始化
   */
  static async isSDKInitialized() {
    try {
      return await PangleAdModule.isSDKInitialized();
    } catch (error) {
      console.error('Failed to check SDK initialization status:', error);
      return false;
    }
  }

  /**
   * 检查 SDK 是否已启动
   * Check if SDK is started
   * @returns {Promise<boolean>} 是否已启动
   */
  static async isSDKStarted() {
    try {
      return await PangleAdModule.isSDKStarted();
    } catch (error) {
      console.error('Failed to check SDK start status:', error);
      return false;
    }
  }

  /**
   * 获取 SDK 版本信息
   * Get SDK version info
   * @returns {Promise<string>} SDK 版本
   */
  static async getSDKVersion() {
    try {
      return await PangleAdModule.getSDKVersion();
    } catch (error) {
      console.error('Failed to get SDK version:', error);
      throw error;
    }
  }

  // ==================== 开屏广告相关方法 ====================

  /**
   * 加载开屏广告
   * Load splash ad
   * @param {string} adId - 广告位 ID
   * @returns {Promise<Object>} 加载结果
   */
  static async loadSplashAd(adId) {
    try {
      console.log('Loading splash ad with ID:', adId);
      
      if (!PangleAdModule || !PangleAdModule.loadSplashAd) {
        throw new Error('PangleAdModule.loadSplashAd is not available');
      }
      
      const result = await PangleAdModule.loadSplashAd(adId);
      console.log('Splash ad loaded:', result);
      return result;
    } catch (error) {
      console.error('Failed to load splash ad:', error);
      throw error;
    }
  }

  /**
   * 展示开屏广告
   * Show splash ad
   * @returns {Promise<Object>} 展示结果
   */
  static async showSplashAd() {
    try {
      console.log('Showing splash ad');
      const result = await PangleAdModule.showSplashAd();
      console.log('Splash ad shown:', result);
      return result;
    } catch (error) {
      console.error('Failed to show splash ad:', error);
      throw error;
    }
  }

  /**
   * 销毁开屏广告
   * Destroy splash ad
   * @returns {Promise<string>} 销毁结果
   */
  static async destroySplashAd() {
    try {
      console.log('Destroying splash ad');
      const result = await PangleAdModule.destroySplashAd();
      console.log('Splash ad destroyed:', result);
      return result;
    } catch (error) {
      console.error('Failed to destroy splash ad:', error);
      throw error;
    }
  }

  /**
   * 检查开屏广告是否已加载
   * Check if splash ad is loaded
   * @returns {Promise<boolean>} 是否已加载
   */
  static async isSplashAdLoaded() {
    try {
      return await PangleAdModule.isSplashAdLoaded();
    } catch (error) {
      console.error('Failed to check splash ad loaded status:', error);
      return false;
    }
  }

  /**
   * 检查开屏广告是否正在加载
   * Check if splash ad is loading
   * @returns {Promise<boolean>} 是否正在加载
   */
  static async isSplashAdLoading() {
    try {
      return await PangleAdModule.isSplashAdLoading();
    } catch (error) {
      console.error('Failed to check splash ad loading status:', error);
      return false;
    }
  }

  /**
   * 加载并展示开屏广告 (便捷方法)
   * Load and show splash ad (Convenience method)
   * @param {string} adId - 广告位 ID
   * @returns {Promise<Object>} 操作结果
   */
  static async loadAndShowSplashAd(adId) {
    try {
      console.log('Loading and showing splash ad with ID:', adId);
      
      // Check if PangleAdModule is available
      if (!PangleAdModule) {
        throw new Error('PangleAdModule is not available. Make sure the native module is properly linked.');
      }
      
      if (!PangleAdModule.loadSplashAd) {
        throw new Error('loadSplashAd method is not available in PangleAdModule. Available methods: ' + Object.keys(PangleAdModule).join(', '));
      }
      
      // 先加载广告
      const loadResult = await this.loadSplashAd(adId);
      console.log('Splash ad load result:', loadResult);
      
      // 如果加载成功，则展示广告
      if (loadResult && loadResult.status === 'loaded') {
        const showResult = await this.showSplashAd();
        console.log('Splash ad show result:', showResult);
        return {
          loadResult,
          showResult
        };
      } else {
        throw new Error('Splash ad not loaded properly');
      }
      
    } catch (error) {
      console.error('Failed to load and show splash ad:', error);
      throw error;
    }
  }

  // ==================== 激励视频广告相关方法 ====================

  /**
   * 加载激励视频广告
   * Load reward video ad
   * @param {string} adId - 广告位 ID
   * @returns {Promise<Object>} 加载结果
   */
  static async loadRewardVideoAd(adId) {
    try {
      console.log('Loading reward video ad with ID:', adId);
      
      if (!PangleAdModule || !PangleAdModule.loadRewardVideoAd) {
        throw new Error('PangleAdModule.loadRewardVideoAd is not available');
      }
      
      const result = await PangleAdModule.loadRewardVideoAd(adId);
      console.log('Reward video ad loaded:', result);
      return result;
    } catch (error) {
      console.error('Failed to load reward video ad:', error);
      throw error;
    }
  }

  /**
   * 展示激励视频广告
   * Show reward video ad
   * @returns {Promise<Object>} 展示结果
   */
  static async showRewardVideoAd() {
    try {
      console.log('Showing reward video ad');
      const result = await PangleAdModule.showRewardVideoAd();
      console.log('Reward video ad shown:', result);
      return result;
    } catch (error) {
      console.error('Failed to show reward video ad:', error);
      throw error;
    }
  }

  /**
   * 销毁激励视频广告
   * Destroy reward video ad
   * @returns {Promise<string>} 销毁结果
   */
  static async destroyRewardVideoAd() {
    try {
      console.log('Destroying reward video ad');
      const result = await PangleAdModule.destroyRewardVideoAd();
      console.log('Reward video ad destroyed:', result);
      return result;
    } catch (error) {
      console.error('Failed to destroy reward video ad:', error);
      throw error;
    }
  }

  /**
   * 检查激励视频广告是否已加载
   * Check if reward video ad is loaded
   * @returns {Promise<boolean>} 是否已加载
   */
  static async isRewardVideoAdLoaded() {
    try {
      return await PangleAdModule.isRewardVideoAdLoaded();
    } catch (error) {
      console.error('Failed to check reward video ad loaded status:', error);
      return false;
    }
  }

  /**
   * 检查激励视频广告是否正在加载
   * Check if reward video ad is loading
   * @returns {Promise<boolean>} 是否正在加载
   */
  static async isRewardVideoAdLoading() {
    try {
      return await PangleAdModule.isRewardVideoAdLoading();
    } catch (error) {
      console.error('Failed to check reward video ad loading status:', error);
      return false;
    }
  }

  /**
   * 加载并展示激励视频广告 (便捷方法)
   * Load and show reward video ad (Convenience method)
   * @param {string} adId - 广告位 ID
   * @returns {Promise<Object>} 操作结果
   */
  static async loadAndShowRewardVideoAd(adId) {
    try {
      console.log('Loading and showing reward video ad with ID:', adId);
      
      // Check if PangleAdModule is available
      if (!PangleAdModule) {
        throw new Error('PangleAdModule is not available. Make sure the native module is properly linked.');
      }
      
      if (!PangleAdModule.loadRewardVideoAd) {
        throw new Error('loadRewardVideoAd method is not available in PangleAdModule. Available methods: ' + Object.keys(PangleAdModule).join(', '));
      }
      
      // 先加载广告
      const loadResult = await this.loadRewardVideoAd(adId);
      console.log('Reward video ad load result:', loadResult);
      
      // 如果加载成功，则展示广告
      if (loadResult && loadResult.status === 'loaded') {
        const showResult = await this.showRewardVideoAd();
        console.log('Reward video ad show result:', showResult);
        return {
          loadResult,
          showResult
        };
      } else {
        throw new Error('Reward video ad not loaded properly');
      }
      
    } catch (error) {
      console.error('Failed to load and show reward video ad:', error);
      throw error;
    }
  }

  // ==================== 新插屏广告相关方法 ====================

  /**
   * 加载新插屏广告
   * Load interstitial ad
   * @param {string} adId - 广告位 ID
   * @returns {Promise<Object>} 加载结果
   */
  static async loadInterstitialAd(adId) {
    try {
      console.log('Loading interstitial ad with ID:', adId);
      
      if (!PangleAdModule || !PangleAdModule.loadInterstitialAd) {
        throw new Error('PangleAdModule.loadInterstitialAd is not available');
      }
      
      const result = await PangleAdModule.loadInterstitialAd(adId);
      console.log('Interstitial ad loaded:', result);
      return result;
    } catch (error) {
      console.error('Failed to load interstitial ad:', error);
      throw error;
    }
  }

  /**
   * 展示新插屏广告
   * Show interstitial ad
   * @returns {Promise<Object>} 展示结果
   */
  static async showInterstitialAd() {
    try {
      console.log('Showing interstitial ad');
      const result = await PangleAdModule.showInterstitialAd();
      console.log('Interstitial ad shown:', result);
      return result;
    } catch (error) {
      console.error('Failed to show interstitial ad:', error);
      throw error;
    }
  }

  /**
   * 销毁新插屏广告
   * Destroy interstitial ad
   * @returns {Promise<string>} 销毁结果
   */
  static async destroyInterstitialAd() {
    try {
      console.log('Destroying interstitial ad');
      const result = await PangleAdModule.destroyInterstitialAd();
      console.log('Interstitial ad destroyed:', result);
      return result;
    } catch (error) {
      console.error('Failed to destroy interstitial ad:', error);
      throw error;
    }
  }

  /**
   * 检查新插屏广告是否已加载
   * Check if interstitial ad is loaded
   * @returns {Promise<boolean>} 是否已加载
   */
  static async isInterstitialAdLoaded() {
    try {
      return await PangleAdModule.isInterstitialAdLoaded();
    } catch (error) {
      console.error('Failed to check interstitial ad loaded status:', error);
      return false;
    }
  }

  /**
   * 检查新插屏广告是否正在加载
   * Check if interstitial ad is loading
   * @returns {Promise<boolean>} 是否正在加载
   */
  static async isInterstitialAdLoading() {
    try {
      return await PangleAdModule.isInterstitialAdLoading();
    } catch (error) {
      console.error('Failed to check interstitial ad loading status:', error);
      return false;
    }
  }

  /**
   * 加载并展示新插屏广告 (便捷方法)
   * Load and show interstitial ad (Convenience method)
   * @param {string} adId - 广告位 ID
   * @returns {Promise<Object>} 操作结果
   */
  static async loadAndShowInterstitialAd(adId) {
    try {
      console.log('Loading and showing interstitial ad with ID:', adId);
      
      // Check if PangleAdModule is available
      if (!PangleAdModule) {
        throw new Error('PangleAdModule is not available. Make sure the native module is properly linked.');
      }
      
      if (!PangleAdModule.loadInterstitialAd) {
        throw new Error('loadInterstitialAd method is not available in PangleAdModule. Available methods: ' + Object.keys(PangleAdModule).join(', '));
      }
      
      // 先加载广告
      const loadResult = await this.loadInterstitialAd(adId);
      console.log('Interstitial ad load result:', loadResult);
      
      // 如果加载成功，则展示广告
      if (loadResult && loadResult.status === 'loaded') {
        const showResult = await this.showInterstitialAd();
        console.log('Interstitial ad show result:', showResult);
        return {
          loadResult,
          showResult
        };
      } else {
        throw new Error('Interstitial ad not loaded properly');
      }
      
    } catch (error) {
      console.error('Failed to load and show interstitial ad:', error);
      throw error;
    }
  }

  // ==================== Banner 广告相关方法 ====================

  /**
   * 加载 Banner 广告
   * Load banner ad
   * @param {string} adId - 广告位 ID
   * @returns {Promise<Object>} 加载结果
   */
  static async loadBannerAd(adId) {
    try {
      console.log('Loading banner ad with ID:', adId);
      
      if (!PangleAdModule || !PangleAdModule.loadBannerAd) {
        throw new Error('PangleAdModule.loadBannerAd is not available');
      }
      
      const result = await PangleAdModule.loadBannerAd(adId);
      console.log('Banner ad loaded:', result);
      return result;
    } catch (error) {
      console.error('Failed to load banner ad:', error);
      throw error;
    }
  }

  /**
   * 展示 Banner 广告
   * Show banner ad
   * @returns {Promise<Object>} 展示结果
   */
  static async showBannerAd() {
    try {
      console.log('Showing banner ad');
      const result = await PangleAdModule.showBannerAd();
      console.log('Banner ad shown:', result);
      return result;
    } catch (error) {
      console.error('Failed to show banner ad:', error);
      throw error;
    }
  }

  /**
   * 销毁 Banner 广告
   * Destroy banner ad
   * @returns {Promise<string>} 销毁结果
   */
  static async destroyBannerAd() {
    try {
      console.log('Destroying banner ad');
      const result = await PangleAdModule.destroyBannerAd();
      console.log('Banner ad destroyed:', result);
      return result;
    } catch (error) {
      console.error('Failed to destroy banner ad:', error);
      throw error;
    }
  }

  /**
   * 检查 Banner 广告是否已加载
   * Check if banner ad is loaded
   * @returns {Promise<boolean>} 是否已加载
   */
  static async isBannerAdLoaded() {
    try {
      return await PangleAdModule.isBannerAdLoaded();
    } catch (error) {
      console.error('Failed to check banner ad loaded status:', error);
      return false;
    }
  }

  /**
   * 检查 Banner 广告是否正在加载
   * Check if banner ad is loading
   * @returns {Promise<boolean>} 是否正在加载
   */
  static async isBannerAdLoading() {
    try {
      return await PangleAdModule.isBannerAdLoading();
    } catch (error) {
      console.error('Failed to check banner ad loading status:', error);
      return false;
    }
  }

  /**
   * 加载并展示 Banner 广告 (便捷方法)
   * Load and show banner ad (Convenience method)
   * @param {string} adId - 广告位 ID
   * @returns {Promise<Object>} 操作结果
   */
  static async loadAndShowBannerAd(adId) {
    try {
      console.log('Loading and showing banner ad with ID:', adId);
      
      // Check if PangleAdModule is available
      if (!PangleAdModule) {
        throw new Error('PangleAdModule is not available. Make sure the native module is properly linked.');
      }
      
      if (!PangleAdModule.loadBannerAd) {
        throw new Error('loadBannerAd method is not available in PangleAdModule. Available methods: ' + Object.keys(PangleAdModule).join(', '));
      }
      
      // 先加载广告
      const loadResult = await this.loadBannerAd(adId);
      console.log('Banner ad load result:', loadResult);
      
      // 如果加载成功，则展示广告
      if (loadResult && loadResult.status === 'loaded') {
        const showResult = await this.showBannerAd();
        console.log('Banner ad show result:', showResult);
        return {
          loadResult,
          showResult
        };
      } else {
        throw new Error('Banner ad not loaded properly');
      }
      
    } catch (error) {
      console.error('Failed to load and show banner ad:', error);
      throw error;
    }
  }

  // ==================== 信息流广告相关方法 ====================

  /**
   * 加载信息流广告
   * Load feed ad
   * @param {string} adId - 广告位 ID
   * @returns {Promise<Object>} 加载结果
   */
  static async loadFeedAd(adId) {
    try {
      console.log('Loading feed ad with ID:', adId);
      
      if (!PangleAdModule || !PangleAdModule.loadFeedAd) {
        throw new Error('PangleAdModule.loadFeedAd is not available');
      }
      
      const result = await PangleAdModule.loadFeedAd(adId);
      console.log('Feed ad loaded:', result);
      return result;
    } catch (error) {
      console.error('Failed to load feed ad:', error);
      throw error;
    }
  }

  /**
   * 展示信息流广告
   * Show feed ad
   * @returns {Promise<Object>} 展示结果
   */
  static async showFeedAd() {
    try {
      console.log('Showing feed ad');
      const result = await PangleAdModule.showFeedAd();
      console.log('Feed ad shown:', result);
      return result;
    } catch (error) {
      console.error('Failed to show feed ad:', error);
      throw error;
    }
  }

  /**
   * 销毁信息流广告
   * Destroy feed ad
   * @returns {Promise<string>} 销毁结果
   */
  static async destroyFeedAd() {
    try {
      console.log('Destroying feed ad');
      const result = await PangleAdModule.destroyFeedAd();
      console.log('Feed ad destroyed:', result);
      return result;
    } catch (error) {
      console.error('Failed to destroy feed ad:', error);
      throw error;
    }
  }

  /**
   * 检查信息流广告是否已加载
   * Check if feed ad is loaded
   * @returns {Promise<boolean>} 是否已加载
   */
  static async isFeedAdLoaded() {
    try {
      return await PangleAdModule.isFeedAdLoaded();
    } catch (error) {
      console.error('Failed to check feed ad loaded status:', error);
      return false;
    }
  }

  /**
   * 检查信息流广告是否正在加载
   * Check if feed ad is loading
   * @returns {Promise<boolean>} 是否正在加载
   */
  static async isFeedAdLoading() {
    try {
      return await PangleAdModule.isFeedAdLoading();
    } catch (error) {
      console.error('Failed to check feed ad loading status:', error);
      return false;
    }
  }

  /**
   * 加载并展示信息流广告 (便捷方法)
   * Load and show feed ad (Convenience method)
   * @param {string} adId - 广告位 ID
   * @returns {Promise<Object>} 操作结果
   */
  static async loadAndShowFeedAd(adId) {
    try {
      console.log('Loading and showing feed ad with ID:', adId);
      
      // Check if PangleAdModule is available
      if (!PangleAdModule) {
        throw new Error('PangleAdModule is not available. Make sure the native module is properly linked.');
      }
      
      if (!PangleAdModule.loadFeedAd) {
        throw new Error('loadFeedAd method is not available in PangleAdModule. Available methods: ' + Object.keys(PangleAdModule).join(', '));
      }
      
      // 先加载广告
      const loadResult = await this.loadFeedAd(adId);
      console.log('Feed ad load result:', loadResult);
      
      // 如果加载成功，则展示广告
      if (loadResult && loadResult.status === 'loaded') {
        const showResult = await this.showFeedAd();
        console.log('Feed ad show result:', showResult);
        return {
          loadResult,
          showResult
        };
      } else {
        throw new Error('Feed ad not loaded properly');
      }
      
    } catch (error) {
      console.error('Failed to load and show feed ad:', error);
      throw error;
    }
  }

  // ==================== Draw 信息流广告相关方法 ====================

  /**
   * 加载 Draw 信息流广告
   * Load draw feed ad
   * @param {string} adId - 广告位 ID
   * @returns {Promise<Object>} 加载结果
   */
  static async loadDrawFeedAd(adId) {
    try {
      console.log('Loading draw feed ad with ID:', adId);
      
      if (!PangleAdModule || !PangleAdModule.loadDrawFeedAd) {
        throw new Error('PangleAdModule.loadDrawFeedAd is not available');
      }
      
      const result = await PangleAdModule.loadDrawFeedAd(adId);
      console.log('Draw feed ad loaded:', result);
      return result;
    } catch (error) {
      console.error('Failed to load draw feed ad:', error);
      throw error;
    }
  }

  /**
   * 展示 Draw 信息流广告
   * Show draw feed ad
   * @returns {Promise<Object>} 展示结果
   */
  static async showDrawFeedAd() {
    try {
      console.log('Showing draw feed ad');
      const result = await PangleAdModule.showDrawFeedAd();
      console.log('Draw feed ad shown:', result);
      return result;
    } catch (error) {
      console.error('Failed to show draw feed ad:', error);
      throw error;
    }
  }

  /**
   * 销毁 Draw 信息流广告
   * Destroy draw feed ad
   * @returns {Promise<string>} 销毁结果
   */
  static async destroyDrawFeedAd() {
    try {
      console.log('Destroying draw feed ad');
      const result = await PangleAdModule.destroyDrawFeedAd();
      console.log('Draw feed ad destroyed:', result);
      return result;
    } catch (error) {
      console.error('Failed to destroy draw feed ad:', error);
      throw error;
    }
  }

  /**
   * 检查 Draw 信息流广告是否已加载
   * Check if draw feed ad is loaded
   * @returns {Promise<boolean>} 是否已加载
   */
  static async isDrawFeedAdLoaded() {
    try {
      return await PangleAdModule.isDrawFeedAdLoaded();
    } catch (error) {
      console.error('Failed to check draw feed ad loaded status:', error);
      return false;
    }
  }

  /**
   * 检查 Draw 信息流广告是否正在加载
   * Check if draw feed ad is loading
   * @returns {Promise<boolean>} 是否正在加载
   */
  static async isDrawFeedAdLoading() {
    try {
      return await PangleAdModule.isDrawFeedAdLoading();
    } catch (error) {
      console.error('Failed to check draw feed ad loading status:', error);
      return false;
    }
  }

  /**
   * 检查 Draw 信息流广告是否为模板广告
   * Check if draw feed ad is express ad
   * @returns {Promise<boolean>} 是否为模板广告
   */
  static async isDrawFeedAdExpress() {
    try {
      return await PangleAdModule.isDrawFeedAdExpress();
    } catch (error) {
      console.error('Failed to check draw feed ad express status:', error);
      return false;
    }
  }

  /**
   * 加载并展示 Draw 信息流广告 (便捷方法)
   * Load and show draw feed ad (Convenience method)
   * @param {string} adId - 广告位 ID
   * @returns {Promise<Object>} 操作结果
   */
  static async loadAndShowDrawFeedAd(adId) {
    try {
      console.log('Loading and showing draw feed ad with ID:', adId);
      
      // Check if PangleAdModule is available
      if (!PangleAdModule) {
        throw new Error('PangleAdModule is not available. Make sure the native module is properly linked.');
      }
      
      if (!PangleAdModule.loadDrawFeedAd) {
        throw new Error('loadDrawFeedAd method is not available in PangleAdModule. Available methods: ' + Object.keys(PangleAdModule).join(', '));
      }
      
      // 先加载广告
      const loadResult = await this.loadDrawFeedAd(adId);
      console.log('Draw feed ad load result:', loadResult);
      
      // 如果加载成功，则展示广告
      if (loadResult && loadResult.status === 'loaded') {
        const showResult = await this.showDrawFeedAd();
        console.log('Draw feed ad show result:', showResult);
        return {
          loadResult,
          showResult
        };
      } else {
        throw new Error('Draw feed ad not loaded properly');
      }
      
    } catch (error) {
      console.error('Failed to load and show draw feed ad:', error);
      throw error;
    }
  }
}

export default PangleAdService;