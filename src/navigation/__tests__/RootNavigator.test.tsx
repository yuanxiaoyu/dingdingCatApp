/**
 * RootNavigator Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import RootNavigator from '../RootNavigator';
import authSlice from '../../store/slices/authSlice';
import configSlice from '../../store/slices/configSlice';
import adSlice from '../../store/slices/adSlice';
import syncSlice from '../../store/slices/syncSlice';

// Mock the screens
jest.mock('../../screens/LoginScreen', () => {
  const { Text } = require('react-native');
  return function MockLoginScreen() {
    return <Text testID="login-screen">Login Screen</Text>;
  };
});

jest.mock('../../screens/HomeScreen', () => {
  const { Text } = require('react-native');
  return function MockHomeScreen() {
    return <Text testID="home-screen">Home Screen</Text>;
  };
});

jest.mock('../../screens/RevenueScreen', () => {
  const { Text } = require('react-native');
  return function MockRevenueScreen() {
    return <Text testID="revenue-screen">Revenue Screen</Text>;
  };
});



jest.mock('../../screens/SettingsScreen', () => {
  const { Text } = require('react-native');
  return function MockSettingsScreen() {
    return <Text testID="settings-screen">Settings Screen</Text>;
  };
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn((component) => component),
    Directions: {},
  };
});

const createMockStore = (initialState: any) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      config: configSlice,
      ad: adSlice,
      sync: syncSlice,
    },
    preloadedState: initialState,
  });
};

const renderWithNavigation = (component: React.ReactElement, store: any) => {
  return render(
    <Provider store={store}>
      <NavigationContainer>
        {component}
      </NavigationContainer>
    </Provider>
  );
};

describe('RootNavigator', () => {
  it('shows loading screen when not initialized', () => {
    const store = createMockStore({
      auth: {
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: false,
        error: null,
      },
      config: {
        appConfig: null,
        adConfig: null,
        riskConfig: null,
        channelConfig: null,
        isLoading: false,
        error: null,
      },
      ad: {
        currentAd: null,
        revenueData: null,
        history: [],
        isLoading: false,
        error: null,
      },
      sync: {
        offlineQueue: [],
        isSyncing: false,
        lastSyncTime: null,
        error: null,
      },
    });

    const { getByTestId } = renderWithNavigation(<RootNavigator />, store);
    
    // Should show loading indicator
    expect(() => getByTestId('login-screen')).toThrow();
    expect(() => getByTestId('home-screen')).toThrow();
  });

  it('shows auth stack when not authenticated', () => {
    const store = createMockStore({
      auth: {
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        error: null,
      },
      config: {
        appConfig: null,
        adConfig: null,
        riskConfig: null,
        channelConfig: null,
        isLoading: false,
        error: null,
      },
      ad: {
        currentAd: null,
        revenueData: null,
        history: [],
        isLoading: false,
        error: null,
      },
      sync: {
        offlineQueue: [],
        isSyncing: false,
        lastSyncTime: null,
        error: null,
      },
    });

    const { getByTestId } = renderWithNavigation(<RootNavigator />, store);
    
    // Should show login screen
    expect(getByTestId('login-screen')).toBeTruthy();
    expect(() => getByTestId('home-screen')).toThrow();
  });

  it('shows main tabs when authenticated', () => {
    const store = createMockStore({
      auth: {
        user: {
          userId: 1,
          userName: 'testuser',
          nickName: 'Test User',
          avatar: '',
          wechatOpenId: 'test-openid',
          appKey: 'test-app-key',
        },
        tokens: {
          accessToken: 'test-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
        },
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        error: null,
      },
      config: {
        appConfig: null,
        adConfig: null,
        riskConfig: null,
        channelConfig: null,
        isLoading: false,
        error: null,
      },
      ad: {
        currentAd: null,
        revenueData: null,
        history: [],
        isLoading: false,
        error: null,
      },
      sync: {
        offlineQueue: [],
        isSyncing: false,
        lastSyncTime: null,
        error: null,
      },
    });

    const { getByTestId } = renderWithNavigation(<RootNavigator />, store);
    
    // Should show home screen (default tab)
    expect(getByTestId('home-screen')).toBeTruthy();
    expect(() => getByTestId('login-screen')).toThrow();
  });
});