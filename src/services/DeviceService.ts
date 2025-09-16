import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import apiClient from './apiClient';
import { DeviceInfo as DeviceInfoType, DeviceReportResponse, ApiResponse } from '../types';
import { ENV_CONFIG } from '../config/env';

// Storage keys for device info caching
const STORAGE_KEYS = {
  DEVICE_INFO: '@dingdingcat/device_info',
  LAST_REPORT_TIME: '@dingdingcat/last_device_report',
  DEVICE_FINGERPRINT: '@dingdingcat/device_fingerprint',
} as const;

// Device info cache duration (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Device change detection threshold
const REPORT_INTERVAL = 60 * 60 * 1000; // 1 hour minimum between reports

export interface DeviceEnvironmentInfo {
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

export interface CollectedDeviceInfo extends DeviceInfoType {
  collectionTime: number;
  networkInfo?: {
    type: string;
    isConnected: boolean;
    isInternetReachable: boolean;
  };
}

class DeviceService {
  private cachedDeviceInfo: CollectedDeviceInfo | null = null;
  private isCollecting = false;
  private changeListeners: Array<(deviceInfo: CollectedDeviceInfo) => void> = [];

  /**
   * Initialize device service and start monitoring
   */
  public async initialize(): Promise<void> {
    try {
      // Load cached device info
      await this.loadCachedDeviceInfo();
      
      // Start network state monitoring
      this.startNetworkMonitoring();
      
      // Collect initial device info if not cached or expired
      if (!this.cachedDeviceInfo || this.isDeviceInfoExpired()) {
        await this.collectDeviceInfo();
      }
      
      console.log('DeviceService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize DeviceService:', error);
      throw error;
    }
  }

  /**
   * Collect comprehensive device information
   */
  public async collectDeviceInfo(): Promise<CollectedDeviceInfo> {
    if (this.isCollecting) {
      // Return cached info if collection is in progress
      return this.cachedDeviceInfo || this.createEmptyDeviceInfo();
    }

    this.isCollecting = true;

    try {
      console.log('Collecting device information...');

      // Collect basic device info
      const basicInfo = await this.collectBasicDeviceInfo();
      
      // Collect environment info (root/emulator detection)
      const environmentInfo = await this.detectDeviceEnvironment();
      
      // Collect network info
      const networkInfo = await this.collectNetworkInfo();
      
      // Collect system info
      const systemInfo = await this.collectSystemInfo();
      
      // Collect app info
      const appInfo = await this.collectAppInfo();

      // Combine all information
      const deviceInfo: CollectedDeviceInfo = {
        userId: 0, // Will be set when reporting
        appKey: ENV_CONFIG.APP_KEY,
        deviceModel: basicInfo.model,
        deviceBrand: basicInfo.brand,
        osName: basicInfo.systemName,
        osVersion: basicInfo.systemVersion,
        deviceId: basicInfo.deviceId,
        isRooted: environmentInfo.isRooted,
        isEmulator: environmentInfo.isEmulator,
        screenResolution: systemInfo.screenResolution,
        screenDensity: systemInfo.screenDensity,
        networkType: networkInfo.type,
        carrier: systemInfo.carrier,
        totalMemory: systemInfo.totalMemory,
        availableMemory: systemInfo.availableMemory,
        totalStorage: systemInfo.totalStorage,
        availableStorage: systemInfo.availableStorage,
        cpuArch: systemInfo.cpuArch,
        cpuCores: systemInfo.cpuCores,
        appVersion: appInfo.version,
        appVersionCode: appInfo.buildNumber,
        deviceLanguage: systemInfo.deviceLanguage,
        deviceTimezone: systemInfo.deviceTimezone,
        batteryLevel: systemInfo.batteryLevel,
        isCharging: systemInfo.isCharging,
        ipAddress: networkInfo.ipAddress,
        userAgent: systemInfo.userAgent,
        extraInfo: JSON.stringify({
          deviceFingerprint: environmentInfo.deviceFingerprint,
          detectionDetails: environmentInfo.detectionDetails,
          collectionMethod: 'react-native-device-info',
          platform: Platform.OS,
        }),
        collectionTime: Date.now(),
        networkInfo: {
          type: networkInfo.type,
          isConnected: networkInfo.isConnected,
          isInternetReachable: networkInfo.isInternetReachable,
        },
      };

      // Cache the collected info
      this.cachedDeviceInfo = deviceInfo;
      await this.cacheDeviceInfo(deviceInfo);

      // Notify listeners
      this.notifyChangeListeners(deviceInfo);

      console.log('Device information collected successfully');
      return deviceInfo;

    } catch (error) {
      console.error('Failed to collect device information:', error);
      
      // Return cached info or empty info on error
      return this.cachedDeviceInfo || this.createEmptyDeviceInfo();
    } finally {
      this.isCollecting = false;
    }
  }

