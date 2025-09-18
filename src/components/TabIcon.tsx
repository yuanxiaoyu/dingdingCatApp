import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TabIconProps {
  name: string;
  focused: boolean;
  color: string;
  size?: number;
}

/**
 * TabIcon - Custom tab bar icon component with font icons
 */
const TabIcon: React.FC<TabIconProps> = ({ name, focused, color, size = 24 }) => {
  // 字体图标映射
  const getIconText = (iconName: string, isFocused: boolean): string => {
    const icons = {
      home: isFocused ? '🏠' : '🏡',
      revenue: isFocused ? '💰' : '💸', 
      history: isFocused ? '📊' : '📈',
      settings: isFocused ? '⚙️' : '🔧',
    };
    
    // 使用更专业的字体图标字符
    const fontIcons = {
      home: isFocused ? '●' : '○',
      revenue: isFocused ? '¥' : '¥',
      history: isFocused ? '■' : '□',
      settings: isFocused ? '★' : '☆',
    };
    
    // 优先使用emoji，如果需要可以切换到fontIcons
    return icons[iconName as keyof typeof icons] || '?';
  };

  // 获取更好的字体图标
  const getBetterIcon = (iconName: string, isFocused: boolean): string => {
    const iconMap = {
      home: isFocused ? '🏠' : '🏡',
      revenue: isFocused ? '💰' : '💸',
      history: isFocused ? '📊' : '📈', 
      settings: isFocused ? '⚙️' : '🔧',
    };
    
    return iconMap[iconName as keyof typeof iconMap] || '?';
  };

  return (
    <View style={styles.container}>
      <Text 
        style={[
          styles.icon, 
          { 
            color, 
            fontSize: size,
            opacity: focused ? 1 : 0.7,
          }
        ]}
      >
        {getBetterIcon(name, focused)}
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

export default TabIcon;