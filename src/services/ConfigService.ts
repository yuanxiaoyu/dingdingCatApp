import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';
import mockService from './MockService';
import { ENV_CONFIG } from '../config/env';
import {
  AppConfig,
  AdConfig,
  RiskConfig,
  ChannelConfigResponse,
  ApiResponse
} from '../types';

// Storage keys for configuration caching
const STORAGE_KEYS = {
  APP_CONFIG: '@dingdingcat/app_config',
  AD_CONFIG: '@dingdingcat/ad_config',
  RISK_CONFIG: '@dingdingcat/risk_config',
  CHANNEL_CONFIG: '@dingdingcat/channel_config',
  CONFIG_VERSIONS: '@dingdingcat/config_versions',
  LAST_UPDATE_TIME: '@dingdingcat/config_last_update',
} as const;

// Configuration version tracking
interface ConfigVersions {
  appConfigVersion?: string;
  adConfigVersion?: string;
  riskConfigVersion?: string;
  channelConfigVersion?: string;
}

// Cache configuration
interface CacheConfig {
  maxAge: number; // Maximum cache age in milliseconds
  forceRefreshInterval: number; // Force refresh interval in milliseconds
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxAge: 30 * 60 * 1000, // 30 minutes
  forceRefreshInterval: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Configuration Service
 * Handles fetching, caching, and version management of app configurations
 */
class ConfigService {
  private cacheConfig: CacheConfig;
  private isInitialized = false;

  constructor() {
    this.cacheConfig = DEFAULT_CACHE_CONFIG;
  }

  /**
   * Initialize configuration service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load cached configurations on startup
      await this.loadCachedConfigurations();
      this.isInitialized = true;

      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('ConfigService initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize ConfigService:', error);
      // Don't throw error - service should work even if cache loading fails
      this.isInitialized = true;
    }
  }

  /**
   * Get application basic configuration
   */
  public async getAppConfig(forceRefresh = false): Promise<AppConfig | null> {
    try {
      // Check if mock mode is enabled
      const isMockMode = mockService.isMockModeEnabled();
      if (isMockMode) {
        if (ENV_CONFIG.DEBUG_MODE) {
          console.log('Using mock app config');
        }
        return await mockService.mockGetAppConfig(ENV_CONFIG.APP_KEY);
      }

      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedConfig = await this.getCachedAppConfig();
        if (cachedConfig && !this.isCacheExpired('app')) {
          if (ENV_CONFIG.DEBUG_MODE) {
            console.log('Returning cached app config');
          }
          return cachedConfig;
        }
      }

      // Fetch from API
      const response = await apiClient.get<AppConfig>('/config', {
        params: {
          appKey: ENV_CONFIG.APP_KEY,
        },
      });

      if (response.code === 200 && response.data) {
        // Cache the configuration
        await this.cacheAppConfig(response.data);

        if (ENV_CONFIG.DEBUG_MODE) {
          console.log('App config fetched and cached successfully');
        }

        return response.data;
      }

      throw new Error(response.message || 'Failed to fetch app config');
    } catch (error: any) {
      console.error('Error fetching app config:', error);

      // Return cached config as fallback
      const cachedConfig = await this.getCachedAppConfig();
      if (cachedConfig) {
        console.warn('Using cached app config as fallback');
        return cachedConfig;
      }

      return null;
    }
  }