  /**
   * Collect basic device information
   */
  private async collectBasicDeviceInfo(): Promise<{
    model: string;
    brand: string;
    systemName: string;
    systemVersion: string;
    deviceId: string;
  }> {
    try {
      const [model, brand, systemName, systemVersion, deviceId] = await Promise.all([
        DeviceInfo.getModel(),
        DeviceInfo.getBrand(),
        DeviceInfo.getSystemName(),
        DeviceInfo.getSystemVersion(),
        DeviceInfo.getDeviceId(),
      ]);

      return {
        model: model || 'Unknown',
        brand: brand || 'Unknown',
        systemName: systemName || Platform.OS,
        systemVersion: systemVersion || 'Unknown',
        deviceId: deviceId || await this.generateFallbackDeviceId(),
      };
    } catch (error) {
      console.error('Failed to collect basic device info:', error);
      return {
        model: 'Unknown',
        brand: 'Unknown',
        systemName: Platform.OS,
        systemVersion: 'Unknown',
        deviceId: await this.generateFallbackDeviceId(),
      };
    }
  }

  /**
   * Detect device environment (root/emulator)
   */
  public async detectDeviceEnvironment(): Promise<DeviceEnvironmentInfo> {
    try {
      const detectionDetails = {
        rootDetectionMethods: [] as string[],
        emulatorDetectionMethods: [] as string[],
        deviceInfo: {},
        suspiciousIndicators: [] as string[],
      };

      // Collect device info for analysis
      const [brand, model, systemName, isEmulator] = await Promise.all([
        DeviceInfo.getBrand().catch((_error) => {
          detectionDetails.suspiciousIndicators.push('detection-error');
          return 'Unknown';
        }),
        DeviceInfo.getModel().catch(() => 'Unknown'),
        DeviceInfo.getSystemName().catch(() => Platform.OS),
        DeviceInfo.isEmulator().catch(() => false),
      ]);

      detectionDetails.deviceInfo = { brand, model, systemName };

      // Emulator detection
      let isEmulatorDetected = isEmulator;
      if (isEmulator) {
        detectionDetails.emulatorDetectionMethods.push('device-info-api');
      }

      // Additional emulator detection by suspicious identifiers
      const suspiciousBrands = ['generic', 'google', 'android', 'genymotion'];
      const suspiciousModels = ['emulator', 'simulator', 'sdk', 'virtual'];
      
      if (suspiciousBrands.some(suspicious => brand.toLowerCase().includes(suspicious))) {
        detectionDetails.suspiciousIndicators.push(`suspicious-brand-${brand}`);
        detectionDetails.emulatorDetectionMethods.push('brand-analysis');
        isEmulatorDetected = true;
      }

      if (suspiciousModels.some(suspicious => model.toLowerCase().includes(suspicious))) {
        detectionDetails.suspiciousIndicators.push(`suspicious-model-${model}`);
        detectionDetails.emulatorDetectionMethods.push('model-analysis');
        isEmulatorDetected = true;
      }

      // Root detection
      let isRootDetected = false;
      
      // Method 1: Check for test-keys (Android)
      if (Platform.OS === 'android') {
        try {
          // Try to access getTags method if available
          const tags = await (DeviceInfo as any).getTags?.();
          if (tags && tags.includes('test-keys')) {
            detectionDetails.rootDetectionMethods.push('test-keys-detection');
            detectionDetails.suspiciousIndicators.push('test-keys-found');
            isRootDetected = true;
          }
        } catch (error) {
          // getTags method not available or failed
        }
      }

      // Method 2: Check for jailbreak indicators (iOS)
      if (Platform.OS === 'ios') {
        try {
          // Check for common jailbreak paths and apps
          // const jailbreakIndicators = [
          //   '/Applications/Cydia.app',
          //   '/usr/sbin/sshd',
          //   '/bin/bash',
          //   '/etc/apt',
          // ];
          
          // This is a simplified check - in a real app you might use native modules
          // to perform more thorough jailbreak detection
          detectionDetails.rootDetectionMethods.push('ios-jailbreak-check');
        } catch (error) {
          // Jailbreak detection failed
        }
      }

      // Generate device fingerprint
      const deviceFingerprint = await this.generateDeviceFingerprint({
        brand,
        model,
        systemName,
        isRooted: isRootDetected,
        isEmulator: isEmulatorDetected,
      });

      return {
        isRooted: isRootDetected,
        isEmulator: isEmulatorDetected,
        deviceFingerprint,
        detectionDetails,
      };

    } catch (error) {
      console.error('Device environment detection failed:', error);
      
      // Return safe defaults on error
      return {
        isRooted: false,
        isEmulator: false,
        deviceFingerprint: await this.generateDeviceFingerprint({}),
        detectionDetails: {
          rootDetectionMethods: [],
          emulatorDetectionMethods: [],
          deviceInfo: {},
          suspiciousIndicators: ['detection-error'],
        },
      };
    }
  }

