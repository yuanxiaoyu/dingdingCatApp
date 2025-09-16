import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { 
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RefreshTokenRequest,
  AuthTokens,
  User,
  AppConfig,
  AdConfig,
  RiskConfig,
  ChannelConfigResponse,
  AdRequest,
  AdResponse,
  AdShowRequest,
  AdClickRequest,
  AdCompleteRequest,
  AdSkipRequest,
  AdCloseRequest,
  BatchReportRequest,
  RevenueData,
  AdHistoryRequest,
  AdHistoryResponse,
  DeviceInfo,
  DeviceReportResponse
} from '../../types';
import { RootState } from '../index';

// Base query with auth header injection
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.REACT_APP_API_BASE_URL || 'https://api.dingdingcat.com',
  prepareHeaders: (headers, { getState }) => {
    // Get token from auth state
    const state = getState() as RootState;
    const token = state.auth.tokens?.accessToken;
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

// Base query with re-auth logic
const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);
  
  // If we get a 401, try to refresh the token
  if (result.error && result.error.status === 401) {
    const state = api.getState() as RootState;
    const refreshToken = state.auth.tokens?.refreshToken;
    
    if (refreshToken) {
      // Try to refresh the token
      const refreshResult = await baseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: {
            appKey: state.auth.user?.appKey,
            refreshToken,
            userId: state.auth.user?.userId?.toString(),
          },
        },
        api,
        extraOptions
      );
      
      if (refreshResult.data) {
        // Store the new token
        const newTokens = (refreshResult.data as ApiResponse<AuthTokens>).data;
        api.dispatch({ type: 'auth/setTokens', payload: newTokens });
        
        // Retry the original query with new token
        result = await baseQuery(args, api, extraOptions);
      } else {
        // Refresh failed, clear auth
        api.dispatch({ type: 'auth/clearAuth' });
      }
    } else {
      // No refresh token, clear auth
      api.dispatch({ type: 'auth/clearAuth' });
    }
  }
  
  return result;
};

