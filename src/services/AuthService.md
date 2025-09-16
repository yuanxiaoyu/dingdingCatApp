# AuthService Documentation

The `AuthService` is a comprehensive authentication service for the DingDingCat app that handles WeChat login, user registration, token management, and secure storage of authentication data.

## Features

- ✅ WeChat SDK integration for social login
- ✅ Automatic user registration for new WeChat users
- ✅ Secure token storage using Keychain
- ✅ Automatic token refresh mechanism
- ✅ Fallback to AsyncStorage if Keychain fails
- ✅ User information management
- ✅ Comprehensive error handling
- ✅ Full TypeScript support
- ✅ Extensive test coverage

## Installation

The AuthService requires the following dependencies (already included in package.json):

```bash
npm install react-native-wechat-lib react-native-keychain @react-native-async-storage/async-storage
```

## Basic Usage

```typescript
import authService from '../services/AuthService';

// Check if user is authenticated
const isAuthenticated = await authService.isAuthenticated();

// Perform WeChat login
const loginResult = await authService.wechatLogin();

// Get current user info
const userInfo = await authService.getUserInfo();

// Logout user
await authService.logout();
```

## API Reference

### Core Methods

#### `wechatLogin(): Promise<LoginResponse>`

Performs the complete WeChat login flow including automatic registration for new users.

**Returns:** Promise resolving to login response with user data and tokens

**Throws:** Error if WeChat is not installed, authorization fails, or API calls fail

**Example:**
```typescript
try {
  const result = await authService.wechatLogin();
  console.log('Login successful:', result.nickName);
} catch (error) {
  console.error('Login failed:', error.message);
}
```

#### `autoRegister(authCode: string): Promise<LoginResponse>`

Automatically registers a new user with WeChat authorization code and random nickname.

**Parameters:**
- `authCode`: WeChat authorization code

**Returns:** Promise resolving to login response after registration

#### `isAuthenticated(): Promise<boolean>`

Checks if the user is currently authenticated by verifying stored tokens.

**Returns:** Promise resolving to boolean indicating authentication status

#### `getUserInfo(): Promise<User | null>`

Retrieves current user information from local storage or API.

**Returns:** Promise resolving to User object or null if not found

#### `refreshToken(): Promise<string | null>`

Refreshes the access token using the stored refresh token.

**Returns:** Promise resolving to new access token or null if refresh fails

#### `logout(): Promise<void>`

Logs out the user by calling the logout API and clearing all stored data.

**Returns:** Promise that resolves when logout is complete

### Token Management

#### `getAccessToken(): Promise<string | null>`

Retrieves the current access token from secure storage.

**Returns:** Promise resolving to access token or null

#### `storeTokensSecurely(tokens: AuthTokens): Promise<void>`

Stores authentication tokens securely using Keychain with biometric protection.

**Parameters:**
- `tokens`: AuthTokens object containing access token, refresh token, etc.

#### `clearStoredTokens(): Promise<void>`

Clears all stored authentication data from both Keychain and AsyncStorage.

### User Management

#### `updateUserInfo(updates: Partial<User>): Promise<User | null>`

Updates user information in local storage.

**Parameters:**
- `updates`: Partial User object with fields to update

**Returns:** Promise resolving to updated User object

#### `getLastLoginTime(): Promise<string | null>`

Gets the timestamp of the last successful login.

**Returns:** Promise resolving to ISO date string or null

### Utility Methods

#### `isWeChatAvailable(): Promise<boolean>`

Checks if WeChat app is installed on the device.

**Returns:** Promise resolving to boolean indicating WeChat availability

#### `shouldRefreshToken(): Promise<boolean>`

Determines if the access token needs to be refreshed based on age.

**Returns:** Promise resolving to boolean indicating if refresh is needed

#### `initializeAuth(): Promise<boolean>`

Initializes authentication on app start, including token refresh if needed.

**Returns:** Promise resolving to boolean indicating successful initialization

## Configuration

The AuthService uses environment configuration from `src/config/env.ts`:

```typescript
export interface EnvConfig {
  API_BASE_URL: string;
  WECHAT_APP_ID: string;  // Required for WeChat SDK
  APP_KEY: string;        // Required for API calls
  DEBUG_MODE: boolean;
}
```

## Security Features

### Secure Token Storage

- **Primary:** Keychain with biometric protection
- **Fallback:** AsyncStorage for compatibility
- **Access Control:** Device passcode or biometry required
- **Accessibility:** Only when device is unlocked

### Token Refresh

- **Automatic:** Tokens are refreshed automatically when expired
- **Proactive:** Tokens are refreshed before expiration (25 minutes)
- **Fallback:** If refresh fails, user is logged out securely

### Error Handling

