import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SyncState, OfflineAdData, BatchReportRequest, BatchReportPlayData } from '../../types';
import { SyncService } from '../../services/SyncService';

// Initial state
const initialState: SyncState = {
  offlineQueue: [],
  isSyncing: false,
  lastSyncTime: 0,
  error: null,
};

// Async thunks for sync operations
export const queueOfflineData = createAsyncThunk(
  'sync/queueOfflineData',
  async (data: OfflineAdData, { rejectWithValue }) => {
    try {
      const syncService = new SyncService();
      await syncService.queueOfflineData(data);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to queue offline data');
    }
  }
);

export const syncOfflineData = createAsyncThunk(
  'sync/syncOfflineData',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { sync: SyncState };
      const syncService = new SyncService();
      
      if (state.sync.offlineQueue.length === 0) {
        return {
          synced: 0,
          failed: 0,
          timestamp: Date.now(),
        };
      }

      const result = await syncService.syncOfflineData();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to sync offline data');
    }
  }
);

export const batchReportAds = createAsyncThunk(
  'sync/batchReportAds',
  async (request: BatchReportRequest, { rejectWithValue }) => {
    try {
      const syncService = new SyncService();
      const response = await syncService.batchReportAds(request);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to batch report ads');
    }
  }
);

export const clearSyncedData = createAsyncThunk(
  'sync/clearSyncedData',
  async (syncedIds: string[], { rejectWithValue }) => {
    try {
      const syncService = new SyncService();
      await syncService.clearSyncedData(syncedIds);
      return syncedIds;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to clear synced data');
    }
  }
);

export const loadOfflineQueue = createAsyncThunk(
  'sync/loadOfflineQueue',
  async (_, { rejectWithValue }) => {
    try {
      const syncService = new SyncService();
      const offlineData = await syncService.getOfflineQueue();
      return offlineData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load offline queue');
    }
  }
);

export const retryFailedSync = createAsyncThunk(
  'sync/retryFailedSync',
  async (maxRetries: number = 3, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as { sync: SyncState };
      const syncService = new SyncService();
      
      // Get failed items that haven't exceeded max retries
      const retryableItems = state.sync.offlineQueue.filter(
        item => !item.synced && item.retryCount < maxRetries
      );

      if (retryableItems.length === 0) {
        return {
          retried: 0,
          timestamp: Date.now(),
        };
      }

      // Increment retry count for items being retried
      const updatedItems = retryableItems.map(item => ({
        ...item,
        retryCount: item.retryCount + 1,
      }));

      // Update the items in storage
      for (const item of updatedItems) {
        await syncService.updateOfflineData(item);
      }

      // Attempt sync
      const result = await dispatch(syncOfflineData()).unwrap();
      
      return {
        retried: retryableItems.length,
        synced: result.synced,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to retry sync');
    }
  }
);

// Helper thunk to auto-sync when network becomes available
export const autoSync = createAsyncThunk(
  'sync/autoSync',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as { sync: SyncState };
      
      // Don't sync if already syncing or no data to sync
      if (state.sync.isSyncing || state.sync.offlineQueue.length === 0) {
        return { skipped: true };
      }

      // Check if enough time has passed since last sync (avoid too frequent syncs)
      const timeSinceLastSync = Date.now() - state.sync.lastSyncTime;
      const minSyncInterval = 30000; // 30 seconds
      
      if (timeSinceLastSync < minSyncInterval) {
        return { skipped: true, reason: 'too_frequent' };
      }

      const result = await dispatch(syncOfflineData()).unwrap();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Auto sync failed');
    }
  }
);

