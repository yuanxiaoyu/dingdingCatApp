import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import apiClient from './apiClient';
import mockService from './MockService';
import { RiskConfig, ApiResponse } from '../types';
import { ENV_CONFIG } from '../config/env';

// Storage keys for risk control data
const RISK_STORAGE_KEYS = {
  RISK_CONFIG: '@dingdingcat/risk_config',
  LAST_AD_TIME: '@dingdingcat/last_ad_time',
  DAILY_AD_COUNT: '@dingdingcat/daily_ad_count',
  DAILY_REVENUE: '@dingdingcat/daily_revenue',
  DEVICE_FINGERPRINT: '@dingdingcat/device_fingerprint',
} as const;

// Risk violation types
export enum RiskViolationType {
  ROOT_DETECTED = 'ROOT_DETECTED',
  EMULATOR_DETECTED = 'EMULATOR_DETECTED',
  AD_INTERVAL_VIOLATION = 'AD_INTERVAL_VIOLATION',
  SINGLE_REVENUE_LIMIT = 'SINGLE_REVENUE_LIMIT',
  DAILY_REWARD_VIDEO_LIMIT = 'DAILY_REWARD_VIDEO_LIMIT',
  DAILY_AD_VIEW_LIMIT = 'DAILY_AD_VIEW_LIMIT',
  IP_ONLINE_LIMIT = 'IP_ONLINE_LIMIT',
  LOGIN_FREQUENCY_LIMIT = 'LOGIN_FREQUENCY_LIMIT',
}

// Risk violation error
export class RiskViolationError extends Error {
  public readonly violationType: RiskViolationType;
  public readonly details: any;

  constructor(violationType: RiskViolationType, message: string, details?: any) {
    super(message);
    this.name = 'RiskViolationError';
    this.violationType = violationType;
    this.details = details;
  }
}

// Device environment detection result
interface DeviceEnvironment {
  isRooted: boolean;
  isEmulator: boolean;
  deviceFingerprint: string;
  detectionDetails: {
    rootDetectionMethods: string[];
    emulatorDetectionMethods: string[];
    deviceInfo: any;
  };
}

// Daily statistics
interface DailyStats {
  date: string;
  adViewCount: number;
  rewardVideoCount: number;
  totalRevenue: number;
  lastResetTime: number;
}

class RiskControlService {
  private riskConfig: RiskConfig | null = null;
  private deviceEnvironment: DeviceEnvironment | null = null;
  private dailyStats: DailyStats | null = null;

