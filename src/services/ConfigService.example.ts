import configService from './ConfigService';
import { ENV_CONFIG } from '../config/env';

/**
 * Example usage of ConfigService
 * This demonstrates how to use the ConfigService in a real application
 */

// Example 1: Initialize the service
async function initializeConfigService() {
  console.log('Initializing ConfigService...');
  await configService.initialize();
  console.log('ConfigService initialized successfully');
}

// Example 2: Get app configuration
async function getAppConfiguration() {
  console.log('Fetching app configuration...');
  
  try {
    const appConfig = await configService.getAppConfig();
    
    if (appConfig) {
      console.log('App Configuration:', {
        appKey: appConfig.appKey,
        appName: appConfig.appName,
        wechatAppId: appConfig.wechatAppId,
        configVersion: appConfig.configVersion,
        channelsCount: appConfig.channels.length,
      });
    } else {
      console.log('No app configuration available');
    }
  } catch (error) {
    console.error('Failed to get app configuration:', error);
  }
}

// Example 3: Get ad configuration
async function getAdConfiguration() {
  console.log('Fetching ad configuration...');
  
  try {
    const adConfig = await configService.getAdConfig();
    
    if (adConfig) {
      console.log('Ad Configuration:', {
        adInterval: adConfig.adInterval,
        singleRewardLimit: adConfig.singleRewardLimit,
        dailyRewardVideoLimit: adConfig.dailyRewardVideoLimit,
        adTypeConfig: adConfig.adTypeConfig,
        configVersion: adConfig.configVersion,
      });
    } else {
      console.log('No ad configuration available');
    }
  } catch (error) {
    console.error('Failed to get ad configuration:', error);
  }
}

// Example 4: Get risk configuration
async function getRiskConfiguration() {
  console.log('Fetching risk configuration...');
  
  try {
    const riskConfig = await configService.getRiskConfig();
    
    if (riskConfig) {
      console.log('Risk Configuration:', {
        rootDetectionEnabled: riskConfig.rootDetectionEnabled,
        emulatorDetectionEnabled: riskConfig.emulatorDetectionEnabled,
        adIntervalSeconds: riskConfig.adIntervalSeconds,
        sameIpUserLimit: riskConfig.sameIpUserLimit,
        riskLevel: riskConfig.riskLevel,
        configVersion: riskConfig.configVersion,
      });
    } else {
      console.log('No risk configuration available');
    }
  } catch (error) {
    console.error('Failed to get risk configuration:', error);
  }
}

// Example 5: Get channel configuration
async function getChannelConfiguration() {
  console.log('Fetching channel configuration...');
  
  try {
    const channelConfig = await configService.getChannelConfig();
    
    if (channelConfig) {
      console.log('Channel Configuration:', {
        defaultChannelCode: channelConfig.defaultChannelCode,
        channelsCount: channelConfig.channels.length,
        configVersion: channelConfig.configVersion,
      });
      
      // List all channels
      channelConfig.channels.forEach((channel, index) => {
        console.log(`Channel ${index + 1}:`, {
          code: channel.channelCode,
          name: channel.channelName,
          type: channel.channelType,
          isDefault: channel.isDefault,
        });
      });
    } else {
      console.log('No channel configuration available');
    }
  } catch (error) {
    console.error('Failed to get channel configuration:', error);
  }
}

// Example 6: Check for configuration updates
async function checkForUpdates() {
  console.log('Checking for configuration updates...');
  
  try {
    const updateResult = await configService.checkConfigUpdates();
    
    if (updateResult.hasUpdates) {
      console.log('Configuration updates found:', updateResult.updatedConfigs);
    } else {
      console.log('All configurations are up to date');
    }
  } catch (error) {
    console.error('Failed to check for updates:', error);
  }
}

// Example 7: Refresh all configurations
async function refreshAllConfigurations() {
  console.log('Refreshing all configurations...');
  
  try {
    const refreshResult = await configService.refreshAllConfigs();
    
    if (refreshResult.success) {
      console.log('All configurations refreshed successfully');
    } else {
      console.log('Some configurations failed to refresh:', refreshResult.errors);
    }
  } catch (error) {
    console.error('Failed to refresh configurations:', error);
  }
}

