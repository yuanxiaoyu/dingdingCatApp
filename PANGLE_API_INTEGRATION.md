# Pangle SDK + API Integration Documentation

## Overview

This document describes the integration between the Pangle Ad SDK and the backend API service, providing a complete ad management solution that handles the full ad lifecycle from request to revenue tracking.

## Architecture

The integration consists of three main components:

1. **PangleAdService** - Native SDK wrapper for ad loading and display
2. **AdService** - API client for server communication
3. **IntegratedAdService** - Orchestrates both services for complete ad lifecycle management

```
┌─────────────────────────────────────────────────────────────┐
│                    IntegratedAdService                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐           ┌─────────────────────────┐  │
│  │  PangleAdService │           │      AdService          │  │
│  │                 │           │                         │  │
│  │ • Load ads      │           │ • Request ads           │  │
│  │ • Show ads      │           │ • Report events         │  │
│  │ • Handle events │           │ • Track revenue         │  │
│  └─────────────────┘           └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Ad Lifecycle Integration

### 1. Ad Request Flow

```typescript
// 1. Request ad from server
const adResponse = await AdService.requestSplashAd(userId);

// 2. Load ad in Pangle SDK
const loadResult = await PangleAdService.loadSplashAd(adResponse.adId);

// 3. Show ad and track events
await this.showSplashAdWithTracking(adResponse, callbacks);
```

### 2. Event Tracking Flow

For each ad event, the integration automatically reports to the API:

- **Ad Show**: Reports when ad starts displaying
- **Ad Click**: Reports when user clicks the ad
- **Ad Complete**: Reports when ad finishes and calculates reward
- **Ad Skip**: Reports when user skips the ad
- **Ad Close**: Reports when ad is closed

### 3. Revenue Calculation

The server calculates and returns the actual reward amount based on:
- Ad type and configuration
- Play duration
- Whether the ad was clicked
- Risk control rules
- User's daily limits

## Supported Ad Types

### 1. Splash Ad (开屏广告)
- **Type**: `AdType.SPLASH`
- **Display**: Full screen on app launch
- **Duration**: 3-5 seconds
- **Revenue**: Low to medium

### 2. Reward Video Ad (激励视频广告)
- **Type**: `AdType.REWARD_VIDEO`
- **Display**: Full screen video
- **Duration**: 15-30 seconds
- **Revenue**: Highest (requires complete viewing)

### 3. Interstitial Ad (插屏广告)
- **Type**: `AdType.INTERSTITIAL`
- **Display**: Full screen between content
- **Duration**: 5-10 seconds
- **Revenue**: Medium

### 4. Banner Ad (Banner广告)
- **Type**: `AdType.BANNER`
- **Display**: Small banner at top/bottom
- **Duration**: Persistent display
- **Revenue**: Low but continuous

## Usage Examples

### Basic Integration

```typescript
import IntegratedAdService from '../services/IntegratedAdService';
import { AdType } from '../types';

// Set current user
IntegratedAdService.setCurrentUser(user);

// Initialize SDK
await IntegratedAdService.initializeSDK('your-app-id');

// Load and show reward video ad
await IntegratedAdService.loadAndShowRewardVideoAd({
  onAdCompleted: (adId, adType, reward) => {
    console.log(`Earned ${reward} from ${adType} ad`);
  },
  onAdError: (adId, adType, error) => {
    console.error(`Ad error: ${error.message}`);
  }
});
```

### React Component Integration

```typescript
import React from 'react';
import { IntegratedAdPanel } from '../components/IntegratedAdButton';

const AdScreen: React.FC = () => {
  return <IntegratedAdPanel />;
};
```

### Custom Ad Callbacks

```typescript
const callbacks: AdEventCallbacks = {
  onAdLoaded: (adId, adType) => {
    // Ad loaded successfully
    setLoadingState(false);
  },
  
  onAdShown: (adId, adType) => {
    // Ad started displaying
    trackAnalyticsEvent('ad_shown', { adType });
  },
  
  onAdCompleted: (adId, adType, reward) => {
    // Ad completed, reward earned
    updateUserBalance(reward);
    showRewardNotification(reward);
  },
  
  onAdError: (adId, adType, error) => {
    // Handle ad error
    showErrorMessage(error.message);
  }
};
```

## API Integration Details

### Request Ad API
```
POST /ad/request
{
  "userId": 123,
  "appKey": "your-app-key",
  "adType": "video",
  "deviceType": "android"
}
```

### Report Ad Events
```
POST /ad/show
POST /ad/click
POST /ad/complete
POST /ad/skip
POST /ad/close
```

### Get Revenue Data
```
GET /ad/revenue?userId=123&appKey=your-app-key
```

## Error Handling

The integration provides comprehensive error handling:

### Network Errors
- Automatic retry with exponential backoff
- Offline data queuing for later sync
- Graceful degradation when API is unavailable

### SDK Errors
- Fallback to alternative ad sources
- Error reporting to analytics
- User-friendly error messages

### Risk Control
- Server-side validation of all ad events
- Detection of suspicious behavior
- Automatic blocking of fraudulent activities

## Testing

### Unit Tests
```bash
npm test -- --testPathPattern=IntegratedAdService.test.ts
```

### Integration Testing
Use the `AdTestScreen` component to test all ad types:

```typescript
import { AdTestScreen } from '../screens/AdTestScreen';

