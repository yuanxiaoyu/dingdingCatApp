// Environment Configuration
export interface EnvConfig {
  API_BASE_URL: string;
  WECHAT_APP_ID: string;
  APP_KEY: string;
  DEBUG_MODE: boolean;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  // Mock configuration
  MOCK_ENABLED: boolean;
  MOCK_USER_STATE: 0 | 1; // 0: 未登录, 1: 登录状态
}

// 尝试读取配置文件
let appSettings: any = {};
try {
  appSettings = require('./appSettings.json');
} catch (error) {
  console.warn('无法读取appSettings.json，使用默认配置');
}

// Helper function to safely get environment variables
const getEnvVar = (key: string, defaultValue?: string): string | undefined => {
  try {
    // Try to access process.env safely
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
    return defaultValue;
  } catch (error) {
    console.warn(`Failed to read environment variable ${key}:`, error);
    return defaultValue;
  }
};

// Development environment configuration
const developmentConfig: EnvConfig = {
  API_BASE_URL: appSettings.api?.baseUrl || 'https://dev-api.dingdingcat.com',
  WECHAT_APP_ID: 'wx_dev_app_id', // Replace with actual WeChat App ID - using placeholder for development
  APP_KEY: 'dev_app_key', // Replace with actual App Key - using placeholder for development
  DEBUG_MODE: appSettings.debug?.enabled ?? true,
  LOG_LEVEL: appSettings.debug?.logLevel || 'debug',
  // Mock configuration - 优先使用配置文件，然后是环境变量
  MOCK_ENABLED: appSettings.mockMode?.enabled ?? (getEnvVar('MOCK_ENABLED') === '1' || true),
  MOCK_USER_STATE: (appSettings.mockMode?.userState ?? (getEnvVar('MOCK_USER_STATE') === '0' ? 0 : 1)) as 0 | 1,
};

// Production environment configuration
const productionConfig: EnvConfig = {
  API_BASE_URL: 'https://api.dingdingcat.com',
  WECHAT_APP_ID: 'wx_prod_app_id', // Replace with actual WeChat App ID
  APP_KEY: 'prod_app_key', // Replace with actual App Key
  DEBUG_MODE: false,
  LOG_LEVEL: 'error',
  // Mock configuration - 生产环境默认关闭
  MOCK_ENABLED: getEnvVar('MOCK_ENABLED') === '1' || false,
  MOCK_USER_STATE: (getEnvVar('MOCK_USER_STATE') === '0' ? 0 : 1) as 0 | 1,
};

// Export configuration based on environment
export const ENV_CONFIG: EnvConfig = __DEV__ ? developmentConfig : productionConfig;

export default ENV_CONFIG;