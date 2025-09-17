// Core Type Definitions for DingDingCat API Integration

// User Data Models
export interface User {
  userId: number;
  userName: string;
  nickName: string;
  avatar: string;
  phoneNumber?: string;
  email?: string;
  sex?: string;
  wechatOpenId: string;
  registerChannel?: string;
  appKey: string;
  registerTime?: string;
  lastLoginTime?: string;
}

// Ad Type Enumeration - matches API specification
export enum AdType {
  SPLASH = 'splash',
  REWARD_VIDEO = 'video', 
  INTERSTITIAL = 'interstitial',
  BANNER = 'banner'
}

// Ad Event Types for reporting
export type AdEventType = 'show' | 'click' | 'complete' | 'skip' | 'close';

// Configuration Data Models
export interface AppConfig {
  appKey: string;
  appName: string;
  appType?: string;
  appDesc?: string;
  status?: string;
  wechatAppId: string;
  channelConfig?: string;
  riskConfig?: string;
  serverTime: number;
  configVersion: string;
  channels: Channel[];
}

export interface Channel {
  channelId?: number;
  channelCode: string;
  channelName: string;
  channelType?: string;
  channelDesc?: string;
  status?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  enabled?: boolean;
  isDefault?: boolean;
}

export interface AdConfig {
  appKey: string;
  serverTime: number;
  configVersion: string;
  adInterval: number;
  adIntervalEnabled: boolean;
  singleRewardLimit: number;
  singleRewardLimitEnabled: boolean;
  dailyRewardVideoLimit: number;
  dailyRewardAmountLimit: number;
  dailyRewardLimitEnabled: boolean;
  dailyAdViewLimit: number;
  dailyAdViewLimitEnabled: boolean;
  adTypeConfig: string;
  adDisplayStrategy: string;
  // Extended config for specific ad types
  splashAdConfig?: {
    enabled: boolean;
    adId: string;
    timeout: number;
  };
  rewardVideoAdConfig?: {
    enabled: boolean;
    adId: string;
    minPlayDuration: number;
  };
  interstitialAdConfig?: {
    enabled: boolean;
    adId: string;
    showInterval: number;
  };
  bannerAdConfig?: {
    enabled: boolean;
    adId: string;
    position: 'top' | 'bottom';
    autoRefresh: boolean;
  };
}

export interface RiskConfig {
  appKey: string;
  serverTime: number;
  configVersion: string;
  rootDetectionEnabled: boolean;
  emulatorDetectionEnabled: boolean;
  deviceFingerprintEnabled: boolean;
  adIntervalCheckEnabled: boolean;
  adIntervalSeconds: number;
  sameIpUserLimit: number;
  sameIpLimitEnabled: boolean;
  ipLocationCheckEnabled: boolean;
  loginFrequencyLimit: number;
  loginFrequencyWindow: number;
  loginFrequencyEnabled: boolean;
  blacklistCheckEnabled: boolean;
  riskLevel: number;
  // Legacy fields for backward compatibility
  dailyRewardVideoLimit?: number;
  singleRevenueLimit?: number;
}

// Ad Data Models
export interface AdRequest {
  userId: number;
  appKey: string;
  adType?: AdType;
  channelCode?: string;
  deviceType?: string;
  ipAddress?: string;
}

export interface AdResponse {
  adId: string;
  adType: AdType;
  adTitle: string;
  adDescription?: string;
  adImageUrl?: string;
  adVideoUrl?: string;
  adClickUrl?: string;
  adDuration?: number;
  expectedReward: number;
  skippable?: boolean;
  skipWaitTime?: number;
  configParams: AdConfigParams;
}

export interface AdConfigParams {
  minPlayDuration?: number;
  completeRewardMultiplier?: number;
  clickRewardMultiplier?: number;
  adInterval?: number;
  dailyWatchLimit?: number;
  timeout?: number;
  showInterval?: number;
  position?: 'top' | 'bottom';
  autoRefresh?: boolean;
}

export interface AdPlayData {
  adId: string;
  adType: AdType;
  playDuration: number;
  isClicked: boolean;
  isSkipped: boolean;
  isCompleted?: boolean;
  stayDuration?: number;
  timestamp: number;
}

// API request interfaces for ad events
export interface AdShowRequest {
  userId: number;
  appKey: string;
  adId: string;
  adType: AdType;
  showTime: number;
  ipAddress?: string;
}

export interface AdClickRequest {
  userId: number;
  appKey: string;
  adId: string;
  adType: AdType;
  clickTime: number;
  clickPosition?: string;
  ipAddress?: string;
}

export interface AdCompleteRequest {
  userId: number;
  appKey: string;
  adId: string;
  adType: AdType;
  playDuration: number;
  isClicked: string; // "0" or "1" as per API spec
  stayDuration?: number;
  completeTime: number;
  ipAddress?: string;
}

