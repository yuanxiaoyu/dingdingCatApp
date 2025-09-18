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
import AlignedTabIcon from '../components/AlignedTabIcon';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Tab bar icon mapping
const getTabBarIconName = (routeName: keyof MainTabParamList): 'home' | 'revenue' | 'history' | 'settings' => {
  const iconNames = {
    Home: 'home' as const,
    Revenue: 'revenue' as const,
    History: 'history' as const,
    Settings: 'settings' as const,
  };
  return iconNames[routeName];
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
        tabBarIcon: ({ focused, color, size }) => (
          <AlignedTabIcon 
            name={getTabBarIconName(route.name)}
            focused={focused}
            color={color}
            size={22}
          />
        ),
        tabBarLabel: getTabBarLabel(route.name),
        tabBarActiveTintColor: '#1890FF',
        tabBarInactiveTintColor: '#999999',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E8E8E8',
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 0,
          height: Platform.OS === 'ios' ? 85 : 65,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
          marginBottom: 2,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 4,
        },

        // Add badge for offline queue count on settings tab (removed for now)
      })}
      initialRouteName="Home"
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: '首页',
        }}
      />
      
      <Tab.Screen 
        name="Revenue" 
        component={RevenueScreen}
        options={{
          title: '收益',
        }}
      />
      
      <Tab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{
          title: '历史',
        }}
      />
      
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: '设置',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabs;