import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from './AuthService';
import configService from './ConfigService';
import deviceService from './DeviceService';
import riskControlService from './RiskControlService';
import syncService from './SyncService';
import mockService from './MockService';
import PangleAdService from './PangleAdService';
import AdConfig from '../config/adConfig.js';
import { ENV_CONFIG } from '../config/env';
import mockModeController from '../utils/mockModeController';

// Storage keys for initialization tracking
const INIT_STORAGE_KEYS = {
  FIRST_LAUNCH: '@dingdingcat/first_launch',
  LAST_INIT_TIME: '@dingdingcat/last_init_time',
  INIT_VERSION: '@dingdingcat/init_version',
} as const;

// Initialization phases
export enum InitPhase {
  STARTING = 'STARTING',
  AUTH_CHECK = 'AUTH_CHECK',
  CONFIG_LOADING = 'CONFIG_LOADING',
  DEVICE_INFO = 'DEVICE_INFO',
  RISK_CONTROL = 'RISK_CONTROL',
  OFFLINE_SYNC = 'OFFLINE_SYNC',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// Initialization status
export interface InitializationStatus {
  phase: InitPhase;
  progress: number; // 0-100
  message: string;
  error?: string;
  details?: any;
}

// Initialization result
export interface InitializationResult {
  success: boolean;
  isFirstLaunch: boolean;
  isAuthenticated: boolean;
  hasConfigUpdates: boolean;
  deviceInfoReported: boolean;
  offlineDataSynced: boolean;
  error?: string;
  duration: number;
}

/**
 * InitializationService - Handles application startup and initialization flow
 * 
 * Responsibilities:
 * 1. Check and restore authentication state
 * 2. Load and update configurations
 * 3. Collect and report device information
 * 4. Initialize risk control
 * 5. Sync offline data
 */
class InitializationService {
  private listeners: Array<(status: InitializationStatus) => void> = [];
  private currentStatus: InitializationStatus = {
    phase: InitPhase.STARTING,
    progress: 0,
    message: '正在启动应用...',
  };

  /**
   * Initialize the application
   */
  public async initialize(): Promise<InitializationResult> {
    const startTime = Date.now();
    let result: InitializationResult = {
      success: false,
      isFirstLaunch: false,
      isAuthenticated: false,
      hasConfigUpdates: false,
      deviceInfoReported: false,
      offlineDataSynced: false,
      duration: 0,
    };

    try {
      console.log('Starting application initialization...');

      // Check if this is first launch
      result.isFirstLaunch = await this.checkFirstLaunch();

      // Initialize mock service if in development
      if (ENV_CONFIG.DEBUG_MODE) {
        await mockService.initialize();
        // Initialize mock mode controller
        await mockModeController.initialize();
      }

      // Phase 1: Authentication check
      await this.updateStatus(InitPhase.AUTH_CHECK, 10, '检查用户认证状态...');
      result.isAuthenticated = await this.initializeAuthentication();

      // Phase 2: Configuration loading
      await this.updateStatus(InitPhase.CONFIG_LOADING, 30, '加载应用配置...');
      result.hasConfigUpdates = await this.initializeConfigurations();

      // Phase 2.5: Initialize Pangle SDK
      await this.updateStatus(InitPhase.CONFIG_LOADING, 40, '初始化广告SDK...');
      await this.initializePangleSDK();

      // Phase 3: Device information collection
      await this.updateStatus(InitPhase.DEVICE_INFO, 50, '收集设备信息...');
      result.deviceInfoReported = await this.initializeDeviceInfo(result.isAuthenticated);

      // Phase 4: Risk control initialization
      await this.updateStatus(InitPhase.RISK_CONTROL, 70, '初始化风控系统...');
      await this.initializeRiskControl();

      // Phase 5: Offline data synchronization
      await this.updateStatus(InitPhase.OFFLINE_SYNC, 90, '同步离线数据...');
      result.offlineDataSynced = await this.initializeOfflineSync();

      // Completed
      await this.updateStatus(InitPhase.COMPLETED, 100, '初始化完成');
      result.success = true;

      // Update initialization tracking
      await this.updateInitializationTracking();

      const duration = Date.now() - startTime;
      result.duration = duration;

      console.log('Application initialization completed successfully:', {
        duration: `${duration}ms`,
        result,
      });

      return result;

    } catch (error: any) {
      console.error('Application initialization failed:', error);

      await this.updateStatus(
        InitPhase.FAILED,
        this.currentStatus.progress,
        '初始化失败',
        error.message || '未知错误'
      );

      result.success = false;
      result.error = error.message || 'Initialization failed';
      result.duration = Date.now() - startTime;

      return result;
    }
  }

