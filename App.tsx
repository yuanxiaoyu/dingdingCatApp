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
import { InitializationResult } from './src/services/InitializationService';

// App initialization states
enum AppState {
  INITIALIZING = 'INITIALIZING',
  READY = 'READY',
  ERROR = 'ERROR',
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [appState, setAppState] = useState<AppState>(AppState.INITIALIZING);
  const [initResult, setInitResult] = useState<InitializationResult | null>(null);

  useEffect(() => {
    // App startup logging
    console.log('DingDingCat App starting...');
    
    // Set status bar style immediately
    StatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content', true);
  }, [isDarkMode]);

  /**
   * Handle initialization completion
   */
  const handleInitializationComplete = (result: InitializationResult) => {
    console.log('App initialization completed:', result);
    
    setInitResult(result);

    if (result.success) {
      setAppState(AppState.READY);
      
      // Log initialization summary
      console.log('App initialization summary:', {
        duration: `${result.duration}ms`,
        isFirstLaunch: result.isFirstLaunch,
        isAuthenticated: result.isAuthenticated,
        hasConfigUpdates: result.hasConfigUpdates,
        deviceInfoReported: result.deviceInfoReported,
        offlineDataSynced: result.offlineDataSynced,
      });

      // Show first launch welcome if needed
      if (result.isFirstLaunch) {
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

  // Show initialization screen during startup
  if (appState === AppState.INITIALIZING) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <InitializationScreen onInitializationComplete={handleInitializationComplete} />
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
