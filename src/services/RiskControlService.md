# RiskControlService Documentation

## Overview

The `RiskControlService` is a comprehensive risk management system for the DingDingCat application. It implements various security checks and business rule validations to prevent fraud, abuse, and ensure fair usage of the advertising system.

## Features

### 1. Device Environment Detection
- **ROOT Detection**: Identifies rooted/jailbroken devices
- **Emulator Detection**: Detects virtual/emulator environments
- **Device Fingerprinting**: Generates unique device identifiers

### 2. Ad Interval Controls
- **Time-based Restrictions**: Enforces minimum intervals between ad views
- **Per-Ad-Type Intervals**: Different intervals for different ad types
- **Configurable Thresholds**: Server-controlled interval settings

### 3. Revenue Limits
- **Single Revenue Limits**: Maximum reward per ad view
- **Daily Revenue Caps**: Total daily earning limits
- **Dynamic Validation**: Real-time revenue validation

### 4. Daily Usage Limits
- **Ad View Limits**: Maximum ads per day
- **Reward Video Limits**: Specific limits for reward videos
- **Automatic Reset**: Daily counters reset at midnight

### 5. IP-based Controls
- **Same-IP Limits**: Restrict multiple users from same IP
- **Geographic Validation**: Location-based restrictions (placeholder)
- **Proxy Detection**: Identify suspicious network usage

## API Reference

### Initialization

```typescript
import riskControlService from './RiskControlService';

// Initialize the service
await riskControlService.initialize();
```

### Core Methods

#### `getRiskConfig(appKey?: string): Promise<RiskConfig>`
Fetches risk configuration from the server.

```typescript
const config = await riskControlService.getRiskConfig();
console.log('Risk config:', config);
```

#### `detectDeviceEnvironment(): Promise<DeviceEnvironment>`
Performs comprehensive device environment detection.

```typescript
const environment = await riskControlService.detectDeviceEnvironment();
if (environment.isRooted) {
  console.warn('Device is rooted');
}
```

#### `checkAdInterval(adType?: string): Promise<boolean>`
Validates ad viewing intervals.

```typescript
try {
  await riskControlService.checkAdInterval('video');
  // Can show ad
} catch (error) {
  // Handle interval violation
}
```

#### `validateRevenueLimit(amount: number): boolean`
Validates single revenue amounts.

```typescript
try {
  riskControlService.validateRevenueLimit(0.05);
  // Revenue is valid
} catch (error) {
  // Handle revenue limit violation
}
```

#### `checkDailyLimits(userId: number, adType?: string): Promise<boolean>`
Checks daily usage limits.

```typescript
try {
  await riskControlService.checkDailyLimits(1001, 'video');
  // Within daily limits
} catch (error) {
  // Handle daily limit violation
}
```

#### `updateDailyStats(adType: string, revenue?: number): Promise<void>`
Updates daily statistics after ad viewing.

```typescript
await riskControlService.updateDailyStats('video', 0.05);
```

#### `performRiskCheck(params): Promise<boolean>`
Comprehensive risk validation.

```typescript
const passed = await riskControlService.performRiskCheck({
  userId: 1001,
  adType: 'video',
  expectedRevenue: 0.05,
  ipAddress: '192.168.1.1'
});
```

### Error Handling

The service uses custom `RiskViolationError` for risk-related violations:

```typescript
import { RiskViolationError, RiskViolationType } from './RiskControlService';

try {
  await riskControlService.performRiskCheck(params);
} catch (error) {
  if (error instanceof RiskViolationError) {
    const userMessage = riskControlService.getRiskViolationMessage(error);
    
    switch (error.violationType) {
      case RiskViolationType.ROOT_DETECTED:
        // Handle root detection
        break;
      case RiskViolationType.AD_INTERVAL_VIOLATION:
        // Handle interval violation
        break;
      // ... other violation types
    }
  }
}
```

## Configuration

Risk controls are configured server-side via the `/config/risk` API endpoint:

```typescript
interface RiskConfig {
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
  dailyRewardVideoLimit?: number;
  singleRevenueLimit?: number;
}
```

## Risk Violation Types

```typescript
enum RiskViolationType {
  ROOT_DETECTED = 'ROOT_DETECTED',
  EMULATOR_DETECTED = 'EMULATOR_DETECTED',
  AD_INTERVAL_VIOLATION = 'AD_INTERVAL_VIOLATION',
  SINGLE_REVENUE_LIMIT = 'SINGLE_REVENUE_LIMIT',
  DAILY_REWARD_VIDEO_LIMIT = 'DAILY_REWARD_VIDEO_LIMIT',
  DAILY_AD_VIEW_LIMIT = 'DAILY_AD_VIEW_LIMIT',
  IP_ONLINE_LIMIT = 'IP_ONLINE_LIMIT',
  LOGIN_FREQUENCY_LIMIT = 'LOGIN_FREQUENCY_LIMIT',
}
```

## Storage

The service uses AsyncStorage for local data persistence:

- `@dingdingcat/risk_config` - Cached risk configuration
- `@dingdingcat/last_ad_time` - Last ad viewing timestamps
- `@dingdingcat/daily_ad_count` - Daily statistics
- `@dingdingcat/device_fingerprint` - Device fingerprint

## Integration with Ad Flow

```typescript
// Before showing an ad
async function showAd(userId: number, adType: string, expectedRevenue: number) {
  try {
    // Perform risk check
    await riskControlService.performRiskCheck({
      userId,
      adType,
      expectedRevenue
    });
    
    // Show the ad (via Pangle SDK)
    const adResult = await showPangleAd(adType);
    
    // Update statistics after successful ad view
    if (adResult.completed) {
      await riskControlService.updateDailyStats(adType, expectedRevenue);
    }
    
  } catch (error) {
    if (error instanceof RiskViolationError) {
      // Show user-friendly error message
      const message = riskControlService.getRiskViolationMessage(error);
      showUserMessage(message);
    }
  }
}
```

## Testing

The service includes comprehensive unit tests covering:

- Configuration fetching and caching
- Device environment detection
- Ad interval validation
- Revenue limit validation
- Daily limit checking
- Statistics updating
- Error handling
- Cache management

Run tests with:
```bash
npm test -- --testPathPattern=RiskControlService.test.ts
```

## Security Considerations

1. **Client-side Limitations**: Some checks (like IP limits) are placeholders and should be implemented server-side
2. **Device Detection**: Detection methods may not catch all rooting/emulation techniques
3. **Data Integrity**: Local storage can be manipulated; critical validations should be server-side
4. **Network Security**: All API communications use HTTPS
5. **Error Handling**: Graceful degradation when detection fails

## Performance

- **Caching**: Risk configuration is cached locally
- **Lazy Loading**: Device detection runs only when needed
- **Efficient Storage**: Minimal data stored locally
- **Error Recovery**: Continues operation even if some checks fail

## Maintenance

- **Configuration Updates**: Risk rules can be updated server-side without app updates
- **Monitoring**: All violations are logged for analysis
- **Cache Management**: Automatic cache cleanup and reset mechanisms
- **Version Control**: Configuration versioning for compatibility

## Future Enhancements

1. **Advanced Device Detection**: More sophisticated root/emulator detection
2. **Machine Learning**: Behavioral analysis for fraud detection
3. **Real-time Monitoring**: Live risk score calculation
4. **A/B Testing**: Different risk rules for different user segments
5. **Analytics Integration**: Risk metrics and reporting