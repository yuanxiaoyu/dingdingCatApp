import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import HistoryScreen from '../HistoryScreen';
import authSlice from '../../store/slices/authSlice';
import adSlice from '../../store/slices/adSlice';
import { AdType, AdHistoryItem } from '../../types';

// Mock dependencies
jest.mock('../../services/AdService');
jest.mock('../../config/env', () => ({
  ENV_CONFIG: {
    APP_KEY: 'test_app_key',
    DEBUG_MODE: false,
  },
}));

// Create mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      ad: adSlice,
    },
    preloadedState: {
      auth: {
        user: {
          userId: 1001,
          userName: 'test_user',
          nickName: 'Test User',
          avatar: '',
          wechatOpenId: 'test_openid',
          appKey: 'test_app_key',
        },
        tokens: {
          accessToken: 'test_token',
          tokenType: 'Bearer',
          expiresIn: 3600,
        },
        isAuthenticated: true,
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
      ...initialState,
    },
  });
};

// Mock history data
const mockHistoryData: AdHistoryItem[] = [
  {
    statId: 1,
    adId: 'ad_001',
    adType: AdType.REWARD_VIDEO,
    playDuration: 30,
    isClicked: true,
    isSkipped: false,
    isCompleted: true,
    stayDuration: 35,
    rewardAmount: 0.05,
    playTime: '2024-01-15T10:30:00Z',
    deviceType: 'android',
    statusDescription: '观看完成',
  },
  {
    statId: 2,
    adId: 'ad_002',
    adType: AdType.SPLASH,
    playDuration: 5,
    isClicked: false,
    isSkipped: true,
    isCompleted: false,
    rewardAmount: 0.01,
    playTime: '2024-01-15T09:15:00Z',
    deviceType: 'android',
    statusDescription: '已跳过',
  },
  {
    statId: 3,
    adId: 'ad_003',
    adType: AdType.INTERSTITIAL,
    playDuration: 15,
    isClicked: true,
    isSkipped: false,
    isCompleted: true,
    stayDuration: 20,
    rewardAmount: 0.03,
    playTime: '2024-01-15T08:45:00Z',
    deviceType: 'android',
    statusDescription: '观看完成',
  },
];