// Sync slice
const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    // Synchronous actions
    addToOfflineQueue: (state, action: PayloadAction<OfflineAdData>) => {
      // Check if item already exists
      const existingIndex = state.offlineQueue.findIndex(item => item.id === action.payload.id);
      if (existingIndex === -1) {
        state.offlineQueue.push(action.payload);
      } else {
        // Update existing item
        state.offlineQueue[existingIndex] = action.payload;
      }
    },
    removeFromOfflineQueue: (state, action: PayloadAction<string[]>) => {
      state.offlineQueue = state.offlineQueue.filter(
        item => !action.payload.includes(item.id)
      );
    },
    updateOfflineItem: (state, action: PayloadAction<{ id: string; updates: Partial<OfflineAdData> }>) => {
      const index = state.offlineQueue.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.offlineQueue[index] = { ...state.offlineQueue[index], ...action.payload.updates };
      }
    },
    markItemAsSynced: (state, action: PayloadAction<string>) => {
      const index = state.offlineQueue.findIndex(item => item.id === action.payload);
      if (index !== -1) {
        state.offlineQueue[index].synced = true;
      }
    },
    clearOfflineQueue: (state) => {
      state.offlineQueue = [];
    },
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    setLastSyncTime: (state, action: PayloadAction<number>) => {
      state.lastSyncTime = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Queue Offline Data
    builder
      .addCase(queueOfflineData.pending, (state) => {
        state.error = null;
      })
      .addCase(queueOfflineData.fulfilled, (state, action: PayloadAction<OfflineAdData>) => {
        // Add to queue if not already present
        const existingIndex = state.offlineQueue.findIndex(item => item.id === action.payload.id);
        if (existingIndex === -1) {
          state.offlineQueue.push(action.payload);
        }
        state.error = null;
      })
      .addCase(queueOfflineData.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Sync Offline Data
    builder
      .addCase(syncOfflineData.pending, (state) => {
        state.isSyncing = true;
        state.error = null;
      })
      .addCase(syncOfflineData.fulfilled, (state, action) => {
        state.isSyncing = false;
        state.lastSyncTime = action.payload.timestamp;
        // Remove synced items from queue
        if (action.payload.synced > 0) {
          state.offlineQueue = state.offlineQueue.filter(item => !item.synced);
        }
        state.error = null;
      })
      .addCase(syncOfflineData.rejected, (state, action) => {
        state.isSyncing = false;
        state.error = action.payload as string;
      });

    // Batch Report Ads
    builder
      .addCase(batchReportAds.pending, (state) => {
        state.isSyncing = true;
        state.error = null;
      })
      .addCase(batchReportAds.fulfilled, (state) => {
        state.isSyncing = false;
        state.lastSyncTime = Date.now();
        state.error = null;
      })
      .addCase(batchReportAds.rejected, (state, action) => {
        state.isSyncing = false;
        state.error = action.payload as string;
      });

    // Clear Synced Data
    builder
      .addCase(clearSyncedData.pending, (state) => {
        state.error = null;
      })
      .addCase(clearSyncedData.fulfilled, (state, action: PayloadAction<string[]>) => {
        // Remove cleared items from queue
        state.offlineQueue = state.offlineQueue.filter(
          item => !action.payload.includes(item.id)
        );
        state.error = null;
      })
      .addCase(clearSyncedData.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Load Offline Queue
    builder
      .addCase(loadOfflineQueue.pending, (state) => {
        state.error = null;
      })
      .addCase(loadOfflineQueue.fulfilled, (state, action: PayloadAction<OfflineAdData[]>) => {
        state.offlineQueue = action.payload;
        state.error = null;
      })
      .addCase(loadOfflineQueue.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Retry Failed Sync
    builder
      .addCase(retryFailedSync.pending, (state) => {
        state.isSyncing = true;
        state.error = null;
      })
      .addCase(retryFailedSync.fulfilled, (state, action) => {
        state.isSyncing = false;
        state.lastSyncTime = action.payload.timestamp;
        // Remove synced items from queue
        if (action.payload.synced > 0) {
          state.offlineQueue = state.offlineQueue.filter(item => !item.synced);
        }
        state.error = null;
      })
      .addCase(retryFailedSync.rejected, (state, action) => {
        state.isSyncing = false;
        state.error = action.payload as string;
      });

    // Auto Sync
    builder
      .addCase(autoSync.pending, (state) => {
        state.isSyncing = true;
        state.error = null;
      })
      .addCase(autoSync.fulfilled, (state, action) => {
        state.isSyncing = false;
        if (!action.payload.skipped) {
          state.lastSyncTime = action.payload.timestamp;
          // Remove synced items from queue
          if (action.payload.synced > 0) {
            state.offlineQueue = state.offlineQueue.filter(item => !item.synced);
          }
        }
        state.error = null;
      })
      .addCase(autoSync.rejected, (state, action) => {
        state.isSyncing = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { 
  addToOfflineQueue, 
  removeFromOfflineQueue, 
  updateOfflineItem, 
  markItemAsSynced, 
  clearOfflineQueue, 
  setSyncing, 
  setLastSyncTime, 
  clearError 
} = syncSlice.actions;

// Export selectors
export const selectSync = (state: { sync: SyncState }) => state.sync;
export const selectOfflineQueue = (state: { sync: SyncState }) => state.sync.offlineQueue;
export const selectIsSyncing = (state: { sync: SyncState }) => state.sync.isSyncing;
export const selectLastSyncTime = (state: { sync: SyncState }) => state.sync.lastSyncTime;
export const selectSyncError = (state: { sync: SyncState }) => state.sync.error;

// Derived selectors
export const selectOfflineQueueCount = (state: { sync: SyncState }) => state.sync.offlineQueue.length;
export const selectUnsyncedCount = (state: { sync: SyncState }) => 
  state.sync.offlineQueue.filter(item => !item.synced).length;
export const selectFailedSyncCount = (state: { sync: SyncState }) => 
  state.sync.offlineQueue.filter(item => !item.synced && item.retryCount > 0).length;

// Filter selectors
export const selectOfflineDataByType = (eventType: string) => (state: { sync: SyncState }) =>
  state.sync.offlineQueue.filter(item => item.eventType === eventType);

export const selectOfflineDataByAdType = (adType: string) => (state: { sync: SyncState }) =>
  state.sync.offlineQueue.filter(item => item.adType === adType);

export const selectPendingSyncData = (state: { sync: SyncState }) =>
  state.sync.offlineQueue.filter(item => !item.synced);

// Export reducer
export default syncSlice.reducer;