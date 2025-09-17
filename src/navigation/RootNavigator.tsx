/**
 * Root Navigator - Main navigation container with authentication guard
 */

import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import { RootStackParamList } from './types';
import { useAuth } from '../store/hooks';
import { useAppDispatch } from '../store/hooks';
import { checkAuthState } from '../store/slices/authSlice';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, isInitialized } = useAuth();

  // Check authentication state on app start
  useEffect(() => {
    if (!isInitialized) {
      dispatch(checkAuthState());
    }
  }, [dispatch, isInitialized]);

  // Show loading screen while checking authentication
  if (!isInitialized || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1890FF" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#FFFFFF' },
        animationEnabled: true,
      }}
    >
      {isAuthenticated ? (
        <Stack.Screen 
          name="Main" 
          component={MainTabs}
          options={{
            title: '主应用',
            animationTypeForReplace: 'push',
          }}
        />
      ) : (
        <Stack.Screen 
          name="Auth" 
          component={AuthStack}
          options={{
            title: '认证',
            animationTypeForReplace: 'pop',
          }}
        />
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default RootNavigator;