  /**
   * Collect network information
   */
  private async collectNetworkInfo(): Promise<{
    type: string;
    isConnected: boolean;
    isInternetReachable: boolean;
    ipAddress?: string;
  }> {
    try {
      const netInfo = await NetInfo.fetch();
      
      return {
        type: netInfo.type || 'unknown',
        isConnected: netInfo.isConnected || false,
        isInternetReachable: netInfo.isInternetReachable || false,
        ipAddress: (netInfo.details as any)?.ipAddress || undefined,
      };
    } catch (error) {
      console.error('Failed to collect network info:', error);
      return {
        type: 'unknown',
        isConnected: false,
        isInternetReachable: false,
      };
    }
  }

  /**
   * Collect system information
   */
  private async collectSystemInfo(): Promise<{
    screenResolution?: string;
    screenDensity?: number;
    carrier?: string;
    totalMemory?: number;
    availableMemory?: number;
    totalStorage?: number;
    availableStorage?: number;
    cpuArch?: string;
    cpuCores?: number;
    deviceLanguage?: string;
    deviceTimezone?: string;
    batteryLevel?: number;
    isCharging?: boolean;
    userAgent?: string;
  }> {
    try {
      const [
        totalMemory,
        usedMemory,
        totalStorage,
        freeStorage,
        carrier,
        batteryLevel,
        isCharging,
      ] = await Promise.all([
        DeviceInfo.getTotalMemory().catch(() => undefined),
        DeviceInfo.getUsedMemory().catch(() => undefined),
        DeviceInfo.getTotalDiskCapacity().catch(() => undefined),
        DeviceInfo.getFreeDiskStorage().catch(() => undefined),
        DeviceInfo.getCarrier().catch(() => undefined),
        DeviceInfo.getBatteryLevel().catch(() => undefined),
        DeviceInfo.isBatteryCharging().catch(() => undefined),
      ]);

      // Convert bytes to MB
      const totalMemoryMB = totalMemory ? Math.round(totalMemory / (1024 * 1024)) : undefined;
      const availableMemoryMB = usedMemory && totalMemory ? 
        Math.round((totalMemory - usedMemory) / (1024 * 1024)) : undefined;
      const totalStorageMB = totalStorage ? Math.round(totalStorage / (1024 * 1024)) : undefined;
      const availableStorageMB = freeStorage ? Math.round(freeStorage / (1024 * 1024)) : undefined;

      return {
        totalMemory: totalMemoryMB,
        availableMemory: availableMemoryMB,
        totalStorage: totalStorageMB,
        availableStorage: availableStorageMB,
        carrier: carrier || undefined,
        batteryLevel: batteryLevel ? Math.round(batteryLevel * 100) : undefined,
        isCharging: isCharging || false,
        deviceLanguage: (DeviceInfo as any).getDeviceLocale ? 
          await (DeviceInfo as any).getDeviceLocale().catch(() => undefined) : undefined,
        deviceTimezone: (DeviceInfo as any).getTimezone ? 
          await (DeviceInfo as any).getTimezone().catch(() => undefined) : undefined,
        userAgent: (DeviceInfo as any).getUserAgent ? 
          await (DeviceInfo as any).getUserAgent().catch(() => undefined) : undefined,
      };
    } catch (error) {
      console.error('Failed to collect system info:', error);
      return {};
    }
  }

