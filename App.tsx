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
import authService from './src/services/AuthService';
import { MusicPlayerService } from './src/services/MusicPlayerService';
import { PerformanceMonitorService } from './src/services/PerformanceMonitorService';

// 开发环境工具导入
if (__DEV__) {
  require('./src/utils/validatePangleConfig');
  require('./src/utils/testSplashAd');
  require('./src/utils/testPangleIntegration');
  require('./src/utils/debugAppFlow');
  require('./src/utils/testSplashAdFix');
  require('./src/utils/testPangleDirectly');
}

// 应用初始化状态
enum AppState {
  SPLASH_SCREEN = 'SPLASH_SCREEN',
  INITIALIZING = 'INITIALIZING',
  SPLASH_AD = 'SPLASH_AD',
  READY = 'READY',
  ERROR = 'ERROR',
}

// 初始化屏幕包装器组件 - 检查登录状态后决定是否显示初始化屏幕
interface InitializationScreenWrapperProps {
  isDarkMode: boolean;
  onInitializationComplete: (result: InitializationResult) => void;
}

const InitializationScreenWrapper: React.FC<InitializationScreenWrapperProps> = ({
  isDarkMode,
  onInitializationComplete,
}) => {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('检查用户登录状态...');
        const authenticated = await authService.isAuthenticated();
        console.log('用户登录状态:', authenticated);
        setIsAuthenticated(authenticated);
      } catch (error) {
        console.error('检查登录状态时出错:', error);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthStatus();
  }, []);

  // 正在检查认证状态时显示加载
  if (isCheckingAuth) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        {/* 可以显示一个简单的加载指示器 */}
        <InitializationScreen onInitializationComplete={onInitializationComplete} />
      </SafeAreaProvider>
    );
  }

  // 已登录用户显示完整的初始化屏幕
  if (isAuthenticated) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <InitializationScreen onInitializationComplete={onInitializationComplete} />
      </SafeAreaProvider>
    );
  }

  // 未登录用户直接进入主应用（通常会显示登录界面）
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
};

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [appState, setAppState] = useState<AppState>(AppState.SPLASH_SCREEN);
  const [initResult, setInitResult] = useState<InitializationResult | null>(null);
  const [flowResult, setFlowResult] = useState<AppFlowResult | null>(null);

  useEffect(() => {
    // 应用启动日志
    console.log('DingDingCat App starting...');

    // 立即设置状态栏样式
    StatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content', true);
    
    // 初始化性能监控
    PerformanceMonitorService.startMonitoring();
    
    // 初始化音乐播放服务
    MusicPlayerService.initialize().catch(error => {
      console.error('Failed to initialize MusicPlayerService:', error);
    });
    
    // 应用退出时的清理
    return () => {
      PerformanceMonitorService.stopMonitoring();
      MusicPlayerService.cleanup();
    };
  }, [isDarkMode]);

  /**
   * 处理初始化完成
   */
  const handleInitializationComplete = async (result: InitializationResult) => {
    console.log('App initialization completed:', result);

    setInitResult(result);

    if (result.success) {
      // 初始化成功后，确定应用流程
      try {
        const flow = await appFlowManager.determineAppFlow();
        console.log('App flow determined:', flow);

        setFlowResult(flow);

        // 根据流程结果设置应用状态
        console.log('App: Setting app state based on flow result:', flow.state);
        switch (flow.state) {
          case AppFlowState.SPLASH_AD:
            console.log('App: Setting state to SPLASH_AD');
            setAppState(AppState.SPLASH_AD);
            break;
          case AppFlowState.LOGIN_REQUIRED:
            console.log('App: Setting state to READY (LOGIN_REQUIRED)');
            setAppState(AppState.READY);
            break;
          case AppFlowState.MAIN_APP:
            console.log('App: Setting state to READY (MAIN_APP)');
            setAppState(AppState.READY);
            break;
          case AppFlowState.ERROR:
            console.log('App: Setting state to ERROR');
            setAppState(AppState.ERROR);
            break;
          default:
            console.log('App: Setting state to READY (default)');
            setAppState(AppState.READY);
        }

        // 记录初始化摘要
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

        // 如需要显示首次启动欢迎信息（在开屏广告后）
        if (result.isFirstLaunch && flow.state !== AppFlowState.SPLASH_AD) {
          setTimeout(() => {
            Alert.alert(
              '欢迎使用丁丁猫',
              '感谢您选择丁丁猫广告收益管理应用！',
              [{ text: '开始使用', style: 'default' }]
            );
          }, 1000);
        }

        // 如需要显示配置更新通知
        if (result.hasConfigUpdates) {
          console.log('Configuration updates detected during startup');
        }

        // 如需要显示离线同步通知
        if (result.offlineDataSynced) {
          console.log('Offline data synchronized during startup');
        }

      } catch (error) {
        console.error('Error determining app flow:', error);
        setAppState(AppState.ERROR);
      }
    } else {
      setAppState(AppState.ERROR);

      // 显示错误提示
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
              // 在真实应用中，您可能希望优雅地退出
              console.log('User chose to exit after initialization failure');
            },
          },
        ]
      );
    }
  };

  /**
   * 处理开屏广告完成
   */
  const handleSplashAdComplete = async () => {
    try {
      console.log('App: Splash ad completed');

      const flow = await appFlowManager.handleSplashAdComplete();
      setFlowResult(flow);
      setAppState(AppState.READY);

      // 如需要显示首次启动欢迎信息
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
   * 处理开屏广告跳过
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
   * 处理开屏广告错误
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
   * 处理自定义启动屏幕完成
   */
  const handleSplashScreenComplete = () => {
    console.log('App: Custom splash screen completed');
    setAppState(AppState.INITIALIZING);
  };

  // 首先显示自定义启动屏幕
  if (appState === AppState.SPLASH_SCREEN) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#1890FF" />
        <CustomSplashScreen onFinish={handleSplashScreenComplete} />
      </SafeAreaProvider>
    );
  }


  // 启动期间显示初始化屏幕（仅在已登录状态下显示）
  if (appState === AppState.INITIALIZING) {
    return (
      <InitializationScreenWrapper
        isDarkMode={isDarkMode}
        onInitializationComplete={handleInitializationComplete}
      />
    );
  }

  // 如需要显示开屏广告屏幕
  if (appState === AppState.SPLASH_AD && flowResult?.shouldShowSplashAd && flowResult.userId) {
    console.log('App: Rendering SplashAdScreen with userId:', flowResult.userId);
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

  // 初始化成功后显示主应用
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
