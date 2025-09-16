# DeviceService Documentation

## Overview

The `DeviceService` is a comprehensive service for collecting, managing, and reporting device information in the DingDingCat app. It provides functionality for device environment detection (root/emulator), information caching, change monitoring, and server reporting.

## Features

- **Comprehensive Device Info Collection**: Collects hardware, software, network, and system information
- **Security Detection**: Detects rooted/jailbroken devices and emulators
- **Smart Caching**: Caches device information with expiration and change detection
- **Rate Limiting**: Prevents excessive server reporting with intelligent rate limiting
- **Change Monitoring**: Monitors device state changes and notifies listeners
- **Error Handling**: Graceful error handling with fallback mechanisms
- **Network Monitoring**: Real-time network state monitoring and updates

## Installation

The DeviceService uses the following dependencies that are already installed:

```json
{
  "react-native-device-info": "^14.0.4",
  "@react-native-async-storage/async-storage": "^2.2.0",
  "@react-native-community/netinfo": "^11.4.1"
}
```

## Basic Usage

### Initialization

```typescript
import deviceService from './services/DeviceService';

// Initialize on app startup
await deviceService.initialize();
```

### Collect Device Information

```typescript
const deviceInfo = await deviceService.collectDeviceInfo();
console.log('Device Model:', deviceInfo.deviceModel);
console.log('Is Rooted:', deviceInfo.isRooted);
console.log('Is Emulator:', deviceInfo.isEmulator);
```

### Report to Server

```typescript
const userId = 1001;
try {
  const result = await deviceService.reportDeviceInfo(userId);
  console.log('Reported successfully:', result);
} catch (error) {
  if (error.message.includes('Rate limited')) {
    console.log('Rate limited - normal behavior');
  } else {
    console.error('Report failed:', error);
  }
}
```

## API Reference

### Core Methods

#### `initialize(): Promise<void>`

Initializes the DeviceService. Should be called once on app startup.

- Loads cached device information
- Starts network monitoring
- Collects initial device info if cache is expired

```typescript
await deviceService.initialize();
```

#### `collectDeviceInfo(): Promise<CollectedDeviceInfo>`

Collects comprehensive device information including:

- Basic device info (model, brand, OS)
- Hardware info (memory, storage, CPU)
- Network info (type, connectivity)
- Security info (root/emulator detection)
- App info (version, build number)
- System info (battery, language, timezone)

```typescript
const deviceInfo = await deviceService.collectDeviceInfo();
```

#### `detectDeviceEnvironment(): Promise<DeviceEnvironmentInfo>`

Detects device security environment:

```typescript
const envInfo = await deviceService.detectDeviceEnvironment();
console.log('Is Rooted:', envInfo.isRooted);
console.log('Is Emulator:', envInfo.isEmulator);
console.log('Device Fingerprint:', envInfo.deviceFingerprint);
```

#### `reportDeviceInfo(userId: number): Promise<DeviceReportResponse>`

Reports device information to the server with rate limiting:

```typescript
try {
  const result = await deviceService.reportDeviceInfo(1001);
  console.log('Report successful:', result);
} catch (error) {
  // Handle rate limiting or network errors
}
```

### Monitoring Methods

#### `hasDeviceInfoChanged(): Promise<boolean>`

Checks if device information has changed significantly:

```typescript
const hasChanged = await deviceService.hasDeviceInfoChanged();
if (hasChanged) {
  console.log('Device info changed, consider reporting');
}
```

#### `addChangeListener(listener: Function): void`

Adds a listener for device info changes:

```typescript
const listener = (deviceInfo) => {
  console.log('Device changed:', deviceInfo.networkType);
};

deviceService.addChangeListener(listener);
```

#### `removeChangeListener(listener: Function): void`

Removes a change listener:

```typescript
deviceService.removeChangeListener(listener);
```

### Cache Management

#### `getCachedDeviceInfo(): CollectedDeviceInfo | null`

Gets cached device information:

```typescript
const cached = deviceService.getCachedDeviceInfo();
if (cached) {
  const ageHours = (Date.now() - cached.collectionTime) / (1000 * 60 * 60);
  console.log(`Cache age: ${ageHours} hours`);
}
```

#### `clearCache(): Promise<void>`

Clears all cached device information:

```typescript
await deviceService.clearCache();
```

#### `refreshDeviceInfo(): Promise<CollectedDeviceInfo>`

Forces a fresh collection of device information:

```typescript
const freshInfo = await deviceService.refreshDeviceInfo();
```

## Data Types

### CollectedDeviceInfo

```typescript
interface CollectedDeviceInfo extends DeviceInfo {
  collectionTime: number;
  networkInfo?: {
    type: string;
    isConnected: boolean;
    isInternetReachable: boolean;
  };
}
```

### DeviceEnvironmentInfo

```typescript
interface DeviceEnvironmentInfo {
  isRooted: boolean;
  isEmulator: boolean;
  deviceFingerprint: string;
  detectionDetails: {
    rootDetectionMethods: string[];
    emulatorDetectionMethods: string[];
    deviceInfo: any;
    suspiciousIndicators: string[];
  };
}
```

## Configuration

### Cache Duration

Device information is cached for 24 hours by default:

```typescript
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
```

### Report Interval

Minimum interval between server reports is 1 hour:

```typescript
const REPORT_INTERVAL = 60 * 60 * 1000; // 1 hour
```

### Storage Keys

The service uses these AsyncStorage keys:

