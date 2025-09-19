import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AnimationService } from '../services/AnimationService';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';
import { MusicPlayerService } from '../services/MusicPlayerService';
import GlobalPlayButton from './GlobalPlayButton';

import { MusicItem } from '../types/music';
import {
  selectMusicList,
  selectMusicCategories,
  selectPlayingTracks,
  selectMusicLoading,
  selectMusicError,
  loadMusicData,
  playMusic,
  clearError,
} from '../store/slices/musicSlice';
import {
  selectIsAddingFavorite,
  selectIsRemovingFavorite,
  toggleFavorite,
  loadFavorites,
} from '../store/slices/favoritesSlice';
import { RootState } from '../store';



interface MusicListComponentProps {
  style?: any;
  onMusicPlay?: (music: MusicItem) => void;
  onMusicPause?: () => void;
  onFavoriteToggle?: (music: MusicItem, isFavorited: boolean) => void;
}

const MusicListComponent: React.FC<MusicListComponentProps> = ({
  style,
  onMusicPlay,
  onMusicPause,
  onFavoriteToggle,
}) => {
  const dispatch = useDispatch();

  // Redux selectors
  const musicList = useSelector(selectMusicList);
  const categories = useSelector(selectMusicCategories);
  const playingTracks = useSelector(selectPlayingTracks);
  const loading = useSelector(selectMusicLoading);
  const error = useSelector(selectMusicError);
  const isAddingFavorite = useSelector(selectIsAddingFavorite);
  const isRemovingFavorite = useSelector(selectIsRemovingFavorite);

  // Local state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filteredMusic, setFilteredMusic] = useState<MusicItem[]>([]);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const cardAnimations = useRef<Map<string, {
    scale: Animated.Value;
    opacity: Animated.Value;
    pulse: Animated.Value;
    heartbeat: Animated.Value;
  }>>(new Map()).current;
  
  // Performance monitoring
  const { recordMetric } = usePerformanceMonitor({
    componentName: 'MusicListComponent',
    trackRender: true,
    trackMount: true,
  });

  // Load initial data
  useEffect(() => {
    const loadStartTime = Date.now();
    
    console.log('MusicListComponent: Loading music data...');
    dispatch(loadMusicData() as any);
    dispatch(loadFavorites() as any);
    
    // Start entrance animation
    AnimationService.createFadeInScale(fadeAnim, scaleAnim, { duration: 500 }).start();
    
    // Record load time
    const loadTime = Date.now() - loadStartTime;
    recordMetric('data_load_time', loadTime);
  }, [dispatch, fadeAnim, scaleAnim, recordMetric]);

  // Debug: Log data changes
  useEffect(() => {
    console.log('MusicListComponent: Music data updated', {
      musicListLength: musicList.length,
      categoriesLength: categories.length,
      loading,
      error,
    });
  }, [musicList, categories, loading, error]);

  // Filter music by category
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredMusic(musicList);
    } else {
      setFilteredMusic(musicList.filter(music => music.category === selectedCategory));
    }
  }, [musicList, selectedCategory]);

  // Initialize card animations for new music items
  useEffect(() => {
    const animationStartTime = Date.now();
    
    filteredMusic.forEach(music => {
      if (!cardAnimations.has(music.id)) {
        cardAnimations.set(music.id, {
          scale: new Animated.Value(1),
          opacity: new Animated.Value(1), // 立即显示，不等待动画
          pulse: new Animated.Value(1),
          heartbeat: new Animated.Value(1),
        });
        
        // 可选的入场动画（不阻塞显示）
        const cardAnim = cardAnimations.get(music.id)!;
        setTimeout(() => {
          AnimationService.createFadeIn(cardAnim.opacity, { 
            fromOpacity: 0.8,
            toOpacity: 1,
            duration: 200 
          }).start();
        }, 50);
      }
    });
    
    // Record animation setup time
    const animationSetupTime = Date.now() - animationStartTime;
    recordMetric('animation_setup_time', animationSetupTime);
    
    // Smart preload based on filtered music
    if (filteredMusic.length > 0) {
      MusicPlayerService.preloadAudioBatch(filteredMusic.slice(0, 5)).catch(error => {
        console.warn('Failed to preload audio batch:', error);
      });
    }
  }, [filteredMusic, cardAnimations, recordMetric]);

  // Animate playing state changes
  useEffect(() => {
    playingTracks.forEach(track => {
      const cardAnim = cardAnimations.get(track.music.id);
      if (cardAnim) {
        // Start pulse animation for playing tracks
        AnimationService.createPulse(cardAnim.pulse, {
          minScale: 0.98,
          maxScale: 1.02,
          duration: 2000,
        }).start();
      }
    });

    // Stop pulse animation for non-playing tracks
    cardAnimations.forEach((anim, musicId) => {
      const isPlaying = playingTracks.some(track => track.music.id === musicId);
      if (!isPlaying) {
        AnimationService.stopAndReset(anim.pulse, 1);
      }
    });
  }, [playingTracks, cardAnimations]);

  // Handle music card press (play/pause)
  const handleMusicPress = useCallback(async (music: MusicItem) => {
    try {
      const cardAnim = cardAnimations.get(music.id);
      
      // Animate button press
      if (cardAnim) {
        AnimationService.createBounce(cardAnim.scale, {
          fromScale: 0.95,
          toScale: 1,
          duration: 200,
        }).start();
      }
      
      const isCurrentlyPlaying = playingTracks.some(track => track.music.id === music.id);
      
      if (isCurrentlyPlaying) {
        onMusicPause?.();
      } else {
        onMusicPlay?.(music);
      }

      await dispatch(playMusic(music) as any);
    } catch (error) {
      console.error('Failed to toggle music playback:', error);
      Alert.alert('播放失败', '音乐播放出现问题，请重试');
    }
  }, [dispatch, playingTracks, onMusicPlay, onMusicPause, cardAnimations]);

  // Get favorites map for efficient lookup
  const favoritesMap = useSelector((state: RootState) => {
    const favorites = state.favorites.favorites;
    const map: Record<string, boolean> = {};
    favorites.forEach(fav => {
      map[fav.id] = true;
    });
    return map;
  });

  // Handle favorite toggle
  const handleFavoritePress = useCallback(async (music: MusicItem, event: any) => {
    // Prevent triggering music play when pressing favorite button
    event.stopPropagation();
    
    try {
      const cardAnim = cardAnimations.get(music.id);
      const wasAlreadyFavorited = favoritesMap[music.id] || false;
      
      // Animate favorite button
      if (cardAnim) {
        if (!wasAlreadyFavorited) {
          // Heartbeat animation for adding to favorites
          AnimationService.createHeartbeat(cardAnim.heartbeat, {
            duration: 600,
            maxScale: 1.3,
          }).start();
        } else {
          // Simple scale animation for removing from favorites
          AnimationService.createScale(cardAnim.heartbeat, {
            fromScale: 1.1,
            toScale: 1,
            duration: 200,
          }).start();
        }
      }
      
      await dispatch(toggleFavorite(music) as any);
      
      // Call callback if provided
      onFavoriteToggle?.(music, !wasAlreadyFavorited);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      Alert.alert('操作失败', '收藏操作失败，请重试');
    }
  }, [dispatch, onFavoriteToggle, favoritesMap, cardAnimations]);

  // Handle category selection
  const handleCategoryPress = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
  }, []);

  // Clear error when component unmounts or error changes
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  // Render category filter
  const renderCategoryFilter = () => (
    <View style={styles.categoryContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScrollContent}
      >
        <TouchableOpacity
          style={[
            styles.categoryButton,
            selectedCategory === 'all' && styles.categoryButtonActive
          ]}
          onPress={() => handleCategoryPress('all')}
        >
          <Text style={styles.categoryIcon}>🎵</Text>
          <Text style={[
            styles.categoryText,
            selectedCategory === 'all' && styles.categoryTextActive
          ]}>
            全部
          </Text>
        </TouchableOpacity>

        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonActive
            ]}
            onPress={() => handleCategoryPress(category.id)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={[
              styles.categoryText,
              selectedCategory === category.id && styles.categoryTextActive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render music item card with animations
  const renderMusicCard = (music: MusicItem) => {
    const isPlaying = playingTracks.some(track => track.music.id === music.id);
    const isFavorited = favoritesMap[music.id] || false;
    const isFavoriteLoading = (isAddingFavorite || isRemovingFavorite);
    
    const cardAnim = cardAnimations.get(music.id);
    
    // 如果动画未准备好，使用默认值渲染
    const animationStyle = cardAnim ? {
      opacity: cardAnim.opacity,
      transform: [
        { scale: Animated.multiply(cardAnim.scale, cardAnim.pulse) }
      ],
    } : {
      opacity: 1,
      transform: [{ scale: 1 }],
    };

    return (
      <Animated.View
        key={music.id}
        style={[animationStyle]}
      >
        <TouchableOpacity
          style={[
            styles.musicCard,
            isPlaying && styles.musicCardPlaying
          ]}
          onPress={() => handleMusicPress(music)}
          activeOpacity={0.7}
        >
          <View style={styles.musicCardContent}>
            {/* Left side - Icon and info */}
            <View style={styles.musicCardLeft}>
              <Text style={styles.musicIcon}>{music.icon}</Text>
              <View style={styles.musicInfo}>
                <Text style={styles.musicTitle}>{music.title}</Text>
                <View style={styles.musicMeta}>
                  <Text style={styles.musicCategory}>
                    {categories.find(cat => cat.id === music.category)?.name || music.category}
                  </Text>
                  <Text style={styles.musicMetaDot}>•</Text>
                  <Text style={styles.musicLoop}>循环播放</Text>
                </View>
              </View>
            </View>

            {/* Right side - Control buttons */}
            <View style={styles.controlButtons}>
              {/* Play/Pause Button */}
              <TouchableOpacity
                style={[
                  styles.playButton,
                  isPlaying && styles.playButtonActive
                ]}
                onPress={(event) => {
                  event.stopPropagation();
                  handleMusicPress(music);
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.playButtonIcon,
                  isPlaying && styles.playButtonIconActive
                ]}>
                  {isPlaying ? '⏸️' : '▶️'}
                </Text>
              </TouchableOpacity>

              {/* Favorite button */}
              <Animated.View
                style={{
                  transform: [{ scale: cardAnim?.heartbeat || new Animated.Value(1) }]
                }}
              >
                <TouchableOpacity
                  style={styles.favoriteButton}
                  onPress={(event) => handleFavoritePress(music, event)}
                  disabled={isFavoriteLoading}
                >
                  {isFavoriteLoading ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <Text style={[
                      styles.favoriteIcon,
                      isFavorited && styles.favoriteIconActive
                    ]}>
                      {isFavorited ? '❤️' : '🤍'}
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>

          {/* Playing indicator with pulse animation */}
          {isPlaying && (
            <Animated.View 
              style={[
                styles.playingIndicator,
                cardAnim && {
                  opacity: cardAnim.pulse.interpolate({
                    inputRange: [0.98, 1.02],
                    outputRange: [0.7, 1],
                  }),
                }
              ]}
            >
              <Animated.View 
                style={[
                  styles.playingDot,
                  cardAnim && {
                    transform: [{ scale: cardAnim.pulse }]
                  }
                ]} 
              />
              <Text style={styles.playingText}>正在播放</Text>
            </Animated.View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Render loading state
  if (loading && musicList.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>加载音乐资源中...</Text>
      </View>
    );
  }

  // Render error state
  if (error && musicList.length === 0) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Text style={styles.errorIcon}>😔</Text>
        <Text style={styles.errorTitle}>加载失败</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => dispatch(loadMusicData() as any)}
        >
          <Text style={styles.retryButtonText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View 
      style={[
        styles.container, 
        style,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>自然音乐</Text>
            <Text style={styles.headerSubtitle}>
              {playingTracks.length > 0 
                ? `正在播放 ${playingTracks.length} 首音乐` 
                : '选择您喜欢的自然声音'
              }
            </Text>
          </View>
          
          {/* Global Play Button */}
          {playingTracks.length > 0 && (
            <GlobalPlayButton
              size="medium"
              variant="filled"
              style={styles.globalPlayButton}
              onPress={(isPlaying) => {
                console.log(`Global playback ${isPlaying ? 'started' : 'paused'}`);
              }}
            />
          )}
        </View>
      </View>

      {/* Category Filter */}
      {renderCategoryFilter()}

      {/* Music List */}
      <ScrollView 
        style={styles.musicScrollView}
        contentContainerStyle={styles.musicScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredMusic.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎵</Text>
            <Text style={styles.emptyTitle}>暂无音乐</Text>
            <Text style={styles.emptyText}>
              {selectedCategory === 'all' 
                ? '音乐资源加载中，请稍候...' 
                : '该分类下暂无音乐资源'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.musicGrid}>
            {filteredMusic.map((music) => renderMusicCard(music))}
          </View>
        )}
      </ScrollView>

      {/* Error toast */}
      {error && (
        <Animated.View 
          style={[
            styles.errorToast,
            {
              opacity: fadeAnim,
            }
          ]}
        >
          <Text style={styles.errorToastText}>{error}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  // Loading state
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Error state
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  globalPlayButton: {
    marginLeft: 16,
  },

  // Category filter
  categoryContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#6366F1',
    fontWeight: '600',
  },

  // Music list
  musicScrollView: {
    flex: 1,
  },
  musicScrollContent: {
    padding: 16,
  },
  musicGrid: {
    gap: 12,
  },

  // Music card
  musicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  musicCardPlaying: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
    shadowColor: '#10B981',
    shadowOpacity: 0.15,
  },
  musicCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  musicCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  musicIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  musicInfo: {
    flex: 1,
  },
  musicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  musicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  musicCategory: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  musicMetaDot: {
    fontSize: 14,
    color: '#D1D5DB',
    marginHorizontal: 6,
  },
  musicLoop: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Control buttons container
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },

  // Play/Pause button
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  playButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  playButtonIcon: {
    fontSize: 18,
  },
  playButtonIconActive: {
    // Active state handled by emoji change
  },

  // Favorite button
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    fontSize: 18,
  },
  favoriteIconActive: {
    // Active state handled by emoji change
  },

  // Playing indicator
  playingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  playingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  playingText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Error toast
  errorToast: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorToastText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
});

export default MusicListComponent;