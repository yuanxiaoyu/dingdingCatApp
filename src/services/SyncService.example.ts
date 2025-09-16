/**
 * SyncService Usage Examples
 * 
 * This file demonstrates how to use the SyncService for offline data synchronization
 */

import syncService from './SyncService';
import { AdType, AdPlayData } from '../types';

/**
 * Example 1: Queue offline ad data
 */
export async function exampleQueueOfflineData() {
  try {
    const playData: AdPlayData = {
      adId: 'ad_12345',
      adType: AdType.REWARD_VIDEO,
      playDuration: 30000, // 30 seconds
      isClicked: true,
      isSkipped: false,
      isCompleted: true,
      stayDuration: 35000,
      timestamp: Date.now(),
    };

    const offlineId = await syncService.queueOfflineData(
      12345, // userId
      'your_app_key', // appKey
      'ad_12345', // adId
      AdType.REWARD_VIDEO, // adType
      'complete', // eventType
      playData
    );

    console.log('Offline data queued with ID:', offlineId);
  } catch (error) {
    console.error('Failed to queue offline data:', error);
  }
}

/**
 * Example 2: Manual sync trigger
 */
export async function exampleManualSync() {
  try {
    console.log('Starting manual sync...');
    await syncService.syncOfflineData();
    console.log('Manual sync completed');
  } catch (error) {
    console.error('Manual sync failed:', error);
  }
}

/**
 * Example 3: Get sync statistics
 */
export async function exampleGetSyncStats() {
  try {
    const stats = await syncService.getSyncStats();
    console.log('Sync Statistics:', {
      totalQueued: stats.totalQueued,
      synced: stats.synced,
      pending: stats.pending,
      failed: stats.failed,
      lastSyncTime: stats.lastSyncTime ? new Date(stats.lastSyncTime) : null,
    });
  } catch (error) {
    console.error('Failed to get sync stats:', error);
  }
}

/**
 * Example 4: Check sync and network status
 */
export function exampleCheckStatus() {
  const isSyncing = syncService.isSyncInProgress();
  const isNetworkAvailable = syncService.isNetworkAvailable();
  
  console.log('Service Status:', {
    isSyncing,
    isNetworkAvailable,
  });
}

/**
 * Example 5: Update sync configuration
 */
export function exampleUpdateConfig() {
  syncService.updateSyncConfig({
    batchSize: 100, // Increase batch size
    syncInterval: 60000, // Sync every minute
    maxRetries: 5, // Allow more retries
    autoSyncEnabled: true, // Enable auto sync
  });
  
  console.log('Sync configuration updated');
}

/**
 * Example 6: Force sync all pending data
 */
export async function exampleForceSyncAll() {
  try {
    console.log('Force syncing all pending data...');
    await syncService.forceSyncAll();
    console.log('Force sync completed');
  } catch (error) {
    console.error('Force sync failed:', error);
  }
}

/**
 * Example 7: Clear synced data
 */
export async function exampleClearSyncedData() {
  try {
    await syncService.clearSyncedData();
    console.log('Synced data cleared');
  } catch (error) {
    console.error('Failed to clear synced data:', error);
  }
}

/**
 * Example 8: Get current queue size
 */
export async function exampleGetQueueSize() {
  try {
    const queueSize = await syncService.getQueueSize();
    console.log('Current queue size:', queueSize);
  } catch (error) {
    console.error('Failed to get queue size:', error);
  }
}

/**
 * Example 9: Integration with AdService
 * This shows how to integrate SyncService with ad event reporting
 */
export async function exampleAdServiceIntegration(
  userId: number,
  appKey: string,
  adId: string,
  adType: AdType,
  playData: AdPlayData
) {
  try {
    // Check if network is available
    if (syncService.isNetworkAvailable()) {
      // Try to report immediately
      console.log('Network available, reporting immediately...');
      // Here you would call the actual API
      // await adService.reportAdComplete(adId, adType, playData);
    } else {
      // Queue for offline sync
      console.log('Network unavailable, queuing for offline sync...');
      await syncService.queueOfflineData(
        userId,
        appKey,
        adId,
        adType,
        'complete',
        playData
      );
    }
  } catch (error) {
    console.error('Ad reporting failed, queuing for offline sync:', error);
    // Fallback to offline queue
    await syncService.queueOfflineData(
      userId,
      appKey,
      adId,
      adType,
      'complete',
      playData
    );
  }
}

/**
 * Example 10: Service lifecycle management
 */
export async function exampleServiceLifecycle() {
  try {
    // Get initial stats
    const initialStats = await syncService.getSyncStats();
    console.log('Initial stats:', initialStats);

    // Queue some test data
    const testPlayData: AdPlayData = {
      adId: 'test_ad',
      adType: AdType.SPLASH,
      playDuration: 5000,
      isClicked: false,
      isSkipped: true,
      timestamp: Date.now(),
    };

    await syncService.queueOfflineData(
      999,
      'test_app_key',
      'test_ad',
      AdType.SPLASH,
      'skip',
      testPlayData
    );

    // Check updated stats
    const updatedStats = await syncService.getSyncStats();
    console.log('Updated stats:', updatedStats);

    // Trigger sync if network is available
    if (syncService.isNetworkAvailable()) {
      await syncService.syncOfflineData();
    }

    // Final stats
    const finalStats = await syncService.getSyncStats();
    console.log('Final stats:', finalStats);

  } catch (error) {
    console.error('Service lifecycle example failed:', error);
  }
}

/**
 * Example 11: Error handling and recovery
 */
export async function exampleErrorHandling() {
  try {
    // Simulate network error scenario
    console.log('Testing error handling...');

    // Queue data when network is down
    const playData: AdPlayData = {
      adId: 'error_test_ad',
      adType: AdType.INTERSTITIAL,
      playDuration: 15000,
      isClicked: true,
      isSkipped: false,
      timestamp: Date.now(),
    };

    await syncService.queueOfflineData(
      888,
      'error_test_app',
      'error_test_ad',
      AdType.INTERSTITIAL,
      'click',
      playData
    );

    // Check if data is queued
    const queueSize = await syncService.getQueueSize();
    console.log('Queue size after error:', queueSize);

    // When network recovers, sync will happen automatically
    // or you can force sync
    if (syncService.isNetworkAvailable()) {
      await syncService.forceSyncAll();
    }

  } catch (error) {
    console.error('Error handling example failed:', error);
  }
}

/**
 * Example 12: Cleanup when app is closing
 */
export async function exampleCleanup() {
  try {
    console.log('Cleaning up SyncService...');
    await syncService.cleanup();
    console.log('SyncService cleanup completed');
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}