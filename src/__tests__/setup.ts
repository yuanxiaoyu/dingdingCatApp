// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-wechat-lib
jest.mock('react-native-wechat-lib', () => ({
  registerApp: jest.fn().mockResolvedValue(true),
  isWXAppInstalled: jest.fn().mockResolvedValue(true),
  sendAuthRequest: jest.fn().mockResolvedValue({
    errCode: 0,
    code: 'mock_auth_code',
  }),
}));

// Mock react-native-keychain
jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn().mockResolvedValue(true),
  getInternetCredentials: jest.fn().mockResolvedValue({
    username: 'test',
    password: 'mock_token',
  }),
  resetInternetCredentials: jest.fn().mockResolvedValue(true),
  ACCESS_CONTROL: {
    BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE: 'BiometryCurrentSetOrDevicePasscode',
  },
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WhenUnlockedThisDeviceOnly',
  },
}));

// Mock react-native-device-info
jest.mock('react-native-device-info', () => ({
  getModel: jest.fn().mockResolvedValue('iPhone 13'),
  getBrand: jest.fn().mockResolvedValue('Apple'),
  getSystemName: jest.fn().mockResolvedValue('iOS'),
  getSystemVersion: jest.fn().mockResolvedValue('15.0'),
  getUniqueId: jest.fn().mockResolvedValue('unique_device_id'),
  isEmulator: jest.fn().mockResolvedValue(false),
  getDeviceId: jest.fn().mockResolvedValue('device_id'),
  getTotalMemory: jest.fn().mockResolvedValue(6144),
  getUsedMemory: jest.fn().mockResolvedValue(3072),
  getBatteryLevel: jest.fn().mockResolvedValue(0.85),
  isCharging: jest.fn().mockResolvedValue(false),
  getCarrier: jest.fn().mockResolvedValue('Test Carrier'),
  getVersion: jest.fn().mockResolvedValue('1.0.0'),
  getBuildNumber: jest.fn().mockResolvedValue('100'),
}));

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn().mockResolvedValue({
    isConnected: true,
    type: 'wifi',
    isInternetReachable: true,
  }),
  addEventListener: jest.fn().mockReturnValue(() => {}),
  useNetInfo: jest.fn().mockReturnValue({
    isConnected: true,
    type: 'wifi',
    isInternetReachable: true,
  }),
}));

// Mock react-native-sqlite-storage
jest.mock('react-native-sqlite-storage', () => ({
  DEBUG: jest.fn(),
  enablePromise: jest.fn(),
  openDatabase: jest.fn(),
}));

// Mock console methods in test environment
global.console = {
  ...console,
  // Uncomment to ignore specific console methods in tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Mock global fetch if needed
global.fetch = jest.fn();

// Mock setTimeout and setInterval for testing
jest.useFakeTimers();

// Setup global test environment
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.clearAllTimers();
});