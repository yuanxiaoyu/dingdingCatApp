import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  AdState, 
  AdResponse, 
  RevenueData, 
  AdHistoryItem, 
  AdHistoryResponse,
  AdRequest,
  AdShowRequest,
  AdClickRequest,
  AdCompleteRequest,
  AdSkipRequest,
  AdCloseRequest,
  AdHistoryRequest,
  AdType 
} from '../../types';
import { AdService } from '../../services/AdService';

// Initial state
const initialState: AdState = {
  currentAd: null,
  revenueData: null,
  history: [],
  isLoading: false,
  error: null,
};

// Async thunks for ad operations
export const requestAd = createAsyncThunk(
  'ad/requestAd',
  async (request: AdRequest, { rejectWithValue }) => {
    try {
      const adService = new AdService();
      const response = await adService.requestAd(request);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to request ad');
    }
  }
);

export const reportAdShow = createAsyncThunk(
  'ad/reportAdShow',
  async (request: AdShowRequest, { rejectWithValue }) => {
    try {
      const adService = new AdService();
      const response = await adService.reportAdShow(request);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to report ad show');
    }
  }
);

export const reportAdClick = createAsyncThunk(
  'ad/reportAdClick',
  async (request: AdClickRequest, { rejectWithValue }) => {
    try {
      const adService = new AdService();
      const response = await adService.reportAdClick(request);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to report ad click');
    }
  }
);

export const reportAdComplete = createAsyncThunk(
  'ad/reportAdComplete',
  async (request: AdCompleteRequest, { rejectWithValue }) => {
    try {
      const adService = new AdService();
      const response = await adService.reportAdComplete(request);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to report ad complete');
    }
  }
);

export const reportAdSkip = createAsyncThunk(
  'ad/reportAdSkip',
  async (request: AdSkipRequest, { rejectWithValue }) => {
    try {
      const adService = new AdService();
      const response = await adService.reportAdSkip(request);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to report ad skip');
    }
  }
);

export const reportAdClose = createAsyncThunk(
  'ad/reportAdClose',
  async (request: AdCloseRequest, { rejectWithValue }) => {
    try {
      const adService = new AdService();
      const response = await adService.reportAdClose(request);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to report ad close');
    }
  }
);

