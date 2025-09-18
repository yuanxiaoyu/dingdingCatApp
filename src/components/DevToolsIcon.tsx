import React, { useState } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

interface DevToolsIconProps {
  size?: number;
}

/**
 * DevToolsIcon - A component that tries to load the app icon, falls back to emoji
 */
const DevToolsIcon: React.FC<DevToolsIconProps> = ({ size = 32 }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const iconSize = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <View style={[styles.container, iconSize]}>
      {/* Try to load the app icon */}
      {!imageError && (
        <Image
          source={require('../assets/images/app_icon.png')}
          style={[styles.image, iconSize]}
          resizeMode="contain"
          onLoad={() => {
            console.log('DevTools icon loaded successfully');
            setImageLoaded(true);
          }}
          onError={(error) => {
            console.log('Failed to load DevTools icon:', error);
            setImageError(true);
          }}
        />
      )}
      
      {/* Fallback to emoji if image fails or hasn't loaded yet */}
      {(imageError || !imageLoaded) && (
        <Text style={[styles.fallbackIcon, { fontSize: size * 0.6 }]}>
          🛠️
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  image: {
    position: 'absolute',
  },
  fallbackIcon: {
    textAlign: 'center',
  },
});

export default DevToolsIcon;