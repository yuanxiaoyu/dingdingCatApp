// Redux Slices Export Index
export { default as authReducer } from './authSlice';
export { default as configReducer } from './configSlice';
export { default as adReducer } from './adSlice';
export { default as syncReducer } from './syncSlice';

// Export actions with prefixes to avoid conflicts
export { 
  setUser, 
  setTokens, 
  clearAuth, 
  clearError as clearAuthError, 
  setLoading as setAuthLoading, 
  setInitialized as setAuthInitialized,
  // Selectors
  selectUser,
  selectTokens,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  selectIsInitialized
} from './authSlice';

export { 
  setAppConfig, 
  setAdConfig, 
  setRiskConfig, 
  setChannelConfig, 
  clearConfigs, 
  clearError as clearConfigError, 
  setLoading as setConfigLoading,
  // Async thunks
  fetchAppConfig,
  fetchAdConfig,
  fetchRiskConfig,
  fetchChannelConfig,
  fetchAllConfigs,
  checkConfigVersions,
  // Selectors
  selectConfig,
  selectAppConfig,
  selectAdConfig,
  selectRiskConfig,
  selectChannelConfig,
  selectConfigLoading,
  selectConfigError
} from './configSlice';

export { 
  setAdData,
  setRevenueData,
  setHistory,
  clearAdData,
  clearError as clearAdError,
  setLoading as setAdLoading,
  // Async thunks
  requestAd,
  reportAdShow,
  reportAdClick,
  reportAdComplete,
  reportAdSkip,
  reportAdClose,
  fetchUserRevenue,
  fetchAdHistory,
  // Selectors
  selectAdData,
  selectRevenueData,
  selectHistory,
  selectAdLoading,
  selectAdError
} from './adSlice';

export { 
  addOfflineData,
  removeOfflineData,
  clearOfflineData,
  setSyncStatus,
  // Async thunks
  syncOfflineData,
  batchReportAds,
  clearSyncedData,
  retryFailedSync,
  // Selectors
  selectSyncState,
  selectOfflineData,
  selectSyncStatus,
  selectLastSyncTime
} from './syncSlice';