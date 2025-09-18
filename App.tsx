/**
 * 丁丁猫应用 - 穿山甲广告集成
 * DingDingCat App - Pangle Ad Integration
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { StatusBar, useColorScheme, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-gesture-handler';

import StoreProvider from './src/store/StoreProvider';
import { RootNavigator } from './src/navigation';
import InitializationScreen from './src/components/InitializationScreen';
import SplashAdScreen from './src/components/SplashAdScreen';
import CustomSplashScreen from './src/components/CustomSplashScreen';
import { InitializationResult } from './src/services/InitializationService';
import appFlowManager, { AppFlowState, AppFlowResult } from './src/services/AppFlowManager';

// App initialization states
enum AppState {
  SPLASH_SCREEN = 'SPLASH_SCREEN',
  INITIALIZING = 'INITIALIZING',
  SPLASH_AD = 'SPLASH_AD',
  READY = 'READY',
  ERROR = 'ERROR',
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [appState, setAppState] = useState<AppState>(AppState.SPLASH_SCREEN);
  const [initResult, setInitResult] = useState<InitializationResult | null>(null);
  const [flowResult, setFlowResult] = useState<AppFlowResult | null>(null);

  useEffect(() => {
    // App startup logging
    console.log('DingDingCat App starting...');
    
    // Set status bar style immediately
    StatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content', true);
  }, [isDarkMode]);

  /**
   * Handle initialization completion
   */
  const handleInitializationComplete = async (result: InitializationResult) => {
    console.log('App initialization completed:', result);
    
    setInitResult(result);

    if (result.success) {
      // After successful initialization, determine app flow
      try {
        const flow = await appFlowManager.determineAppFlow();
        console.log('App flow determined:', flow);
        
        setFlowResult(flow);

        // Set app state based on flow result
        switch (flow.state) {
          case AppFlowState.SPLASH_AD:
            setAppState(AppState.SPLASH_AD);
            break;
          case AppFlowState.LOGIN_REQUIRED:
          case AppFlowState.MAIN_APP:
            setAppState(AppState.READY);
            break;
          case AppFlowState.ERROR:
            setAppState(AppState.ERROR);
            break;
          default:
            setAppState(AppState.READY);
        }

        // Log initialization summary
        console.log('App initialization summary:', {
          duration: `${result.duration}ms`,
          isFirstLaunch: result.isFirstLaunch,
          isAuthenticated: result.isAuthenticated,
          hasConfigUpdates: result.hasConfigUpdates,
          deviceInfoReported: result.deviceInfoReported,
          offlineDataSynced: result.offlineDataSynced,
          flowState: flow.state,
          shouldShowSplashAd: flow.shouldShowSplashAd,
        });

        // Show first launch welcome if needed (after splash ad)
        if (result.isFirstLaunch && flow.state !== AppFlowState.SPLASH_AD) {
          setTimeout(() => {
            Alert.alert(
              '欢迎使用丁丁猫',
              '感谢您选择丁丁猫广告收益管理应用！',
              [{ text: '开始使用', style: 'default' }]
            );
          }, 1000);
        }

        // Show config updates notification if needed
        if (result.hasConfigUpdates) {
          console.log('Configuration updates detected during startup');
        }

        // Show offline sync notification if needed
        if (result.offlineDataSynced) {
          console.log('Offline data synchronized during startup');
        }

      } catch (error) {
        console.error('Error determining app flow:', error);
        setAppState(AppState.ERROR);
      }
    } else {
      setAppState(AppState.ERROR);
      
      // Show error alert
      Alert.alert(
        '应用启动失败',
        result.error || '应用初始化过程中发生错误，请重启应用重试。',
        [
          {
            text: '重试',
            onPress: () => {
              setAppState(AppState.INITIALIZING);
              setInitResult(null);
              setFlowResult(null);
            },
          },
          {
            text: '退出',
            style: 'destructive',
            onPress: () => {
              // In a real app, you might want to exit gracefully
              console.log('User chose to exit after initialization failure');
            },
          },
        ]
      );
    }
  };

  /**
   * Handle splash ad completion
   */
  const handleSplashAdComplete = async () => {
    try {
      console.log('App: Splash ad completed');
      
      const flow = await appFlowManager.handleSplashAdComplete();
      setFlowResult(flow);
      setAppState(AppState.READY);

      // Show first launch welcome if needed
      if (initResult?.isFirstLaunch) {
        setTimeout(() => {
          Alert.alert(
            '欢迎使用丁丁猫',
            '感谢您选择丁丁猫广告收益管理应用！',
            [{ text: '开始使用', style: 'default' }]
          );
        }, 500);
      }

    } catch (error) {
      console.error('Error handling splash ad completion:', error);
      setAppState(AppState.ERROR);
    }
  };

  /**
   * Handle splash ad skip
   */
  const handleSplashAdSkip = async () => {
    try {
      console.log('App: Splash ad skipped');
      
      const flow = await appFlowManager.handleSplashAdSkip();
      setFlowResult(flow);
      setAppState(AppState.READY);

    } catch (error) {
      console.error('Error handling splash ad skip:', error);
      setAppState(AppState.ERROR);
    }
  };

  /**
   * Handle splash ad error
   */
  const handleSplashAdError = async (error: Error) => {
    try {
      console.log('App: Splash ad error:', error.message);
      
      const flow = await appFlowManager.handleSplashAdError(error);
      setFlowResult(flow);
      setAppState(AppState.READY);

    } catch (handlingError) {
      console.error('Error handling splash ad error:', handlingError);
      setAppState(AppState.ERROR);
    }
  };

  /**
   * Handle custom splash screen completion
   */
  const handleSplashScreenComplete = () => {
    console.log('App: Custom splash screen completed');
    setAppState(AppState.INITIALIZING);
  };

  // Show custom splash screen first
  if (appState === AppState.SPLASH_SCREEN) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#1890FF" />
        <CustomSplashScreen onFinish={handleSplashScreenComplete} />
      </SafeAreaProvider>
    );
  }

  // Show initialization screen during startup
  if (appState === AppState.INITIALIZING) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <InitializationScreen onInitializationComplete={handleInitializationComplete} />
      </SafeAreaProvider>
    );
  }

  // Show splash ad screen if needed
  if (appState === AppState.SPLASH_AD && flowResult?.shouldShowSplashAd && flowResult.userId) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <SplashAdScreen
          userId={flowResult.userId}
          onAdComplete={handleSplashAdComplete}
          onAdSkipped={handleSplashAdSkip}
          onAdError={handleSplashAdError}
        />
      </SafeAreaProvider>
    );
  }

  // Show main app after successful initialization
  return (
    <StoreProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </StoreProvider>
  );
}

export default App;
