import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SimpleTabBarIconProps {
  name: 'home' | 'revenue' | 'history' | 'settings';
  focused: boolean;
  color: string;
  size?: number;
}

/**
 * SimpleTabBarIcon - Properly aligned tab bar icon implementation
 */
const SimpleTabBarIcon: React.FC<SimpleTabBarIconProps> = ({ name, focused, color, size = 24 }) => {
  
  // 获取图标字符
  const getIcon = (iconName: string): string => {
    const icons = {
      home: '⌂',      // House symbol
      revenue: '¥',    // Yen symbol
      history: '⧗',    // Hourglass
      settings: '⚙',   // Gear
    };
    
    return icons[iconName as keyof typeof icons] || '?';
  };

  return (
    <View style={styles.container}>
      <Text 
        style={[
          styles.iconText,
          {
            color,
            fontSize: size,
            fontWeight: focused ? '600' : '400',
            transform: name === 'settings' && focused ? [{ rotate: '90deg' }] : [{ rotate: '0deg' }],
          }
        ]}
      >
        {getIcon(name)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 28,
  },
});

export default SimpleTabBarIcon;