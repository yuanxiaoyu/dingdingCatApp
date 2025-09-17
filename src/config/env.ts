// Environment Configuration
export interface EnvConfig {
  API_BASE_URL: string;
  WECHAT_APP_ID: string;
  APP_KEY: string;
  DEBUG_MODE: boolean;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
}

// Development environment configuration
const developmentConfig: EnvConfig = {
  API_BASE_URL: 'https://dev-api.dingdingcat.com',
  WECHAT_APP_ID: 'wx_dev_app_id', // Replace with actual WeChat App ID - using placeholder for development
  APP_KEY: 'dev_app_key', // Replace with actual App Key - using placeholder for development
  DEBUG_MODE: true,
  LOG_LEVEL: 'debug',
};

// Production environment configuration
const productionConfig: EnvConfig = {
  API_BASE_URL: 'https://api.dingdingcat.com',
  WECHAT_APP_ID: 'wx_prod_app_id', // Replace with actual WeChat App ID
  APP_KEY: 'prod_app_key', // Replace with actual App Key
  DEBUG_MODE: false,
  LOG_LEVEL: 'error',
};

// Export configuration based on environment
export const ENV_CONFIG: EnvConfig = __DEV__ ? developmentConfig : productionConfig;

export default ENV_CONFIG;