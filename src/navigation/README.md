# Navigation System

This directory contains the React Navigation setup for the DingDingCat app.

## Structure

```
src/navigation/
├── types.ts              # Navigation type definitions
├── RootNavigator.tsx     # Main navigation container with auth guard
├── AuthStack.tsx         # Authentication flow navigation
├── MainTabs.tsx          # Bottom tab navigation for authenticated users
├── index.ts              # Navigation exports
└── __tests__/            # Navigation tests
```

## Navigation Flow

### 1. Root Navigator (`RootNavigator.tsx`)
- Main navigation container
- Handles authentication state checking
- Shows loading screen while initializing
- Routes to Auth or Main stack based on authentication status

### 2. Auth Stack (`AuthStack.tsx`)
- Handles authentication flow
- Currently contains only Login screen
- Stack navigation for potential multi-step auth flows

### 3. Main Tabs (`MainTabs.tsx`)
- Bottom tab navigation for authenticated users
- Contains 4 main tabs:
  - **Home**: Main dashboard with ad watching functionality
  - **Revenue**: Revenue statistics and earnings data
  - **History**: Ad watching history and records
  - **Settings**: User settings and app configuration

## Authentication Guard

The navigation system includes an authentication guard that:

1. Checks if the app is initialized (`isInitialized`)
2. Shows loading screen while checking auth state
3. Routes to appropriate stack based on authentication status:
   - Not authenticated → Auth Stack (Login)
   - Authenticated → Main Tabs (Home as default)

## State Management Integration

The navigation system integrates with Redux store for:

- **Authentication State**: `useAuth()` hook
- **Loading States**: Shows loading indicators during state transitions
- **Error Handling**: Handles authentication errors gracefully

## Screen Components

### Auth Screens
- `LoginScreen`: WeChat login interface

### Main Screens
- `HomeScreen`: Main dashboard with ad buttons
- `RevenueScreen`: Revenue statistics and charts
- `HistoryScreen`: Ad watching history with filters
- `SettingsScreen`: User settings and app configuration

## Navigation Props

Type-safe navigation props are defined in `types.ts`:

```typescript
// Root Stack
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
};

// Main Tabs
export type MainTabParamList = {
  Home: undefined;
  Revenue: undefined;
  History: undefined;
  Settings: undefined;
};
```

## Usage

### In App.tsx
```typescript
import { RootNavigator } from './src/navigation';

function App() {
  return (
    <StoreProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </StoreProvider>
  );
}
```

### In Screen Components
```typescript
import { MainTabScreenProps } from '../navigation/types';

type Props = MainTabScreenProps<'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  // Use navigation prop for programmatic navigation
  const handleNavigateToRevenue = () => {
    navigation.navigate('Revenue');
  };
  
  return (
    // Screen content
  );
};
```

## Features

### 1. Route Guards
- Authentication-based routing
- Automatic redirection on auth state changes

### 2. State Persistence
- Navigation state is managed by React Navigation
- Authentication state persisted via Redux and secure storage

### 3. Deep Linking Support
- Ready for deep linking implementation
- Type-safe parameter passing between screens

### 4. Tab Bar Customization
- Custom icons and labels
- Platform-specific styling
- Badge support for notifications

## Dependencies

- `@react-navigation/native`: Core navigation library
- `@react-navigation/stack`: Stack navigator for auth flow
- `@react-navigation/bottom-tabs`: Bottom tab navigator
- `react-native-screens`: Native screen optimization
- `react-native-gesture-handler`: Gesture handling for navigation

## Testing

Navigation components are tested for:
- Correct routing logic based on authentication state
- Type safety of navigation parameters
- Screen component integration

## Future Enhancements

1. **Deep Linking**: Add support for deep links to specific screens
2. **Modal Navigation**: Add modal screens for overlays
3. **Drawer Navigation**: Consider drawer navigation for additional features
4. **Animation Customization**: Custom transition animations
5. **Tab Bar Badges**: Show notification counts on tab icons