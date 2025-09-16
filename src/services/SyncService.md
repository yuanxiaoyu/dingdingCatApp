# SyncService Documentation

## Overview

The `SyncService` is a comprehensive offline data synchronization service for the DingDingCat application. It provides robust offline data storage using SQLite and automatic synchronization with the backend API when network connectivity is restored.

## Features

### Core Functionality
- **Offline Data Storage**: SQLite database for reliable offline data persistence
- **Network State Monitoring**: Automatic detection of network connectivity changes
- **Batch Synchronization**: Efficient batch reporting to minimize API calls
- **Automatic Retry**: Exponential backoff retry mechanism for failed sync attempts
- **Queue Management**: Intelligent queue size management with cleanup strategies

### Key Capabilities
- Store ad event data when network is unavailable
- Automatically sync when network becomes available
- Batch multiple ad events for efficient API usage
- Handle sync failures with retry logic
- Monitor sync statistics and queue status
- Configurable sync behavior and timing

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Application   │───▶│   SyncService    │───▶│  Backend API    │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  SQLite Database │
                       │  (Offline Queue) │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ Network Monitor  │
                       │   (NetInfo)      │
                       └──────────────────┘
```

## Database Schema

### offline_ad_data Table
```sql
CREATE TABLE offline_ad_data (
  id TEXT PRIMARY KEY,              -- Unique identifier
  userId INTEGER NOT NULL,          -- User ID
  appKey TEXT NOT NULL,            -- Application key
  adId TEXT NOT NULL,              -- Advertisement ID
  adType TEXT NOT NULL,            -- Ad type (splash, video, etc.)
  eventType TEXT NOT NULL,         -- Event type (show, click, complete, etc.)
  playData TEXT NOT NULL,          -- JSON serialized play data
  timestamp INTEGER NOT NULL,      -- Event timestamp
  synced INTEGER DEFAULT 0,        -- Sync status (0=pending, 1=synced)
  retryCount INTEGER DEFAULT 0,    -- Number of retry attempts
  createdAt INTEGER DEFAULT (strftime('%s', 'now')),
  updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
);
```

### Indexes
- `idx_offline_ad_data_synced`: Index on synced status
- `idx_offline_ad_data_timestamp`: Index on timestamp
- `idx_offline_ad_data_user`: Index on userId

## API Reference

### Core Methods

#### `queueOfflineData(userId, appKey, adId, adType, eventType, playData)`
Queue ad event data for offline synchronization.

**Parameters:**
- `userId` (number): User identifier
- `appKey` (string): Application key
- `adId` (string): Advertisement identifier
- `adType` (AdType): Type of advertisement
- `eventType` (AdEventType): Type of event (show, click, complete, skip, close)
- `playData` (AdPlayData): Detailed play data

**Returns:** Promise<string> - Unique offline data ID

**Example:**
```typescript
const offlineId = await syncService.queueOfflineData(
  12345,
  'your_app_key',
  'ad_12345',
  AdType.REWARD_VIDEO,
  'complete',
  playData
);
```

#### `syncOfflineData()`
Manually trigger synchronization of offline data.

**Returns:** Promise<void>

**Example:**
```typescript
await syncService.syncOfflineData();
```

#### `getSyncStats()`
Get comprehensive synchronization statistics.

**Returns:** Promise<SyncStats>
```typescript
interface SyncStats {
  totalQueued: number;    // Total items in queue
  synced: number;         // Successfully synced items
  pending: number;        // Items pending sync
  failed: number;         // Items that failed max retries
  lastSyncTime: number | null; // Last successful sync timestamp
}
```

#### `getQueueSize()`
Get current number of items in the offline queue.

**Returns:** Promise<number>

#### `clearSyncedData()`
Remove all successfully synced data from the database.

**Returns:** Promise<void>

#### `forceSyncAll()`
Force synchronization of all pending data, including previously failed items.

**Returns:** Promise<void>

### Configuration Methods

#### `updateSyncConfig(config)`
Update synchronization configuration.

**Parameters:**
- `config` (Partial<SyncConfig>): Configuration options

```typescript
interface SyncConfig {
  maxRetries: number;        // Maximum retry attempts (default: 3)
  batchSize: number;         // Items per batch (default: 50)
  syncInterval: number;      // Auto-sync interval in ms (default: 30000)
  maxQueueSize: number;      // Maximum queue size (default: 1000)
  autoSyncEnabled: boolean;  // Enable automatic sync (default: true)
}
```

**Example:**
```typescript
syncService.updateSyncConfig({
  batchSize: 100,
  syncInterval: 60000,
  maxRetries: 5
});
```

### Status Methods

#### `isSyncInProgress()`
Check if synchronization is currently running.

**Returns:** boolean

#### `isNetworkAvailable()`
Check current network connectivity status.

**Returns:** boolean

### Lifecycle Methods

#### `cleanup()`
Clean up resources and close database connections.

**Returns:** Promise<void>

## Configuration Options

### Default Configuration
```typescript
const DEFAULT_SYNC_CONFIG = {
  maxRetries: 3,           // Retry failed syncs up to 3 times
  batchSize: 50,           // Process 50 items per batch
  syncInterval: 30000,     // Auto-sync every 30 seconds
  maxQueueSize: 1000,      // Maximum 1000 items in queue
  autoSyncEnabled: true    // Enable automatic synchronization
};
```

### Customization
```typescript
// Create service with custom configuration
const customSyncService = new SyncService({
  maxRetries: 5,
  batchSize: 100,
  syncInterval: 60000,
  maxQueueSize: 2000,
  autoSyncEnabled: true
});

