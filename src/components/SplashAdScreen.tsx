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
} from 'react-native';
import configService from '../services/ConfigService';
import adService from '../services/AdService';
import mockService, { MockUserState } from '../services/MockService';
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
 * SplashAdScreen - Handles splash ad display with full API integration
 * 
 * Features:
 * - Loads ad configuration from server
 * - Requests splash ad from API
 * - Integrates with Pangle SDK for ad display
 * - Reports ad events to server
 * - Handles skip functionality with countdown
 * - Mock mode support for development
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

  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const skipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

      // Check if mock mode is enabled
      const isMockMode = mockService.isMockModeEnabled();
      
      if (isMockMode) {
        await handleMockSplashAd();
      } else {
        await handleRealSplashAd();
      }

    } catch (error) {
      console.error('SplashAdScreen: Initialization error:', error);
      handleError(error as Error);
    }
  };

  /**
   * Handle mock splash ad for development
   */
  const handleMockSplashAd = async () => {
    try {
      console.log('SplashAdScreen: Using mock splash ad');

      // Simulate network delay
      await mockService.simulateNetworkDelay(500, 1000);

      // Get mock ad config
      const adConfig = await mockService.getMockAdConfig();
      
      if (!adConfig.splashAdConfig?.enabled) {
        console.log('SplashAdScreen: Splash ads disabled in mock config');
        onAdComplete();
        return;
      }

      // Generate mock ad response
      const mockAdData = mockService.generateMockAdResponse(AdType.SPLASH);

      setState(prev => ({
        ...prev,
        isLoading: false,
        isAdLoaded: true,
        adData: mockAdData,
      }));

      // Start showing the mock ad
      await showMockSplashAd(mockAdData, adConfig);

    } catch (error) {
      console.error('SplashAdScreen: Mock ad error:', error);
      handleError(error as Error);
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

      if (loadResult?.status !== 'loaded') {
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

      // Auto complete after timeout
      const timeout = adConfig.splashAdConfig?.timeout || 5000;
      setTimeout(() => {
        if (state.isAdShowing) {
          handleAdComplete();
        }
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

      // Report ad show event to server
      await adService.reportAdShowNow(userId, adData.adId, AdType.SPLASH);
      console.log('SplashAdScreen: Ad show reported to server');

      // Show ad in Pangle SDK
      const showResult = await PangleAdService.showSplashAd();
      console.log('SplashAdScreen: Ad shown in SDK:', showResult);

      // Start countdown and skip timer
      const skipDelay = adConfig.splashAdConfig?.skipDelay || 3000;
      startCountdown(Math.ceil(skipDelay / 1000));
      
      skipTimeoutRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, canSkip: true }));
      }, skipDelay);

      // Handle ad result
      if (showResult?.status === 'completed') {
        await handleAdComplete();
      } else if (showResult?.status === 'skipped') {
        await handleAdSkip();
      } else if (showResult?.status === 'clicked') {
        await handleAdClick();
        await handleAdComplete();
      } else {
        // Auto complete after timeout
        const timeout = adConfig.splashAdConfig?.timeout || 5000;
        setTimeout(() => {
          if (state.isAdShowing) {
            handleAdComplete();
          }
        }, timeout);
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
      if (!state.adData) return;

      console.log('SplashAdScreen: Ad completed');

      // Report completion to server (if not mock mode)
      const isMockMode = mockService.isMockModeEnabled();
      if (!isMockMode) {
        const reward = await adService.reportAdCompleteNow(
          userId,
          state.adData.adId,
          AdType.SPLASH,
          5, // 5 seconds play duration
          false // not clicked
        );
        console.log('SplashAdScreen: Ad completion reported, reward:', reward);
      }

      // Cleanup and complete
      cleanup();
      onAdComplete();

    } catch (error) {
      console.error('SplashAdScreen: Error handling ad completion:', error);
      handleError(error as Error);
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
      const isMockMode = await mockService.isMockModeEnabled();
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
      const isMockMode = await mockService.isMockModeEnabled();
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
            <Text style={styles.placeholderText}>丁丁猫</Text>
            <Text style={styles.placeholderSubtext}>广告收益管理</Text>
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
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FF4D4F',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  adContainer: {
    flex: 1,
    position: 'relative',
  },
  adImage: {
    width: width,
    height: height,
  },
  placeholderAd: {
    flex: 1,
    backgroundColor: '#1890FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
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
  },
});

export default SplashAdScreen;