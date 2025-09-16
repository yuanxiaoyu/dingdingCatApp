# AdService Documentation

## Overview

The `AdService` is a comprehensive service class that handles all advertisement-related operations in the DingDingCat application. It provides a complete interface for managing the ad lifecycle, from requesting ads to reporting events and retrieving user statistics.

## Features

- **Ad Request Management**: Request ads for all 4 supported types (splash, video, interstitial, banner)
- **Event Reporting**: Report ad events (show, click, complete, skip, close) to the server
- **Batch Operations**: Support for offline data synchronization through batch reporting
- **Revenue Tracking**: Retrieve user revenue statistics and earning history
- **Error Handling**: Comprehensive error handling with proper error transformation
- **Type Safety**: Full TypeScript support with proper type definitions
- **Utility Functions**: Helper methods for validation and ad type checking

## Supported Ad Types

The service supports 4 ad types as defined in the API specification:

| Ad Type | Enum Value | Description |
|---------|------------|-------------|
| Splash | `AdType.SPLASH` | Full-screen ads shown at app startup |
| Reward Video | `AdType.REWARD_VIDEO` | Video ads that reward users upon completion |
| Interstitial | `AdType.INTERSTITIAL` | Full-screen ads shown at natural app transition points |
| Banner | `AdType.BANNER` | Small rectangular ads displayed within app content |

## Core Methods

### Ad Request Methods

#### `requestAd(request: AdRequest): Promise<AdResponse>`
Generic method to request any type of ad.

```typescript
const adResponse = await adService.requestAd({
  userId: 1001,
  appKey: 'your_app_key',
  adType: AdType.REWARD_VIDEO,
  channelCode: 'pangle_001',
  deviceType: 'android'
});
```

#### Specific Ad Type Methods
- `requestSplashAd(userId: number, channelCode?: string): Promise<AdResponse>`
- `requestRewardVideoAd(userId: number, channelCode?: string): Promise<AdResponse>`
- `requestInterstitialAd(userId: number, channelCode?: string): Promise<AdResponse>`
- `requestBannerAd(userId: number, channelCode?: string): Promise<AdResponse>`

### Event Reporting Methods

#### `reportAdShow(request: AdShowRequest): Promise<void>`
Report when an ad starts displaying.

```typescript
await adService.reportAdShow({
  userId: 1001,
  appKey: 'your_app_key',
  adId: 'AD_123456',
  adType: AdType.REWARD_VIDEO,
  showTime: Date.now()
});
```

#### `reportAdClick(request: AdClickRequest): Promise<void>`
Report when user clicks on an ad.

#### `reportAdComplete(request: AdCompleteRequest): Promise<number>`
Report when ad playback completes. Returns the reward amount earned.

```typescript
const rewardAmount = await adService.reportAdComplete({
  userId: 1001,
  appKey: 'your_app_key',
  adId: 'AD_123456',
  adType: AdType.REWARD_VIDEO,
  playDuration: 30,
  isClicked: '1',
  completeTime: Date.now()
});
console.log('Earned reward:', rewardAmount);
```

#### `reportAdSkip(request: AdSkipRequest): Promise<void>`
Report when user skips an ad.

#### `reportAdClose(request: AdCloseRequest): Promise<void>`
Report when an ad is closed.

### Convenience Methods

The service provides convenience methods that automatically use the current timestamp:

- `reportAdShowNow(userId: number, adId: string, adType: AdType): Promise<void>`
- `reportAdClickNow(userId: number, adId: string, adType: AdType, clickPosition?: string): Promise<void>`
- `reportAdCompleteNow(userId: number, adId: string, adType: AdType, playDuration: number, isClicked: boolean, stayDuration?: number): Promise<number>`
- `reportAdSkipNow(userId: number, adId: string, adType: AdType, playDuration: number, skipReason?: string): Promise<void>`
- `reportAdCloseNow(userId: number, adId: string, adType: AdType, playDuration: number, stayDuration?: number, closeReason?: string): Promise<void>`

### Batch Operations

#### `batchReportAds(request: BatchReportRequest): Promise<number>`
Batch report multiple ad play data for offline synchronization.

```typescript
const processedCount = await adService.batchReportAds({
  userId: 1001,
  appKey: 'your_app_key',
  playDataList: [
    {
      adType: AdType.REWARD_VIDEO,
      playDuration: 30,
      isClicked: '1',
      isSkipped: '0',
      stayDuration: 35
    },
    {
      adType: AdType.BANNER,
      playDuration: 5,
      isClicked: '0',
      isSkipped: '1'
    }
  ]
});
```

### Data Retrieval Methods

#### `getUserRevenue(userId: number): Promise<RevenueData>`
Get comprehensive user revenue statistics.

```typescript
const revenueData = await adService.getUserRevenue(1001);
console.log('Total revenue:', revenueData.totalRevenue);
console.log('Today revenue:', revenueData.todayRevenue);
console.log('Watch count:', revenueData.totalWatchCount);
```

#### `getAdHistory(request: AdHistoryRequest): Promise<AdHistoryResponse>`
Get paginated ad watching history with optional filtering.

