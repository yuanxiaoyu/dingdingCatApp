import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Custom hooks for common state selections
export const useAuth = () => useAppSelector((state) => state.auth);
export const useConfig = () => useAppSelector((state) => state.config);
export const useAd = () => useAppSelector((state) => state.ad);
export const useSync = () => useAppSelector((state) => state.sync);

// Specific auth hooks
export const useUser = () => useAppSelector((state) => state.auth.user);
export const useIsAuthenticated = () => useAppSelector((state) => state.auth.isAuthenticated);
export const useAuthTokens = () => useAppSelector((state) => state.auth.tokens);

// Specific config hooks
export const useAppConfig = () => useAppSelector((state) => state.config.appConfig);
export const useAdConfig = () => useAppSelector((state) => state.config.adConfig);
export const useRiskConfig = () => useAppSelector((state) => state.config.riskConfig);
export const useChannelConfig = () => useAppSelector((state) => state.config.channelConfig);

// Specific ad hooks
export const useCurrentAd = () => useAppSelector((state) => state.ad.currentAd);
export const useRevenueData = () => useAppSelector((state) => state.ad.revenueData);
export const useAdHistory = () => useAppSelector((state) => state.ad.history);

// Specific sync hooks
export const useOfflineQueue = () => useAppSelector((state) => state.sync.offlineQueue);
export const useIsSyncing = () => useAppSelector((state) => state.sync.isSyncing);
export const useSyncStatus = () => useAppSelector((state) => ({
  isSyncing: state.sync.isSyncing,
  lastSyncTime: state.sync.lastSyncTime,
  queueCount: state.sync.offlineQueue.length,
  unsyncedCount: state.sync.offlineQueue.filter(item => !item.synced).length,
}));

// Loading state hooks
export const useLoadingStates = () => useAppSelector((state) => ({
  authLoading: state.auth.isLoading,
  configLoading: state.config.isLoading,
  adLoading: state.ad.isLoading,
  syncLoading: state.sync.isSyncing,
}));

// Error state hooks
export const useErrorStates = () => useAppSelector((state) => ({
  authError: state.auth.error,
  configError: state.config.error,
  adError: state.ad.error,
  syncError: state.sync.error,
}));

// Combined app state hook
export const useAppState = () => useAppSelector((state) => ({
  // Auth state
  user: state.auth.user,
  isAuthenticated: state.auth.isAuthenticated,
  authLoading: state.auth.isLoading,
  authError: state.auth.error,
  
  // Config state
  appConfig: state.config.appConfig,
  adConfig: state.config.adConfig,
  riskConfig: state.config.riskConfig,
  configLoading: state.config.isLoading,
  configError: state.config.error,
  
  // Ad state
  currentAd: state.ad.currentAd,
  revenueData: state.ad.revenueData,
  adLoading: state.ad.isLoading,
  adError: state.ad.error,
  
  // Sync state
  offlineQueueCount: state.sync.offlineQueue.length,
  isSyncing: state.sync.isSyncing,
  lastSyncTime: state.sync.lastSyncTime,
  syncError: state.sync.error,
}));