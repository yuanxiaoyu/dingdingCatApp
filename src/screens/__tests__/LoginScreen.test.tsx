import React from 'react';
import renderer from 'react-test-renderer';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import LoginScreen from '../LoginScreen';
import { authSlice } from '../../store/slices/authSlice';

// Mock the AuthService
jest.mock('../../services/AuthService', () => ({
  isWeChatAvailable: jest.fn().mockResolvedValue(true),
  wechatLogin: jest.fn(),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

// Mock react-native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 })),
    },
  };
});

// Create a test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
    },
    preloadedState: {
      auth: {
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        ...initialState,
      },
    },
  });
};

describe('LoginScreen', () => {
  it('renders correctly', () => {
    const store = createTestStore();
    
    const tree = renderer.create(
      <Provider store={store}>
        <LoginScreen />
      </Provider>
    ).toJSON();
    
    expect(tree).toBeTruthy();
  });

  it('renders with loading state', () => {
    const store = createTestStore({
      isLoading: true,
    });
    
    const tree = renderer.create(
      <Provider store={store}>
        <LoginScreen />
      </Provider>
    ).toJSON();
    
    expect(tree).toBeTruthy();
  });

  it('renders with error state', () => {
    const store = createTestStore({
      error: 'Test error message',
    });
    
    const tree = renderer.create(
      <Provider store={store}>
        <LoginScreen />
      </Provider>
    ).toJSON();
    
    expect(tree).toBeTruthy();
  });

  it('renders with authenticated state', () => {
    const store = createTestStore({
      isAuthenticated: true,
      user: {
        userId: 1,
        userName: 'testuser',
        nickName: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
        wechatOpenId: 'test_openid',
        appKey: 'test_app_key',
      },
    });
    
    const tree = renderer.create(
      <Provider store={store}>
        <LoginScreen />
      </Provider>
    ).toJSON();
    
    expect(tree).toBeTruthy();
  });
});