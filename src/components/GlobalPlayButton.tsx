import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AnimationService } from '../services/AnimationService';
import { 
  selectIsPlaying, 
  selectPlayingTracks,
  toggleGlobalPlayback,
} from '../store/slices/musicSlice';

interface GlobalPlayButtonProps {
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
  variant?: 'filled' | 'outlined' | 'minimal';
  onPress?: (isPlaying: boolean) => void;
}

const GlobalPlayButton: React.FC<GlobalPlayButtonProps> = ({
  style,
  size = 'medium',
  variant = 'filled',
  onPress,
}) => {
  const dispatch = useDispatch();
  
  // Redux selectors
  const isPlaying = useSelector(selectIsPlaying);
  const playingTracks = useSelector(selectPlayingTracks);
  
  // Animation refs
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(playingTracks.length > 0 ? 1 : 0.5)).current;

  // Show/hide button based on playing tracks
  useEffect(() => {
    const targetOpacity = playingTracks.length > 0 ? 1 : 0.5;
    AnimationService.createFadeIn(fadeAnim, {
      fromOpacity: 0,
      toOpacity: targetOpacity,
      duration: 300,
    }).start();
  }, [playingTracks.length, fadeAnim]);

  // Animate when playing state changes
  useEffect(() => {
    if (isPlaying && playingTracks.length > 0) {
      // Start pulse animation when playing
      AnimationService.createPulse(pulseAnim, {
        minScale: 0.95,
        maxScale: 1.05,
        duration: 2000,
      }).start();
    } else {
      // Stop pulse animation when paused
      AnimationService.stopAndReset(pulseAnim, 1);
    }
  }, [isPlaying, playingTracks.length, pulseAnim]);

  // Handle button press
  const handlePress = async () => {
    if (playingTracks.length === 0) {
      return; // No tracks to control
    }

    try {
      // Animate button press
      AnimationService.createBounce(scaleAnim, {
        fromScale: 0.9,
        toScale: 1,
        duration: 150,
      }).start();

      await dispatch(toggleGlobalPlayback() as any);
      onPress?.(!isPlaying);
    } catch (error) {
      console.error('Failed to toggle global playback:', error);
    }
  };

  // Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: 36,
          height: 36,
          borderRadius: 18,
          iconSize: 14,
        };
      case 'large':
        return {
          width: 64,
          height: 64,
          borderRadius: 32,
          iconSize: 24,
        };
      default: // medium
        return {
          width: 48,
          height: 48,
          borderRadius: 24,
          iconSize: 18,
        };
    }
  };

  // Get variant styles
  const getVariantStyles = () => {
    const baseColor = isPlaying ? '#10B981' : '#6366F1';
    
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: baseColor,
          iconColor: baseColor,
        };
      case 'minimal':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
          borderColor: 'transparent',
          iconColor: baseColor,
        };
      default: // filled
        return {
          backgroundColor: baseColor,
          borderWidth: 0,
          borderColor: 'transparent',
          iconColor: '#FFFFFF',
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [
            { scale: Animated.multiply(scaleAnim, pulseAnim) }
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          {
            width: sizeStyles.width,
            height: sizeStyles.height,
            borderRadius: sizeStyles.borderRadius,
            backgroundColor: variantStyles.backgroundColor,
            borderWidth: variantStyles.borderWidth,
            borderColor: variantStyles.borderColor,
          },
          style,
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
        disabled={playingTracks.length === 0}
      >
        <Text
          style={[
            styles.icon,
            {
              fontSize: sizeStyles.iconSize,
              color: variantStyles.iconColor,
            },
          ]}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    textAlign: 'center',
  },
});

export default GlobalPlayButton;