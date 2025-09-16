/**
 * DeviceService Usage Examples
 * 
 * This file demonstrates how to use the DeviceService for collecting
 * and reporting device information in the DingDingCat app.
 */

import deviceService, { DeviceService, CollectedDeviceInfo } from './DeviceService';

/**
 * Example 1: Initialize and collect device info on app startup
 */
export async function initializeDeviceServiceExample(): Promise<void> {
  try {
    console.log('Initializing DeviceService...');
    
    // Initialize the service (should be called once on app startup)
    await deviceService.initialize();
    
    console.log('DeviceService initialized successfully');
    
    // Get cached device info if available
    const cachedInfo = deviceService.getCachedDeviceInfo();
    if (cachedInfo) {
      console.log('Cached device info:', {
        model: cachedInfo.deviceModel,
        brand: cachedInfo.deviceBrand,
        os: `${cachedInfo.osName} ${cachedInfo.osVersion}`,
        isRooted: cachedInfo.isRooted,
        isEmulator: cachedInfo.isEmulator,
        cacheAge: Date.now() - cachedInfo.collectionTime,
      });
    }
    
  } catch (error) {
    console.error('Failed to initialize DeviceService:', error);
  }
}

/**
 * Example 2: Collect fresh device information
 */
export async function collectDeviceInfoExample(): Promise<CollectedDeviceInfo | null> {
  try {
    console.log('Collecting device information...');
    
    const deviceInfo = await deviceService.collectDeviceInfo();
    
    console.log('Device Information Collected:', {
      // Basic device info
      model: deviceInfo.deviceModel,
      brand: deviceInfo.deviceBrand,
      os: `${deviceInfo.osName} ${deviceInfo.osVersion}`,
      deviceId: deviceInfo.deviceId,
      
      // Security info
      isRooted: deviceInfo.isRooted,
      isEmulator: deviceInfo.isEmulator,
      
      // Hardware info
      totalMemory: `${deviceInfo.totalMemory}MB`,
      availableMemory: `${deviceInfo.availableMemory}MB`,
      totalStorage: `${deviceInfo.totalStorage}MB`,
      availableStorage: `${deviceInfo.availableStorage}MB`,
      
      // Network info
      networkType: deviceInfo.networkType,
      carrier: deviceInfo.carrier,
      
      // App info
      appVersion: deviceInfo.appVersion,
      appVersionCode: deviceInfo.appVersionCode,
      
      // System info
      batteryLevel: `${deviceInfo.batteryLevel}%`,
      isCharging: deviceInfo.isCharging,
      language: deviceInfo.deviceLanguage,
      timezone: deviceInfo.deviceTimezone,
      
      // Collection metadata
      collectionTime: new Date(deviceInfo.collectionTime).toISOString(),
    });
    
    return deviceInfo;
    
  } catch (error) {
    console.error('Failed to collect device info:', error);
    return null;
  }
}

/**
 * Example 3: Report device info to server
 */
export async function reportDeviceInfoExample(userId: number): Promise<boolean> {
  try {
    console.log(`Reporting device info for user ${userId}...`);
    
    const result = await deviceService.reportDeviceInfo(userId);
    
    console.log('Device info reported successfully:', {
      userId: result.userId,
      appKey: result.appKey,
      reportTime: new Date(result.reportTime).toISOString(),
    });
    
    return true;
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('Rate limited')) {
      console.log('Device info reporting skipped due to rate limiting');
      return true; // Not an error, just rate limited
    }
    
    console.error('Failed to report device info:', error);
    return false;
  }
}

/**
 * Example 4: Detect device environment (root/emulator)
 */
export async function detectDeviceEnvironmentExample(): Promise<void> {
  try {
    console.log('Detecting device environment...');
    
    const environmentInfo = await deviceService.detectDeviceEnvironment();
    
    console.log('Device Environment Detection Results:', {
      isRooted: environmentInfo.isRooted,
      isEmulator: environmentInfo.isEmulator,
      deviceFingerprint: environmentInfo.deviceFingerprint,
      
      // Detection details
      rootDetectionMethods: environmentInfo.detectionDetails.rootDetectionMethods,
      emulatorDetectionMethods: environmentInfo.detectionDetails.emulatorDetectionMethods,
      suspiciousIndicators: environmentInfo.detectionDetails.suspiciousIndicators,
      
      // Device info used for detection
      deviceInfo: environmentInfo.detectionDetails.deviceInfo,
    });
    
    // Handle security concerns
    if (environmentInfo.isRooted) {
      console.warn('⚠️ Device is rooted/jailbroken');
      // You might want to show a warning to the user or restrict certain features
    }
    
    if (environmentInfo.isEmulator) {
      console.warn('⚠️ Running on emulator/simulator');
      // You might want to restrict certain features or show different content
    }
    
  } catch (error) {
    console.error('Failed to detect device environment:', error);
  }
}

