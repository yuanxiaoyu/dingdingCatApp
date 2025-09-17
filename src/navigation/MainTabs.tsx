/**
 * Main Tab Navigator - Bottom tab navigation for authenticated users
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import RevenueScreen from '../screens/RevenueScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Tab bar icons (using emoji for now, can be replaced with proper icons)
const getTabBarIcon = (routeName: keyof MainTabParamList, focused: boolean) => {
  const icons = {
    Home: focused ? '🏠' : '🏡',
    Revenue: focused ? '💰' : '💸',
    History: focused ? '📊' : '📈',
    Settings: focused ? '⚙️' : '🔧',
  };
  return icons[routeName];
};

// Tab bar labels
const getTabBarLabel = (routeName: keyof MainTabParamList) => {
  const labels = {
    Home: '首页',
    Revenue: '收益',
    History: '历史',
    Settings: '设置',
  };
  return labels[routeName];
};

const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => getTabBarIcon(route.name, focused),
        tabBarLabel: getTabBarLabel(route.name),
        tabBarActiveTintColor: '#1890FF',
        tabBarInactiveTintColor: '#999999',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E8E8E8',
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          paddingTop: 5,
          height: Platform.OS === 'ios' ? 85 : 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarIconStyle: {
          fontSize: 20,
        },
        // Add badge for offline queue count on settings tab
        tabBarBadge: route.name === 'Settings' ? undefined : undefined,
      })}
      initialRouteName="Home"
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: '首页',
          tabBarTestID: 'home-tab',
        }}
      />
      
      <Tab.Screen 
        name="Revenue" 
        component={RevenueScreen}
        options={{
          title: '收益',
          tabBarTestID: 'revenue-tab',
        }}
      />
      
      <Tab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{
          title: '历史',
          tabBarTestID: 'history-tab',
        }}
      />
      
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: '设置',
          tabBarTestID: 'settings-tab',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabs;