# DingDingCat Project Structure

## Overview
This document describes the project structure for the DingDingCat React Native application with API integration.

## Directory Structure

```
src/
├── components/          # Reusable UI components
│   ├── ErrorBoundary.tsx
│   └── index.ts
├── config/             # Configuration files
│   ├── env.ts          # Environment configuration
│   └── index.ts
├── screens/            # Screen components
│   └── index.ts        # (To be implemented)
├── services/           # Business logic services
│   └── index.ts        # (To be implemented)
├── store/              # Redux store and slices
│   ├── slices/         # Redux slices
│   └── index.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
│   ├── constants.ts    # Application constants
│   ├── helpers.ts      # Helper functions
│   ├── logger.ts       # Logging utility
│   ├── validation.ts   # Validation functions
│   └── index.ts
└── __tests__/          # Test setup and utilities
    └── setup.ts
```

## Key Features Implemented

### 1. TypeScript Configuration
- Strict type checking enabled
- Path aliases configured for clean imports
- Comprehensive type definitions for all data models

### 2. Development Tools
- ESLint and Prettier configuration
- Jest testing setup with mocks
- Logger utility for debugging
- Error boundary for error handling

### 3. Project Architecture
- Service-oriented architecture
- Redux Toolkit for state management
- Modular component structure
- Utility functions for common operations

### 4. Dependencies Installed
- **State Management**: @reduxjs/toolkit, react-redux
- **Storage**: @react-native-async-storage/async-storage, react-native-sqlite-storage
- **WeChat Integration**: react-native-wechat-lib
- **Device Info**: react-native-device-info
- **Security**: react-native-keychain
- **HTTP Client**: axios

## Development Scripts

- `npm start` - Start Metro bundler
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run type-check` - Check TypeScript types

## Next Steps

The infrastructure is now ready for implementing the core services:
1. API Client (Task 3)
2. Authentication Service (Task 4)
3. Configuration Service (Task 5)
4. Risk Control Service (Task 6)
5. Ad Service (Task 7)
6. And subsequent tasks...

## Path Aliases

The following path aliases are configured:
- `@/` - src/
- `@/types` - src/types
- `@/services` - src/services
- `@/store` - src/store
- `@/screens` - src/screens
- `@/components` - src/components
- `@/utils` - src/utils
- `@/config` - src/config