- **Network Errors:** Automatic retry with exponential backoff
- **WeChat Errors:** Proper error messages for user feedback
- **Token Errors:** Automatic cleanup and re-authentication
- **Storage Errors:** Graceful fallback between storage methods

## Integration with API Client

The AuthService integrates seamlessly with the existing `apiClient`:

```typescript
// AuthService automatically stores tokens in apiClient
await authService.wechatLogin();

// apiClient automatically uses stored tokens for requests
const response = await apiClient.get('/some-protected-endpoint');

// apiClient automatically refreshes tokens when they expire
// No additional code needed in your components
```

## Error Handling

### Common Error Scenarios

1. **WeChat Not Installed**
   ```typescript
   try {
     await authService.wechatLogin();
   } catch (error) {
     if (error.message.includes('not installed')) {
       // Show WeChat installation prompt
     }
   }
   ```

2. **User Cancels Authorization**
   ```typescript
   try {
     await authService.wechatLogin();
   } catch (error) {
     if (error.message.includes('cancelled')) {
       // User cancelled, no action needed
     }
   }
   ```

3. **Network Errors**
   ```typescript
   try {
     await authService.wechatLogin();
   } catch (error) {
     if (error.message.includes('network')) {
       // Show retry option
     }
   }
   ```

4. **Token Refresh Failure**
   ```typescript
   const refreshed = await authService.refreshToken();
   if (!refreshed) {
     // Redirect to login screen
     navigation.navigate('Login');
   }
   ```

## Testing

The AuthService includes comprehensive tests covering:

- WeChat SDK integration
- Login and registration flows
- Token management and refresh
- Secure storage operations
- Error handling scenarios
- User information management

Run tests with:
```bash
npm test -- --testPathPattern=AuthService.test.ts
```

## React Native Integration

### App Initialization

```typescript
// App.tsx
import { useEffect, useState } from 'react';
import authService from './src/services/AuthService';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const initialized = await authService.initializeAuth();
        setIsAuthenticated(initialized);
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  if (isLoading) return <LoadingScreen />;
  return isAuthenticated ? <MainApp /> : <LoginScreen />;
}
```

### Login Screen

```typescript
// LoginScreen.tsx
import { useState } from 'react';
import { Alert, Button, View } from 'react-native';
import authService from '../services/AuthService';

function LoginScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleWeChatLogin = async () => {
    setIsLoading(true);
    try {
      // Check WeChat availability first
      const isAvailable = await authService.isWeChatAvailable();
      if (!isAvailable) {
        Alert.alert('WeChat Required', 'Please install WeChat to continue');
        return;
      }

      // Perform login
      const result = await authService.wechatLogin();
      
      // Navigate to main app
      navigation.replace('Main');
      
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View>
      <Button 
        title={isLoading ? 'Logging in...' : 'Login with WeChat'}
        onPress={handleWeChatLogin}
        disabled={isLoading}
      />
    </View>
  );
}
```

### Protected Components

```typescript
// ProtectedComponent.tsx
import { useEffect, useState } from 'react';
import authService from '../services/AuthService';

function ProtectedComponent() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const userInfo = await authService.getUserInfo();
      setUser(userInfo);
    };

    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      // Navigate to login screen
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <View>
      <Text>Welcome, {user?.nickName}!</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}
```

## Best Practices

1. **Always check WeChat availability** before attempting login
2. **Handle errors gracefully** with user-friendly messages
3. **Use loading states** during authentication operations
4. **Initialize auth on app start** to maintain login state
5. **Clear sensitive data** on logout or app uninstall
6. **Test on real devices** for WeChat integration
7. **Monitor token expiration** and refresh proactively

## Troubleshooting

### WeChat SDK Issues

1. **Registration fails:** Verify WeChat App ID in env config
2. **Authorization fails:** Check WeChat app configuration
3. **SDK not initialized:** Ensure proper async initialization

### Token Issues

1. **Tokens not persisting:** Check Keychain permissions
2. **Refresh fails:** Verify refresh token validity
3. **API calls fail:** Check token format and headers

### Storage Issues

1. **Keychain access denied:** Fallback to AsyncStorage works automatically
2. **Data not persisting:** Check app permissions and storage quotas
3. **Migration issues:** Clear storage and re-login if needed

## Migration Guide

If upgrading from a previous authentication system:

1. **Clear old tokens:** `await authService.logout()`
2. **Re-authenticate users:** Redirect to login screen
3. **Update API calls:** Use new token format
4. **Test thoroughly:** Verify all authentication flows

## Contributing

When contributing to AuthService:

1. **Add tests** for new functionality
2. **Update documentation** for API changes
3. **Follow TypeScript** strict mode requirements
4. **Test on multiple devices** for compatibility
5. **Consider security implications** of changes

## License

This AuthService is part of the DingDingCat project and follows the same license terms.