// Or update existing service configuration
syncService.updateSyncConfig({
  batchSize: 75,
  syncInterval: 45000
});
```

## Integration Patterns

### With AdService
```typescript
// In AdService, integrate offline fallback
export class AdService {
  async reportAdComplete(adId: string, adType: AdType, playData: AdPlayData) {
    try {
      if (syncService.isNetworkAvailable()) {
        // Try immediate API call
        return await apiClient.post('/ad/complete', {
          userId: this.userId,
          appKey: this.appKey,
          adId,
          adType,
          playDuration: playData.playDuration,
          isClicked: playData.isClicked ? '1' : '0',
          stayDuration: playData.stayDuration,
          completeTime: Date.now()
        });
      } else {
        throw new Error('Network unavailable');
      }
    } catch (error) {
      // Fallback to offline queue
      await syncService.queueOfflineData(
        this.userId,
        this.appKey,
        adId,
        adType,
        'complete',
        playData
      );
      throw error; // Re-throw to let caller handle
    }
  }
}
```

### With Redux Store
```typescript
// In Redux slice
const syncSlice = createSlice({
  name: 'sync',
  initialState: {
    queueSize: 0,
    isSyncing: false,
    lastSyncTime: null,
    error: null
  },
  reducers: {
    setSyncStatus: (state, action) => {
      state.isSyncing = action.payload;
    },
    updateQueueSize: (state, action) => {
      state.queueSize = action.payload;
    },
    setLastSyncTime: (state, action) => {
      state.lastSyncTime = action.payload;
    }
  }
});

