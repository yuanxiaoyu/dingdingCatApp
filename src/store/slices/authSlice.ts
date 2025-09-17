import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User, AuthTokens, LoginRequest, RegisterRequest, RefreshTokenRequest, LoginResponse } from '../../types';

// Initial state
const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};

// Import the singleton service instance
import authService from '../../services/AuthService';

// Async thunks for auth operations
export const wechatLogin = createAsyncThunk(
  'auth/wechatLogin',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.wechatLogin();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const wechatRegister = createAsyncThunk(
  'auth/wechatRegister',
  async (request: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await authService.autoRegister(request);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (request?: RefreshTokenRequest, { rejectWithValue }) => {
    try {
      const newToken = await authService.refreshToken(request);
      if (newToken) {
        // Return the new token in the expected format
        return {
          accessToken: newToken,
          tokenType: 'Bearer',
          expiresIn: 1800,
        };
      }
      throw new Error('Token refresh failed');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Token refresh failed');
    }
  }
);

export const getUserInfo = createAsyncThunk(
  'auth/getUserInfo',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getUserInfo();
      if (!response) {
        throw new Error('No user info available');
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get user info');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

export const checkAuthState = createAsyncThunk(
  'auth/checkAuthState',
  async (_, { rejectWithValue }) => {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      if (isAuthenticated) {
        const userInfo = await authService.getUserInfo();
        return { isAuthenticated: true, user: userInfo };
      }
      return { isAuthenticated: false, user: null };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check auth state');
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Synchronous actions
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    setTokens: (state, action: PayloadAction<AuthTokens>) => {
      state.tokens = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.tokens = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
  },
  extraReducers: (builder) => {
    // WeChat Login
    builder
      .addCase(wechatLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(wechatLogin.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.isLoading = false;
        state.user = {
          userId: action.payload.userId,
          userName: action.payload.userName,
          nickName: action.payload.nickName,
          avatar: action.payload.avatar,
          phoneNumber: action.payload.phoneNumber,
          email: action.payload.email,
          sex: action.payload.sex,
          wechatOpenId: action.payload.wechatOpenId,
          registerChannel: action.payload.registerChannel,
          appKey: action.payload.appKey,
          registerTime: action.payload.registerTime,
          lastLoginTime: action.payload.lastLoginTime,
        };
        state.tokens = {
          accessToken: action.payload.accessToken,
          tokenType: action.payload.tokenType,
          expiresIn: action.payload.expiresIn,
        };
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(wechatLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // WeChat Register
    builder
      .addCase(wechatRegister.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(wechatRegister.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.isLoading = false;
        state.user = {
          userId: action.payload.userId,
          userName: action.payload.userName,
          nickName: action.payload.nickName,
          avatar: action.payload.avatar,
          phoneNumber: action.payload.phoneNumber,
          email: action.payload.email,
          sex: action.payload.sex,
          wechatOpenId: action.payload.wechatOpenId,
          registerChannel: action.payload.registerChannel,
          appKey: action.payload.appKey,
          registerTime: action.payload.registerTime,
          lastLoginTime: action.payload.lastLoginTime,
        };
        state.tokens = {
          accessToken: action.payload.accessToken,
          tokenType: action.payload.tokenType,
          expiresIn: action.payload.expiresIn,
        };
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(wechatRegister.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Refresh Token
    builder
      .addCase(refreshToken.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(refreshToken.fulfilled, (state, action: PayloadAction<AuthTokens>) => {
        state.isLoading = false;
        state.tokens = action.payload;
        state.error = null;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        // Clear auth on refresh token failure
        state.user = null;
        state.tokens = null;
        state.isAuthenticated = false;
      });

    // Get User Info
    builder
      .addCase(getUserInfo.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUserInfo.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(getUserInfo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.tokens = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        // Still clear auth even if logout API fails
        state.user = null;
        state.tokens = null;
        state.isAuthenticated = false;
      });

    // Check Auth State
    builder
      .addCase(checkAuthState.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkAuthState.fulfilled, (state, action: PayloadAction<{ isAuthenticated: boolean; user: User | null }>) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(checkAuthState.rejected, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { setUser, setTokens, clearAuth, clearError, setLoading, setInitialized } = authSlice.actions;

// Export selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectTokens = (state: { auth: AuthState }) => state.auth.tokens;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;

// Export reducer
export default authSlice.reducer;