import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FontTabIconProps {
  name: 'home' | 'revenue' | 'history' | 'settings';
  focused: boolean;
  color: string;
  size?: number;
}

/**
 * FontTabIcon - Professional font-based tab bar icons
 */
const FontTabIcon: React.FC<FontTabIconProps> = ({ name, focused, color, size = 24 }) => {
  
  // 使用专业的字体图标字符
  const getFontIcon = (iconName: string, isFocused: boolean): string => {
    // 使用Unicode字符创建专业图标
    const icons = {
      home: '⌂',      // House symbol
      revenue: '¥',    // Yen symbol
      history: '⧖',    // Hourglass with flowing sand
      settings: '⚙',   // Gear
    };
    
    return icons[iconName as keyof typeof icons] || '?';
  };

  // 使用更好的Unicode符号
  const getBetterIcon = (iconName: string, isFocused: boolean): string => {
    const icons = {
      home: '⌂',       // House
      revenue: '¥',     // Yen
      history: '⧗',     // Black hourglass  
      settings: '⚙',    // Gear
    };
    
    return icons[iconName as keyof typeof icons] || '?';
  };

  // 使用几何图形
  const getGeometricIcon = (iconName: string, isFocused: boolean): string => {
    const focusedIcons = {
      home: '▲',       // Filled triangle
      revenue: '●',     // Filled circle
      history: '■',     // Filled square
      settings: '◆',    // Filled diamond
    };
    
    const normalIcons = {
      home: '△',       // Empty triangle
      revenue: '○',     // Empty circle  
      history: '□',     // Empty square
      settings: '◇',    // Empty diamond
    };
    
    const iconSet = isFocused ? focusedIcons : normalIcons;
    return iconSet[iconName as keyof typeof iconSet] || '?';
  };

  // 创建自定义样式的图标
  const renderCustomIcon = (iconName: string, isFocused: boolean) => {
    const baseStyle = {
      color,
      fontSize: size,
      fontWeight: isFocused ? 'bold' : 'normal',
    };

    switch (iconName) {
      case 'home':
        return (
          <Text style={[baseStyle, styles.homeIcon]}>
            ⌂
          </Text>
        );
      case 'revenue':
        return (
          <Text style={[baseStyle, styles.revenueIcon]}>
            ¥
          </Text>
        );
      case 'history':
        return (
          <Text style={[baseStyle, styles.historyIcon]}>
            ⧗
          </Text>
        );
      case 'settings':
        return (
          <Text style={[baseStyle, styles.settingsIcon, { 
            transform: [{ rotate: isFocused ? '90deg' : '0deg' }] 
          }]}>
            ⚙
          </Text>
        );
      default:
        return <Text style={baseStyle}>?</Text>;
    }
  };

  return (
    <View style={[styles.container, { opacity: focused ? 1 : 0.6 }]}>
      {renderCustomIcon(name, focused)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    flex: 1,
  },
  homeIcon: {
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 24,
  },
  revenueIcon: {
    textAlign: 'center',
    textAlignVertical: 'center',
    fontWeight: 'bold',
    lineHeight: 24,
  },
  historyIcon: {
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 24,
  },
  settingsIcon: {
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 24,
  },
});

export default FontTabIcon;