module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/types$': '<rootDir>/src/types',
    '^@/services$': '<rootDir>/src/services',
    '^@/store$': '<rootDir>/src/store',
    '^@/screens$': '<rootDir>/src/screens',
    '^@/components$': '<rootDir>/src/components',
    '^@/utils$': '<rootDir>/src/utils',
    '^@/config$': '<rootDir>/src/config',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-.*|@react-native-async-storage|react-native-wechat-lib|react-native-device-info|react-native-keychain|react-native-sqlite-storage|react-redux|@reduxjs|immer)/)',
  ],
};