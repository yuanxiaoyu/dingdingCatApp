import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import mockService from '../services/MockService';
import PangleAdService from '../services/PangleAdService';
import adService from '../services/AdService';
import { AdType, AdResponse } from '../types';
import AdConfig from '../config/adConfig';
import { ENV_CONFIG } from '../config/env';

const { width } = Dimensions.get('window');

interface BannerAdComponentProps {
  userId?: number;
  onAdClick?: (adData: AdResponse) => void;
  onAdError?: (error: Error) => void;
  style?: any;
}

interface BannerAdState {
  isLoading: boolean;
  isAdLoaded: boolean;
  isAdShowing: boolean;
  error: string | null;
  adData: AdResponse | null;
}

/**
 * Banner广告组件 - 用于首页顶部展示横幅广告
 * 
 * 功能特性:
 * - 自动加载Banner广告
 * - 支持Mock模式和真实广告
 * - 点击统计和收益上报
 * - 自适应尺寸和响应式设计
 * - 错误处理和重试机制
 */
const BannerAdComponent: React.FC<BannerAdComponentProps> = ({
  userId,
  onAdClick,
  onAdError,
  style,
}) => {
  const [state, setState] = useState<BannerAdState>({
    isLoading: true,
    isAdLoaded: false,
    isAdShowing: false,
    error: null,
    adData: null,
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    initializeBannerAd();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  /**
   * 初始化Banner广告
   */
  const initializeBannerAd = async () => {
    try {
      console.log('BannerAdComponent: Initializing banner ad');

      // 检查是否启用Mock模式
      const isMockMode = mockService.isMockModeEnabled();
      
      if (isMockMode) {
        await handleMockBannerAd();
      } else {
        await handleRealBannerAd();
      }

    } catch (error) {
      console.error('BannerAdComponent: Initialization error:', error);
      handleError(error as Error);
    }
  };

  /**
   * 处理Mock Banner广告
   */
  const handleMockBannerAd = async () => {
    try {
      console.log('BannerAdComponent: Using mock banner ad');

      // 模拟加载延迟
      await mockService.simulateNetworkDelay(500, 1000);

      // 获取Mock广告配置
      const adConfig = await mockService.getMockAdConfig();
      
      // 生成Mock Banner广告数据
      const mockAdData: AdResponse = {
        adId: AdConfig.bannerAdId, // 使用adConfig.js中的Banner广告位ID
        adType: AdType.BANNER,
        adTitle: '丁丁猫Banner广告 - Mock模拟',
        adImageUrl: '', // Mock模式使用占位内容
        adClickUrl: 'https://www.dingdingcat.com',

        playDuration: 0, // Banner广告无播放时长
        expectedReward: 5,
        configParams: {
          width: width - 32, // 左右边距16px
          height: 80, // Banner高度
          refreshInterval: 30000, // 30秒刷新间隔
        },
      };

      console.log('BannerAdComponent: Mock banner data generated:', {
        adId: mockAdData.adId,
        title: mockAdData.adTitle,
        size: `${mockAdData.configParams?.width}x${mockAdData.configParams?.height}`,
      });

      setState(prev => ({
        ...prev,
        isLoading: false,
        isAdLoaded: true,
        isAdShowing: true,
        adData: mockAdData,
      }));

      // 启动入场动画
      startEntranceAnimation();

      // 模拟上报展示事件
      console.log('BannerAdComponent: Mock banner ad show reported');

    } catch (error) {
      console.error('BannerAdComponent: Mock banner error:', error);
      handleError(error as Error);
    }
  };

  /**
   * 处理真实Banner广告
   */
  const handleRealBannerAd = async () => {
    try {
      console.log('BannerAdComponent: Using real banner ad with API');

      if (!userId) {
        throw new Error('User ID is required for real banner ads');
      }

      // 请求Banner广告
      const adResponse = await adService.requestBannerAd(userId);
      console.log('BannerAdComponent: Banner ad requested from server:', adResponse.adId);

      // 加载穿山甲Banner广告
      const loadResult = await PangleAdService.loadBannerAd(adResponse.adId);
      console.log('BannerAdComponent: Banner ad loaded in SDK:', loadResult);

      if ((loadResult as any)?.status !== 'loaded') {
        throw new Error('Failed to load banner ad in Pangle SDK');
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        isAdLoaded: true,
        isAdShowing: true,
        adData: adResponse,
      }));

      // 启动入场动画
      startEntranceAnimation();

      // 上报展示事件
      await adService.reportAdShowNow(userId, adResponse.adId, AdType.BANNER);
      console.log('BannerAdComponent: Banner ad show reported to server');

    } catch (error) {
      console.error('BannerAdComponent: Real banner error:', error);
      handleError(error as Error);
    }
  };

  /**
   * 启动入场动画
   */
  const startEntranceAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * 处理Banner广告点击
   */
  const handleBannerClick = async () => {
    if (!state.adData) return;

    try {
      console.log('BannerAdComponent: Banner ad clicked');

      // 上报点击事件（如果不是Mock模式）
      const isMockMode = mockService.isMockModeEnabled();
      if (!isMockMode && userId) {
        await adService.reportAdClickNow(userId, state.adData.adId, AdType.BANNER);
        console.log('BannerAdComponent: Banner click reported to server');
      }

      // 调用点击回调
      if (onAdClick) {
        onAdClick(state.adData);
      }

      // 如果有点击链接，可以在这里处理跳转
      if (state.adData.adClickUrl) {
        console.log('BannerAdComponent: Would navigate to:', state.adData.adClickUrl);
        // 这里可以集成深度链接或浏览器打开
      }

    } catch (error) {
      console.error('BannerAdComponent: Click handling error:', error);
    }
  };

  /**
   * 处理错误
   */
  const handleError = (error: Error) => {
    console.error('BannerAdComponent: Error occurred:', error);

    setState(prev => ({
      ...prev,
      isLoading: false,
      error: error.message,
    }));

    if (onAdError) {
      onAdError(error);
    }

    // 设置重试机制
    retryTimeoutRef.current = setTimeout(() => {
      console.log('BannerAdComponent: Retrying after error...');
      setState(prev => ({ ...prev, error: null, isLoading: true }));
      initializeBannerAd();
    }, 10000); // 10秒后重试
  };

  /**
   * 手动重试
   */
  const handleRetry = () => {
    setState(prev => ({ ...prev, error: null, isLoading: true }));
    initializeBannerAd();
  };

  // 渲染加载状态
  if (state.isLoading) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#1890FF" />
          <Text style={styles.loadingText}>加载广告中...</Text>
        </View>
      </View>
    );
  }

  // 渲染错误状态
  if (state.error) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>广告加载失败</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 渲染Banner广告
  if (state.isAdShowing && state.adData) {
    return (
      <Animated.View
        style={[
          styles.container,
          style,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        <TouchableOpacity
          style={styles.bannerContainer}
          onPress={handleBannerClick}
          activeOpacity={0.8}
        >
          {/* Banner内容 */}
          <View style={styles.bannerContent}>
            {/* 左侧图标 */}
            <View style={styles.bannerIcon}>
              <Text style={styles.iconText}>📰</Text>
            </View>
            
            {/* 中间内容 */}
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle} numberOfLines={1}>
                {state.adData.adTitle}
              </Text>
              <Text style={styles.bannerSubtitle} numberOfLines={1}>
                点击查看详情 • 奖励 ¥{state.adData.expectedReward?.toFixed(2) || '0.05'}
              </Text>
            </View>
            
            {/* 右侧箭头 */}
            <View style={styles.bannerArrow}>
              <Text style={styles.arrowText}>▶</Text>
            </View>
          </View>

          {/* 广告标识 */}
          <View style={styles.adLabel}>
            <Text style={styles.adLabelText}>广告</Text>
          </View>

          {/* Debug信息 */}
          {ENV_CONFIG.DEBUG_MODE && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>
                ID: {state.adData.adId} | Mock: {mockService.isMockModeEnabled() ? 'Y' : 'N'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // 默认不渲染任何内容
  return null;
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  loadingContainer: {
    height: 80,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderStyle: 'dashed',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
  },
  errorContainer: {
    height: 80,
    backgroundColor: '#FFF2F0',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCCC7',
  },
  errorText: {
    fontSize: 14,
    color: '#FF4D4F',
    marginRight: 12,
  },
  retryButton: {
    backgroundColor: '#FF4D4F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  bannerContainer: {
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  bannerTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#666666',
  },
  bannerArrow: {
    marginLeft: 8,
  },
  arrowText: {
    fontSize: 14,
    color: '#1890FF',
    fontWeight: 'bold',
  },
  adLabel: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adLabelText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  debugInfo: {
    position: 'absolute',
    bottom: 4,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: 'monospace',
  },
});

export default BannerAdComponent;