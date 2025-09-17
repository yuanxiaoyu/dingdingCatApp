import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ConfigState, AppConfig, AdConfig, RiskConfig, ChannelConfigResponse } from '../../types';
import configService from '../../services/ConfigService';

// Initial state
const initialState: ConfigState = {
  appConfig: null,
  adConfig: null,
  riskConfig: null,
  channelConfig: null,
  lastUpdated: 0,
  isLoading: false,
  error: null,
};

// Async thunks for config operations
export const fetchAppConfig = createAsyncThunk(
  'config/fetchAppConfig',
  async (appKey: string, { rejectWithValue }) => {
    try {
      const response = await configService.getAppConfig(appKey);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch app config');
    }
  }
);

export const fetchAdConfig = createAsyncThunk(
  'config/fetchAdConfig',
  async (appKey: string, { rejectWithValue }) => {
    try {
      const response = await configService.getAdConfig(appKey);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch ad config');
    }
  }
);

export const fetchRiskConfig = createAsyncThunk(
  'config/fetchRiskConfig',
  async (appKey: string, { rejectWithValue }) => {
    try {
      const response = await configService.getRiskConfig(appKey);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch risk config');
    }
  }
);

export const fetchChannelConfig = createAsyncThunk(
  'config/fetchChannelConfig',
  async (appKey: string, { rejectWithValue }) => {
    try {
      const response = await configService.getChannelConfig(appKey);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch channel config');
    }
  }
);

export const fetchAllConfigs = createAsyncThunk(
  'config/fetchAllConfigs',
  async (appKey: string, { dispatch, rejectWithValue }) => {
    try {
      // Fetch all configs in parallel
      const results = await Promise.allSettled([
        dispatch(fetchAppConfig(appKey)).unwrap(),
        dispatch(fetchAdConfig(appKey)).unwrap(),
        dispatch(fetchRiskConfig(appKey)).unwrap(),
        dispatch(fetchChannelConfig(appKey)).unwrap(),
      ]);

      // Check if any failed
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        console.warn('Some configs failed to load:', failures);
      }

      return {
        success: results.filter(result => result.status === 'fulfilled').length,
        total: results.length,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch configs');
    }
  }
);

export const checkConfigVersions = createAsyncThunk(
  'config/checkConfigVersions',
  async (appKey: string, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as { config: ConfigState };
      
      // Check if configs need updating based on version
      const currentVersions = {
        app: state.config.appConfig?.configVersion,
        ad: state.config.adConfig?.configVersion,
        risk: state.config.riskConfig?.configVersion,
        channel: state.config.channelConfig?.configVersion,
      };

      // Get latest versions from server (simplified check)
      const latestAppConfig = await configService.getAppConfig(appKey);
      
      const updates: string[] = [];
      
      if (currentVersions.app !== latestAppConfig.configVersion) {
        updates.push('app');
        await dispatch(fetchAppConfig(appKey));
      }

      // For now, we'll update all configs if app config version changed
      if (updates.length > 0) {
        await dispatch(fetchAdConfig(appKey));
        await dispatch(fetchRiskConfig(appKey));
        await dispatch(fetchChannelConfig(appKey));
        updates.push('ad', 'risk', 'channel');
      }

      return {
        updated: updates,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check config versions');
    }
  }
);

// Config slice
const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    // Synchronous actions
    setAppConfig: (state, action: PayloadAction<AppConfig>) => {
      state.appConfig = action.payload;
      state.lastUpdated = Date.now();
    },
    setAdConfig: (state, action: PayloadAction<AdConfig>) => {
      state.adConfig = action.payload;
      state.lastUpdated = Date.now();
    },
    setRiskConfig: (state, action: PayloadAction<RiskConfig>) => {
      state.riskConfig = action.payload;
      state.lastUpdated = Date.now();
    },
    setChannelConfig: (state, action: PayloadAction<ChannelConfigResponse>) => {
      state.channelConfig = action.payload;
      state.lastUpdated = Date.now();
    },
    clearConfigs: (state) => {
      state.appConfig = null;
      state.adConfig = null;
      state.riskConfig = null;
      state.channelConfig = null;
      state.lastUpdated = 0;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch App Config
    builder
      .addCase(fetchAppConfig.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAppConfig.fulfilled, (state, action: PayloadAction<AppConfig>) => {
        state.isLoading = false;
        state.appConfig = action.payload;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchAppConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Ad Config
    builder
      .addCase(fetchAdConfig.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAdConfig.fulfilled, (state, action: PayloadAction<AdConfig>) => {
        state.isLoading = false;
        state.adConfig = action.payload;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchAdConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Risk Config
    builder
      .addCase(fetchRiskConfig.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRiskConfig.fulfilled, (state, action: PayloadAction<RiskConfig>) => {
        state.isLoading = false;
        state.riskConfig = action.payload;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchRiskConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Channel Config
    builder
      .addCase(fetchChannelConfig.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChannelConfig.fulfilled, (state, action: PayloadAction<ChannelConfigResponse>) => {
        state.isLoading = false;
        state.channelConfig = action.payload;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchChannelConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch All Configs
    builder
      .addCase(fetchAllConfigs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllConfigs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchAllConfigs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Check Config Versions
    builder
      .addCase(checkConfigVersions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkConfigVersions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lastUpdated = action.payload.timestamp;
        state.error = null;
      })
      .addCase(checkConfigVersions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { 
  setAppConfig, 
  setAdConfig, 
  setRiskConfig, 
  setChannelConfig, 
  clearConfigs, 
  clearError, 
  setLoading 
} = configSlice.actions;

// Export selectors
export const selectConfig = (state: { config: ConfigState }) => state.config;
export const selectAppConfig = (state: { config: ConfigState }) => state.config.appConfig;
export const selectAdConfig = (state: { config: ConfigState }) => state.config.adConfig;
export const selectRiskConfig = (state: { config: ConfigState }) => state.config.riskConfig;
export const selectChannelConfig = (state: { config: ConfigState }) => state.config.channelConfig;
export const selectConfigLoading = (state: { config: ConfigState }) => state.config.isLoading;
export const selectConfigError = (state: { config: ConfigState }) => state.config.error;
export const selectConfigLastUpdated = (state: { config: ConfigState }) => state.config.lastUpdated;

// Export reducer
export default configSlice.reducer;