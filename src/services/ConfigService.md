# ConfigService

The ConfigService is responsible for managing application configurations, including fetching, caching, and version management of various configuration types from the server.

## Features

- **Multiple Configuration Types**: Supports app, ad, risk, and channel configurations
- **Intelligent Caching**: Local caching with version checking and expiration
- **Fallback Support**: Returns cached data when API calls fail
- **Version Management**: Tracks configuration versions and detects updates
- **Error Handling**: Graceful error handling with fallback mechanisms
- **Cache Management**: Clear cache, check status, and update cache settings

## Configuration Types

### 1. App Configuration (`getAppConfig()`)
Contains basic application settings:
- App key and name
- WeChat App ID
- Server time and configuration version
- Available channels

### 2. Ad Configuration (`getAdConfig()`)
Contains advertisement-related settings:
- Ad interval timing
- Reward limits (single and daily)
- Ad view limits
- Supported ad types
- Display strategies

### 3. Risk Configuration (`getRiskConfig()`)
Contains security and risk control settings:
- Root/emulator detection flags
- IP and frequency limits
- Risk level settings
- Blacklist checking

### 4. Channel Configuration (`getChannelConfig()`)
Contains advertising channel information:
- Available channels
- Default channel settings
- Channel-specific configurations

## Basic Usage

```typescript
import configService from '../services/ConfigService';

// Initialize the service
await configService.initialize();

// Get app configuration
const appConfig = await configService.getAppConfig();
if (appConfig) {
  console.log('App Name:', appConfig.appName);
  console.log('WeChat App ID:', appConfig.wechatAppId);
}

// Get ad configuration
const adConfig = await configService.getAdConfig();
if (adConfig) {
  console.log('Ad Interval:', adConfig.adInterval);
  console.log('Daily Limit:', adConfig.dailyRewardVideoLimit);
}
```

## Advanced Features

### Force Refresh
```typescript
// Force refresh from server (bypass cache)
const freshConfig = await configService.getAppConfig(true);
```

### Check for Updates
```typescript
const updateResult = await configService.checkConfigUpdates();
if (updateResult.hasUpdates) {
  console.log('Updated configs:', updateResult.updatedConfigs);
}
```

### Refresh All Configurations
```typescript
const refreshResult = await configService.refreshAllConfigs();
if (!refreshResult.success) {
  console.log('Errors:', refreshResult.errors);
}
```

### Cache Management
```typescript
// Get cache status
const status = await configService.getCacheStatus();
console.log('App config cached:', status.appConfig.cached);

// Clear all cache
await configService.clearCache();

// Update cache settings
configService.updateCacheConfig({
  maxAge: 60 * 60 * 1000, // 1 hour
  forceRefreshInterval: 24 * 60 * 60 * 1000, // 24 hours
});
```

## Error Handling

The ConfigService implements comprehensive error handling:

1. **Network Errors**: Automatically falls back to cached data
2. **API Errors**: Returns null and logs errors appropriately
3. **Cache Errors**: Continues operation even if caching fails
4. **JSON Parsing Errors**: Handles malformed cached data gracefully

```typescript
try {
  const config = await configService.getAppConfig();
  if (!config) {
    // Handle case where no configuration is available
    console.warn('Using default configuration');
    // Use fallback values
  }
} catch (error) {
  console.error('Configuration error:', error);
  // Implement fallback logic
}
```

## Caching Strategy

The service implements a multi-level caching strategy:

1. **Memory Cache**: Fast access to recently fetched configurations
2. **Local Storage**: Persistent cache using AsyncStorage
3. **Version Tracking**: Compares server versions with cached versions
4. **Expiration**: Automatic cache expiration based on age
5. **Fallback**: Uses cached data when server is unavailable

### Cache Keys
- `@dingdingcat/app_config` - App configuration
- `@dingdingcat/ad_config` - Ad configuration  
- `@dingdingcat/risk_config` - Risk configuration
- `@dingdingcat/channel_config` - Channel configuration
- `@dingdingcat/config_versions` - Version tracking
- `@dingdingcat/config_last_update` - Last update timestamp

## API Integration

The service integrates with the following API endpoints:

- `GET /config?appKey={appKey}` - App configuration
- `GET /config/ad?appKey={appKey}` - Ad configuration
- `GET /config/risk?appKey={appKey}` - Risk configuration
- `GET /config/channel?appKey={appKey}` - Channel configuration

All requests include:
- App key from environment configuration
- Timestamp for request tracking
- Automatic authentication headers (via apiClient)

## Configuration Structure

### AppConfig
```typescript
interface AppConfig {
  appKey: string;
  appName: string;
  wechatAppId: string;
  serverTime: number;
  configVersion: string;
  channels: Channel[];
}
```

### AdConfig
```typescript
interface AdConfig {
  appKey: string;
  serverTime: number;
  configVersion: string;
  adInterval: number;
  adIntervalEnabled: boolean;
  singleRewardLimit: number;
  dailyRewardVideoLimit: number;
  dailyAdViewLimit: number;
  adTypeConfig: string;
  adDisplayStrategy: string;
}
```

### RiskConfig
```typescript
interface RiskConfig {
  appKey: string;
  serverTime: number;
  configVersion: string;
  rootDetectionEnabled: boolean;
  emulatorDetectionEnabled: boolean;
  adIntervalCheckEnabled: boolean;
  adIntervalSeconds: number;
  sameIpUserLimit: number;
  riskLevel: number;
}
```

## Best Practices

1. **Initialize Early**: Call `initialize()` during app startup
2. **Handle Nulls**: Always check if configuration is null
3. **Use Caching**: Don't force refresh unless necessary
4. **Error Handling**: Implement fallback logic for critical configurations
5. **Version Checking**: Periodically check for updates
6. **Cache Management**: Clear cache when needed (e.g., user logout)

## Performance Considerations

- Configurations are cached locally to reduce API calls
- Cache expiration prevents stale data
- Parallel requests are handled efficiently
- Fallback to cache ensures app continues working offline
- Version checking minimizes unnecessary updates

## Security

- All API requests use HTTPS
- Authentication tokens are handled automatically
- Sensitive configuration data is not logged in production
- Cache data is stored securely using AsyncStorage

## Testing

The service includes comprehensive unit tests covering:
- Configuration fetching and caching
- Error handling and fallback scenarios
- Version checking and updates
- Cache management operations

See `ConfigService.test.ts` for detailed test cases and `ConfigService.example.ts` for usage examples.