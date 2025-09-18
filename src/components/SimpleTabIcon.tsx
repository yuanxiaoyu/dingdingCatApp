import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SimpleTabIconProps {
  name: 'home' | 'revenue' | 'history' | 'settings';
  focused: boolean;
  color: string;
  size?: number;
}

/**
 * SimpleTabIcon - Clean and simple tab bar icons
 */
const SimpleTabIcon: React.FC<SimpleTabIconProps> = ({ name, focused, color, size = 24 }) => {
  
  // 使用简洁的文字图标
  const getTextIcon = (iconName: string): string => {
    const icons = {
      home: '首页',
      revenue: '收益', 
      history: '历史',
      settings: '设置',
    };
    
    return icons[iconName as keyof typeof icons] || '?';
  };

  // 使用符号图标
  const getSymbolIcon = (iconName: string, isFocused: boolean): string => {
    const icons = {
      home: isFocused ? '●' : '○',
      revenue: '¥',
      history: isFocused ? '▊' : '▌', 
      settings: isFocused ? '⚙' : '○',
    };
    
    return icons[iconName as keyof typeof icons] || '?';
  };

  // 使用emoji但更精简
  const getCleanIcon = (iconName: string): string => {
    const icons = {
      home: '🏠',
      revenue: '💰',
      history: '📊', 
      settings: '⚙️',
    };
    
    return icons[iconName as keyof typeof icons] || '?';
  };

  return (
    <View style={[styles.container, { opacity: focused ? 1 : 0.7 }]}>
      <Text style={[styles.icon, { color, fontSize: size }]}>
        {getCleanIcon(name)}
      </Text>
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
  icon: {
    textAlign: 'center',
    lineHeight: 28,
  },
});

export default SimpleTabIcon;