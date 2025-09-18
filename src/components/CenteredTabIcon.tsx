import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CenteredTabIconProps {
  name: 'home' | 'revenue' | 'history' | 'settings';
  focused: boolean;
  color: string;
  size?: number;
}

/**
 * CenteredTabIcon - Properly centered tab bar icons
 */
const CenteredTabIcon: React.FC<CenteredTabIconProps> = ({ name, focused, color, size = 22 }) => {
  
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
    <View style={styles.iconContainer}>
      <Text 
        style={[
          styles.iconText, 
          {
            color,
            fontSize: size,
            fontWeight: focused ? '600' : '400',
            opacity: focused ? 1 : 0.7,
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
  iconContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: -2,
  },
  iconText: {
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 24,
  },
});

export default CenteredTabIcon;