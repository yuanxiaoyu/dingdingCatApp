// Application Constants
export const API_CONFIG = {
  BASE_URL: 'https://api.dingdingcat.com', // Replace with actual API base URL
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

export const STORAGE_KEYS = {
  AUTH_TOKENS: 'auth_tokens',
  USER_INFO: 'user_info',
  APP_CONFIG: 'app_config',
  AD_CONFIG: 'ad_config',
  RISK_CONFIG: 'risk_config',
  DEVICE_INFO: 'device_info',
};

export const AD_TYPES = {
  SPLASH: 'splash',
  REWARD_VIDEO: 'video',
  INTERSTITIAL: 'interstitial',
  BANNER: 'banner',
} as const;

export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RISK_CONTROL_ERROR: 'RISK_CONTROL_ERROR',
  AD_LOAD_ERROR: 'AD_LOAD_ERROR',
} as const;

export const RISK_CONTROL = {
  MAX_DAILY_VIEWS: 100,
  MIN_AD_INTERVAL: 30, // seconds
  MAX_SINGLE_REVENUE: 1.0, // yuan
  MAX_IP_USERS: 5,
} as const;