// Sync status monitoring
export const monitorSyncStatus = () => async (dispatch: AppDispatch) => {
  const stats = await syncService.getSyncStats();
  dispatch(updateQueueSize(stats.pending));
  dispatch(setLastSyncTime(stats.lastSyncTime));
};
```

## Error Handling

### Network Errors
- Automatic retry with exponential backoff
- Queue data for later synchronization
- Network state monitoring for auto-recovery

### Database Errors
- Graceful degradation when database is unavailable
- Error logging for debugging
- Automatic database recreation if corrupted

### API Errors
- Distinguish between retryable and non-retryable errors
- Increment retry count for failed items
- Mark items as permanently failed after max retries

### Example Error Handling
```typescript
try {
  await syncService.queueOfflineData(userId, appKey, adId, adType, eventType, playData);
} catch (error) {
  if (error.message.includes('Database not initialized')) {
    // Handle database initialization error
    console.error('Database error, data will be lost:', error);
  } else if (error.message.includes('Queue size limit')) {
    // Handle queue overflow
    console.warn('Queue full, oldest data will be removed');
  } else {
    // Handle other errors
    console.error('Unexpected sync error:', error);
  }
}
```

## Performance Considerations

### Database Optimization
- Indexed queries for fast data retrieval
- Batch operations to minimize database transactions
- Periodic cleanup of synced data
- Connection pooling and reuse

### Memory Management
- Lazy loading of large datasets
- Streaming for batch operations
- Proper cleanup of resources
- Garbage collection friendly patterns

### Network Optimization
- Batch multiple events in single API call
- Compression of large payloads
- Connection reuse and keep-alive
- Intelligent retry timing

## Monitoring and Debugging

### Logging
```typescript
// Enable debug logging
const syncService = new SyncService({
  debugMode: true // Custom option for detailed logging
});
```

### Statistics Monitoring
```typescript
// Regular stats monitoring
setInterval(async () => {
  const stats = await syncService.getSyncStats();
  console.log('Sync Stats:', stats);
}, 60000); // Every minute
```

### Health Checks
```typescript
// Service health check
export async function checkSyncServiceHealth() {
  const isNetworkAvailable = syncService.isNetworkAvailable();
  const isSyncing = syncService.isSyncInProgress();
  const queueSize = await syncService.getQueueSize();
  
  return {
    healthy: isNetworkAvailable || queueSize < 100,
    networkAvailable: isNetworkAvailable,
    syncing: isSyncing,
    queueSize
  };
}
```

## Best Practices

### Queue Management
- Monitor queue size regularly
- Implement queue size alerts
- Clean up old synced data periodically
- Set appropriate batch sizes for your use case

### Error Recovery
- Implement exponential backoff for retries
- Distinguish between temporary and permanent failures
- Log errors for debugging and monitoring
- Provide user feedback for sync status

### Performance
- Use appropriate batch sizes (50-100 items)
- Avoid blocking the main thread during sync
- Implement proper database indexing
- Monitor memory usage during large syncs

### Security
- Encrypt sensitive data in offline storage
- Validate data integrity before sync
- Implement proper authentication for API calls
- Secure database file permissions

## Troubleshooting

### Common Issues

#### Database Initialization Fails
```typescript
// Check database permissions and storage space
const dbPath = await SQLite.getDatabasePath('DingDingCat.db');
console.log('Database path:', dbPath);
```

#### Network Detection Issues
```typescript
// Manual network state check
import NetInfo from '@react-native-community/netinfo';

const netInfo = await NetInfo.fetch();
console.log('Network state:', netInfo);
```

#### Sync Performance Issues
```typescript
// Reduce batch size for better performance
syncService.updateSyncConfig({
  batchSize: 25,
  syncInterval: 60000
});
```

#### Queue Overflow
```typescript
// Monitor and manage queue size
const queueSize = await syncService.getQueueSize();
if (queueSize > 500) {
  await syncService.clearSyncedData();
}
```

## Migration and Upgrades

### Database Schema Updates
When updating the database schema, implement migration logic:

```typescript
// Example migration for schema v2
private async migrateDatabase(currentVersion: string): Promise<void> {
  if (currentVersion === '1.0') {
    // Add new columns or tables
    await this.database.executeSql(`
      ALTER TABLE offline_ad_data 
      ADD COLUMN priority INTEGER DEFAULT 0
    `);
  }
}
```

### Configuration Updates
Handle configuration changes gracefully:

```typescript
// Backward compatible configuration
const config = {
  ...DEFAULT_SYNC_CONFIG,
  ...userConfig,
  // Ensure required fields exist
  maxRetries: userConfig.maxRetries || DEFAULT_SYNC_CONFIG.maxRetries
};
```

This documentation provides comprehensive guidance for using the SyncService effectively in the DingDingCat application.