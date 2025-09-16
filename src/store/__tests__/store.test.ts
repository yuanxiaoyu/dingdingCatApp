import { store } from '../index';
import { 
  setUser, 
  clearAuth, 
  setAppConfig, 
  setCurrentAd, 
  addToOfflineQueue 
} from '../slices';
import { User, AppConfig, AdResponse, OfflineAdData, AdType } from '../../types';

describe('Redux Store', () => {
  test('should have initial state', () => {
    const state = store.getState();
    
    expect(state.auth.user).toBeNull();
    expect(state.auth.isAuthenticated).toBe(false);
    expect(state.config.appConfig).toBeNull();
    expect(state.ad.currentAd).toBeNull();
    expect(state.sync.offlineQueue).toEqual([]);
  });

  test('should handle auth actions', () => {
    const mockUser: User = {
      userId: 1,
      userName: 'testuser',
      nickName: 'Test User',
      avatar: 'https://example.com/avatar.jpg',
      wechatOpenId: 'wx123456',
      appKey: 'test-app-key',
    };

    store.dispatch(setUser(mockUser));
    let state = store.getState();
    
    expect(state.auth.user).toEqual(mockUser);
    expect(state.auth.isAuthenticated).toBe(true);

    store.dispatch(clearAuth());
    state = store.getState();
    
    expect(state.auth.user).toBeNull();
    expect(state.auth.isAuthenticated).toBe(false);
  });

  test('should handle config actions', () => {
    const mockConfig: AppConfig = {
      appKey: 'test-app-key',
      appName: 'Test App',
      wechatAppId: 'wx123456',
      serverTime: Date.now(),
      configVersion: '1.0.0',
      channels: [],
    };

    store.dispatch(setAppConfig(mockConfig));
    const state = store.getState();
    
    expect(state.config.appConfig).toEqual(mockConfig);
  });

  test('should handle ad actions', () => {
    const mockAd: AdResponse = {
      adId: 'ad123',
      adType: AdType.REWARD_VIDEO,
      adTitle: 'Test Ad',
      expectedReward: 100,
      configParams: {},
    };

    store.dispatch(setCurrentAd(mockAd));
    const state = store.getState();
    
    expect(state.ad.currentAd).toEqual(mockAd);
  });

  test('should handle sync actions', () => {
    const mockOfflineData: OfflineAdData = {
      id: 'offline123',
      userId: 1,
      appKey: 'test-app-key',
      adId: 'ad123',
      adType: AdType.REWARD_VIDEO,
      eventType: 'show',
      playData: {
        adId: 'ad123',
        adType: AdType.REWARD_VIDEO,
        playDuration: 30000,
        isClicked: false,
        isSkipped: false,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      synced: false,
      retryCount: 0,
    };

    store.dispatch(addToOfflineQueue(mockOfflineData));
    const state = store.getState();
    
    expect(state.sync.offlineQueue).toHaveLength(1);
    expect(state.sync.offlineQueue[0]).toEqual(mockOfflineData);
  });

  test('should have correct reducer structure', () => {
    const state = store.getState();
    
    expect(state).toHaveProperty('auth');
    expect(state).toHaveProperty('config');
    expect(state).toHaveProperty('ad');
    expect(state).toHaveProperty('sync');
    expect(state).toHaveProperty('api');
  });
});