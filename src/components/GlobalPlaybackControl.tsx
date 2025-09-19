import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AnimationService } from '../services/AnimationService';
import { 
  selectIsPlaying, 
  selectPlayingTracks, 
  selectMasterVolume,
  pauseAllMusic,
  resumeAllMusic,
  stopAllMusic,
  setMasterVolume,
} from '../store/slices/musicSlice';

const { width: screenWidth } = Dimensions.get('window');

interface GlobalPlaybackControlProps {
  style?: any;
  position?: 'bottom' | 'top' | 'floating';
  showVolumeControl?: boolean;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

const GlobalPlaybackControl: React.FC<GlobalPlaybackControlProps> = ({
  style,
  position = 'bottom',
  showVolumeControl = true,
  onPlayStateChange,
}) => {
  const dispatch = useDispatch();
  
  // Redux selectors
  const isPlaying = useSelector(selectIsPlaying);
  const playingTracks = useSelector(selectPlayingTracks);
  const masterVolume = useSelector(selectMasterVolume);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const playButtonScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const volumeSlideAnim = useRef(new Animated.Value(showVolumeControl ? 1 : 0)).current;

  // Show/hide control based on playing tracks
  useEffect(() => {
    if (playingTracks.length > 0) {
      // Show control with animation
      AnimationService.createFadeInScale(fadeAnim, scaleAnim, { duration: 300 }).start();
    } else {
      // Hide control with animation
      AnimationService.createFadeOutScale(fadeAnim, scaleAnim, { duration: 300 }).start();
    }
  }, [playingTracks.length, fadeAnim, scaleAnim]);

  // Animate play button when playing state changes
  useEffect(() => {
    if (isPlaying) {
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
  }, [isPlaying, pulseAnim]);

  // Animate volume control visibility
  useEffect(() => {
    const targetValue = showVolumeControl ? 1 : 0;
    AnimationService.createFadeIn(volumeSlideAnim, {
      fromOpacity: 0,
      toOpacity: targetValue,
      duration: 200,
    }).start();
  }, [showVolumeControl, volumeSlideAnim]);

  // Handle play/pause button press
  const handlePlayPausePress = async () => {
    try {
      // Animate button press
      AnimationService.createBounce(playButtonScale, {
        fromScale: 0.9,
        toScale: 1,
        duration: 150,
      }).start();

      if (isPlaying) {
        await dispatch(pauseAllMusic() as any);
        onPlayStateChange?.(false);
      } else {
        await dispatch(resumeAllMusic() as any);
        onPlayStateChange?.(true);
      }
    } catch (error) {
      console.error('Failed to toggle playback:', error);
    }
  };

  // Handle stop button press
  const handleStopPress = async () => {
    try {
      await dispatch(stopAllMusic() as any);
      onPlayStateChange?.(false);
    } catch (error) {
      console.error('Failed to stop playback:', error);
    }
  };

  // Handle volume change
  const handleVolumeChange = async (newVolume: number) => {
    try {
      await dispatch(setMasterVolume(newVolume) as any);
    } catch (error) {
      console.error('Failed to set volume:', error);
    }
  };

  // Don't render if no tracks are playing
  if (playingTracks.length === 0) {
    return null;
  }

  const containerStyle = [
    styles.container,
    position === 'floating' && styles.floating,
    position === 'top' && styles.top,
    position === 'bottom' && styles.bottom,
    style,
  ];

  return (
    <Animated.View
      style={[
        containerStyle,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        {/* Track Info */}
        <View style={styles.trackInfo}>
          <Text style={styles.trackCount}>
            {playingTracks.length} 首音乐
          </Text>
          <Text style={styles.trackStatus}>
            {isPlaying ? '正在播放' : '已暂停'}
          </Text>
        </View>

        {/* Control Buttons */}
        <View style={styles.controls}>
          {/* Play/Pause Button */}
          <Animated.View
            style={{
              transform: [
                { scale: Animated.multiply(playButtonScale, pulseAnim) }
              ],
            }}
          >
            <TouchableOpacity
              style={[
                styles.playButton,
                isPlaying && styles.playButtonActive,
              ]}
              onPress={handlePlayPausePress}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.playButtonIcon,
                isPlaying && styles.playButtonIconActive,
              ]}>
                {isPlaying ? '⏸️' : '▶️'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Stop Button */}
          <TouchableOpacity
            style={styles.stopButton}
            onPress={handleStopPress}
            activeOpacity={0.7}
          >
            <Text style={styles.stopButtonIcon}>⏹️</Text>
          </TouchableOpacity>
        </View>

        {/* Volume Control */}
        {showVolumeControl && (
          <Animated.View
            style={[
              styles.volumeContainer,
              {
                opacity: volumeSlideAnim,
                transform: [
                  {
                    scaleX: volumeSlideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.volumeIcon}>🔊</Text>
            <View style={styles.volumeSlider}>
              <View style={styles.volumeTrack}>
                <View
                  style={[
                    styles.volumeFill,
                    { width: `${masterVolume * 100}%` },
                  ]}
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.volumeThumb,
                  { left: `${masterVolume * 100 - 2}%` },
                ]}
                onPress={() => {
                  // Simple volume toggle for demo
                  const newVolume = masterVolume > 0.5 ? 0.3 : 0.8;
                  handleVolumeChange(newVolume);
                }}
              />
            </View>
            <Text style={styles.volumeText}>
              {Math.round(masterVolume * 100)}%
            </Text>
          </Animated.View>
        )}
      </View>

      {/* Playing Indicator */}
      {isPlaying && (
        <Animated.View
          style={[
            styles.playingIndicator,
            {
              opacity: pulseAnim.interpolate({
                inputRange: [0.95, 1.05],
                outputRange: [0.6, 1],
              }),
            },
          ]}
        >
          <View style={styles.playingDot} />
          <View style={styles.playingDot} />
          <View style={styles.playingDot} />
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  // Position styles
  floating: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  
  top: {
    marginTop: 16,
  },
  
  bottom: {
    marginBottom: 16,
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Track Info
  trackInfo: {
    flex: 1,
  },
  trackCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  trackStatus: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  
  playButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  
  playButtonIcon: {
    fontSize: 20,
  },
  
  playButtonIconActive: {
    // Active state handled by emoji
  },
  
  stopButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  stopButtonIcon: {
    fontSize: 16,
  },

  // Volume Control
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    maxWidth: 120,
  },
  
  volumeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  
  volumeSlider: {
    flex: 1,
    height: 20,
    justifyContent: 'center',
    marginRight: 8,
  },
  
  volumeTrack: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    position: 'relative',
  },
  
  volumeFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 2,
  },
  
  volumeThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#6366F1',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  volumeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    minWidth: 30,
    textAlign: 'right',
  },

  // Playing Indicator
  playingIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  
  playingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 1,
  },
});

export default GlobalPlaybackControl;