export const fetchUserRevenue = createAsyncThunk(
  'ad/fetchUserRevenue',
  async (params: { userId: number; appKey: string }, { rejectWithValue }) => {
    try {
      const adService = new AdService();
      const response = await adService.getUserRevenue(params.userId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user revenue');
    }
  }
);

export const fetchAdHistory = createAsyncThunk(
  'ad/fetchAdHistory',
  async (request: AdHistoryRequest, { rejectWithValue }) => {
    try {
      const adService = new AdService();
      const response = await adService.getAdHistory(request);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch ad history');
    }
  }
);

export const loadMoreHistory = createAsyncThunk(
  'ad/loadMoreHistory',
  async (request: AdHistoryRequest, { rejectWithValue }) => {
    try {
      const adService = new AdService();
      const response = await adService.getAdHistory(request);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load more history');
    }
  }
);

// Helper thunk for complete ad flow (request -> show -> complete)
export const playAdComplete = createAsyncThunk(
  'ad/playAdComplete',
  async (
    params: {
      adRequest: AdRequest;
      playDuration: number;
      isClicked: boolean;
      stayDuration?: number;
    },
    { dispatch, rejectWithValue }
  ) => {
    try {
      // 1. Request ad
      const adResponse = await dispatch(requestAd(params.adRequest)).unwrap();
      
      // 2. Report ad show
      await dispatch(reportAdShow({
        userId: params.adRequest.userId,
        appKey: params.adRequest.appKey,
        adId: adResponse.adId,
        adType: adResponse.adType,
        showTime: Date.now(),
        ipAddress: params.adRequest.ipAddress,
      })).unwrap();

      // 3. Report ad click if clicked
      if (params.isClicked) {
        await dispatch(reportAdClick({
          userId: params.adRequest.userId,
          appKey: params.adRequest.appKey,
          adId: adResponse.adId,
          adType: adResponse.adType,
          clickTime: Date.now(),
          ipAddress: params.adRequest.ipAddress,
        })).unwrap();
      }

      // 4. Report ad complete
      const completeResponse = await dispatch(reportAdComplete({
        userId: params.adRequest.userId,
        appKey: params.adRequest.appKey,
        adId: adResponse.adId,
        adType: adResponse.adType,
        playDuration: params.playDuration,
        isClicked: params.isClicked ? '1' : '0',
        stayDuration: params.stayDuration,
        completeTime: Date.now(),
        ipAddress: params.adRequest.ipAddress,
      })).unwrap();

      return {
        ad: adResponse,
        reward: completeResponse,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to complete ad flow');
    }
  }
);

// Ad slice
const adSlice = createSlice({
  name: 'ad',
  initialState,
  reducers: {
    // Synchronous actions
    setCurrentAd: (state, action: PayloadAction<AdResponse | null>) => {
      state.currentAd = action.payload;
    },
    setRevenueData: (state, action: PayloadAction<RevenueData>) => {
      state.revenueData = action.payload;
    },
    addHistoryItem: (state, action: PayloadAction<AdHistoryItem>) => {
      state.history.unshift(action.payload);
    },
    updateHistoryItem: (state, action: PayloadAction<{ id: number; updates: Partial<AdHistoryItem> }>) => {
      const index = state.history.findIndex(item => item.statId === action.payload.id);
      if (index !== -1) {
        state.history[index] = { ...state.history[index], ...action.payload.updates };
      }
    },
    clearHistory: (state) => {
      state.history = [];
    },
    clearCurrentAd: (state) => {
      state.currentAd = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Request Ad
    builder
      .addCase(requestAd.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestAd.fulfilled, (state, action: PayloadAction<AdResponse>) => {
        state.isLoading = false;
        state.currentAd = action.payload;
        state.error = null;
      })
      .addCase(requestAd.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Report Ad Show
    builder
      .addCase(reportAdShow.pending, (state) => {
        state.error = null;
      })
      .addCase(reportAdShow.fulfilled, (state) => {
        state.error = null;
      })
      .addCase(reportAdShow.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Report Ad Click
    builder
      .addCase(reportAdClick.pending, (state) => {
        state.error = null;
      })
      .addCase(reportAdClick.fulfilled, (state) => {
        state.error = null;
      })
      .addCase(reportAdClick.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Report Ad Complete
    builder
      .addCase(reportAdComplete.pending, (state) => {
        state.error = null;
      })
      .addCase(reportAdComplete.fulfilled, (state, action) => {
        state.error = null;
        // Update revenue data if returned
        if (action.payload && typeof action.payload === 'object' && 'rewardAmount' in action.payload) {
          if (state.revenueData) {
            state.revenueData.todayRevenue += (action.payload as any).rewardAmount;
            state.revenueData.totalRevenue += (action.payload as any).rewardAmount;
            state.revenueData.todayWatchCount += 1;
            state.revenueData.totalWatchCount += 1;
          }
        }
      })
      .addCase(reportAdComplete.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Report Ad Skip
    builder
      .addCase(reportAdSkip.pending, (state) => {
        state.error = null;
      })
      .addCase(reportAdSkip.fulfilled, (state) => {
        state.error = null;
      })
      .addCase(reportAdSkip.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Report Ad Close
    builder
      .addCase(reportAdClose.pending, (state) => {
        state.error = null;
      })
      .addCase(reportAdClose.fulfilled, (state) => {
        state.error = null;
      })
      .addCase(reportAdClose.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Fetch User Revenue
    builder
      .addCase(fetchUserRevenue.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserRevenue.fulfilled, (state, action: PayloadAction<RevenueData>) => {
        state.isLoading = false;
        state.revenueData = action.payload;
        state.error = null;
      })
      .addCase(fetchUserRevenue.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Ad History
    builder
      .addCase(fetchAdHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAdHistory.fulfilled, (state, action: PayloadAction<AdHistoryResponse>) => {
        state.isLoading = false;
        state.history = action.payload.historyList;
        state.error = null;
      })
      .addCase(fetchAdHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Load More History
    builder
      .addCase(loadMoreHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadMoreHistory.fulfilled, (state, action: PayloadAction<AdHistoryResponse>) => {
        state.isLoading = false;
        // Append new history items
        state.history = [...state.history, ...action.payload.historyList];
        state.error = null;
      })
      .addCase(loadMoreHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Play Ad Complete Flow
    builder
      .addCase(playAdComplete.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(playAdComplete.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentAd = action.payload.ad;
        // Update revenue if available
        if (action.payload.reward && typeof action.payload.reward === 'object' && 'rewardAmount' in action.payload.reward) {
          if (state.revenueData) {
            state.revenueData.todayRevenue += (action.payload.reward as any).rewardAmount;
            state.revenueData.totalRevenue += (action.payload.reward as any).rewardAmount;
            state.revenueData.todayWatchCount += 1;
            state.revenueData.totalWatchCount += 1;
          }
        }
        state.error = null;
      })
      .addCase(playAdComplete.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { 
  setCurrentAd, 
  setRevenueData, 
  addHistoryItem, 
  updateHistoryItem, 
  clearHistory, 
  clearCurrentAd, 
  clearError, 
  setLoading 
} = adSlice.actions;

// Export selectors
export const selectAd = (state: { ad: AdState }) => state.ad;
export const selectCurrentAd = (state: { ad: AdState }) => state.ad.currentAd;
export const selectRevenueData = (state: { ad: AdState }) => state.ad.revenueData;
export const selectAdHistory = (state: { ad: AdState }) => state.ad.history;
export const selectAdLoading = (state: { ad: AdState }) => state.ad.isLoading;
export const selectAdError = (state: { ad: AdState }) => state.ad.error;

// Derived selectors
export const selectTodayRevenue = (state: { ad: AdState }) => state.ad.revenueData?.todayRevenue || 0;
export const selectTotalRevenue = (state: { ad: AdState }) => state.ad.revenueData?.totalRevenue || 0;
export const selectTodayWatchCount = (state: { ad: AdState }) => state.ad.revenueData?.todayWatchCount || 0;
export const selectTotalWatchCount = (state: { ad: AdState }) => state.ad.revenueData?.totalWatchCount || 0;
export const selectRemainingWatchCount = (state: { ad: AdState }) => state.ad.revenueData?.remainingWatchCount || 0;

// Filter selectors
export const selectHistoryByType = (adType: AdType) => (state: { ad: AdState }) => 
  state.ad.history.filter(item => item.adType === adType);

export const selectHistoryByDateRange = (startDate: string, endDate: string) => (state: { ad: AdState }) =>
  state.ad.history.filter(item => {
    const itemDate = new Date(item.playTime).toISOString().split('T')[0];
    return itemDate >= startDate && itemDate <= endDate;
  });

// Export reducer
export default adSlice.reducer;