// Navigate to test screen
navigation.navigate('AdTest');
```

### Manual Testing Checklist

- [ ] SDK initialization works
- [ ] All 4 ad types load successfully
- [ ] Ad events are reported to API
- [ ] Revenue is calculated correctly
- [ ] Error handling works properly
- [ ] Offline sync functions correctly

## Performance Considerations

### Memory Management
- Automatic cleanup of ad resources
- Event listener management
- Tracking data cleanup after reporting

### Network Optimization
- Request batching for offline sync
- Compression of event data
- Connection pooling for API calls

### Battery Optimization
- Efficient event tracking
- Minimal background processing
- Smart retry strategies

## Security Features

### Data Protection
- Secure token storage
- Encrypted sensitive data
- HTTPS-only communication

### Fraud Prevention
- Device fingerprinting
- Behavioral analysis
- Server-side validation

### Privacy Compliance
- User consent management
- Data anonymization
- GDPR/CCPA compliance

## Monitoring and Analytics

### Key Metrics
- Ad load success rate
- Ad completion rate
- Revenue per ad view
- Error rates by ad type

### Logging
- Structured JSON logs
- Error tracking with stack traces
- Performance metrics collection

### Alerts
- High error rates
- Revenue anomalies
- SDK initialization failures

## Troubleshooting

### Common Issues

1. **SDK Not Ready**
   - Check if `initializeSDK()` was called
   - Verify app ID is correct
   - Check native module linking

2. **API Errors**
   - Verify network connectivity
   - Check authentication tokens
   - Validate request parameters

3. **No Ads Available**
   - Check ad configuration
   - Verify user eligibility
   - Review risk control settings

4. **Revenue Not Updating**
   - Check API response status
   - Verify event reporting
   - Review server logs

### Debug Mode

Enable debug logging:

```typescript
import { ENV_CONFIG } from '../config/env';

// Set debug mode
ENV_CONFIG.DEBUG_MODE = true;
```

### Log Analysis

Check logs for integration issues:

```bash
# Filter integration logs
adb logcat | grep "IntegratedAdService"

# Check API calls
adb logcat | grep "AdService"

# Monitor SDK events
adb logcat | grep "PangleAdService"
```

## Migration Guide

### From Direct SDK Usage

1. Replace direct SDK calls with IntegratedAdService
2. Add API event reporting
3. Update error handling
4. Test all ad flows

### From API-Only Implementation

1. Add Pangle SDK integration
2. Update ad loading flow
3. Implement event callbacks
4. Test native ad display

## Best Practices

### Code Organization
- Keep ad logic in service layer
- Use TypeScript for type safety
- Implement proper error boundaries
- Follow React Native best practices

### User Experience
- Show loading indicators
- Provide clear error messages
- Respect user preferences
- Minimize interruptions

### Performance
- Preload ads when possible
- Cache configuration data
- Optimize image loading
- Monitor memory usage

### Testing
- Write comprehensive unit tests
- Test error scenarios
- Validate API integration
- Monitor production metrics

## Future Enhancements

### Planned Features
- A/B testing for ad formats
- Advanced analytics dashboard
- Real-time revenue tracking
- Machine learning optimization

### SDK Updates
- Support for new ad formats
- Enhanced targeting options
- Improved performance metrics
- Better error reporting

### API Improvements
- GraphQL support
- Real-time notifications
- Advanced reporting APIs
- Enhanced security features

## Support

For technical support or questions about the integration:

1. Check the troubleshooting section
2. Review the test cases
3. Enable debug logging
4. Contact the development team

## Changelog

### v1.0.0 (Current)
- Initial integration implementation
- Support for 4 ad types
- Complete API integration
- Comprehensive error handling
- Unit test coverage

### Planned v1.1.0
- Enhanced error recovery
- Performance optimizations
- Additional ad formats
- Improved analytics