// Example 8: Get cache status
async function getCacheStatus() {
  console.log('Getting cache status...');
  
  try {
    const cacheStatus = await configService.getCacheStatus();
    
    console.log('Cache Status:', {
      appConfig: cacheStatus.appConfig.cached ? 'Cached' : 'Not cached',
      adConfig: cacheStatus.adConfig.cached ? 'Cached' : 'Not cached',
      riskConfig: cacheStatus.riskConfig.cached ? 'Cached' : 'Not cached',
      channelConfig: cacheStatus.channelConfig.cached ? 'Cached' : 'Not cached',
    });
  } catch (error) {
    console.error('Failed to get cache status:', error);
  }
}

// Example 9: Clear cache
async function clearConfigurationCache() {
  console.log('Clearing configuration cache...');
  
  try {
    await configService.clearCache();
    console.log('Configuration cache cleared successfully');
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}

// Example 10: Update cache configuration
function updateCacheSettings() {
  console.log('Updating cache settings...');
  
  // Update cache to expire after 1 hour instead of 30 minutes
  configService.updateCacheConfig({
    maxAge: 60 * 60 * 1000, // 1 hour
    forceRefreshInterval: 24 * 60 * 60 * 1000, // 24 hours
  });
  
  console.log('Cache settings updated');
}

// Example usage workflow
export async function demonstrateConfigService() {
  console.log('=== ConfigService Demo ===');
  
  // Initialize the service
  await initializeConfigService();
  
  // Update cache settings
  updateCacheSettings();
  
  // Get all configurations
  await getAppConfiguration();
  await getAdConfiguration();
  await getRiskConfiguration();
  await getChannelConfiguration();
  
  // Check cache status
  await getCacheStatus();
  
  // Check for updates
  await checkForUpdates();
  
  // Refresh all configurations
  await refreshAllConfigurations();
  
  // Clear cache
  await clearConfigurationCache();
  
  console.log('=== Demo Complete ===');
}

// Example of using configurations in app logic
export async function useConfigurationsInApp() {
  // Get ad configuration to determine ad settings
  const adConfig = await configService.getAdConfig();
  if (adConfig) {
    console.log(`Ad interval: ${adConfig.adInterval} seconds`);
    console.log(`Daily reward limit: ${adConfig.dailyRewardVideoLimit} videos`);
    console.log(`Single reward limit: $${adConfig.singleRewardLimit}`);
  }
  
  // Get risk configuration for security checks
  const riskConfig = await configService.getRiskConfig();
  if (riskConfig) {
    if (riskConfig.rootDetectionEnabled) {
      console.log('Root detection is enabled');
    }
    if (riskConfig.emulatorDetectionEnabled) {
      console.log('Emulator detection is enabled');
    }
    console.log(`Same IP user limit: ${riskConfig.sameIpUserLimit}`);
  }
  
  // Get channel configuration for ad serving
  const channelConfig = await configService.getChannelConfig();
  if (channelConfig) {
    const defaultChannel = channelConfig.channels.find(c => c.isDefault);
    if (defaultChannel) {
      console.log(`Using default channel: ${defaultChannel.channelName} (${defaultChannel.channelCode})`);
    }
  }
}

// Example of error handling
export async function handleConfigurationErrors() {
  try {
    // Try to get configuration
    const appConfig = await configService.getAppConfig();
    
    if (!appConfig) {
      // Handle case where no configuration is available
      console.warn('No app configuration available, using defaults');
      // Use default configuration values
    }
  } catch (error) {
    console.error('Configuration error:', error);
    
    // Implement fallback logic
    console.log('Using fallback configuration');
    // Use hardcoded fallback values
  }
}

export default {
  demonstrateConfigService,
  useConfigurationsInApp,
  handleConfigurationErrors,
};