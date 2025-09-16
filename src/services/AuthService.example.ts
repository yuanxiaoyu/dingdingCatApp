/**
 * AuthService Usage Examples
 * 
 * This file demonstrates how to use the AuthService for WeChat login,
 * token management, and user authentication in the DingDingCat app.
 */

import authService from './AuthService';
import { LoginResponse } from '../types';

/**
 * Example 1: WeChat Login Flow
 */
export async function exampleWeChatLogin(): Promise<void> {
  try {
    console.log('Starting WeChat login...');
    
    // Check if WeChat is available
    const isWeChatAvailable = await authService.isWeChatAvailable();
    if (!isWeChatAvailable) {
      console.error('WeChat is not installed');
      return;
    }

    // Perform WeChat login (includes auto-registration if needed)
    const loginResult: LoginResponse = await authService.wechatLogin();
    
    console.log('Login successful:', {
      userId: loginResult.userId,
      userName: loginResult.userName,
      nickName: loginResult.nickName,
      avatar: loginResult.avatar,
    });

    // Tokens are automatically stored securely
    console.log('Access token stored securely');
    
  } catch (error) {
    console.error('WeChat login failed:', error);
    // Handle login error (show user-friendly message)
  }
}

/**
 * Example 2: Check Authentication Status
 */
export async function exampleCheckAuth(): Promise<boolean> {
  try {
    const isAuthenticated = await authService.isAuthenticated();
    
    if (isAuthenticated) {
      console.log('User is authenticated');
      
      // Get user information
      const userInfo = await authService.getUserInfo();
      if (userInfo) {
        console.log('Current user:', userInfo.nickName);
      }
      
      return true;
    } else {
      console.log('User is not authenticated');
      return false;
    }
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

/**
 * Example 3: Initialize Authentication on App Start
 */
export async function exampleInitializeAuth(): Promise<boolean> {
  try {
    console.log('Initializing authentication...');
    
    // This will check if user is authenticated and refresh token if needed
    const isInitialized = await authService.initializeAuth();
    
    if (isInitialized) {
      console.log('Authentication initialized successfully');
      
      // Get user info to display in UI
      const userInfo = await authService.getUserInfo();
      if (userInfo) {
        console.log(`Welcome back, ${userInfo.nickName}!`);
      }
      
      return true;
    } else {
      console.log('User needs to login');
      return false;
    }
  } catch (error) {
    console.error('Error initializing auth:', error);
    return false;
  }
}

/**
 * Example 4: Manual Token Refresh
 */
export async function exampleRefreshToken(): Promise<boolean> {
  try {
    console.log('Refreshing access token...');
    
    const newToken = await authService.refreshToken();
    
    if (newToken) {
      console.log('Token refreshed successfully');
      return true;
    } else {
      console.log('Token refresh failed - user needs to login again');
      return false;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
}

/**
 * Example 5: Update User Information
 */
export async function exampleUpdateUserInfo(): Promise<void> {
  try {
    // Update user's nickname
    const updatedUser = await authService.updateUserInfo({
      nickName: 'New Nickname',
    });
    
    if (updatedUser) {
      console.log('User info updated:', updatedUser.nickName);
    }
  } catch (error) {
    console.error('Error updating user info:', error);
  }
}

/**
 * Example 6: User Logout
 */
export async function exampleLogout(): Promise<void> {
  try {
    console.log('Logging out user...');
    
    await authService.logout();
    
    console.log('User logged out successfully');
    
    // Redirect to login screen or update UI state
    
  } catch (error) {
    console.error('Error during logout:', error);
    // Even if logout API fails, local data is cleared
  }
}

/**
 * Example 7: Get Access Token for API Calls
 */
export async function exampleGetAccessToken(): Promise<string | null> {
  try {
    const accessToken = await authService.getAccessToken();
    
    if (accessToken) {
      console.log('Access token retrieved');
      // Use token for API calls
      return accessToken;
    } else {
      console.log('No access token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

/**
 * Example 8: Complete App Authentication Flow
 */
export async function exampleCompleteAuthFlow(): Promise<void> {
  try {
    // Step 1: Initialize auth on app start
    const isInitialized = await exampleInitializeAuth();
    
    if (!isInitialized) {
      // Step 2: User needs to login
      console.log('Showing login screen...');
      
      // In a real app, you would show the login screen here
      // For this example, we'll simulate the login
      await exampleWeChatLogin();
    }
    
    // Step 3: User is now authenticated, proceed with app
    const userInfo = await authService.getUserInfo();
    if (userInfo) {
      console.log(`App ready for user: ${userInfo.nickName}`);
      
      // Initialize other services that require authentication
      // Load user-specific data
      // Update UI to show authenticated state
    }
    
  } catch (error) {
    console.error('Error in complete auth flow:', error);
    // Handle error appropriately
  }
}

/**
 * Example 9: Handle Token Expiration
 */
export async function exampleHandleTokenExpiration(): Promise<void> {
  try {
    // This would typically be called when an API returns 401 Unauthorized
    console.log('Token expired, attempting refresh...');
    
    const refreshed = await exampleRefreshToken();
    
    if (refreshed) {
      console.log('Token refreshed, retrying API call...');
      // Retry the failed API call
    } else {
      console.log('Refresh failed, redirecting to login...');
      // Clear any cached data
      await authService.logout();
      // Redirect to login screen
    }
    
  } catch (error) {
    console.error('Error handling token expiration:', error);
  }
}

/**
 * Example 10: Check if Token Needs Refresh
 */
export async function exampleCheckTokenRefresh(): Promise<void> {
  try {
    const shouldRefresh = await authService.shouldRefreshToken();
    
    if (shouldRefresh) {
      console.log('Token needs refresh, refreshing proactively...');
      await exampleRefreshToken();
    } else {
      console.log('Token is still valid');
    }
    
  } catch (error) {
    console.error('Error checking token refresh need:', error);
  }
}

// Export all examples for easy testing
export const authExamples = {
  wechatLogin: exampleWeChatLogin,
  checkAuth: exampleCheckAuth,
  initializeAuth: exampleInitializeAuth,
  refreshToken: exampleRefreshToken,
  updateUserInfo: exampleUpdateUserInfo,
  logout: exampleLogout,
  getAccessToken: exampleGetAccessToken,
  completeAuthFlow: exampleCompleteAuthFlow,
  handleTokenExpiration: exampleHandleTokenExpiration,
  checkTokenRefresh: exampleCheckTokenRefresh,
};

/**
 * Usage in React Native Components:
 * 
 * ```typescript
 * import authService from '../services/AuthService';
 * import { useEffect, useState } from 'react';
 * 
 * function LoginScreen() {
 *   const [isLoading, setIsLoading] = useState(false);
 * 
 *   const handleWeChatLogin = async () => {
 *     setIsLoading(true);
 *     try {
 *       const result = await authService.wechatLogin();
 *       // Navigate to main screen
 *       navigation.navigate('Home');
 *     } catch (error) {
 *       Alert.alert('Login Failed', error.message);
 *     } finally {
 *       setIsLoading(false);
 *     }
 *   };
 * 
 *   return (
 *     <View>
 *       <Button 
 *         title="Login with WeChat" 
 *         onPress={handleWeChatLogin}
 *         disabled={isLoading}
 *       />
 *     </View>
 *   );
 * }
 * 
 * function App() {
 *   const [isAuthenticated, setIsAuthenticated] = useState(false);
 *   const [isLoading, setIsLoading] = useState(true);
 * 
 *   useEffect(() => {
 *     const initializeAuth = async () => {
 *       try {
 *         const initialized = await authService.initializeAuth();
 *         setIsAuthenticated(initialized);
 *       } catch (error) {
 *         console.error('Auth initialization failed:', error);
 *       } finally {
 *         setIsLoading(false);
 *       }
 *     };
 * 
 *     initializeAuth();
 *   }, []);
 * 
 *   if (isLoading) {
 *     return <LoadingScreen />;
 *   }
 * 
 *   return isAuthenticated ? <MainApp /> : <LoginScreen />;
 * }
 * ```
 */