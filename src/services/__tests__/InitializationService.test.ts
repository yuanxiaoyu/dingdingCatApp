import { InitializationService, InitPhase } from '../InitializationService';

// Mock all the services
jest.mock('../AuthService', () => ({
  __esModule: true,
  default: {
    initializeAuth: jest.fn(() => {
      console.log('Mock initializeAuth called');
      return Promise.resolve(false);
    }),
  },
}));

jest.mock('../ConfigService', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn().mockResolvedValue(undefined),
    getAppConfig: jest.fn().mockResolvedValue(null),
    getAdConfig: jest.fn().mockResolvedValue(null),
    getRiskConfig: jest.fn().mockResolvedValue(null),
    getChannelConfig: jest.fn().mockResolvedValue(null),
    checkConfigUpdates: jest.fn().mockResolvedValue({ hasUpdates: false, updatedConfigs: [] }),
  },
}));

jest.mock('../DeviceService', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn().mockResolvedValue(undefined),
    collectDeviceInfo: jest.fn().mockResolvedValue({
      userId: 0,
      appKey: 'test',
      deviceModel: 'Test Device',
      deviceBrand: 'Test Brand',
      osName: 'Test OS',
      osVersion: '1.0',
      deviceId: 'test-device-id',
      isRooted: false,
      isEmulator: false,
      collectionTime: Date.now(),
    }),
    reportDeviceInfo: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../RiskControlService', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn().mockResolvedValue(undefined),
    getRiskConfig: jest.fn().mockResolvedValue(null),
    detectDeviceEnvironment: jest.fn().mockResolvedValue({
      isRooted: false,
      isEmulator: false,
      deviceFingerprint: 'test-fingerprint',
      detectionDetails: {
        rootDetectionMethods: [],
        emulatorDetectionMethods: [],
        deviceInfo: {},
      },
    }),
  },
}));

jest.mock('../SyncService', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn().mockResolvedValue(undefined),
    getQueueSize: jest.fn().mockResolvedValue(0),
    syncOfflineData: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

describe('InitializationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize successfully', async () => {
    const initService = new InitializationService();
    const statusUpdates: any[] = [];
    
    initService.addStatusListener((status) => {
      console.log('Status update:', status.phase, status.progress, status.message);
      statusUpdates.push(status);
    });

    const result = await initService.initialize();

    expect(result.success).toBe(true);
    expect(result.isFirstLaunch).toBe(true);
    expect(result.isAuthenticated).toBe(false);
    expect(result.duration).toBeGreaterThan(0);

    // Check that we went through all phases
    const phases = statusUpdates.map(update => update.phase);
    expect(phases).toContain(InitPhase.AUTH_CHECK);
    expect(phases).toContain(InitPhase.CONFIG_LOADING);
    expect(phases).toContain(InitPhase.DEVICE_INFO);
    expect(phases).toContain(InitPhase.RISK_CONTROL);
    expect(phases).toContain(InitPhase.OFFLINE_SYNC);
    expect(phases).toContain(InitPhase.COMPLETED);
  }, 10000);

  it('should handle initialization errors gracefully', async () => {
    // Mock a service to throw an error
    const authService = require('../AuthService').default;
    authService.initializeAuth.mockRejectedValue(new Error('Auth failed'));

    const initService = new InitializationService();
    const result = await initService.initialize();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Auth failed');
  }, 10000);

  it('should track status updates correctly', async () => {
    const initService = new InitializationService();
    const statusUpdates: any[] = [];
    
    const listener = (status: any) => {
      statusUpdates.push(status);
    };

    initService.addStatusListener(listener);
    await initService.initialize();
    initService.removeStatusListener(listener);

    expect(statusUpdates.length).toBeGreaterThan(0);
    expect(statusUpdates[0].phase).toBe(InitPhase.STARTING);
    expect(statusUpdates[statusUpdates.length - 1].phase).toBe(InitPhase.COMPLETED);
  }, 10000);
});