/**
 * Example 5: Monitor device info changes
 */
export function monitorDeviceChangesExample(): () => void {
  console.log('Setting up device info change monitoring...');
  
  const changeListener = (deviceInfo: CollectedDeviceInfo) => {
    console.log('Device info changed:', {
      model: deviceInfo.deviceModel,
      networkType: deviceInfo.networkType,
      batteryLevel: deviceInfo.batteryLevel,
      isCharging: deviceInfo.isCharging,
      updateTime: new Date(deviceInfo.collectionTime).toISOString(),
    });
    
    // Handle device changes
    if (deviceInfo.networkInfo) {
      if (!deviceInfo.networkInfo.isConnected) {
        console.log('📱 Device went offline');
        // Handle offline state
      } else if (deviceInfo.networkInfo.isInternetReachable) {
        console.log('🌐 Device back online');
        // Handle online state, maybe sync data
      }
    }
  };
  
  // Add the listener
  deviceService.addChangeListener(changeListener);
  
  // Return cleanup function
  return () => {
    deviceService.removeChangeListener(changeListener);
    console.log('Device change monitoring stopped');
  };
}

/**
 * Example 6: Check if device info has changed
 */
export async function checkDeviceChangesExample(): Promise<boolean> {
  try {
    console.log('Checking for device info changes...');
    
    const hasChanged = await deviceService.hasDeviceInfoChanged();
    
    if (hasChanged) {
      console.log('📱 Device info has changed, may need to report to server');
      
      // Optionally report the changes
      // await reportDeviceInfoExample(currentUserId);
      
      return true;
    } else {
      console.log('✅ No significant device changes detected');
      return false;
    }
    
  } catch (error) {
    console.error('Failed to check device changes:', error);
    return false;
  }
}

/**
 * Example 7: Cache management
 */
export async function cacheManagementExample(): Promise<void> {
  try {
    console.log('Device cache management examples...');
    
    // Get cached info
    const cachedInfo = deviceService.getCachedDeviceInfo();
    if (cachedInfo) {
      const cacheAge = Date.now() - cachedInfo.collectionTime;
      const cacheAgeHours = Math.round(cacheAge / (1000 * 60 * 60));
      console.log(`Cache age: ${cacheAgeHours} hours`);
    }
    
    // Clear cache if needed
    if (cachedInfo && (Date.now() - cachedInfo.collectionTime) > 24 * 60 * 60 * 1000) {
      console.log('Cache is old, clearing...');
      await deviceService.clearCache();
    }
    
    // Force refresh device info
    console.log('Force refreshing device info...');
    const freshInfo = await deviceService.refreshDeviceInfo();
    console.log('Fresh device info collected:', {
      model: freshInfo.deviceModel,
      collectionTime: new Date(freshInfo.collectionTime).toISOString(),
    });
    
  } catch (error) {
    console.error('Cache management failed:', error);
  }
}

/**
 * Example 8: Complete app startup flow
 */
export async function appStartupDeviceFlowExample(userId: number): Promise<void> {
  try {
    console.log('🚀 Starting app device info flow...');
    
    // Step 1: Initialize service
    await deviceService.initialize();
    
    // Step 2: Check if we need to collect fresh info
    let needsCollection = false;
    const cachedInfo = deviceService.getCachedDeviceInfo();
    
    if (!cachedInfo) {
      console.log('No cached device info, collecting...');
      needsCollection = true;
    } else {
      const cacheAge = Date.now() - cachedInfo.collectionTime;
      if (cacheAge > 24 * 60 * 60 * 1000) { // 24 hours
        console.log('Cached device info is old, refreshing...');
        needsCollection = true;
      }
    }
    
    // Step 3: Collect device info if needed
    if (needsCollection) {
      await deviceService.collectDeviceInfo();
    }
    
    // Step 4: Detect security issues
    const environmentInfo = await deviceService.detectDeviceEnvironment();
    if (environmentInfo.isRooted || environmentInfo.isEmulator) {
      console.warn('⚠️ Security concerns detected:', {
        isRooted: environmentInfo.isRooted,
        isEmulator: environmentInfo.isEmulator,
      });
      
      // You might want to show a warning dialog or restrict features
    }
    
    // Step 5: Report to server (with rate limiting)
    try {
      await deviceService.reportDeviceInfo(userId);
      console.log('✅ Device info reported to server');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Rate limited')) {
        console.log('ℹ️ Device info reporting rate limited (normal)');
      } else {
        console.error('❌ Failed to report device info:', error);
      }
    }
    
    // Step 6: Set up change monitoring
    const stopMonitoring = monitorDeviceChangesExample();
    
    console.log('✅ App device info flow completed');
    
    // Return cleanup function for when app shuts down
    return stopMonitoring;
    
  } catch (error) {
    console.error('❌ App startup device flow failed:', error);
    throw error;
  }
}