```typescript
const history = await adService.getAdHistory({
  userId: 1001,
  appKey: 'your_app_key',
  pageNum: 1,
  pageSize: 20,
  adType: AdType.REWARD_VIDEO,
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});
```

### Utility Methods

#### `isSupportedAdType(adType: string): boolean`
Check if an ad type is supported.

```typescript
if (adService.isSupportedAdType('video')) {
  // Ad type is supported
}
```

#### `getSupportedAdTypes(): AdType[]`
Get array of all supported ad types.

#### `validateAdRequest(request: AdRequest): void`
Validate ad request parameters. Throws error if validation fails.

#### `createAdRequest(userId: number, adType: AdType, options?: Partial<AdRequest>): AdRequest`
Create ad request with default values.

## Usage Patterns

### Complete Ad Flow Example

```typescript
import adService from './services/AdService';
import { AdType } from './types';

async function watchRewardVideo(userId: number) {
  try {
    // 1. Request ad
    const ad = await adService.requestRewardVideoAd(userId);
    
    // 2. Report show
    await adService.reportAdShowNow(userId, ad.adId, ad.adType);
    
    // 3. Play ad (integrate with Pangle SDK)
    // ... ad playback logic ...
    
    // 4. Report completion and get reward
    const reward = await adService.reportAdCompleteNow(
      userId, ad.adId, ad.adType, 30, true, 35
    );
    
    console.log('Earned reward:', reward);
    
  } catch (error) {
    console.error('Ad flow error:', error);
  }
}
```

### Error Handling

```typescript
try {
  const ad = await adService.requestRewardVideoAd(userId);
} catch (error) {
  if (error && typeof error === 'object' && 'code' in error) {
    const apiError = error as ApiError;
    switch (apiError.code) {
      case 400:
        console.log('Bad request:', apiError.message);
        break;
      case 403:
        console.log('Risk control violation:', apiError.message);
        break;
      case 429:
        console.log('Rate limited:', apiError.message);
        break;
      default:
        console.log('API error:', apiError.message);
    }
  } else {
    console.log('Network or other error:', error);
  }
}
```

### Offline Data Sync

```typescript
// Store offline data when network is unavailable
const offlineData = [
  {
    adType: AdType.REWARD_VIDEO,
    playDuration: 30,
    isClicked: '1',
    isSkipped: '0',
    stayDuration: 35
  }
];

// Sync when network is available
try {
  const processed = await adService.batchReportAds({
    userId,
    appKey: 'your_app_key',
    playDataList: offlineData
  });
  console.log(`Synced ${processed} records`);
} catch (error) {
  console.error('Sync failed:', error);
}
```

## Integration with Pangle SDK

The AdService is designed to work seamlessly with the existing Pangle SDK integration:

```typescript
// In your Pangle ad event handlers
const PangleAdManager = {
  onAdShow: async (adId: string, adType: AdType) => {
    await adService.reportAdShowNow(userId, adId, adType);
  },
  
  onAdClick: async (adId: string, adType: AdType) => {
    await adService.reportAdClickNow(userId, adId, adType);
  },
  
  onAdComplete: async (adId: string, adType: AdType, playDuration: number) => {
    const reward = await adService.reportAdCompleteNow(
      userId, adId, adType, playDuration, false
    );
    // Update UI with reward
  },
  
  onAdSkip: async (adId: string, adType: AdType, playDuration: number) => {
    await adService.reportAdSkipNow(userId, adId, adType, playDuration);
  }
};
```

## Configuration

The service uses configuration from `ENV_CONFIG`:

```typescript
// src/config/env.ts
export const ENV_CONFIG = {
  APP_KEY: 'your_app_key',
  API_BASE_URL: 'https://api.dingdingcat.com',
  DEBUG_MODE: __DEV__,
};
```

## Testing

The service includes comprehensive unit tests covering all methods and error scenarios. Run tests with:

```bash
npm test -- --testPathPattern=AdService.test.ts
```

## Dependencies

- `apiClient`: For HTTP requests
- `types`: TypeScript type definitions
- `config/env`: Environment configuration

## Error Codes

Common error codes returned by the service:

| Code | Description | Action |
|------|-------------|--------|
| 200 | Success | Continue normally |
| 400 | Bad request | Check parameters |
| 401 | Unauthorized | Re-authenticate |
| 403 | Forbidden/Risk control | Check risk rules |
| 429 | Rate limited | Reduce request frequency |
| 500 | Server error | Retry later |

## Best Practices

1. **Always handle errors**: Wrap service calls in try-catch blocks
2. **Use convenience methods**: Prefer `reportAdShowNow()` over `reportAdShow()` for simplicity
3. **Validate inputs**: Use `validateAdRequest()` before making requests
4. **Implement offline support**: Use batch reporting for offline data sync
5. **Monitor performance**: Log service call durations in production
6. **Cache ad responses**: Cache ad data locally to reduce API calls
7. **Respect rate limits**: Implement client-side rate limiting if needed

## Future Enhancements

- Add retry mechanisms for failed requests
- Implement request caching for better performance
- Add metrics collection for monitoring
- Support for additional ad types as they become available
- Enhanced offline support with local database storage