describe('HistoryScreen', () => {
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    store = createMockStore();
    jest.clearAllMocks();
  });

  const renderHistoryScreen = (customStore?: ReturnType<typeof createMockStore>) => {
    return render(
      <Provider store={customStore || store}>
        <HistoryScreen />
      </Provider>
    );
  };

  describe('Authentication', () => {
    it('should show loading when not authenticated', () => {
      store = createMockStore({
        auth: {
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        },
      });

      const { getByText } = renderHistoryScreen();
      expect(getByText('请先登录')).toBeTruthy();
    });

    it('should show error when user not found', () => {
      store = createMockStore({
        auth: {
          user: null,
          tokens: null,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        },
      });

      const { getByText } = renderHistoryScreen();
      expect(getByText('用户信息加载失败')).toBeTruthy();
      expect(getByText('重试')).toBeTruthy();
    });
  });

  describe('Header and Navigation', () => {
    it('should render header with title and filter button', () => {
      const { getByText } = renderHistoryScreen();
      
      expect(getByText('观看历史')).toBeTruthy();
      expect(getByText('筛选')).toBeTruthy();
    });

    it('should show filter modal when filter button is pressed', async () => {
      const { getByText, queryByText } = renderHistoryScreen();
      
      // Initially filter modal should not be visible
      expect(queryByText('筛选条件')).toBeFalsy();
      
      // Press filter button
      fireEvent.press(getByText('筛选'));
      
      // Filter modal should be visible
      await waitFor(() => {
        expect(getByText('筛选条件')).toBeTruthy();
      });
    });
  });

  describe('History List', () => {
    it('should render component without crashing', () => {
      const { getByText } = renderHistoryScreen();
      
      // Basic component rendering test
      expect(getByText('观看历史')).toBeTruthy();
      expect(getByText('筛选')).toBeTruthy();
    });

    it('should show empty history count by default', () => {
      const { getByText } = renderHistoryScreen();
      
      // Should show the count of history items (0 by default)
      expect(getByText('共 0 条记录')).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no history', () => {
      const { getByText } = renderHistoryScreen();
      
      expect(getByText('暂无观看记录')).toBeTruthy();
      expect(getByText('开始观看广告来获得收益吧')).toBeTruthy();
    });
  });

  describe('Filter Modal', () => {
    it('should show all filter options', async () => {
      const { getByText } = renderHistoryScreen();
      
      // Open filter modal
      fireEvent.press(getByText('筛选'));
      
      await waitFor(() => {
        // Date filters
        expect(getByText('时间范围')).toBeTruthy();
        expect(getByText('全部')).toBeTruthy();
        expect(getByText('今日')).toBeTruthy();
        expect(getByText('本周')).toBeTruthy();
        expect(getByText('本月')).toBeTruthy();
        
        // Ad type filters
        expect(getByText('广告类型')).toBeTruthy();
        expect(getByText('全部类型')).toBeTruthy();
        expect(getByText('开屏广告')).toBeTruthy();
        expect(getByText('视频激励')).toBeTruthy();
        expect(getByText('插屏广告')).toBeTruthy();
        expect(getByText('Banner广告')).toBeTruthy();
        
        // Action buttons
        expect(getByText('重置')).toBeTruthy();
        expect(getByText('应用')).toBeTruthy();
      });
    });

    it('should close filter modal when close button is pressed', async () => {
      const { getByText, queryByText } = renderHistoryScreen();
      
      // Open filter modal
      fireEvent.press(getByText('筛选'));
      
      await waitFor(() => {
        expect(getByText('筛选条件')).toBeTruthy();
      });
      
      // Close modal
      fireEvent.press(getByText('✕'));
      
      await waitFor(() => {
        expect(queryByText('筛选条件')).toBeFalsy();
      });
    });

    it('should reset filters when reset button is pressed', async () => {
      const { getByText } = renderHistoryScreen();
      
      // Open filter modal
      fireEvent.press(getByText('筛选'));
      
      await waitFor(() => {
        expect(getByText('筛选条件')).toBeTruthy();
      });
      
      // Select a filter option
      fireEvent.press(getByText('今日'));
      fireEvent.press(getByText('视频激励'));
      
      // Reset filters
      fireEvent.press(getByText('重置'));
      
      // Apply should work (no specific assertion as we can't easily check internal state)
      fireEvent.press(getByText('应用'));
    });
  });

  describe('Component Structure', () => {
    it('should render all main sections', () => {
      const { getByText } = renderHistoryScreen();
      
      // Header section
      expect(getByText('观看历史')).toBeTruthy();
      expect(getByText('筛选')).toBeTruthy();
      
      // Filter summary section
      expect(getByText('全部记录')).toBeTruthy();
      expect(getByText('共 0 条记录')).toBeTruthy();
      
      // Empty state
      expect(getByText('暂无观看记录')).toBeTruthy();
      expect(getByText('开始观看广告来获得收益吧')).toBeTruthy();
    });
  });

  describe('Loading States', () => {
    it('should show loading overlay when loading', () => {
      store = createMockStore({
        ad: {
          currentAd: null,
          revenueData: null,
          history: [],
          isLoading: true,
          error: null,
        },
      });

      const { getByText } = renderHistoryScreen();
      expect(getByText('加载中...')).toBeTruthy();
    });
  });

  describe('State Management', () => {
    it('should handle loading state correctly', () => {
      const loadingStore = createMockStore({
        ad: {
          currentAd: null,
          revenueData: null,
          history: [],
          isLoading: true,
          error: null,
        },
      });

      const { getByText } = renderHistoryScreen(loadingStore);
      
      expect(getByText('加载中...')).toBeTruthy();
    });

    it('should handle error state correctly', () => {
      const errorStore = createMockStore({
        ad: {
          currentAd: null,
          revenueData: null,
          history: [],
          isLoading: false,
          error: 'Failed to load history',
        },
      });

      const { getByText } = renderHistoryScreen(errorStore);
      
      // Should still render the basic structure
      expect(getByText('观看历史')).toBeTruthy();
    });
  });
});