  /**
   * Collect app information
   */
  private async collectAppInfo(): Promise<{
    version: string;
    buildNumber: number;
  }> {
    try {
      const [version, buildNumber] = await Promise.all([
        DeviceInfo.getVersion(),
        DeviceInfo.getBuildNumber(),
      ]);

      return {
        version: version || '1.0.0',
        buildNumber: parseInt(buildNumber) || 1,
      };
    } catch (error) {
      console.error('Failed to collect app info:', error);
      return {
        version: '1.0.0',
        buildNumber: 1,
      };
    }
  }

  /**
   * Report device information to server
   */
  public async reportDeviceInfo(userId: number): Promise<DeviceReportResponse> {
    try {
      // Check if we should skip reporting due to rate limiting
      if (await this.shouldSkipReporting()) {
        console.log('Skipping device info reporting due to rate limiting');
        throw new Error('Rate limited - too frequent reporting');
      }

      // Get current device info
      let deviceInfo = this.cachedDeviceInfo;
      if (!deviceInfo || this.isDeviceInfoExpired()) {
        deviceInfo = await this.collectDeviceInfo();
      }

      // Prepare request data
      const requestData: DeviceInfoType = {
        ...deviceInfo,
        userId,
        appKey: ENV_CONFIG.APP_KEY,
      };

      // Remove collection-specific fields
      delete (requestData as any).collectionTime;
      delete (requestData as any).networkInfo;

      console.log('Reporting device info to server...');

      // Make API request
      const response: ApiResponse<DeviceReportResponse> = await apiClient.post(
        '/user/device',
        requestData
      );

      // Update last report time
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_REPORT_TIME,
        Date.now().toString()
      );

      console.log('Device info reported successfully');
      return response.data;

    } catch (error) {
      console.error('Failed to report device info:', error);
      throw error;
    }
  }