// Create the API slice
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Auth',
    'User', 
    'Config',
    'AdConfig',
    'RiskConfig',
    'ChannelConfig',
    'Ad',
    'Revenue',
    'History',
    'Device'
  ],
  endpoints: (builder) => ({
    // Auth endpoints
    wechatLogin: builder.mutation<ApiResponse<LoginResponse>, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/wechat/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth', 'User'],
    }),

    wechatRegister: builder.mutation<ApiResponse<LoginResponse>, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/wechat/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['Auth', 'User'],
    }),

    refreshToken: builder.mutation<ApiResponse<AuthTokens>, RefreshTokenRequest>({
      query: (tokenData) => ({
        url: '/auth/refresh',
        method: 'POST',
        body: tokenData,
      }),
      invalidatesTags: ['Auth'],
    }),

    logout: builder.mutation<ApiResponse<boolean>, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth', 'User'],
    }),

    getUserInfo: builder.query<ApiResponse<User>, void>({
      query: () => '/auth/userInfo',
      providesTags: ['User'],
    }),

    // Config endpoints
    getAppConfig: builder.query<ApiResponse<AppConfig>, string>({
      query: (appKey) => `/config?appKey=${appKey}`,
      providesTags: ['Config'],
    }),

    getAdConfig: builder.query<ApiResponse<AdConfig>, string>({
      query: (appKey) => `/config/ad?appKey=${appKey}`,
      providesTags: ['AdConfig'],
    }),

    getRiskConfig: builder.query<ApiResponse<RiskConfig>, string>({
      query: (appKey) => `/config/risk?appKey=${appKey}`,
      providesTags: ['RiskConfig'],
    }),

    getChannelConfig: builder.query<ApiResponse<ChannelConfigResponse>, string>({
      query: (appKey) => `/config/channel?appKey=${appKey}`,
      providesTags: ['ChannelConfig'],
    }),

    // Ad endpoints
    requestAd: builder.mutation<ApiResponse<AdResponse>, AdRequest>({
      query: (adRequest) => ({
        url: '/ad/request',
        method: 'POST',
        body: adRequest,
      }),
      invalidatesTags: ['Ad'],
    }),

    reportAdShow: builder.mutation<ApiResponse<any>, AdShowRequest>({
      query: (showData) => ({
        url: '/ad/show',
        method: 'POST',
        body: showData,
      }),
    }),

    reportAdClick: builder.mutation<ApiResponse<any>, AdClickRequest>({
      query: (clickData) => ({
        url: '/ad/click',
        method: 'POST',
        body: clickData,
      }),
    }),

    reportAdComplete: builder.mutation<ApiResponse<any>, AdCompleteRequest>({
      query: (completeData) => ({
        url: '/ad/complete',
        method: 'POST',
        body: completeData,
      }),
      invalidatesTags: ['Revenue'],
    }),

    reportAdSkip: builder.mutation<ApiResponse<any>, AdSkipRequest>({
      query: (skipData) => ({
        url: '/ad/skip',
        method: 'POST',
        body: skipData,
      }),
    }),

    reportAdClose: builder.mutation<ApiResponse<any>, AdCloseRequest>({
      query: (closeData) => ({
        url: '/ad/close',
        method: 'POST',
        body: closeData,
      }),
    }),

    batchReportAds: builder.mutation<ApiResponse<any>, BatchReportRequest>({
      query: (batchData) => ({
        url: '/ad/batchReport',
        method: 'POST',
        body: batchData,
      }),
      invalidatesTags: ['Revenue'],
    }),

    getUserRevenue: builder.query<ApiResponse<RevenueData>, { userId: number; appKey: string }>({
      query: ({ userId, appKey }) => `/ad/revenue?userId=${userId}&appKey=${appKey}`,
      providesTags: ['Revenue'],
    }),

    getAdHistory: builder.query<ApiResponse<AdHistoryResponse>, AdHistoryRequest>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        searchParams.append('userId', params.userId.toString());
        searchParams.append('appKey', params.appKey);
        
        if (params.pageNum) searchParams.append('pageNum', params.pageNum.toString());
        if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString());
        if (params.adType) searchParams.append('adType', params.adType);
        if (params.startDate) searchParams.append('startDate', params.startDate);
        if (params.endDate) searchParams.append('endDate', params.endDate);
        
        return `/ad/history?${searchParams.toString()}`;
      },
      providesTags: ['History'],
    }),

    // Device endpoints
    reportDeviceInfo: builder.mutation<ApiResponse<DeviceReportResponse>, DeviceInfo>({
      query: (deviceInfo) => ({
        url: '/user/device',
        method: 'POST',
        body: deviceInfo,
      }),
      invalidatesTags: ['Device'],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  // Auth hooks
  useWechatLoginMutation,
  useWechatRegisterMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useGetUserInfoQuery,
  useLazyGetUserInfoQuery,

  // Config hooks
  useGetAppConfigQuery,
  useLazyGetAppConfigQuery,
  useGetAdConfigQuery,
  useLazyGetAdConfigQuery,
  useGetRiskConfigQuery,
  useLazyGetRiskConfigQuery,
  useGetChannelConfigQuery,
  useLazyGetChannelConfigQuery,

  // Ad hooks
  useRequestAdMutation,
  useReportAdShowMutation,
  useReportAdClickMutation,
  useReportAdCompleteMutation,
  useReportAdSkipMutation,
  useReportAdCloseMutation,
  useBatchReportAdsMutation,
  useGetUserRevenueQuery,
  useLazyGetUserRevenueQuery,
  useGetAdHistoryQuery,
  useLazyGetAdHistoryQuery,

  // Device hooks
  useReportDeviceInfoMutation,
} = apiSlice;

// Export the reducer and middleware
export const { reducer: apiReducer, middleware: apiMiddleware } = apiSlice;