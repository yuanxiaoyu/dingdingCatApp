import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TabBarIconProps {
  name: 'home' | 'revenue' | 'history' | 'settings';
  focused: boolean;
  color: string;
  size?: number;
}

/**
 * TabBarIcon - Professional tab bar icons using Unicode characters
 */
const TabBarIcon: React.FC<TabBarIconProps> = ({ name, focused, color, size = 24 }) => {
  
  // 使用Unicode字符创建更专业的图标
  const getUnicodeIcon = (iconName: string, isFocused: boolean): string => {
    const icons = {
      home: isFocused ? '⌂' : '⌂',      // House symbol
      revenue: isFocused ? '¥' : '¥',    // Yen symbol  
      history: isFocused ? '⧖' : '⧖',    // Hourglass
      settings: isFocused ? '⚙' : '⚙',   // Gear
    };
    
    return icons[iconName as keyof typeof icons] || '?';
  };

  // 使用几何图形创建简洁图标
  const getGeometricIcon = (iconName: string, isFocused: boolean): string => {
    const icons = {
      home: isFocused ? '▲' : '△',       // Triangle for home
      revenue: isFocused ? '●' : '○',     // Circle for revenue
      history: isFocused ? '■' : '□',     // Square for history  
      settings: isFocused ? '◆' : '◇',    // Diamond for settings
    };
    
    return icons[iconName as keyof typeof icons] || '?';
  };

  // 使用更好的emoji组合
  const getEmojiIcon = (iconName: string, isFocused: boolean): string => {
    const icons = {
      home: '🏠',
      revenue: '💰', 
      history: '📊',
      settings: '⚙️',
    };
    
    return icons[iconName as keyof typeof icons] || '?';
  };

  // 创建自定义图标样式
  const getCustomIcon = (iconName: string, isFocused: boolean) => {
    switch (iconName) {
      case 'home':
        return (
          <View style={[styles.customIcon, { borderColor: color }]}>
            <View style={[styles.homeIcon, { backgroundColor: isFocused ? color : 'transparent' }]} />
          </View>
        );
      case 'revenue':
        return (
          <Text style={[styles.revenueIcon, { color, fontWeight: isFocused ? 'bold' : 'normal' }]}>
            ¥
          </Text>
        );
      case 'history':
        return (
          <View style={[styles.historyIcon, { borderColor: color }]}>
            <View style={[styles.historyBar, { backgroundColor: isFocused ? color : 'transparent' }]} />
            <View style={[styles.historyBar, { backgroundColor: isFocused ? color : 'transparent', height: 8 }]} />
            <View style={[styles.historyBar, { backgroundColor: isFocused ? color : 'transparent', height: 12 }]} />
          </View>
        );
      case 'settings':
        return (
          <Text style={[styles.settingsIcon, { color, transform: [{ rotate: isFocused ? '45deg' : '0deg' }] }]}>
            ⚙
          </Text>
        );
      default:
        return <Text style={{ color }}>?</Text>;
    }
  };

  return (
    <View style={[styles.container, { opacity: focused ? 1 : 0.6 }]}>
      {getCustomIcon(name, focused)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
  customIcon: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeIcon: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  revenueIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  historyIcon: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: 18,
    height: 14,
  },
  historyBar: {
    width: 4,
    height: 6,
    borderRadius: 1,
  },
  settingsIcon: {
    fontSize: 20,
  },
});

export default TabBarIcon;