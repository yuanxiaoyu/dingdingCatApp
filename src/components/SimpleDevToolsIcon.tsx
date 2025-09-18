import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SimpleDevToolsIconProps {
  size?: number;
}

/**
 * SimpleDevToolsIcon - A simple text-based dev tools icon
 */
const SimpleDevToolsIcon: React.FC<SimpleDevToolsIconProps> = ({ size = 32 }) => {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.icon, { fontSize: size * 0.5 }]}>
        丁丁猫
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1890FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 11,
  },
});

export default SimpleDevToolsIcon;