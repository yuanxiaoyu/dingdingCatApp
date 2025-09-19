// Redux Slices Export Index
export { default as authReducer } from './authSlice';
export { default as configReducer } from './configSlice';
export { default as adReducer } from './adSlice';
export { default as syncReducer } from './syncSlice';
export { default as musicReducer } from './musicSlice';
export { default as favoritesReducer } from './favoritesSlice';

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
  setCurrentAd,
  setRevenueData,
  clearCurrentAd,
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
  playAdComplete,
  // Selectors
  selectAd,
  selectCurrentAd,
  selectRevenueData,
  selectAdLoading,
  selectAdError,
  selectTodayRevenue,
  selectTotalRevenue,
  selectTodayWatchCount,
  selectTotalWatchCount,
  selectRemainingWatchCount
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

export {
  // Actions
  clearError as clearMusicError,
  togglePlaybackPanel,
  setPlaybackPanelVisible,
  updatePlayingTracks,
  // Async thunks
  loadMusicData,
  playMusic,
  pauseAllMusic,
  resumeAllMusic,
  stopAllMusic,
  setTrackVolume,
  setMasterVolume,
  toggleGlobalPlayback,
  // Selectors
  selectMusicState,
  selectMusicList,
  selectMusicCategories,
  selectPlayingTracks,
  selectIsPlaying,
  selectMasterVolume,
  selectShowPlaybackPanel,
  selectMusicLoading,
  selectMusicError,
  selectIsTrackPlaying,
  selectTrackVolume,
  selectMusicByCategory
} from './musicSlice';

export {
  // Actions
  clearError as clearFavoritesError,
  resetLoadingState as resetFavoritesLoadingState,
  addFavoriteLocally,
  removeFavoriteLocally,
  // Async thunks
  loadFavorites,
  addToFavorites,
  removeFromFavorites,
  toggleFavorite,
  clearAllFavorites,
  checkIsFavorited,
  // Selectors
  selectFavoritesState,
  selectFavorites,
  selectFavoritesLoading,
  selectFavoritesError,
  selectIsAddingFavorite,
  selectIsRemovingFavorite,
  selectIsFavorited,
  selectFavoriteById,
  selectFavoritesByCategory,
  selectFavoritesCount
} from './favoritesSlice';