  /**
   * Add status listener
   */
  public addStatusListener(listener: (status: InitializationStatus) => void): void {
    this.listeners.push(listener);
    // Immediately notify with current status
    listener(this.currentStatus);
  }

  /**
   * Remove status listener
   */
  public removeStatusListener(listener: (status: InitializationStatus) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Get current initialization status
   */
  public getCurrentStatus(): InitializationStatus {
    return { ...this.currentStatus };
  }

  // Private methods

  /**
   * Check if this is the first launch
   */
  private async checkFirstLaunch(): Promise<boolean> {
    try {
      const firstLaunch = await AsyncStorage.getItem(INIT_STORAGE_KEYS.FIRST_LAUNCH);
      const isFirstLaunch = firstLaunch === null;

      if (isFirstLaunch) {
        await AsyncStorage.setItem(INIT_STORAGE_KEYS.FIRST_LAUNCH, 'false');
        console.log('First launch detected');
      }

      return isFirstLaunch;
    } catch (error) {
      console.error('Error checking first launch:', error);
      return false;
    }
  }

  /**
   * Initialize authentication
   */
  private async initializeAuthentication(): Promise<boolean> {
    try {
      console.log('Initializing authentication...');
      
      // Initialize auth service and check authentication state
      const isAuthenticated = await authService.initializeAuth();
      
      if (isAuthenticated) {
        console.log('User is authenticated');
      } else {
        console.log('User is not authenticated');
      }

      return isAuthenticated;
    } catch (error) {
      console.error('Authentication initialization failed:', error);
      return false;
    }
  }

  /**
   * Initialize configurations
   */
  private async initializeConfigurations(): Promise<boolean> {
    try {
      console.log('Initializing configurations...');

      // Initialize config service
      await configService.initialize();

      // Load all configurations
      const configResults = await Promise.allSettled([
        configService.getAppConfig(),
        configService.getAdConfig(),
        configService.getRiskConfig(),
        configService.getChannelConfig(),
      ]);

      // Check for configuration updates
      const updateResult = await configService.checkConfigUpdates();

      console.log('Configuration initialization completed:', {
        appConfig: configResults[0].status === 'fulfilled' ? 'loaded' : 'failed',
        adConfig: configResults[1].status === 'fulfilled' ? 'loaded' : 'failed',
        riskConfig: configResults[2].status === 'fulfilled' ? 'loaded' : 'failed',
        channelConfig: configResults[3].status === 'fulfilled' ? 'loaded' : 'failed',
        hasUpdates: updateResult.hasUpdates,
        updatedConfigs: updateResult.updatedConfigs,
      });

      return updateResult.hasUpdates;
    } catch (error) {
      console.error('Configuration initialization failed:', error);
      // Don't fail initialization if config loading fails
      return false;
    }
  }

  /**
   * Initialize device information
   */
  private async initializeDeviceInfo(isAuthenticated: boolean): Promise<boolean> {
    try {
      console.log('Initializing device information...');

      // Initialize device service
      await deviceService.initialize();

      // Collect device information
      const deviceInfo = await deviceService.collectDeviceInfo();

      // Report device info if user is authenticated
      let deviceInfoReported = false;
      if (isAuthenticated && deviceInfo.userId) {
        try {
          await deviceService.reportDeviceInfo(deviceInfo.userId);
          deviceInfoReported = true;
          console.log('Device information reported successfully');
        } catch (error) {
          console.warn('Failed to report device info, will retry later:', error);
        }
      } else {
        console.log('Skipping device info reporting - user not authenticated');
      }

      return deviceInfoReported;
    } catch (error) {
      console.error('Device info initialization failed:', error);
      // Don't fail initialization if device info fails
      return false;
    }
  }

  /**
   * Initialize risk control
   */
  private async initializeRiskControl(): Promise<void> {
    try {
      console.log('Initializing risk control...');

      // Initialize risk control service
      await riskControlService.initialize();

      // Get risk configuration
      await riskControlService.getRiskConfig();

      // Detect device environment
      await riskControlService.detectDeviceEnvironment();

      console.log('Risk control initialization completed');
    } catch (error) {
      console.error('Risk control initialization failed:', error);
      // Don't fail initialization if risk control fails
    }
  }

  /**
   * Initialize offline data synchronization
   */
  private async initializeOfflineSync(): Promise<boolean> {
    try {
      console.log('Initializing offline data sync...');

      // Initialize sync service
      await syncService.initialize();

      // Check if there's offline data to sync
      const queueSize = await syncService.getQueueSize();
      
      if (queueSize > 0) {
        console.log(`Found ${queueSize} items in offline queue, starting sync...`);
        
        // Attempt to sync offline data
        await syncService.syncOfflineData();
        
        // Check if sync was successful
        const newQueueSize = await syncService.getQueueSize();
        const syncedCount = queueSize - newQueueSize;
        
        console.log(`Offline sync completed: ${syncedCount} items synced, ${newQueueSize} remaining`);
        return syncedCount > 0;
      } else {
        console.log('No offline data to sync');
        return false;
      }
    } catch (error) {
      console.error('Offline sync initialization failed:', error);
      // Don't fail initialization if sync fails
      return false;
    }
  }

  /**
   * Initialize Pangle SDK
   */
  private async initializePangleSDK(): Promise<void> {
    try {
      console.log('Initializing Pangle SDK...');
      
      // Get app ID from config
      const appId = AdConfig.appId;
      console.log('Using Pangle App ID:', appId);
      
      // Initialize and start SDK
      await PangleAdService.initializeAndStartSDK(appId);
      
      // Verify SDK is ready
      const isInitialized = await PangleAdService.isSDKInitialized();
      const isStarted = await PangleAdService.isSDKStarted();
      
      console.log('Pangle SDK initialization status:', {
        initialized: isInitialized,
        started: isStarted,
      });
      
      if (!isInitialized || !isStarted) {
        throw new Error('Pangle SDK failed to initialize properly');
      }
      
      console.log('Pangle SDK initialized successfully');
      
    } catch (error) {
      console.error('Pangle SDK initialization failed:', error);
      // Don't fail the entire initialization if SDK fails
      // The app can still work without ads
    }
  }

  /**
   * Update initialization tracking
   */
  private async updateInitializationTracking(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(INIT_STORAGE_KEYS.LAST_INIT_TIME, Date.now().toString()),
        AsyncStorage.setItem(INIT_STORAGE_KEYS.INIT_VERSION, '1.0.0'),
      ]);
    } catch (error) {
      console.error('Failed to update initialization tracking:', error);
    }
  }

  /**
   * Update initialization status
   */
  private async updateStatus(
    phase: InitPhase,
    progress: number,
    message: string,
    error?: string,
    details?: any
  ): Promise<void> {
    this.currentStatus = {
      phase,
      progress,
      message,
      ...(error && { error }),
      ...(details && { details }),
    };

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(this.currentStatus);
      } catch (error) {
        console.error('Error in initialization status listener:', error);
      }
    });

    // Add small delay to make progress visible
    await new Promise<void>(resolve => setTimeout(resolve, 100));
  }

  /**
   * Get initialization history
   */
  public async getInitializationHistory(): Promise<{
    isFirstLaunch: boolean;
    lastInitTime: number | null;
    initVersion: string | null;
  }> {
    try {
      const [firstLaunch, lastInitTime, initVersion] = await Promise.all([
        AsyncStorage.getItem(INIT_STORAGE_KEYS.FIRST_LAUNCH),
        AsyncStorage.getItem(INIT_STORAGE_KEYS.LAST_INIT_TIME),
        AsyncStorage.getItem(INIT_STORAGE_KEYS.INIT_VERSION),
      ]);

      return {
        isFirstLaunch: firstLaunch === null,
        lastInitTime: lastInitTime ? parseInt(lastInitTime) : null,
        initVersion,
      };
    } catch (error) {
      console.error('Error getting initialization history:', error);
      return {
        isFirstLaunch: true,
        lastInitTime: null,
        initVersion: null,
      };
    }
  }

  /**
   * Clear initialization data (for testing/debugging)
   */
  public async clearInitializationData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(INIT_STORAGE_KEYS.FIRST_LAUNCH),
        AsyncStorage.removeItem(INIT_STORAGE_KEYS.LAST_INIT_TIME),
        AsyncStorage.removeItem(INIT_STORAGE_KEYS.INIT_VERSION),
      ]);
      
      console.log('Initialization data cleared');
    } catch (error) {
      console.error('Failed to clear initialization data:', error);
    }
  }
}

// Create singleton instance
const initializationService = new InitializationService();

export default initializationService;
export { InitializationService };