export interface AdSkipRequest {
  userId: number;
  appKey: string;
  adId: string;
  adType: AdType;
  playDuration: number;
  skipTime: number;
  skipReason?: string;
  ipAddress?: string;
}

export interface AdCloseRequest {
  userId: number;
  appKey: string;
  adId: string;
  adType: AdType;
  playDuration: number;
  stayDuration?: number;
  closeTime: number;
  closeReason?: string;
  ipAddress?: string;
}

// Offline Data Models
export interface OfflineAdData {
  id: string;
  userId: number;
  appKey: string;
  adId: string;
  adType: AdType;
  eventType: AdEventType;
  playData: AdPlayData;
  timestamp: number;
  synced: boolean;
  retryCount: number;
}

// Batch report interfaces
export interface BatchReportPlayData {
  adType: AdType;
  playDuration: number;
  isClicked: string; // "0" or "1" as per API spec
  isSkipped: string; // "0" or "1" as per API spec
  stayDuration?: number;
}

export interface BatchReportRequest {
  userId: number;
  appKey: string;
  ipAddress?: string;
  playDataList: BatchReportPlayData[];
}

// API Response Types
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

// Auth related types
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
}

export interface LoginRequest {
  appKey: string;
  code: string;
}

export interface RegisterRequest {
  appKey: string;
  code: string;
  nickName?: string;
  phoneNumber?: string;
}

export interface RefreshTokenRequest {
  appKey: string;
  refreshToken: string;
  userId: string;
}

export interface LoginResponse extends User {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

// Revenue and History Types
export interface RevenueData {
  userId: number;
  userName: string;
  totalRevenue: number;
  totalWatchCount: number;
  todayRevenue: number;
  yesterdayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  todayWatchCount: number;
  yesterdayWatchCount: number;
  weekWatchCount: number;
  monthWatchCount: number;
  remainingWatchCount: number;
  avgRevenuePerWatch: number;
  lastWatchTime: string;
  accountStatus: string;
  withdrawableAmount: number;
  frozenAmount: number;
}

export interface AdHistoryItem {
  statId: number;
  adId: string;
  adType: AdType;
  playDuration: number;
  isClicked: boolean;
  isSkipped: boolean;
  isCompleted: boolean;
  stayDuration?: number;
  rewardAmount: number;
  playTime: string;
  deviceType?: string;
  statusDescription?: string;
}

export interface AdHistoryResponse {
  total: number;
  pageNum: number;
  pageSize: number;
  historyList: AdHistoryItem[];
}

export interface AdHistoryRequest {
  userId: number;
  appKey: string;
  pageNum?: number;
  pageSize?: number;
  adType?: AdType;
  startDate?: string;
  endDate?: string;
}

// Device Information Types
export interface DeviceInfo {
  userId: number;
  appKey: string;
  deviceModel: string;
  deviceBrand: string;
  osName: string;
  osVersion: string;
  deviceId: string;
  isRooted: boolean;
  isEmulator: boolean;
  screenResolution?: string;
  screenDensity?: number;
  networkType?: string;
  carrier?: string;
  totalMemory?: number;
  availableMemory?: number;
  totalStorage?: number;
  availableStorage?: number;
  cpuArch?: string;
  cpuCores?: number;
  appVersion?: string;
  appVersionCode?: number;
  deviceLanguage?: string;
  deviceTimezone?: string;
  batteryLevel?: number;
  isCharging?: boolean;
  ipAddress?: string;
  userAgent?: string;
  extraInfo?: string;
}

export interface DeviceReportResponse {
  userId: number;
  appKey: string;
  reportTime: number;
}

// Error Types
export interface ApiError {
  code: number;
  message: string;
  details?: any;
}

export interface ErrorRecovery {
  retryConfig: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  fallbackStrategy: {
    useCache: boolean;
    showOfflineMode: boolean;
    disableFeature: boolean;
  };
  userNotification: {
    showError: boolean;
    errorMessage: string;
    actionButton?: string;
  };
}

// Channel Config Types
export interface ChannelConfigResponse {
  appKey: string;
  channelConfig: string;
  serverTime: number;
  configVersion: string;
  defaultChannelCode: string;
  channels: Channel[];
}

// Redux State Types
export interface RootState {
  auth: AuthState;
  config: ConfigState;
  ad: AdState;
  sync: SyncState;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

export interface ConfigState {
  appConfig: AppConfig | null;
  adConfig: AdConfig | null;
  riskConfig: RiskConfig | null;
  channelConfig: ChannelConfigResponse | null;
  lastUpdated: number;
  isLoading: boolean;
  error: string | null;
}

export interface AdState {
  currentAd: AdResponse | null;
  revenueData: RevenueData | null;
  history: AdHistoryItem[];
  isLoading: boolean;
  error: string | null;
}

export interface SyncState {
  offlineQueue: OfflineAdData[];
  isSyncing: boolean;
  lastSyncTime: number;
  error: string | null;
}