  /**
   * Initialize risk control service
   */
  public async initialize(): Promise<void> {
    try {
      // In development mode, use simplified initialization
      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('RiskControlService: Using simplified initialization for development');
        
        // Set default risk config for development
        this.riskConfig = {
          appKey: ENV_CONFIG.APP_KEY,
          configVersion: '1.0.0-dev',
          serverTime: Date.now(),
          rootDetectionEnabled: false,
          emulatorDetectionEnabled: false,
          adIntervalCheckEnabled: true,
          adIntervalSeconds: 30,
          singleRevenueLimit: 100,
          dailyRewardVideoLimit: 50,
          dailyAdViewLimit: 200,
          sameIpUserLimit: 10,
          deviceFingerprintEnabled: false,
          sameIpLimitEnabled: false,
          ipLocationCheckEnabled: false,
          loginFrequencyCheckEnabled: false,
          maxLoginPerHour: 10,
        };
        
        // Set default device environment
        this.deviceEnvironment = {
          isRooted: false,
          isEmulator: false,
          deviceFingerprint: 'dev-fingerprint',
          detectionDetails: {
            rootDetectionMethods: [],
            emulatorDetectionMethods: [],
            deviceInfo: {},
          },
        };
        
        // Set default daily stats
        this.dailyStats = {
          adViewCount: 0,
          rewardVideoCount: 0,
          totalRevenue: 0,
          lastResetDate: new Date().toDateString(),
        };
        
        console.log('RiskControlService: Development initialization completed');
        return;
      }
      
      // Production initialization
      await this.loadCachedRiskConfig();
      await this.detectDeviceEnvironment();
      await this.loadDailyStats();
      
      console.log('RiskControlService initialized:', {
        hasRiskConfig: !!this.riskConfig,
        deviceEnvironment: this.deviceEnvironment,
        dailyStats: this.dailyStats,
      });
    } catch (error) {
      console.error('Failed to initialize RiskControlService:', error);
      
      // In case of error, provide fallback configuration
      this.riskConfig = {
        appKey: ENV_CONFIG.APP_KEY,
        configVersion: '1.0.0-fallback',
        serverTime: Date.now(),
        rootDetectionEnabled: false,
        emulatorDetectionEnabled: false,
        adIntervalCheckEnabled: false,
        adIntervalSeconds: 0,
        singleRevenueLimit: 1000,
        dailyRewardVideoLimit: 100,
        dailyAdViewLimit: 500,
        sameIpUserLimit: 50,
        deviceFingerprintEnabled: false,
        sameIpLimitEnabled: false,
        ipLocationCheckEnabled: false,
        loginFrequencyCheckEnabled: false,
        maxLoginPerHour: 50,
      };
      
      console.log('RiskControlService: Using fallback configuration');
    }
  }

  /**
   * Get risk configuration from server
   */
  public async getRiskConfig(appKey?: string): Promise<RiskConfig> {
    try {
      // 检查是否启用Mock模式
      const isMockMode = mockService.isMockModeEnabled();
      if (isMockMode) {
        if (ENV_CONFIG.DEBUG_MODE) {
          console.log('RiskControlService: 使用Mock风控配置');
        }
        const mockRiskConfig = await mockService.mockGetRiskConfig(appKey || ENV_CONFIG.APP_KEY);
        this.riskConfig = mockRiskConfig;
        return mockRiskConfig;
      }

      const response = await apiClient.get<RiskConfig>('/config/risk', {
        params: {
          appKey: appKey || ENV_CONFIG.APP_KEY,
        },
      });

      if (response.code === 200 && response.data) {
        this.riskConfig = response.data;
        
        // Cache the risk config
        await this.cacheRiskConfig(response.data);
        
        if (ENV_CONFIG.DEBUG_MODE) {
          console.log('Risk config fetched successfully:', response.data);
        }
        
        return response.data;
      }

      throw new Error(`Failed to get risk config: ${response.message}`);
    } catch (error) {
      console.error('Error getting risk config:', error);
      
      // Return cached config if available
      if (this.riskConfig) {
        console.warn('Using cached risk config due to network error');
        return this.riskConfig;
      }
      
      throw error;
    }
  }

  /**
   * Detect device environment (ROOT/Emulator detection)
   */
  public async detectDeviceEnvironment(): Promise<DeviceEnvironment> {
    try {
      const detectionResults = {
        isRooted: false,
        isEmulator: false,
        deviceFingerprint: '',
        detectionDetails: {
          rootDetectionMethods: [] as string[],
          emulatorDetectionMethods: [] as string[],
          deviceInfo: {},
        },
      };

      // Collect device information - safely handle methods that might not exist
      const deviceInfo: any = {};
      
      try {
        deviceInfo.brand = await DeviceInfo.getBrand();
        deviceInfo.model = await DeviceInfo.getModel();
        deviceInfo.systemName = await DeviceInfo.getSystemName();
        deviceInfo.systemVersion = await DeviceInfo.getSystemVersion();
        deviceInfo.deviceId = await DeviceInfo.getDeviceId();
        deviceInfo.uniqueId = await DeviceInfo.getUniqueId();
      } catch (error) {
        console.warn('Error getting basic device info:', error);
      }

      // Try to get additional device info if methods exist
      try {
        if (typeof (DeviceInfo as any).getBuildId === 'function') {
          deviceInfo.buildId = await (DeviceInfo as any).getBuildId();
        }
        if (typeof (DeviceInfo as any).getFingerprint === 'function') {
          deviceInfo.fingerprint = await (DeviceInfo as any).getFingerprint();
        }
        if (typeof (DeviceInfo as any).getHardware === 'function') {
          deviceInfo.hardware = await (DeviceInfo as any).getHardware();
        }
        if (typeof (DeviceInfo as any).getProduct === 'function') {
          deviceInfo.product = await (DeviceInfo as any).getProduct();
        }
        if (typeof (DeviceInfo as any).getTags === 'function') {
          deviceInfo.tags = await (DeviceInfo as any).getTags();
        }
        if (typeof (DeviceInfo as any).getType === 'function') {
          deviceInfo.type = await (DeviceInfo as any).getType();
        }
        if (typeof (DeviceInfo as any).getBaseOs === 'function') {
          deviceInfo.baseOs = await (DeviceInfo as any).getBaseOs();
        }
        if (typeof (DeviceInfo as any).getBootloader === 'function') {
          deviceInfo.bootloader = await (DeviceInfo as any).getBootloader();
        }
        if (typeof (DeviceInfo as any).getCodename === 'function') {
          deviceInfo.codename = await (DeviceInfo as any).getCodename();
        }
        if (typeof (DeviceInfo as any).getIncremental === 'function') {
          deviceInfo.incremental = await (DeviceInfo as any).getIncremental();
        }
        if (typeof (DeviceInfo as any).getSupported32BitAbis === 'function') {
          deviceInfo.supported32BitAbis = await (DeviceInfo as any).getSupported32BitAbis();
        }
        if (typeof (DeviceInfo as any).getSupported64BitAbis === 'function') {
          deviceInfo.supported64BitAbis = await (DeviceInfo as any).getSupported64BitAbis();
        }
        if (typeof (DeviceInfo as any).getSupportedAbis === 'function') {
          deviceInfo.supportedAbis = await (DeviceInfo as any).getSupportedAbis();
        }
      } catch (error) {
        console.warn('Error getting extended device info:', error);
      }

      detectionResults.detectionDetails.deviceInfo = deviceInfo;

      // ROOT Detection
      const rootDetectionResults = await this.performRootDetection(deviceInfo);
      detectionResults.isRooted = rootDetectionResults.isRooted;
      detectionResults.detectionDetails.rootDetectionMethods = rootDetectionResults.methods;

      // Emulator Detection
      const emulatorDetectionResults = await this.performEmulatorDetection(deviceInfo);
      detectionResults.isEmulator = emulatorDetectionResults.isEmulator;
      detectionResults.detectionDetails.emulatorDetectionMethods = emulatorDetectionResults.methods;

      // Generate device fingerprint
      detectionResults.deviceFingerprint = await this.generateDeviceFingerprint(deviceInfo);

      // Cache the results
      this.deviceEnvironment = detectionResults;
      await this.cacheDeviceFingerprint(detectionResults.deviceFingerprint);

      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('Device environment detection completed:', {
          isRooted: detectionResults.isRooted,
          isEmulator: detectionResults.isEmulator,
          fingerprint: detectionResults.deviceFingerprint,
        });
      }

      return detectionResults;
    } catch (error) {
      console.error('Error detecting device environment:', error);
      
      // Return cached results if available
      if (this.deviceEnvironment) {
        return this.deviceEnvironment;
      }
      
      // Return safe defaults
      return {
        isRooted: false,
        isEmulator: false,
        deviceFingerprint: 'unknown',
        detectionDetails: {
          rootDetectionMethods: [],
          emulatorDetectionMethods: [],
          deviceInfo: {},
        },
      };
    }
  }

  /**
   * Check ad interval time
   */
  public async checkAdInterval(adType?: string): Promise<boolean> {
    try {
      if (!this.riskConfig?.adIntervalCheckEnabled) {
        return true; // Skip check if disabled
      }

      const lastAdTime = await this.getLastAdTime(adType);
      const currentTime = Date.now();
      const intervalSeconds = this.riskConfig.adIntervalSeconds || 30;
      const requiredInterval = intervalSeconds * 1000; // Convert to milliseconds

      if (lastAdTime && (currentTime - lastAdTime) < requiredInterval) {
        const remainingTime = Math.ceil((requiredInterval - (currentTime - lastAdTime)) / 1000);
        throw new RiskViolationError(
          RiskViolationType.AD_INTERVAL_VIOLATION,
          `广告间隔时间不足，请等待 ${remainingTime} 秒后再试`,
          {
            lastAdTime,
            currentTime,
            requiredInterval: intervalSeconds,
            remainingTime,
            adType,
          }
        );
      }

      // Update last ad time
      await this.updateLastAdTime(adType, currentTime);
      return true;
    } catch (error) {
      if (error instanceof RiskViolationError) {
        throw error;
      }
      console.error('Error checking ad interval:', error);
      return true; // Allow on error to avoid blocking users
    }
  }

  /**
   * Validate single revenue limit
   */
  public validateRevenueLimit(amount: number): boolean {
    try {
      if (!this.riskConfig?.singleRevenueLimit) {
        return true; // Skip check if not configured
      }

      const limit = this.riskConfig.singleRevenueLimit;
      if (amount > limit) {
        throw new RiskViolationError(
          RiskViolationType.SINGLE_REVENUE_LIMIT,
          `单次收益金额超出限制，最大允许 ${limit} 元`,
          {
            amount,
            limit,
          }
        );
      }

      return true;
    } catch (error) {
      if (error instanceof RiskViolationError) {
        throw error;
      }
      console.error('Error validating revenue limit:', error);
      return true;
    }
  }

  /**
   * Check daily limits (ad view count, reward video count)
   */
  public async checkDailyLimits(userId: number, adType?: string): Promise<boolean> {
    try {
      await this.ensureDailyStatsReset();

      if (!this.dailyStats) {
        return true;
      }

      // Check daily ad view limit
      if (this.riskConfig?.dailyAdViewLimitEnabled) {
        const dailyAdViewLimit = this.riskConfig.dailyAdViewLimit || 200;
        if (this.dailyStats.adViewCount >= dailyAdViewLimit) {
          throw new RiskViolationError(
            RiskViolationType.DAILY_AD_VIEW_LIMIT,
            `今日广告观看次数已达上限 ${dailyAdViewLimit} 次`,
            {
              currentCount: this.dailyStats.adViewCount,
              limit: dailyAdViewLimit,
            }
          );
        }
      }

      // Check daily reward video limit
      if (adType === 'video' && this.riskConfig?.dailyRewardLimitEnabled) {
        const dailyRewardVideoLimit = this.riskConfig.dailyRewardVideoLimit || 100;
        if (this.dailyStats.rewardVideoCount >= dailyRewardVideoLimit) {
          throw new RiskViolationError(
            RiskViolationType.DAILY_REWARD_VIDEO_LIMIT,
            `今日激励视频观看次数已达上限 ${dailyRewardVideoLimit} 次`,
            {
              currentCount: this.dailyStats.rewardVideoCount,
              limit: dailyRewardVideoLimit,
            }
          );
        }
      }

      return true;
    } catch (error) {
      if (error instanceof RiskViolationError) {
        throw error;
      }
      console.error('Error checking daily limits:', error);
      return true;
    }
  }

  /**
   * Update daily statistics
   */
  public async updateDailyStats(adType: string, revenue?: number): Promise<void> {
    try {
      await this.ensureDailyStatsReset();

      if (!this.dailyStats) {
        this.dailyStats = {
          date: this.getCurrentDateString(),
          adViewCount: 0,
          rewardVideoCount: 0,
          totalRevenue: 0,
          lastResetTime: Date.now(),
        };
      }

      // Update counters
      this.dailyStats.adViewCount += 1;
      
      if (adType === 'video') {
        this.dailyStats.rewardVideoCount += 1;
      }
      
      if (revenue && revenue > 0) {
        this.dailyStats.totalRevenue += revenue;
      }

      // Save updated stats
      await this.saveDailyStats();

      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('Daily stats updated:', this.dailyStats);
      }
    } catch (error) {
      console.error('Error updating daily stats:', error);
    }
  }

  /**
   * Validate IP limits (placeholder - would need server-side implementation)
   */
  public validateIpLimits(ipAddress?: string): boolean {
    try {
      // This is a client-side placeholder
      // Real IP limit validation should be done server-side
      if (!this.riskConfig?.sameIpLimitEnabled) {
        return true;
      }

      // Log for debugging
      if (ENV_CONFIG.DEBUG_MODE && ipAddress) {
        console.log('IP limit check (client-side placeholder):', {
          ipAddress,
          limit: this.riskConfig.sameIpUserLimit,
        });
      }

      return true;
    } catch (error) {
      console.error('Error validating IP limits:', error);
      return true;
    }
  }

  /**
   * Perform comprehensive risk check
   */
  public async performRiskCheck(params: {
    userId: number;
    adType?: string;
    expectedRevenue?: number;
    ipAddress?: string;
  }): Promise<boolean> {
    try {
      const { userId, adType, expectedRevenue, ipAddress } = params;

      // Ensure risk config is loaded
      if (!this.riskConfig) {
        await this.getRiskConfig();
      }

      // Device environment checks
      if (!this.deviceEnvironment) {
        await this.detectDeviceEnvironment();
      }

      // ROOT detection check
      if (this.riskConfig?.rootDetectionEnabled && this.deviceEnvironment?.isRooted) {
        throw new RiskViolationError(
          RiskViolationType.ROOT_DETECTED,
          '检测到设备已ROOT，无法继续使用',
          { deviceEnvironment: this.deviceEnvironment }
        );
      }

      // Emulator detection check
      if (this.riskConfig?.emulatorDetectionEnabled && this.deviceEnvironment?.isEmulator) {
        throw new RiskViolationError(
          RiskViolationType.EMULATOR_DETECTED,
          '检测到模拟器环境，无法继续使用',
          { deviceEnvironment: this.deviceEnvironment }
        );
      }

      // Ad interval check
      await this.checkAdInterval(adType);

      // Daily limits check
      await this.checkDailyLimits(userId, adType);

      // Revenue limit check
      if (expectedRevenue) {
        this.validateRevenueLimit(expectedRevenue);
      }

      // IP limits check
      this.validateIpLimits(ipAddress);

      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('Risk check passed for:', params);
      }

      return true;
    } catch (error) {
      if (error instanceof RiskViolationError) {
        console.warn('Risk check failed:', error.message, error.details);
        throw error;
      }
      
      console.error('Error performing risk check:', error);
      // Allow on unexpected errors to avoid blocking users
      return true;
    }
  }

  /**
   * Get risk violation message for user display
   */
  public getRiskViolationMessage(error: RiskViolationError): string {
    const messages = {
      [RiskViolationType.ROOT_DETECTED]: '检测到设备已ROOT，为了账户安全，请使用未ROOT的设备',
      [RiskViolationType.EMULATOR_DETECTED]: '检测到模拟器环境，请使用真实设备',
      [RiskViolationType.AD_INTERVAL_VIOLATION]: error.message,
      [RiskViolationType.SINGLE_REVENUE_LIMIT]: error.message,
      [RiskViolationType.DAILY_REWARD_VIDEO_LIMIT]: error.message,
      [RiskViolationType.DAILY_AD_VIEW_LIMIT]: error.message,
      [RiskViolationType.IP_ONLINE_LIMIT]: '同一IP地址在线用户数过多，请稍后再试',
      [RiskViolationType.LOGIN_FREQUENCY_LIMIT]: '登录过于频繁，请稍后再试',
    };

    return messages[error.violationType] || '系统检测到异常行为，请稍后再试';
  }

  /**
   * Clear all cached risk data
   */
  public async clearCache(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(RISK_STORAGE_KEYS.RISK_CONFIG),
        AsyncStorage.removeItem(RISK_STORAGE_KEYS.LAST_AD_TIME),
        AsyncStorage.removeItem(RISK_STORAGE_KEYS.DAILY_AD_COUNT),
        AsyncStorage.removeItem(RISK_STORAGE_KEYS.DAILY_REVENUE),
        AsyncStorage.removeItem(RISK_STORAGE_KEYS.DEVICE_FINGERPRINT),
      ]);

      this.riskConfig = null;
      this.deviceEnvironment = null;
      this.dailyStats = null;

      console.log('Risk control cache cleared');
    } catch (error) {
      console.error('Error clearing risk control cache:', error);
    }
  }

  // Private helper methods

  private async loadCachedRiskConfig(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem(RISK_STORAGE_KEYS.RISK_CONFIG);
      if (cached) {
        this.riskConfig = JSON.parse(cached);
      }
    } catch (error) {
      console.error('Error loading cached risk config:', error);
    }
  }

  private async cacheRiskConfig(config: RiskConfig): Promise<void> {
    try {
      await AsyncStorage.setItem(RISK_STORAGE_KEYS.RISK_CONFIG, JSON.stringify(config));
    } catch (error) {
      console.error('Error caching risk config:', error);
    }
  }

  private async performRootDetection(deviceInfo: any): Promise<{ isRooted: boolean; methods: string[] }> {
    const methods: string[] = [];
    let isRooted = false;

    try {
      // Method 1: Check for common root indicators in device info
      if (deviceInfo.tags && deviceInfo.tags.includes('test-keys')) {
        methods.push('test-keys-detected');
        isRooted = true;
      }

      // Method 2: Check build fingerprint
      if (deviceInfo.fingerprint && (
        deviceInfo.fingerprint.includes('generic') ||
        deviceInfo.fingerprint.includes('unknown') ||
        deviceInfo.fingerprint.includes('test-keys')
      )) {
        methods.push('suspicious-fingerprint');
        isRooted = true;
      }

      // Method 3: Check for emulator-like characteristics that might indicate root
      if (Platform.OS === 'android') {
        const suspiciousValues = [
          'generic', 'unknown', 'emulator', 'simulator',
          'genymotion', 'goldfish', 'vbox', 'ttVM_Hdragon'
        ];
        
        const checkFields = [
          deviceInfo.brand, deviceInfo.model, deviceInfo.product,
          deviceInfo.hardware, deviceInfo.bootloader
        ];

        for (const field of checkFields) {
          if (field && suspiciousValues.some(val => 
            field.toLowerCase().includes(val.toLowerCase())
          )) {
            methods.push('suspicious-device-info');
            // Note: This might indicate emulator rather than root
            break;
          }
        }
      }

      // Method 4: Use DeviceInfo's isEmulator as a proxy (emulators are often rooted)
      const isEmulatorResult = await DeviceInfo.isEmulator();
      if (isEmulatorResult) {
        methods.push('emulator-detected');
        // Don't set isRooted here as emulator != root
      }

    } catch (error) {
      console.error('Error in root detection:', error);
      methods.push('detection-error');
    }

    return { isRooted, methods };
  }

  private async performEmulatorDetection(deviceInfo: any): Promise<{ isEmulator: boolean; methods: string[] }> {
    const methods: string[] = [];
    let isEmulator = false;

    try {
      // Method 1: Use DeviceInfo's built-in emulator detection
      const isEmulatorResult = await DeviceInfo.isEmulator();
      if (isEmulatorResult) {
        methods.push('device-info-api');
        isEmulator = true;
      }

      // Method 2: Check for emulator-specific values
      const emulatorIndicators = [
        'generic', 'emulator', 'simulator', 'genymotion',
        'goldfish', 'vbox', 'ttVM_Hdragon', 'android sdk built for'
      ];

      const checkFields = [
        deviceInfo.brand, deviceInfo.model, deviceInfo.product,
        deviceInfo.hardware, deviceInfo.bootloader, deviceInfo.fingerprint
      ];

      for (const field of checkFields) {
        if (field && emulatorIndicators.some(indicator => 
          field.toLowerCase().includes(indicator.toLowerCase())
        )) {
          methods.push('suspicious-identifiers');
          isEmulator = true;
          break;
        }
      }

      // Method 3: Check for specific emulator patterns
      if (Platform.OS === 'android') {
        // Check for Genymotion
        if (deviceInfo.product && deviceInfo.product.includes('vbox')) {
          methods.push('genymotion-detected');
          isEmulator = true;
        }

        // Check for Android SDK emulator
        if (deviceInfo.fingerprint && deviceInfo.fingerprint.includes('generic')) {
          methods.push('android-sdk-emulator');
          isEmulator = true;
        }
      }

    } catch (error) {
      console.error('Error in emulator detection:', error);
      methods.push('detection-error');
    }

    return { isEmulator, methods };
  }

  private async generateDeviceFingerprint(deviceInfo: any): Promise<string> {
    try {
      // Create a unique fingerprint based on device characteristics
      const fingerprintData = [
        deviceInfo.brand || '',
        deviceInfo.model || '',
        deviceInfo.systemName || '',
        deviceInfo.systemVersion || '',
        deviceInfo.buildId || '',
        deviceInfo.hardware || '',
        deviceInfo.product || '',
        deviceInfo.supportedAbis?.join(',') || '',
      ].join('|');

      // Simple hash function (in production, use a proper hash library)
      let hash = 0;
      for (let i = 0; i < fingerprintData.length; i++) {
        const char = fingerprintData.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }

      return `fp_${Math.abs(hash).toString(16)}`;
    } catch (error) {
      console.error('Error generating device fingerprint:', error);
      return `fp_${Date.now().toString(16)}`;
    }
  }

  private async cacheDeviceFingerprint(fingerprint: string): Promise<void> {
    try {
      await AsyncStorage.setItem(RISK_STORAGE_KEYS.DEVICE_FINGERPRINT, fingerprint);
    } catch (error) {
      console.error('Error caching device fingerprint:', error);
    }
  }

  private async getLastAdTime(adType?: string): Promise<number | null> {
    try {
      const key = adType ? `${RISK_STORAGE_KEYS.LAST_AD_TIME}_${adType}` : RISK_STORAGE_KEYS.LAST_AD_TIME;
      const stored = await AsyncStorage.getItem(key);
      return stored ? parseInt(stored, 10) : null;
    } catch (error) {
      console.error('Error getting last ad time:', error);
      return null;
    }
  }

  private async updateLastAdTime(adType: string | undefined, timestamp: number): Promise<void> {
    try {
      const key = adType ? `${RISK_STORAGE_KEYS.LAST_AD_TIME}_${adType}` : RISK_STORAGE_KEYS.LAST_AD_TIME;
      await AsyncStorage.setItem(key, timestamp.toString());
    } catch (error) {
      console.error('Error updating last ad time:', error);
    }
  }

  private async loadDailyStats(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(RISK_STORAGE_KEYS.DAILY_AD_COUNT);
      if (stored) {
        this.dailyStats = JSON.parse(stored);
        await this.ensureDailyStatsReset();
      }
    } catch (error) {
      console.error('Error loading daily stats:', error);
    }
  }

  private async saveDailyStats(): Promise<void> {
    try {
      if (this.dailyStats) {
        await AsyncStorage.setItem(RISK_STORAGE_KEYS.DAILY_AD_COUNT, JSON.stringify(this.dailyStats));
      }
    } catch (error) {
      console.error('Error saving daily stats:', error);
    }
  }

  private async ensureDailyStatsReset(): Promise<void> {
    const currentDate = this.getCurrentDateString();
    
    if (!this.dailyStats || this.dailyStats.date !== currentDate) {
      // Reset daily stats for new day
      this.dailyStats = {
        date: currentDate,
        adViewCount: 0,
        rewardVideoCount: 0,
        totalRevenue: 0,
        lastResetTime: Date.now(),
      };
      
      await this.saveDailyStats();
      
      if (ENV_CONFIG.DEBUG_MODE) {
        console.log('Daily stats reset for new day:', currentDate);
      }
    }
  }

  private getCurrentDateString(): string {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  }
}

// Create singleton instance
const riskControlService = new RiskControlService();

export default riskControlService;
export { RiskControlService, RiskViolationType, RiskViolationError };