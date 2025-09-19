import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Animated,
  StatusBar,
} from 'react-native';
import configService from '../services/ConfigService';
import adService from '../services/AdService';
import mockService from '../services/MockService';
import PangleAdService from '../services/PangleAdService';
import { AdType, AdConfig, AdResponse } from '../types';
import { ENV_CONFIG } from '../config/env';

const { width, height } = Dimensions.get('window');

interface SplashAdScreenProps {
  userId: number;
  onAdComplete: () => void;
  onAdSkipped: () => void;
  onAdError: (error: Error) => void;
}

interface SplashAdState {
  isLoading: boolean;
  isAdLoaded: boolean;
  isAdShowing: boolean;
  canSkip: boolean;
  countdown: number;
  error: string | null;
  adData: AdResponse | null;
}

/**
 * 开屏广告屏幕 - 处理开屏广告展示和完整API集成
 * 
 * 功能特性:
 * - 从服务器加载广告配置
 * - 通过API请求开屏广告
 * - 集成穿山甲SDK进行广告展示
 * - 向服务器上报广告事件
 * - 处理跳过功能和倒计时
 * - 支持开发环境Mock模式
 */
const SplashAdScreen: React.FC<SplashAdScreenProps> = ({
  userId,
  onAdComplete,
  onAdSkipped,
  onAdError,
}) => {
  const [state, setState] = useState<SplashAdState>({
    isLoading: true,
    isAdLoaded: false,
    isAdShowing: false,
    canSkip: false,
    countdown: 5,
    error: null,
    adData: null,
  });

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const skipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoCompleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    initializeSplashAd();

    return () => {
      // Cleanup timers
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      if (skipTimeoutRef.current) {
        clearTimeout(skipTimeoutRef.current);
      }
      if (autoCompleteTimeoutRef.current) {
        clearTimeout(autoCompleteTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Initialize splash ad flow
   */
  const initializeSplashAd = async () => {
    try {
      console.log('SplashAdScreen: Initializing splash ad for user:', userId);

      // Start fade in animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Add timeout protection
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Splash ad initialization timeout'));
        }, 15000); // 15 second timeout for SDK initialization
      });

      // Check if mock mode is enabled
      const isMockMode = mockService.isMockModeEnabled();

      const initPromise = isMockMode ? handleMockSplashAd() : handleRealSplashAd();

      // Race between initialization and timeout
      await Promise.race([initPromise, timeoutPromise]);

    } catch (error) {
      console.error('SplashAdScreen: Initialization error:', error);

      if ((error as Error).message.includes('timeout')) {
        console.log('SplashAdScreen: Timeout detected, showing fallback ad');
        await handleFallbackAd();
      } else {
        handleError(error as Error);
      }
    }
  };

  /**
   * Handle mock splash ad for development
   */
  const handleMockSplashAd = async () => {
    try {
      console.log('SplashAdScreen: Using mock splash ad simulation');

      // Simulate loading delay
      setState(prev => ({ ...prev, isLoading: true }));
      await mockService.simulateNetworkDelay(800, 1500);

      // Get mock ad config using adConfig.js data
      const adConfig = await mockService.getMockAdConfig();
      console.log('SplashAdScreen: Mock ad config loaded:', {
        enabled: adConfig.splashAdConfig?.enabled,
        adId: adConfig.splashAdConfig?.adId,
        timeout: adConfig.splashAdConfig?.timeout,
        skipDelay: adConfig.splashAdConfig?.skipDelay,
      });

      if (!adConfig.splashAdConfig?.enabled) {
        console.log('SplashAdScreen: Splash ads disabled in mock config');
        onAdComplete();
        return;
      }

      // Generate mock ad response with Pangle test ID
      const mockAdData: AdResponse = {
        adId: adConfig.splashAdConfig.adId, // 使用adConfig.js中的穿山甲测试ID
        adType: AdType.SPLASH,
        adTitle: '丁丁猫开屏广告 - Mock模拟',
        adImageUrl: '', // Mock模式不使用真实图片
        adClickUrl: 'https://www.dingdingcat.com',

        playDuration: adConfig.splashAdConfig.timeout || 5000,
        expectedReward: 10,
        configParams: {},
      };

      console.log('SplashAdScreen: Mock ad data generated:', mockAdData);
      console.log('SplashAdScreen: Using Pangle test ID:', mockAdData.adId);

      setState(prev => ({
        ...prev,
        isLoading: false,
        isAdLoaded: true,
        adData: mockAdData,
      }));

      // 在Mock模式下也调用真实的穿山甲SDK
      console.log('SplashAdScreen: Loading ad in Pangle SDK with ID:', mockAdData.adId);

      // Step 1: Load ad in Pangle SDK
      const loadResult = await PangleAdService.loadSplashAd(mockAdData.adId);
      console.log('SplashAdScreen: Ad loaded in SDK:', loadResult);

      if (!loadResult || (loadResult as any).status !== 'loaded') {
        console.log('SplashAdScreen: Failed to load ad in SDK, using mock display');
        await showMockSplashAd(mockAdData, adConfig);
        return;
      }

      // Step 2: Show the loaded ad
      await showRealSplashAd(mockAdData, adConfig);

    } catch (error) {
      console.error('SplashAdScreen: Mock ad error:', error);
      handleError(error as Error);
    }
  };

  /**
   * Handle fallback ad when initialization fails or times out
   */
  const handleFallbackAd = async () => {
    try {
      console.log('SplashAdScreen: Using fallback ad');

      // Create a simple fallback ad
      const fallbackAdData: AdResponse = {
        adId: 'fallback_ad',
        adType: AdType.SPLASH,
        adTitle: '丁丁猫广告',
        adImageUrl: '',
        adClickUrl: '',

        playDuration: 3000,
        expectedReward: 0,
        configParams: {},
      };

      setState(prev => ({
        ...prev,
        isLoading: false,
        isAdLoaded: true,
        adData: fallbackAdData,
      }));

      // Show fallback ad for 3 seconds
      setTimeout(() => {
        setState(prev => ({ ...prev, canSkip: true }));
      }, 1000);

      // Auto complete after 3 seconds
      setTimeout(() => {
        console.log('SplashAdScreen: Fallback ad completed, auto-navigating to home');
        setState(prev => ({ ...prev, isAdShowing: false }));
        // Fallback广告完播后也自动跳转
        setTimeout(() => {
          onAdComplete();
        }, 200);
      }, 3000);

    } catch (error) {
      console.error('SplashAdScreen: Fallback ad error:', error);
      // If even fallback fails, just complete
      onAdComplete();
    }
  };

  /**
   * Handle real splash ad with API integration
   */
  const handleRealSplashAd = async () => {
    try {
      console.log('SplashAdScreen: Using real splash ad with API');

      // Step 1: Get ad configuration
      const adConfig = await configService.getAdConfig();

      if (!adConfig?.splashAdConfig?.enabled) {
        console.log('SplashAdScreen: Splash ads disabled in server config');
        onAdComplete();
        return;
      }

      // Step 2: Request ad from server
      const adResponse = await adService.requestSplashAd(userId);
      console.log('SplashAdScreen: Ad requested from server:', adResponse.adId);

      setState(prev => ({
        ...prev,
        adData: adResponse,
      }));

      // Step 3: Load ad in Pangle SDK
      const loadResult = await PangleAdService.loadSplashAd(adResponse.adId);
      console.log('SplashAdScreen: Ad loaded in SDK:', loadResult);

      if ((loadResult as any)?.status !== 'loaded') {
        throw new Error('Failed to load ad in Pangle SDK');
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        isAdLoaded: true,
      }));

      // Step 4: Show ad and report events
      await showRealSplashAd(adResponse, adConfig);

    } catch (error) {
      console.error('SplashAdScreen: Real ad error:', error);
      handleError(error as Error);
    }
  };

  /**
   * Show mock splash ad
   */
  const showMockSplashAd = async (adData: AdResponse, adConfig: AdConfig) => {
    try {
      setState(prev => ({ ...prev, isAdShowing: true }));

      // Report ad show event (mock)
      console.log('SplashAdScreen: Mock ad show reported');

      // Start countdown and skip timer
      const skipDelay = adConfig.splashAdConfig?.skipDelay || 3000;
      startCountdown(Math.ceil(skipDelay / 1000));

      skipTimeoutRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, canSkip: true }));
      }, skipDelay);

      // Auto complete after timeout - 确保一定会跳转
      const timeout = adConfig.splashAdConfig?.timeout || 5000;
      autoCompleteTimeoutRef.current = setTimeout(() => {
        console.log('SplashAdScreen: Mock ad timeout reached, auto-completing');
        handleAdComplete();
      }, timeout);

    } catch (error) {
      console.error('SplashAdScreen: Error showing mock ad:', error);
      handleError(error as Error);
    }
  };

  /**
   * Show real splash ad with Pangle SDK
   */
  const showRealSplashAd = async (adData: AdResponse, adConfig: AdConfig) => {
    try {
      setState(prev => ({ ...prev, isAdShowing: true }));

      // Report ad show event to server (skip in mock mode to avoid network errors)
      const isMockMode = mockService.isMockModeEnabled();
      if (!isMockMode) {
        await adService.reportAdShowNow(userId, adData.adId, AdType.SPLASH);
        console.log('SplashAdScreen: Ad show reported to server');
      } else {
        console.log('SplashAdScreen: Skipping ad show report in mock mode');
      }

      // Show ad in Pangle SDK
      const showResult = await PangleAdService.showSplashAd();
      console.log('SplashAdScreen: Ad shown in SDK:', showResult);

      // Start countdown and skip timer
      const skipDelay = adConfig.splashAdConfig?.skipDelay || 3000;
      startCountdown(Math.ceil(skipDelay / 1000));

      skipTimeoutRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, canSkip: true }));
      }, skipDelay);

      // 设置最大超时时间，确保一定会跳转
      const maxTimeout = (adConfig.splashAdConfig?.timeout || 5000) + 1000; // 额外1秒保险
      autoCompleteTimeoutRef.current = setTimeout(() => {
        console.log('SplashAdScreen: Max timeout reached, force completing ad');
        handleAdComplete();
      }, maxTimeout);

      // Handle ad result
      if ((showResult as any)?.status === 'completed') {
        console.log('SplashAdScreen: Ad completed successfully, auto-navigating to home');
        // 清除超时定时器
        if (autoCompleteTimeoutRef.current) {
          clearTimeout(autoCompleteTimeoutRef.current);
        }
        // 广告完播后自动跳转到首页
        setTimeout(() => {
          handleAdComplete();
        }, 500); // 延迟500ms确保用户看到完播
      } else if ((showResult as any)?.status === 'skipped') {
        console.log('SplashAdScreen: Ad was skipped');
        if (autoCompleteTimeoutRef.current) {
          clearTimeout(autoCompleteTimeoutRef.current);
        }
        handleAdSkip();
      } else if ((showResult as any)?.status === 'clicked') {
        console.log('SplashAdScreen: Ad was clicked, auto-navigating to home');
        if (autoCompleteTimeoutRef.current) {
          clearTimeout(autoCompleteTimeoutRef.current);
        }
        await handleAdClick();
        // 点击广告后也自动跳转
        setTimeout(() => {
          handleAdComplete();
        }, 300);
      } else {
        console.log('SplashAdScreen: Ad show completed with unknown status, auto-navigating');
        // 清除超时定时器
        if (autoCompleteTimeoutRef.current) {
          clearTimeout(autoCompleteTimeoutRef.current);
        }
        // 默认情况下也自动跳转
        setTimeout(() => {
          handleAdComplete();
        }, 500);
      }

    } catch (error) {
      console.error('SplashAdScreen: Error showing real ad:', error);
      handleError(error as Error);
    }
  };

  /**
   * Start countdown timer
   */
  const startCountdown = (initialCount: number) => {
    setState(prev => ({ ...prev, countdown: initialCount }));

    countdownRef.current = setInterval(() => {
      setState(prev => {
        const newCount = prev.countdown - 1;
        if (newCount <= 0) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
          }
          // 倒计时结束后自动完播
          console.log('SplashAdScreen: Countdown finished, auto-completing ad');
          setTimeout(() => {
            handleAdComplete();
          }, 100);
          return { ...prev, countdown: 0, canSkip: true };
        }
        return { ...prev, countdown: newCount };
      });
    }, 1000);
  };

  /**
   * Handle ad completion
   */
  const handleAdComplete = async () => {
    try {
      console.log('SplashAdScreen: Ad completed - starting completion process');

      // Report completion to server (if not mock mode)
      const isMockMode = mockService.isMockModeEnabled();
      if (!isMockMode && state.adData) {
        try {
          const reward = await adService.reportAdCompleteNow(
            userId,
            state.adData.adId,
            AdType.SPLASH,
            5, // 5 seconds play duration
            false // not clicked
          );
          console.log('SplashAdScreen: Ad completion reported, reward:', reward);
        } catch (reportError) {
          console.error('SplashAdScreen: Failed to report ad completion:', reportError);
          // Continue with completion even if reporting fails
        }
      }

      // Cleanup and complete
      cleanup();

      console.log('SplashAdScreen: Calling onAdComplete callback');
      onAdComplete();

    } catch (error) {
      console.error('SplashAdScreen: Error handling ad completion:', error);
      // Even if there's an error, try to complete
      cleanup();
      onAdComplete();
    }
  };

  /**
   * Handle ad skip
   */
  const handleAdSkip = async () => {
    try {
      if (!state.adData) return;

      console.log('SplashAdScreen: Ad skipped');

      // Report skip to server (if not mock mode)
      const isMockMode = mockService.isMockModeEnabled();
      if (!isMockMode) {
        await adService.reportAdSkipNow(
          userId,
          state.adData.adId,
          AdType.SPLASH,
          state.countdown > 0 ? 5 - state.countdown : 5,
          'user_skip'
        );
        console.log('SplashAdScreen: Ad skip reported');
      }

      // Cleanup and skip
      cleanup();
      onAdSkipped();

    } catch (error) {
      console.error('SplashAdScreen: Error handling ad skip:', error);
      handleError(error as Error);
    }
  };

  /**
   * Handle ad click
   */
  const handleAdClick = async () => {
    try {
      if (!state.adData) return;

      console.log('SplashAdScreen: Ad clicked');

      // Report click to server (if not mock mode)
      const isMockMode = mockService.isMockModeEnabled();
      if (!isMockMode) {
        await adService.reportAdClickNow(userId, state.adData.adId, AdType.SPLASH);
        console.log('SplashAdScreen: Ad click reported');
      }

    } catch (error) {
      console.error('SplashAdScreen: Error handling ad click:', error);
    }
  };

  /**
   * Handle errors
   */
  const handleError = (error: Error) => {
    console.error('SplashAdScreen: Error occurred:', error);

    setState(prev => ({
      ...prev,
      isLoading: false,
      error: error.message,
    }));

    // Cleanup and report error
    cleanup();
    onAdError(error);
  };

  /**
   * Cleanup resources
   */
  const cleanup = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (skipTimeoutRef.current) {
      clearTimeout(skipTimeoutRef.current);
      skipTimeoutRef.current = null;
    }
    if (autoCompleteTimeoutRef.current) {
      clearTimeout(autoCompleteTimeoutRef.current);
      autoCompleteTimeoutRef.current = null;
    }
  };

  /**
   * Handle skip button press
   */
  const handleSkipPress = () => {
    if (state.canSkip) {
      handleAdSkip();
    }
  };

  // Render loading state
  if (state.isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <Animated.View
          style={[
            styles.loadingContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
          <ActivityIndicator size="large" color="#1890FF" />
          <Text style={styles.loadingText}>正在加载广告...</Text>
        </Animated.View>
      </View>
    );
  }

  // Render error state
  if (state.error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>广告加载失败</Text>
          <Text style={styles.errorDetail}>{state.error}</Text>
          <TouchableOpacity style={styles.skipButton} onPress={() => onAdComplete()}>
            <Text style={styles.skipButtonText}>继续</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Render splash ad
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Animated.View
        style={[
          styles.adContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        {/* Ad Content */}
        {state.adData?.adImageUrl ? (
          <Image
            source={{ uri: state.adData.adImageUrl }}
            style={styles.adImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderAd}>
            <Text style={styles.placeholderText}>加载中...</Text>
          </View>
        )}

        {/* Skip Button */}
        <TouchableOpacity
          style={[
            styles.skipButton,
            !state.canSkip && styles.skipButtonDisabled
          ]}
          onPress={handleSkipPress}
          disabled={!state.canSkip}
        >
          <Text style={[
            styles.skipButtonText,
            !state.canSkip && styles.skipButtonTextDisabled
          ]}>
            {state.canSkip ? '跳过' : `跳过 ${state.countdown}s`}
          </Text>
        </TouchableOpacity>

        {/* Ad Info */}
        {ENV_CONFIG.DEBUG_MODE && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>
              Mock: {mockService.isMockModeEnabled() ? 'Yes' : 'No'}
            </Text>
            <Text style={styles.debugText}>
              Ad ID: {state.adData?.adId || 'N/A'}
            </Text>
            <Text style={styles.debugText}>
              Countdown: {state.countdown}s
            </Text>
            <Text style={styles.debugText}>
              Can Skip: {state.canSkip ? 'Yes' : 'No'}
            </Text>
            <TouchableOpacity
              style={styles.debugButton}
              onPress={() => {
                console.log('SplashAdScreen: Debug force complete');
                handleAdComplete();
              }}
            >
              <Text style={styles.debugButtonText}>Force Complete</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 18,
    color: '#FF4D4F',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  errorDetail: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  adContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  adImage: {
    width: width,
    height: height,
  },
  placeholderAd: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background instead of blue
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999999', // Gray text instead of white
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    zIndex: 1000,
  },
  skipButtonDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  skipButtonTextDisabled: {
    opacity: 0.6,
  },
  debugInfo: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 4,
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  debugButton: {
    backgroundColor: '#FF4D4F',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  debugButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default SplashAdScreen;