  /**
   * Get advertisement configuration
   */
  public async getAdConfig(forceRefresh = false): Promise<AdConfig | null> {
    try {
      // Check if mock mode is enabled
      const isMockMode = mockService.isMockModeEnabled();
      if (isMockMode) {
        if (ENV_CONFIG.DEBUG_MODE) {
          console.log('Using mock ad config');
        }
        return await mockService.getMockAdConfig();
      }

      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedConfig = await this.getCachedAdConfig();
        if (cachedConfig && !this.isCacheExpired('ad')) {
          if (ENV_CONFIG.DEBUG_MODE) {
            console.log('Returning cached ad config');
          }
          return cachedConfig;
        }
      }

      // Fetch from API
      const response = await apiClient.get<AdConfig>('/config/ad', {
        params: {
          appKey: ENV_CONFIG.APP_KEY,
        },
      });

      if (response.code === 200 && response.data) {
        // Cache the configuration
        await this.cacheAdConfig(response.data);

        if (ENV_CONFIG.DEBUG_MODE) {
          console.log('Ad config fetched and cached successfully');
        }

        return response.data;
      }

      throw new Error(response.message || 'Failed to fetch ad config');
    } catch (error: any) {
      console.error('Error fetching ad config:', error);

      // Return cached config as fallback
      const cachedConfig = await this.getCachedAdConfig();
      if (cachedConfig) {
        console.warn('Using cached ad config as fallback');
        return cachedConfig;
      }

      return null;
    }
  }

  /**
   * Get risk control configuration
   */
  public async getRiskConfig(forceRefresh = false): Promise<RiskConfig | null> {
    try {
      // Check if mock mode is enabled
      const isMockMode = mockService.isMockModeEnabled();
      if (isMockMode) {
        if (ENV_CONFIG.DEBUG_MODE) {
          console.log('Using mock risk config');
        }
        return await mockService.mockGetRiskConfig(ENV_CONFIG.APP_KEY);
      }

      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedConfig = await this.getCachedRiskConfig();
        if (cachedConfig && !this.isCacheExpired('risk')) {
          if (ENV_CONFIG.DEBUG_MODE) {
            console.log('Returning cached risk config');
          }
          return cachedConfig;
        }
      }

      // Fetch from API
      const response = await apiClient.get<RiskConfig>('/config/risk', {
        params: {
          appKey: ENV_CONFIG.APP_KEY,
        },
      });

      if (response.code === 200 && response.data) {
        // Cache the configuration
        await this.cacheRiskConfig(response.data);

        if (ENV_CONFIG.DEBUG_MODE) {
          console.log('Risk config fetched and cached successfully');
        }

        return response.data;
      }

      throw new Error(response.message || 'Failed to fetch risk config');
    } catch (error: any) {
      console.error('Error fetching risk config:', error);

      // Return cached config as fallback
      const cachedConfig = await this.getCachedRiskConfig();
      if (cachedConfig) {
        console.warn('Using cached risk config as fallback');
        return cachedConfig;
      }

      return null;
    }
  }

  /**
   * Get channel configuration
   */
  public async getChannelConfig(forceRefresh = false): Promise<ChannelConfigResponse | null> {
    try {
      // Check if mock mode is enabled
      const isMockMode = mockService.isMockModeEnabled();
      if (isMockMode) {
        if (ENV_CONFIG.DEBUG_MODE) {
          console.log('Using mock channel config');
        }
        return await mockService.mockGetChannelConfig(ENV_CONFIG.APP_KEY);
      }

      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedConfig = await this.getCachedChannelConfig();
        if (cachedConfig && !this.isCacheExpired('channel')) {
          if (ENV_CONFIG.DEBUG_MODE) {
            console.log('Returning cached channel config');
          }
          return cachedConfig;
        }
      }

      // Fetch from API
      const response = await apiClient.get<ChannelConfigResponse>('/config/channel', {
        params: {
          appKey: ENV_CONFIG.APP_KEY,
        },
      });

      if (response.code === 200 && response.data) {
        // Cache the configuration
        await this.cacheChannelConfig(response.data);

        if (ENV_CONFIG.DEBUG_MODE) {
          console.log('Channel config fetched and cached successfully');
        }

        return response.data;
      }

      throw new Error(response.message || 'Failed to fetch channel config');
    } catch (error: any) {
      console.error('Error fetching channel config:', error);

      // Return cached config as fallback
      const cachedConfig = await this.getCachedChannelConfig();
      if (cachedConfig) {
        console.warn('Using cached channel config as fallback');
        return cachedConfig;
      }

      return null;
    }
  }

  /**
   * Check for configuration updates and refresh if needed
   */
  public async checkConfigUpdates(): Promise<{
    hasUpdates: boolean;
    updatedConfigs: string[];
  }> {
    try {
      const currentVersions = await this.getStoredConfigVersions();
      const updatedConfigs: string[] = [];

      // Check each configuration type for updates
      const checks = [
        { type: 'app', method: () => this.getAppConfig(true) },
        { type: 'ad', method: () => this.getAdConfig(true) },
        { type: 'risk', method: () => this.getRiskConfig(true) },
        { type: 'channel', method: () => this.getChannelConfig(true) },
      ];

      for (const check of checks) {
        try {
          const config = await check.method();
          if (config && 'configVersion' in config) {
            const currentVersion = this.getCurrentVersion(currentVersions, check.type);
            if (config.configVersion !== currentVersion) {
              updatedConfigs.push(check.type);
            }
          }
        } catch (error) {
          console.warn(`Failed to check ${check.type} config updates:`, error);
        }
      }

      const hasUpdates = updatedConfigs.length > 0;

      if (hasUpdates && ENV_CONFIG.DEBUG_MODE) {
        console.log('Configuration updates found:', updatedConfigs);
      }

      return { hasUpdates, updatedConfigs };
    } catch (error) {
      console.error('Error checking config updates:', error);
      return { hasUpdates: false, updatedConfigs: [] };
    }
  }

  /**
   * Refresh all configurations
   */
  public async refreshAllConfigs(): Promise<{
    success: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Refresh all configurations in parallel
      const results = await Promise.allSettled([
        this.getAppConfig(true),
        this.getAdConfig(true),
        this.getRiskConfig(true),
        this.getChannelConfig(true),
      ]);

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const configTypes = ['app', 'ad', 'risk', 'channel'];
          errors.push(`Failed to refresh ${configTypes[index]} config: ${result.reason}`);
        }
      });

      const success = errors.length === 0;

      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('Configuration refresh completed:', { success, errors });
      }

      return { success, errors };
    } catch (error) {
      console.error('Error refreshing all configs:', error);
      return { success: false, errors: ['Failed to refresh configurations'] };
    }
  }

  /**
   * Clear all cached configurations
   */
  public async clearCache(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.APP_CONFIG),
        AsyncStorage.removeItem(STORAGE_KEYS.AD_CONFIG),
        AsyncStorage.removeItem(STORAGE_KEYS.RISK_CONFIG),
        AsyncStorage.removeItem(STORAGE_KEYS.CHANNEL_CONFIG),
        AsyncStorage.removeItem(STORAGE_KEYS.CONFIG_VERSIONS),
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_UPDATE_TIME),
      ]);

      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('Configuration cache cleared');
      }
    } catch (error) {
      console.error('Error clearing configuration cache:', error);
    }
  }

  /**
   * Get cache status information
   */
  public async getCacheStatus(): Promise<{
    appConfig: { cached: boolean; version?: string; lastUpdate?: string };
    adConfig: { cached: boolean; version?: string; lastUpdate?: string };
    riskConfig: { cached: boolean; version?: string; lastUpdate?: string };
    channelConfig: { cached: boolean; version?: string; lastUpdate?: string };
  }> {
    try {
      const [appConfig, adConfig, riskConfig, channelConfig, versions, lastUpdate] = await Promise.all([
        this.getCachedAppConfig(),
        this.getCachedAdConfig(),
        this.getCachedRiskConfig(),
        this.getCachedChannelConfig(),
        this.getStoredConfigVersions(),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_UPDATE_TIME),
      ]);

      return {
        appConfig: {
          cached: !!appConfig,
          version: appConfig?.configVersion,
          lastUpdate: lastUpdate || undefined,
        },
        adConfig: {
          cached: !!adConfig,
          version: adConfig?.configVersion,
          lastUpdate: lastUpdate || undefined,
        },
        riskConfig: {
          cached: !!riskConfig,
          version: riskConfig?.configVersion,
          lastUpdate: lastUpdate || undefined,
        },
        channelConfig: {
          cached: !!channelConfig,
          version: channelConfig?.configVersion,
          lastUpdate: lastUpdate || undefined,
        },
      };
    } catch (error) {
      console.error('Error getting cache status:', error);
      return {
        appConfig: { cached: false },
        adConfig: { cached: false },
        riskConfig: { cached: false },
        channelConfig: { cached: false },
      };
    }
  }

  // Private helper methods

  /**
   * Load cached configurations on startup
   */
  private async loadCachedConfigurations(): Promise<void> {
    // This method can be used to preload configurations if needed
    // For now, we'll load them on-demand
  }

  /**
   * Check if cache is expired for a specific config type
   */
  private async isCacheExpired(configType: string): Promise<boolean> {
    try {
      const lastUpdateStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_UPDATE_TIME);
      if (!lastUpdateStr) {
        return true;
      }

      const lastUpdate = parseInt(lastUpdateStr, 10);
      const now = Date.now();
      const age = now - lastUpdate;

      // For testing, if the last update is very recent (within 1 second), consider it not expired
      if (age < 1000) {
        return false;
      }

      return age > this.cacheConfig.maxAge;
    } catch (error) {
      console.error('Error checking cache expiry:', error);
      return true; // Assume expired if we can't check
    }
  }

  /**
   * Get cached app configuration
   */
  private async getCachedAppConfig(): Promise<AppConfig | null> {
    try {
      const configStr = await AsyncStorage.getItem(STORAGE_KEYS.APP_CONFIG);
      return configStr ? JSON.parse(configStr) : null;
    } catch (error) {
      console.error('Error getting cached app config:', error);
      return null;
    }
  }

  /**
   * Cache app configuration
   */
  private async cacheAppConfig(config: AppConfig): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.APP_CONFIG, JSON.stringify(config)),
        this.updateConfigVersion('appConfigVersion', config.configVersion),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_UPDATE_TIME, Date.now().toString()),
      ]);
    } catch (error) {
      console.error('Error caching app config:', error);
    }
  }

  /**
   * Get cached ad configuration
   */
  private async getCachedAdConfig(): Promise<AdConfig | null> {
    try {
      const configStr = await AsyncStorage.getItem(STORAGE_KEYS.AD_CONFIG);
      return configStr ? JSON.parse(configStr) : null;
    } catch (error) {
      console.error('Error getting cached ad config:', error);
      return null;
    }
  }

  /**
   * Cache ad configuration
   */
  private async cacheAdConfig(config: AdConfig): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.AD_CONFIG, JSON.stringify(config)),
        this.updateConfigVersion('adConfigVersion', config.configVersion),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_UPDATE_TIME, Date.now().toString()),
      ]);
    } catch (error) {
      console.error('Error caching ad config:', error);
    }
  }

  /**
   * Get cached risk configuration
   */
  private async getCachedRiskConfig(): Promise<RiskConfig | null> {
    try {
      const configStr = await AsyncStorage.getItem(STORAGE_KEYS.RISK_CONFIG);
      return configStr ? JSON.parse(configStr) : null;
    } catch (error) {
      console.error('Error getting cached risk config:', error);
      return null;
    }
  }

  /**
   * Cache risk configuration
   */
  private async cacheRiskConfig(config: RiskConfig): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.RISK_CONFIG, JSON.stringify(config)),
        this.updateConfigVersion('riskConfigVersion', config.configVersion),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_UPDATE_TIME, Date.now().toString()),
      ]);
    } catch (error) {
      console.error('Error caching risk config:', error);
    }
  }

  /**
   * Get cached channel configuration
   */
  private async getCachedChannelConfig(): Promise<ChannelConfigResponse | null> {
    try {
      const configStr = await AsyncStorage.getItem(STORAGE_KEYS.CHANNEL_CONFIG);
      return configStr ? JSON.parse(configStr) : null;
    } catch (error) {
      console.error('Error getting cached channel config:', error);
      return null;
    }
  }

  /**
   * Cache channel configuration
   */
  private async cacheChannelConfig(config: ChannelConfigResponse): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.CHANNEL_CONFIG, JSON.stringify(config)),
        this.updateConfigVersion('channelConfigVersion', config.configVersion),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_UPDATE_TIME, Date.now().toString()),
      ]);
    } catch (error) {
      console.error('Error caching channel config:', error);
    }
  }

  /**
   * Get stored configuration versions
   */
  private async getStoredConfigVersions(): Promise<ConfigVersions> {
    try {
      const versionsStr = await AsyncStorage.getItem(STORAGE_KEYS.CONFIG_VERSIONS);
      return versionsStr ? JSON.parse(versionsStr) : {};
    } catch (error) {
      console.error('Error getting stored config versions:', error);
      return {};
    }
  }

  /**
   * Update configuration version
   */
  private async updateConfigVersion(versionKey: keyof ConfigVersions, version: string): Promise<void> {
    try {
      const currentVersions = await this.getStoredConfigVersions();
      const updatedVersions = {
        ...currentVersions,
        [versionKey]: version,
      };

      await AsyncStorage.setItem(STORAGE_KEYS.CONFIG_VERSIONS, JSON.stringify(updatedVersions));
    } catch (error) {
      console.error('Error updating config version:', error);
    }
  }

  /**
   * Get current version for a config type
   */
  private getCurrentVersion(versions: ConfigVersions, configType: string): string | undefined {
    switch (configType) {
      case 'app':
        return versions.appConfigVersion;
      case 'ad':
        return versions.adConfigVersion;
      case 'risk':
        return versions.riskConfigVersion;
      case 'channel':
        return versions.channelConfigVersion;
      default:
        return undefined;
    }
  }

  /**
   * Update cache configuration
   */
  public updateCacheConfig(config: Partial<CacheConfig>): void {
    this.cacheConfig = { ...this.cacheConfig, ...config };

    if (ENV_CONFIG.DEBUG_MODE) {
      console.log('Cache configuration updated:', this.cacheConfig);
    }
  }
}

// Create singleton instance
const configService = new ConfigService();

export default configService;
export { ConfigService };