  /**
   * Check if device information has changed significantly
   */
  public async hasDeviceInfoChanged(): Promise<boolean> {
    try {
      const cachedInfo = this.cachedDeviceInfo;

      if (!cachedInfo) {
        return true;
      }

      // Collect fresh info without updating cache
      const currentInfo = await this.collectFreshDeviceInfo();

      // Check for significant changes
      const significantFields = [
        'deviceModel', 'deviceBrand', 'osVersion', 'isRooted', 'isEmulator',
        'appVersion', 'appVersionCode', 'networkType', 'carrier'
      ];

      for (const field of significantFields) {
        if (currentInfo[field as keyof CollectedDeviceInfo] !== 
            cachedInfo[field as keyof CollectedDeviceInfo]) {
          console.log(`Device info changed: ${field}`);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Failed to check device info changes:', error);
      return false;
    }
  }

  /**
   * Collect device info without updating cache (for comparison purposes)
   */
  private async collectFreshDeviceInfo(): Promise<CollectedDeviceInfo> {
    // Collect basic device info
    const basicInfo = await this.collectBasicDeviceInfo();
    
    // Collect environment info (root/emulator detection)
    const environmentInfo = await this.detectDeviceEnvironment();
    
    // Collect network info
    const networkInfo = await this.collectNetworkInfo();
    
    // Collect system info
    const systemInfo = await this.collectSystemInfo();
    
    // Collect app info
    const appInfo = await this.collectAppInfo();

    // Combine all information
    const deviceInfo: CollectedDeviceInfo = {
      userId: 0, // Will be set when reporting
      appKey: ENV_CONFIG.APP_KEY,
      deviceModel: basicInfo.model,
      deviceBrand: basicInfo.brand,
      osName: basicInfo.systemName,
      osVersion: basicInfo.systemVersion,
      deviceId: basicInfo.deviceId,
      isRooted: environmentInfo.isRooted,
      isEmulator: environmentInfo.isEmulator,
      screenResolution: systemInfo.screenResolution,
      screenDensity: systemInfo.screenDensity,
      networkType: networkInfo.type,
      carrier: systemInfo.carrier,
      totalMemory: systemInfo.totalMemory,
      availableMemory: systemInfo.availableMemory,
      totalStorage: systemInfo.totalStorage,
      availableStorage: systemInfo.availableStorage,
      cpuArch: systemInfo.cpuArch,
      cpuCores: systemInfo.cpuCores,
      appVersion: appInfo.version,
      appVersionCode: appInfo.buildNumber,
      deviceLanguage: systemInfo.deviceLanguage,
      deviceTimezone: systemInfo.deviceTimezone,
      batteryLevel: systemInfo.batteryLevel,
      isCharging: systemInfo.isCharging,
      ipAddress: networkInfo.ipAddress,
      userAgent: systemInfo.userAgent,
      extraInfo: JSON.stringify({
        deviceFingerprint: environmentInfo.deviceFingerprint,
        detectionDetails: environmentInfo.detectionDetails,
        collectionMethod: 'react-native-device-info',
        platform: Platform.OS,
      }),
      collectionTime: Date.now(),
      networkInfo: {
        type: networkInfo.type,
        isConnected: networkInfo.isConnected,
        isInternetReachable: networkInfo.isInternetReachable,
      },
    };

    return deviceInfo;
  }

  /**
   * Add listener for device info changes
   */
  public addChangeListener(listener: (deviceInfo: CollectedDeviceInfo) => void): void {
    this.changeListeners.push(listener);
  }

  /**
   * Remove change listener
   */
  public removeChangeListener(listener: (deviceInfo: CollectedDeviceInfo) => void): void {
    const index = this.changeListeners.indexOf(listener);
    if (index > -1) {
      this.changeListeners.splice(index, 1);
    }
  }

  /**
   * Get cached device information
   */
  public getCachedDeviceInfo(): CollectedDeviceInfo | null {
    return this.cachedDeviceInfo;
  }

  /**
   * Clear cached device information
   */
  public async clearCache(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.DEVICE_INFO),
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_REPORT_TIME),
        AsyncStorage.removeItem(STORAGE_KEYS.DEVICE_FINGERPRINT),
      ]);
      
      this.cachedDeviceInfo = null;
      console.log('Device info cache cleared');
    } catch (error) {
      console.error('Failed to clear device info cache:', error);
    }
  }

  /**
   * Force refresh device information
   */
  public async refreshDeviceInfo(): Promise<CollectedDeviceInfo> {
    await this.clearCache();
    return this.collectDeviceInfo();
  }

  // Private helper methods

  private async loadCachedDeviceInfo(): Promise<void> {
    try {
      const cachedData = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_INFO);
      if (cachedData) {
        this.cachedDeviceInfo = JSON.parse(cachedData);
      }
    } catch (error) {
      console.error('Failed to load cached device info:', error);
    }
  }

  private async cacheDeviceInfo(deviceInfo: CollectedDeviceInfo): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.DEVICE_INFO,
        JSON.stringify(deviceInfo)
      );
    } catch (error) {
      console.error('Failed to cache device info:', error);
    }
  }

  private isDeviceInfoExpired(): boolean {
    if (!this.cachedDeviceInfo) {
      return true;
    }

    const now = Date.now();
    const cacheTime = this.cachedDeviceInfo.collectionTime || 0;
    return (now - cacheTime) > CACHE_DURATION;
  }

  private async shouldSkipReporting(): Promise<boolean> {
    try {
      const lastReportTime = await AsyncStorage.getItem(STORAGE_KEYS.LAST_REPORT_TIME);
      if (!lastReportTime) {
        return false;
      }

      const now = Date.now();
      const lastReport = parseInt(lastReportTime);
      return (now - lastReport) < REPORT_INTERVAL;
    } catch (error) {
      return false;
    }
  }

  private async generateFallbackDeviceId(): Promise<string> {
    try {
      // Try to get unique ID first
      const uniqueId = await DeviceInfo.getUniqueId();
      return uniqueId;
    } catch (error) {
      // Generate a fallback ID based on available info
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      return `fallback_${Platform.OS}_${timestamp}_${random}`;
    }
  }

  private async generateDeviceFingerprint(deviceData: any): Promise<string> {
    try {
      // Check if we have a cached fingerprint
      const cachedFingerprint = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_FINGERPRINT);
      if (cachedFingerprint) {
        return cachedFingerprint;
      }

      // Generate new fingerprint
      const fingerprintData = {
        platform: Platform.OS,
        brand: deviceData.brand || 'unknown',
        model: deviceData.model || 'unknown',
        systemName: deviceData.systemName || Platform.OS,
        timestamp: Date.now(),
        random: Math.random().toString(36).substr(2, 9),
      };

      // Create a simple hash instead of using Buffer
      const dataString = JSON.stringify(fingerprintData);
      let hash = 0;
      for (let i = 0; i < dataString.length; i++) {
        const char = dataString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      const fingerprint = `fp_${Platform.OS}_${Math.abs(hash).toString(36).substr(0, 16)}`;

      // Cache the fingerprint
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_FINGERPRINT, fingerprint);
      
      return fingerprint;
    } catch (error) {
      console.error('Failed to generate device fingerprint:', error);
      return `fp_${Platform.OS}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  private createEmptyDeviceInfo(): CollectedDeviceInfo {
    return {
      userId: 0,
      appKey: ENV_CONFIG.APP_KEY,
      deviceModel: 'Unknown',
      deviceBrand: 'Unknown',
      osName: Platform.OS,
      osVersion: 'Unknown',
      deviceId: 'unknown',
      isRooted: false,
      isEmulator: false,
      collectionTime: Date.now(),
    };
  }

  private startNetworkMonitoring(): void {
    // Monitor network changes
    NetInfo.addEventListener(state => {
      if (this.cachedDeviceInfo && this.cachedDeviceInfo.networkInfo) {
        const hasNetworkChanged = 
          this.cachedDeviceInfo.networkInfo.type !== state.type ||
          this.cachedDeviceInfo.networkInfo.isConnected !== state.isConnected;

        if (hasNetworkChanged) {
          console.log('Network state changed, updating device info...');
          // Update network info in cached data
          this.cachedDeviceInfo.networkInfo = {
            type: state.type || 'unknown',
            isConnected: state.isConnected || false,
            isInternetReachable: state.isInternetReachable || false,
          };
          
          // Notify listeners
          this.notifyChangeListeners(this.cachedDeviceInfo);
        }
      }
    });
  }

  private notifyChangeListeners(deviceInfo: CollectedDeviceInfo): void {
    this.changeListeners.forEach(listener => {
      try {
        listener(deviceInfo);
      } catch (error) {
        console.error('Error in device info change listener:', error);
      }
    });
  }
}

// Create singleton instance
const deviceService = new DeviceService();

export default deviceService;
export { DeviceService };