```typescript
const STORAGE_KEYS = {
  DEVICE_INFO: '@dingdingcat/device_info',
  LAST_REPORT_TIME: '@dingdingcat/last_device_report',
  DEVICE_FINGERPRINT: '@dingdingcat/device_fingerprint',
};
```

## Security Features

### Root/Jailbreak Detection

The service detects rooted Android devices and jailbroken iOS devices:

**Android Detection Methods:**
- Test-keys detection
- Suspicious system properties

**iOS Detection Methods:**
- Common jailbreak file paths
- Suspicious system behaviors

### Emulator Detection

Multiple methods for emulator detection:

- Device-info API detection
- Suspicious brand names (generic, google, android)
- Suspicious model names (emulator, simulator, sdk)

### Device Fingerprinting

Generates unique device fingerprints for tracking:

```typescript
const fingerprint = await deviceService.detectDeviceEnvironment();
console.log('Fingerprint:', fingerprint.deviceFingerprint);
```

## Error Handling

The service provides comprehensive error handling:

### Network Errors

```typescript
try {
  await deviceService.reportDeviceInfo(userId);
} catch (error) {
  if (error.message.includes('Network')) {
    // Handle network error - queue for retry
  }
}
```

### Rate Limiting

```typescript
try {
  await deviceService.reportDeviceInfo(userId);
} catch (error) {
  if (error.message.includes('Rate limited')) {
    // Normal behavior - too frequent reporting
  }
}
```

### Collection Errors

```typescript
try {
  const info = await deviceService.collectDeviceInfo();
} catch (error) {
  // Falls back to cached info or safe defaults
  const cached = deviceService.getCachedDeviceInfo();
}
```

## Best Practices

### App Startup Integration

```typescript
// In your App.tsx or main component
useEffect(() => {
  const initializeDevice = async () => {
    try {
      await deviceService.initialize();
      
      // Report if user is logged in
      if (currentUser) {
        await deviceService.reportDeviceInfo(currentUser.userId);
      }
    } catch (error) {
      console.error('Device service initialization failed:', error);
    }
  };
  
  initializeDevice();
}, []);
```

### Change Monitoring

```typescript
useEffect(() => {
  const handleDeviceChange = (deviceInfo) => {
    // Handle network changes
    if (!deviceInfo.networkInfo?.isConnected) {
      // Handle offline state
    }
    
    // Handle security changes
    if (deviceInfo.isRooted || deviceInfo.isEmulator) {
      // Show security warning
    }
  };
  
  deviceService.addChangeListener(handleDeviceChange);
  
  return () => {
    deviceService.removeChangeListener(handleDeviceChange);
  };
}, []);
```

### Periodic Reporting

```typescript
// Check and report device changes periodically
const checkDeviceChanges = async () => {
  try {
    const hasChanged = await deviceService.hasDeviceInfoChanged();
    if (hasChanged && currentUser) {
      await deviceService.reportDeviceInfo(currentUser.userId);
    }
  } catch (error) {
    console.error('Device change check failed:', error);
  }
};

// Check every hour
setInterval(checkDeviceChanges, 60 * 60 * 1000);
```

## Performance Considerations

### Memory Usage

- Device info is cached in memory and AsyncStorage
- Cache is automatically cleared when expired
- Network listeners are properly cleaned up

### Network Usage

- Rate limiting prevents excessive API calls
- Only significant changes trigger reports
- Offline data is queued for later sync

### Battery Usage

- Minimal background processing
- Network monitoring uses efficient native APIs
- Collection is triggered only when needed

## Troubleshooting

### Common Issues

**Device ID Not Available:**
```typescript
// Service automatically generates fallback IDs
const info = await deviceService.collectDeviceInfo();
console.log('Device ID:', info.deviceId); // Always available
```

**Permission Errors:**
```typescript
// Service handles permission errors gracefully
// Falls back to available information
```

**Network Errors:**
```typescript
// Rate limiting prevents spam
// Automatic retry with exponential backoff
```

### Debug Mode

Enable debug logging in development:

```typescript
// In your env config
const ENV_CONFIG = {
  DEBUG_MODE: __DEV__,
  // ...
};
```

## Testing

The service includes comprehensive tests:

```bash
# Run device service tests
npm test -- DeviceService.test.ts

# Run with coverage
npm run test:coverage -- DeviceService.test.ts
```

### Mock Usage in Tests

```typescript
import deviceService from '../DeviceService';

// Mock the service in tests
jest.mock('../DeviceService', () => ({
  initialize: jest.fn(),
  collectDeviceInfo: jest.fn(),
  reportDeviceInfo: jest.fn(),
}));
```

## Integration Examples

See `DeviceService.example.ts` for comprehensive usage examples including:

- App startup integration
- Risk control integration
- Error handling patterns
- Change monitoring setup
- Cache management strategies

## API Endpoint

The service reports to the `/user/device` endpoint as defined in the API documentation:

```
POST /api/app/user/device
```

**Request Body:**
```json
{
  "userId": 1001,
  "appKey": "your_app_key",
  "deviceModel": "iPhone 13",
  "deviceBrand": "Apple",
  "osName": "iOS",
  "osVersion": "15.0",
  "deviceId": "device_unique_id",
  "isRooted": false,
  "isEmulator": false,
  // ... additional fields
}
```

**Response:**
```json
{
  "code": 200,
  "message": "设备信息上报成功",
  "data": {
    "userId": 1001,
    "appKey": "your_app_key",
    "reportTime": 1640995200000
  }
}
```