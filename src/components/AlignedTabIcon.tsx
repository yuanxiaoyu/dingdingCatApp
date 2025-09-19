import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AlignedTabIconProps {
  name: 'home' | 'settings';
  focused: boolean;
  color: string;
  size?: number;
}

/**
 * AlignedTabIcon - Perfectly aligned tab bar icons
 */
const AlignedTabIcon: React.FC<AlignedTabIconProps> = ({ name, focused, color, size = 22 }) => {
  
  // 获取图标字符
  const getIcon = (iconName: string): string => {
    const icons = {
      home: '⌂',      // House symbol
      settings: '⚙',   // Gear
    };
    
    return icons[iconName as keyof typeof icons] || '?';
  };

  return (
    <View style={styles.iconContainer}>
      <View style={styles.iconWrapper}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 24,
  },
});

export default AlignedTabIcon;