/**
 * Example 9: Error handling patterns
 */
export async function errorHandlingExample(): Promise<void> {
  try {
    // Example of handling different types of errors
    
    // 1. Network errors when reporting
    try {
      await deviceService.reportDeviceInfo(1001);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Rate limited')) {
          console.log('Rate limited - this is normal behavior');
        } else if (error.message.includes('Network')) {
          console.log('Network error - will retry later');
          // Queue for retry when network is available
        } else if (error.message.includes('401')) {
          console.log('Authentication error - user needs to login again');
          // Redirect to login
        } else {
          console.error('Unexpected error reporting device info:', error);
        }
      }
    }
    
    // 2. Device info collection errors
    try {
      await deviceService.collectDeviceInfo();
    } catch (error) {
      console.error('Device info collection failed, using cached data');
      const cachedInfo = deviceService.getCachedDeviceInfo();
      if (cachedInfo) {
        console.log('Using cached device info from:', new Date(cachedInfo.collectionTime));
      }
    }
    
    // 3. Environment detection errors
    try {
      await deviceService.detectDeviceEnvironment();
    } catch (error) {
      console.error('Environment detection failed, assuming safe environment');
      // Continue with safe defaults
    }
    
  } catch (error) {
    console.error('Error handling example failed:', error);
  }
}

/**
 * Example 10: Integration with other services
 */
export class DeviceServiceIntegrationExample {
  private stopMonitoring?: () => void;
  
  async initializeWithRiskControl(userId: number): Promise<void> {
    try {
      // Initialize device service
      await deviceService.initialize();
      
      // Collect device info
      const deviceInfo = await deviceService.collectDeviceInfo();
      
      // Detect environment for risk control
      const environmentInfo = await deviceService.detectDeviceEnvironment();
      
      // Report to server for risk analysis
      await deviceService.reportDeviceInfo(userId);
      
      // Set up monitoring for risk control
      this.stopMonitoring = monitorDeviceChangesExample();
      
      console.log('Device service integrated with risk control');
      
    } catch (error) {
      console.error('Failed to integrate device service with risk control:', error);
      throw error;
    }
  }
  
  async checkRiskFactors(): Promise<{
    riskLevel: 'low' | 'medium' | 'high';
    factors: string[];
  }> {
    try {
      const environmentInfo = await deviceService.detectDeviceEnvironment();
      const deviceInfo = deviceService.getCachedDeviceInfo();
      
      const riskFactors: string[] = [];
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      
      if (environmentInfo.isRooted) {
        riskFactors.push('Device is rooted/jailbroken');
        riskLevel = 'high';
      }
      
      if (environmentInfo.isEmulator) {
        riskFactors.push('Running on emulator');
        riskLevel = 'high';
      }
      
      if (environmentInfo.detectionDetails.suspiciousIndicators.length > 0) {
        riskFactors.push('Suspicious device indicators detected');
        if (riskLevel === 'low') riskLevel = 'medium';
      }
      
      if (deviceInfo && !deviceInfo.networkInfo?.isInternetReachable) {
        riskFactors.push('No internet connection');
        if (riskLevel === 'low') riskLevel = 'medium';
      }
      
      return { riskLevel, factors: riskFactors };
      
    } catch (error) {
      console.error('Risk factor check failed:', error);
      return { riskLevel: 'medium', factors: ['Risk check failed'] };
    }
  }
  
  cleanup(): void {
    if (this.stopMonitoring) {
      this.stopMonitoring();
      this.stopMonitoring = undefined;
    }
  }
}

// Export all examples for easy testing
export const DeviceServiceExamples = {
  initializeDeviceServiceExample,
  collectDeviceInfoExample,
  reportDeviceInfoExample,
  detectDeviceEnvironmentExample,
  monitorDeviceChangesExample,
  checkDeviceChangesExample,
  cacheManagementExample,
  appStartupDeviceFlowExample,
  errorHandlingExample,
  DeviceServiceIntegrationExample,
};