// Redux Store Configuration
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

// Import slice reducers
import authReducer from './slices/authSlice';
import configReducer from './slices/configSlice';
import adReducer from './slices/adSlice';
import syncReducer from './slices/syncSlice';
import musicReducer from './slices/musicSlice';
import favoritesReducer from './slices/favoritesSlice';
import { apiSlice } from './api/apiSlice';

// Configure the Redux store
export const store = configureStore({
  reducer: {
    // Feature slices
    auth: authReducer,
    config: configReducer,
    ad: adReducer,
    sync: syncReducer,
    music: musicReducer,
    favorites: favoritesReducer,
    // RTK Query API slice
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST', 
          'persist/REHYDRATE',
          // RTK Query actions
          'api/executeQuery/pending',
          'api/executeQuery/fulfilled',
          'api/executeQuery/rejected',
          'api/executeMutation/pending',
          'api/executeMutation/fulfilled',
          'api/executeMutation/rejected',
        ],
        ignoredPaths: [
          // Ignore RTK Query cache paths
          'api.queries',
          'api.mutations',
        ],
      },
    })
    // Add RTK Query middleware
    .concat(apiSlice.middleware),
});

// Setup listeners for RTK Query (enables caching, invalidation, polling, etc.)
setupListeners(store.dispatch);

// Export types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export store as default
export default store;

// Re-export slices and their actions/selectors
export * from './slices';

// Re-export API slice
export * from './api/apiSlice';

// Re-export hooks
export * from './hooks';

// Re-export provider
export { default as StoreProvider } from './StoreProvider';