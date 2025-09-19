/**
 * HomeScreen - Main application interface
 * 
 * Features:
 * - User information card with avatar, nickname, and today's revenue
 * - 4 ad type buttons (splash, video, interstitial, banner)
 * - Quick statistics card showing total revenue and watch count
 * - Integration with AdService for ad requests and playback
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSelector } from 'react-redux';

import {
  selectUser,
  selectIsAuthenticated,
  selectAuthLoading
} from '../store/slices/authSlice';
import { ENV_CONFIG } from '../config/env';
import DevTools from '../components/DevTools';
import BannerAdComponent from '../components/BannerAdComponent';
import MusicListComponent from '../components/MusicListComponent';




const HomeScreen: React.FC = () => {
  // Redux state
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authLoading = useSelector(selectAuthLoading);

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);

  // Handle banner ad click
  const handleBannerAdClick = useCallback((adData: any) => {
    console.log('Banner ad clicked:', adData);
  }, []);

  // Handle banner ad error
  const handleBannerAdError = useCallback((error: Error) => {
    console.error('Banner ad error:', error);
    // 静默处理Banner广告错误，不影响用户体验
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // 简化刷新逻辑，主要用于音乐组件的刷新
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // Show loading screen if not authenticated
  if (!isAuthenticated || authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with App Title */}
      <View style={styles.header}>
        {/* Header Background Pattern */}
        <View style={styles.headerBackground}>
          <View style={styles.headerCircle1} />
          <View style={styles.headerCircle2} />
          <View style={styles.headerCircle3} />
        </View>

        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.appTitle}>丁丁猫</Text>
            <View style={styles.titleUnderline} />
          </View>
        </View>

        {/* Dev Tools Button (Debug Mode Only) - Hidden but accessible */}
        {ENV_CONFIG.DEBUG_MODE && (
          <TouchableOpacity
            style={styles.hiddenDevToolsButton}
            onPress={() => setShowDevTools(true)}
          >
            <View style={styles.hiddenDevToolsArea} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1890FF']}
            tintColor="#1890FF"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Ad - 顶部横幅广告 */}
        <BannerAdComponent
          userId={user?.userId || ''}
          onAdClick={handleBannerAdClick}
          onAdError={handleBannerAdError}
        />

        {/* Music List Component - 音乐播放器 */}
        <MusicListComponent
          style={styles.musicListContainer}
          onMusicPlay={(music) => {
            console.log('Music started playing:', music.title);
          }}
          onMusicPause={() => {
            console.log('Music paused');
          }}
          onFavoriteToggle={(music, isFavorited) => {
            console.log(`Music ${music.title} ${isFavorited ? 'added to' : 'removed from'} favorites`);
          }}
        />
      </ScrollView>

      {/* Dev Tools Modal */}
      <DevTools
        visible={showDevTools}
        onClose={() => setShowDevTools(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Header Styles
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.03,
  },
  headerCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3B82F6',
    top: -40,
    left: -20,
  },
  headerCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    top: -10,
    right: -10,
  },
  headerCircle3: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F59E0B',
    bottom: -20,
    left: '50%',
    marginLeft: -30,
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 0,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  titleUnderline: {
    width: 24,
    height: 2,
    backgroundColor: '#3B82F6',
    borderRadius: 1,
    marginTop: 4,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
    marginTop: 2,
  },
  hiddenDevToolsButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hiddenDevToolsArea: {
    width: 20,
    height: 20,
    backgroundColor: 'transparent',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  
  // Music List Container
  musicListContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },


});

export default HomeScreen;