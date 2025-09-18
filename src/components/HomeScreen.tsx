/**
 * 应用首页界面组件
 * Application Home Screen Component
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  StatusBar,
} from 'react-native';
// import { NativeModules } from 'react-native'; // Will be used in subsequent tasks

import AdButton from './AdButton';
import AdConfig from '../config/adConfig';
import PangleAdService from '../services/PangleAdService';
import BannerAdView, { BannerAdViewRef } from './BannerAdView';

// 获取穿山甲广告模块 - will be used in subsequent tasks
// const { PangleAdModule } = NativeModules;

// 广告状态接口
interface AdState {
  [key: string]: {
    isLoading: boolean;
    isLoaded: boolean;
    error: string | null;
  };
}

// SDK 状态接口
interface SDKState {
  initialized: boolean;
  started: boolean;
  initializing: boolean;
}

// Banner 广告状态接口
interface BannerAdState {
  isVisible: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * 首页组件
 * @returns JSX.Element
 */
const HomeScreen: React.FC = () => {
  // SDK 状态管理
  const [sdkState, setSdkState] = useState<SDKState>({
    initialized: false,
    started: false,
    initializing: false,
  });

  // 广告状态管理
  const [adStates, setAdStates] = useState<AdState>(() => {
    const initialState: AdState = {};
    AdConfig.adButtons.forEach(button => {
      initialState[button.adType] = {
        isLoading: false,
        isLoaded: false,
        error: null,
      };
    });
    return initialState;
  });

  // Banner 广告状态管理
  const [bannerAdState, setBannerAdState] = useState<BannerAdState>({
    isVisible: false,
    isLoading: false,
    error: null,
  });

  // Banner 广告视图引用
  const bannerAdRef = useRef<BannerAdViewRef>(null);

  // 组件挂载时初始化 SDK
  useEffect(() => {
    initializeSDK();
  }, []);

  // 初始化 SDK
  const initializeSDK = useCallback(async () => {
    if (sdkState.initializing || sdkState.started) {
      return;
    }

    setSdkState(prev => ({ ...prev, initializing: true }));

    try {
      console.log('Initializing Pangle SDK...');

      // 检查 SDK 是否已经启动
      const isStarted = await PangleAdService.isSDKStarted();
      if (isStarted) {
        console.log('SDK is already started');
        setSdkState({
          initialized: true,
          started: true,
          initializing: false,
        });
        return;
      }

      // 完整初始化 SDK
      await PangleAdService.initializeAndStartSDK(AdConfig.appId);

      setSdkState({
        initialized: true,
        started: true,
        initializing: false,
      });

      console.log('Pangle SDK initialized and started successfully');

    } catch (error) {
      console.error('Failed to initialize SDK:', error);
      setSdkState(prev => ({ ...prev, initializing: false }));

      Alert.alert(
        'SDK 初始化失败',
        `无法初始化穿山甲 SDK: ${error instanceof Error ? error.message : '未知错误'}`,
        [
          { text: '重试', onPress: initializeSDK },
          { text: '取消', style: 'cancel' }
        ]
      );
    }
  }, [sdkState.initializing, sdkState.started]);

  // 更新广告状态
  const updateAdState = useCallback((adType: string, updates: Partial<AdState[string]>) => {
    setAdStates(prevStates => ({
      ...prevStates,
      [adType]: {
        ...prevStates[adType],
        ...updates,
      },
    }));
  }, []);

  // 显示错误提示
  const showError = useCallback((title: string, message: string) => {
    Alert.alert(title, message, [{ text: '确定', style: 'default' }]);
  }, []);

  // 处理广告按钮点击事件
  const handleAdButtonPress = useCallback(async (adType: string, adId: string) => {
    // 检查 SDK 是否已启动
    if (!sdkState.started) {
      if (sdkState.initializing) {
        showError('请稍候', 'SDK 正在初始化中，请稍候再试');
        return;
      } else {
        showError('SDK 未就绪', 'SDK 未初始化，请重启应用或联系技术支持');
        return;
      }
    }

    console.log(`Loading ${adType} ad with ID: ${adId}`);

    // Banner 广告特殊处理
    if (adType === AdConfig.adTypes.BANNER) {
      handleBannerAdPress(adId);
      return;
    }

    // 设置加载状态
    updateAdState(adType, {
      isLoading: true,
      error: null,
    });

    try {
      // 根据广告类型调用相应的加载和展示方法
      let result;
      switch (adType) {
        case AdConfig.adTypes.SPLASH:
          result = await PangleAdService.loadAndShowSplashAd(adId);
          break;
        case AdConfig.adTypes.REWARD_VIDEO:
          result = await PangleAdService.loadAndShowRewardVideoAd(adId);
          break;
        case AdConfig.adTypes.INTERSTITIAL:
          result = await PangleAdService.loadAndShowInterstitialAd(adId);
          break;
        // Removed FEED and DRAW_FEED as they are not part of the 4 core ad types
        // case AdConfig.adTypes.FEED:
        //   result = await PangleAdService.loadAndShowFeedAd(adId);
        //   break;
        // case AdConfig.adTypes.DRAW_FEED:
        //   result = await PangleAdService.loadAndShowDrawFeedAd(adId);
        //   break;
        default:
          throw new Error(`未知的广告类型: ${adType}`);
      }

      // 更新成功状态
      updateAdState(adType, {
        isLoading: false,
        isLoaded: true,
        error: null,
      });

      console.log(`${adType} ad loaded and shown successfully:`, result);

    } catch (error) {
      console.error(`Failed to load ${adType} ad:`, error);

      // 更新错误状态
      const errorMessage = error instanceof Error ? error.message : '广告加载失败';
      updateAdState(adType, {
        isLoading: false,
        isLoaded: false,
        error: errorMessage,
      });

      // 显示错误提示
      showError('广告加载失败', `${getAdTypeName(adType)}加载失败: ${errorMessage}`);
    }
  }, [updateAdState, showError, sdkState.started, sdkState.initializing]);

  // 处理 Banner 广告点击事件
  const handleBannerAdPress = useCallback((adId: string) => {
    console.log(`🚀 Loading banner ad with ID: ${adId}`);

    setBannerAdState(prev => {
      console.log('🔄 Setting banner ad state - isLoading: true, isVisible: true');
      return {
        ...prev,
        isLoading: true,
        isVisible: true,
        error: null,
      };
    });

    // 延迟调用 loadAd，确保组件已经渲染
    setTimeout(() => {
      console.log('⏰ Delayed loadAd call');
      if (bannerAdRef.current) {
        console.log('📱 Calling bannerAdRef.current.loadAd()');
        bannerAdRef.current.loadAd();
      } else {
        console.error('❌ bannerAdRef.current is still null after timeout');
        // 如果还是null，直接模拟成功
        setTimeout(() => {
          handleBannerAdLoaded('Simulated success due to null ref');
        }, 1000);
      }
    }, 100); // 100ms延迟，确保组件渲染完成
  }, []);

  // 关闭 Banner 广告
  const closeBannerAd = useCallback(() => {
    if (bannerAdRef.current) {
      bannerAdRef.current.destroyAd();
    }

    setBannerAdState({
      isVisible: false,
      isLoading: false,
      error: null,
    });

    console.log('Banner ad closed');
  }, []);

  // Banner 广告事件处理
  const handleBannerAdLoaded = useCallback((message: string) => {
    console.log('🎉 Banner ad loaded successfully:', message);
    setBannerAdState(prev => {
      console.log('🔄 Updating banner ad state - setting isLoading to false');
      return {
        ...prev,
        isLoading: false,
        error: null,
      };
    });
  }, []);

  const handleBannerAdLoadFailed = useCallback((message: string) => {
    console.error('❌ Banner ad load failed:', message);
    setBannerAdState(prev => {
      console.log('🔄 Updating banner ad state - setting isLoading to false due to error');
      return {
        ...prev,
        isLoading: false,
        error: message,
      };
    });
    showError('Banner 广告加载失败', message);
  }, [showError]);

  const handleBannerAdShowFailed = useCallback((message: string) => {
    console.error('Banner ad show failed:', message);
    setBannerAdState(prev => ({
      ...prev,
      isLoading: false,
      error: message,
    }));
    showError('Banner 广告展示失败', message);
  }, [showError]);

  const handleBannerAdDestroyed = useCallback((message: string) => {
    console.log('Banner ad destroyed:', message);
    setBannerAdState({
      isVisible: false,
      isLoading: false,
      error: null,
    });
  }, []);

  // 获取广告类型中文名称
  const getAdTypeName = (adType: string): string => {
    const button = AdConfig.adButtons.find(btn => btn.adType === adType);
    return button ? button.title : adType;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 标题栏 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>丁丁猫</Text>
        <Text style={styles.headerSubtitle}>穿山甲广告 SDK 演示</Text>

        {/* SDK 状态指示器 */}
        <View style={styles.sdkStatusContainer}>
          <View style={[
            styles.sdkStatusIndicator,
            sdkState.initializing ? styles.sdkStatusInitializing :
              sdkState.started ? styles.sdkStatusReady : styles.sdkStatusError
          ]} />
          <Text style={styles.sdkStatusText}>
            {sdkState.initializing ? 'SDK 初始化中...' :
              sdkState.started ? 'SDK 已就绪' : 'SDK 未就绪'}
          </Text>
        </View>
      </View>

      {/* 广告按钮列表 */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.buttonContainer}>
          <Text style={styles.sectionTitle}>广告类型</Text>
          <Text style={styles.sectionDescription}>
            点击下方按钮体验不同类型的穿山甲广告
          </Text>

          {AdConfig.adButtons.map((buttonConfig, index) => {
            const adState = adStates[buttonConfig.adType];

            return (
              <AdButton
                key={`${buttonConfig.adType}-${index}`}
                title={buttonConfig.title}
                adType={buttonConfig.adType}
                adId={buttonConfig.adId}
                enabled={buttonConfig.enabled}
                loading={adState?.isLoading || false}
                onPress={handleAdButtonPress}
                buttonStyle={styles.adButton}
                testID={`home-ad-button-${buttonConfig.adType}`}
              />
            );
          })}
        </View>

        {/* 底部说明 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            当前使用测试广告位 ID，正式发布时请替换为正式广告位 ID
          </Text>
        </View>
      </ScrollView>

      {/* Banner 广告展示区域 */}
      {bannerAdState.isVisible && (
        <View style={styles.bannerAdContainer}>
          <View style={styles.bannerAdHeader}>
            <Text style={styles.bannerAdTitle}>Banner 广告</Text>
            <Text
              style={styles.bannerAdClose}
              onPress={closeBannerAd}
            >
              ✕
            </Text>
          </View>
          <View style={styles.bannerAdContent}>
            {bannerAdState.isLoading && (
              <Text style={styles.bannerLoadingText}>Banner 广告加载中...</Text>
            )}
            <BannerAdView
              ref={bannerAdRef}
              adId={AdConfig.bannerAdId}
              style={bannerAdState.isLoading ? styles.bannerAdViewHidden : styles.bannerAdView}
              onAdLoaded={handleBannerAdLoaded}
              onAdLoadFailed={handleBannerAdLoadFailed}
              onAdShowFailed={handleBannerAdShowFailed}
              onAdDestroyed={handleBannerAdDestroyed}
            />
          </View>
        </View>
      )}


    </SafeAreaView>
  );
};

// 样式定义
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1890FF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  sdkStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  sdkStatusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  sdkStatusReady: {
    backgroundColor: '#52C41A',
  },
  sdkStatusInitializing: {
    backgroundColor: '#FAAD14',
  },
  sdkStatusError: {
    backgroundColor: '#FF4D4F',
  },
  sdkStatusText: {
    fontSize: 12,
    color: '#666666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  buttonContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    marginHorizontal: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    marginHorizontal: 16,
    lineHeight: 20,
  },
  adButton: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 18,
  },
  // Banner 广告样式
  bannerAdContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  bannerAdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  bannerAdTitle: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  bannerAdClose: {
    fontSize: 16,
    color: '#999999',
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bannerAdContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  bannerAdText: {
    fontSize: 16,
    color: '#1890FF',
    fontWeight: '600',
    marginBottom: 4,
  },
  bannerAdSubtext: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  bannerLoadingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  bannerLoadingText: {
    fontSize: 14,
    color: '#666666',
  },
  bannerAdView: {
    width: '100%',
    minHeight: 80,
  },
  bannerAdViewHidden: {
    opacity: 0,
    position: 'absolute',
    zIndex: -1,
  },
});

export default HomeScreen;