/**
 * HomeScreen - Main application interface
 * 
 * Features:
 * - User information card with avatar, nickname, and today's revenue
 * - 4 ad type buttons (splash, video, interstitial, banner)
 * - Quick statistics card showing total revenue and watch count
 * - Integration with AdService for ad requests and playback
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { 
  selectUser, 
  selectIsAuthenticated,
  selectAuthLoading 
} from '../store/slices/authSlice';
import { 
  selectRevenueData,
  selectAdLoading,
  selectAdError,
  fetchUserRevenue,
  requestAd,
  reportAdShow,
  reportAdClick,
  reportAdComplete,
  clearError
} from '../store/slices/adSlice';
import { AdType } from '../types';
import { ENV_CONFIG } from '../config/env';

// Ad type configuration for buttons
const AD_TYPE_CONFIG = [
  {
    type: AdType.SPLASH,
    title: '开屏广告',
    description: '应用启动时展示',
    icon: '🚀',
    color: '#FF6B6B',
  },
  {
    type: AdType.REWARD_VIDEO,
    title: '视频激励广告',
    description: '观看完整视频获得奖励',
    icon: '🎬',
    color: '#4ECDC4',
  },
  {
    type: AdType.INTERSTITIAL,
    title: '插屏广告',
    description: '全屏展示广告',
    icon: '📱',
    color: '#45B7D1',
  },
  {
    type: AdType.BANNER,
    title: 'Banner广告',
    description: '页面底部横幅广告',
    icon: '📰',
    color: '#96CEB4',
  },
];

const HomeScreen: React.FC = () => {
  const dispatch = useDispatch();
  
  // Redux state
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authLoading = useSelector(selectAuthLoading);
  const revenueData = useSelector(selectRevenueData);
  const adLoading = useSelector(selectAdLoading);
  const adError = useSelector(selectAdError);

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [loadingAdType, setLoadingAdType] = useState<AdType | null>(null);

  // Load initial data
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserRevenue();
    }
  }, [isAuthenticated, user]);

  // Clear ad errors when component mounts
  useEffect(() => {
    if (adError) {
      dispatch(clearError());
    }
  }, []);

  // Load user revenue data
  const loadUserRevenue = useCallback(async () => {
    if (!user) return;
    
    try {
      await dispatch(fetchUserRevenue({
        userId: user.userId,
        appKey: user.appKey,
      })).unwrap();
    } catch (error) {
      console.error('Failed to load user revenue:', error);
    }
  }, [dispatch, user]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserRevenue();
    setRefreshing(false);
  }, [loadUserRevenue]);

  // Handle ad button press
  const handleAdButtonPress = useCallback(async (adType: AdType) => {
    if (!user || !isAuthenticated) {
      Alert.alert('错误', '请先登录');
      return;
    }

    if (loadingAdType) {
      Alert.alert('请稍候', '正在处理其他广告请求');
      return;
    }

    setLoadingAdType(adType);

    try {
      // 1. Request ad from server
      const adResponse = await dispatch(requestAd({
        userId: user.userId,
        appKey: user.appKey,
        adType,
        deviceType: 'android', // TODO: Get from device info
      })).unwrap();

      // 2. Report ad show
      await dispatch(reportAdShow({
        userId: user.userId,
        appKey: user.appKey,
        adId: adResponse.adId,
        adType: adResponse.adType,
        showTime: Date.now(),
      })).unwrap();

      // 3. Simulate ad playback (in real implementation, this would be handled by Pangle SDK)
      const playDuration = getSimulatedPlayDuration(adType);
      const isClicked = Math.random() > 0.7; // 30% click rate simulation

      // 4. Report ad click if clicked
      if (isClicked) {
        await dispatch(reportAdClick({
          userId: user.userId,
          appKey: user.appKey,
          adId: adResponse.adId,
          adType: adResponse.adType,
          clickTime: Date.now(),
        })).unwrap();
      }

      // 5. Report ad complete and get reward
      const rewardAmount = await dispatch(reportAdComplete({
        userId: user.userId,
        appKey: user.appKey,
        adId: adResponse.adId,
        adType: adResponse.adType,
        playDuration,
        isClicked: isClicked ? '1' : '0',
        stayDuration: playDuration + Math.floor(Math.random() * 5),
        completeTime: Date.now(),
      })).unwrap();

      // Show success message
      Alert.alert(
        '广告播放完成',
        `恭喜获得 ${typeof rewardAmount === 'number' ? rewardAmount.toFixed(2) : adResponse.expectedReward.toFixed(2)} 元奖励！`,
        [{ text: '确定', onPress: () => loadUserRevenue() }]
      );

    } catch (error: any) {
      console.error(`Failed to play ${adType} ad:`, error);
      Alert.alert(
        '广告播放失败',
        error.message || '请稍后重试',
        [{ text: '确定' }]
      );
    } finally {
      setLoadingAdType(null);
    }
  }, [dispatch, user, isAuthenticated, loadingAdType, loadUserRevenue]);

  // Get simulated play duration based on ad type
  const getSimulatedPlayDuration = (adType: AdType): number => {
    switch (adType) {
      case AdType.SPLASH:
        return 3; // 3 seconds
      case AdType.REWARD_VIDEO:
        return 30; // 30 seconds
      case AdType.INTERSTITIAL:
        return 5; // 5 seconds
      case AdType.BANNER:
        return 10; // 10 seconds
      default:
        return 5;
    }
  };

  // Get ad type display name
  const getAdTypeDisplayName = (adType: AdType): string => {
    const config = AD_TYPE_CONFIG.find(c => c.type === adType);
    return config?.title || adType;
  };

  // Show loading screen if not authenticated
  if (!isAuthenticated || authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1890FF" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error if user not found
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>用户信息加载失败</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
        {/* User Information Card */}
        <View style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.defaultAvatar}>
                  <Text style={styles.avatarText}>
                    {user.nickName?.charAt(0) || user.userName?.charAt(0) || '用'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.nickName || user.userName}</Text>
              <Text style={styles.userSubtitle}>今日收益</Text>
              <Text style={styles.todayRevenue}>
                ¥{revenueData?.todayRevenue?.toFixed(2) || '0.00'}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Statistics Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>收益统计</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                ¥{revenueData?.totalRevenue?.toFixed(2) || '0.00'}
              </Text>
              <Text style={styles.statLabel}>总收益</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {revenueData?.totalWatchCount || 0}
              </Text>
              <Text style={styles.statLabel}>观看次数</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {revenueData?.remainingWatchCount || 0}
              </Text>
              <Text style={styles.statLabel}>剩余次数</Text>
            </View>
          </View>
        </View>

        {/* Ad Type Buttons */}
        <View style={styles.adSection}>
          <Text style={styles.sectionTitle}>广告类型</Text>
          <Text style={styles.sectionSubtitle}>点击下方按钮观看广告获得收益</Text>
          
          <View style={styles.adButtonsContainer}>
            {AD_TYPE_CONFIG.map((config) => (
              <TouchableOpacity
                key={config.type}
                style={[
                  styles.adButton,
                  { borderLeftColor: config.color },
                  loadingAdType === config.type && styles.adButtonLoading
                ]}
                onPress={() => handleAdButtonPress(config.type)}
                disabled={!!loadingAdType}
                activeOpacity={0.7}
              >
                <View style={styles.adButtonContent}>
                  <View style={styles.adButtonLeft}>
                    <Text style={styles.adButtonIcon}>{config.icon}</Text>
                    <View style={styles.adButtonText}>
                      <Text style={styles.adButtonTitle}>{config.title}</Text>
                      <Text style={styles.adButtonDescription}>{config.description}</Text>
                    </View>
                  </View>
                  <View style={styles.adButtonRight}>
                    {loadingAdType === config.type ? (
                      <ActivityIndicator size="small" color={config.color} />
                    ) : (
                      <Text style={[styles.adButtonArrow, { color: config.color }]}>▶</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Additional Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 温馨提示</Text>
          <Text style={styles.infoText}>
            • 每日观看次数有限，请合理安排{'\n'}
            • 完整观看视频广告可获得更多收益{'\n'}
            • 收益将在广告播放完成后立即到账
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF4D4F',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1890FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },

  // User Card Styles
  userCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  defaultAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1890FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  userSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  todayRevenue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#52C41A',
  },

  // Stats Card Styles
  statsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E8E8E8',
    marginHorizontal: 16,
  },

  // Ad Section Styles
  adSection: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  adButtonsContainer: {
    gap: 12,
  },
  adButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adButtonLoading: {
    opacity: 0.7,
  },
  adButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  adButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  adButtonText: {
    flex: 1,
  },
  adButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  adButtonDescription: {
    fontSize: 12,
    color: '#666666',
  },
  adButtonRight: {
    marginLeft: 12,
  },
  adButtonArrow: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Info Card Styles
  infoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});

export default HomeScreen;