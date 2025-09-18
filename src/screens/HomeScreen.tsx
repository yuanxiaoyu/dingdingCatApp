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
  Image,
  Alert,
  ActivityIndicator,
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
  selectAdError,
  fetchUserRevenue,
  clearAdError
} from '../store/slices/adSlice';
import { AdType } from '../types';
import { ENV_CONFIG } from '../config/env';
import IntegratedAdService, { AdEventCallbacks } from '../services/IntegratedAdService';
import DevTools from '../components/DevTools';
import SimpleDevToolsIcon from '../components/SimpleDevToolsIcon';
import Icon from '../assets/images/mipmap-mdpi_ic_launcher.png';


// Ad type configuration for buttons (removed Banner ad)
const AD_TYPE_CONFIG = [
  {
    type: AdType.SPLASH,
    title: '开屏广告',
    description: '应用启动时展示',
    icon: '📱',
    color: '#EF4444',
  },
  {
    type: AdType.REWARD_VIDEO,
    title: '视频激励广告',
    description: '观看完整视频获得奖励',
    icon: '🎬',
    color: '#10B981',
  },
  {
    type: AdType.INTERSTITIAL,
    title: '插屏广告',
    description: '全屏展示广告',
    icon: '📺',
    color: '#3B82F6',
  },
];

const HomeScreen: React.FC = () => {
  const dispatch = useDispatch();

  // Redux state
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authLoading = useSelector(selectAuthLoading);
  const revenueData = useSelector(selectRevenueData);

  const adError = useSelector(selectAdError);

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [loadingAdType, setLoadingAdType] = useState<AdType | null>(null);
  const [showDevTools, setShowDevTools] = useState(false);
  const [adButtonStates, setAdButtonStates] = useState<Record<AdType, 'idle' | 'loading' | 'playing'>>({
    [AdType.SPLASH]: 'idle',
    [AdType.REWARD_VIDEO]: 'idle',
    [AdType.INTERSTITIAL]: 'idle',
    [AdType.BANNER]: 'idle',
  });

  // Load initial data
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserRevenue();
      // Set user for integrated ad service
      IntegratedAdService.setCurrentUser(user);
    }
  }, [isAuthenticated, user]);

  // Clear ad errors when component mounts
  useEffect(() => {
    if (adError) {
      dispatch(clearAdError());
    }
  }, []);

  // Load user revenue data
  const loadUserRevenue = useCallback(async () => {
    if (!user) return;

    try {
      await (dispatch as any)(fetchUserRevenue({
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

  // Update ad button state
  const updateAdButtonState = useCallback((adType: AdType, state: 'idle' | 'loading' | 'playing') => {
    setAdButtonStates(prev => ({
      ...prev,
      [adType]: state,
    }));
  }, []);

  // Create ad event callbacks
  const createAdCallbacks = useCallback((adType: AdType): AdEventCallbacks => ({
    onAdLoaded: (adId: string, adType: AdType) => {
      console.log(`Ad loaded: ${adType} - ${adId}`);
      updateAdButtonState(adType, 'playing');
    },

    onAdShown: (adId: string, adType: AdType) => {
      console.log(`Ad shown: ${adType} - ${adId}`);
      updateAdButtonState(adType, 'playing');
    },

    onAdClicked: (adId: string, adType: AdType) => {
      console.log(`Ad clicked: ${adType} - ${adId}`);
    },

    onAdCompleted: (adId: string, adType: AdType, reward: number) => {
      console.log(`Ad completed: ${adType} - ${adId}, reward: ${reward}`);
      setLoadingAdType(null);
      updateAdButtonState(adType, 'idle');

      // 显示完播提示，不显示具体收益金额
      Alert.alert(
        '广告观看完成！',
        `您已完成一次${getAdTypeDisplayName(adType)}观看，感谢您的参与！`,
        [{ text: '确定', onPress: () => loadUserRevenue() }]
      );
    },

    onAdSkipped: (adId: string, adType: AdType) => {
      console.log(`Ad skipped: ${adType} - ${adId}`);
      setLoadingAdType(null);
      updateAdButtonState(adType, 'idle');
      Alert.alert('广告已跳过', '您跳过了广告播放');
    },

    onAdClosed: (adId: string, adType: AdType) => {
      console.log(`Ad closed: ${adType} - ${adId}`);
      setLoadingAdType(null);
      updateAdButtonState(adType, 'idle');
    },

    onAdError: (adId: string, adType: AdType, error: Error) => {
      console.error(`Ad error: ${adType} - ${adId}:`, error);
      setLoadingAdType(null);
      updateAdButtonState(adType, 'idle');
      Alert.alert(
        '广告加载失败',
        `${getAdTypeDisplayName(adType)}加载失败，请稍后重试。\n错误信息：${error.message}`,
        [{ text: '确定' }]
      );
    },
  }), [loadUserRevenue, updateAdButtonState]);



  // Handle ad button press with integrated service
  const handleAdButtonPress = useCallback(async (adType: AdType) => {
    if (!user || !isAuthenticated) {
      Alert.alert('错误', '请先登录');
      return;
    }

    if (loadingAdType) {
      Alert.alert('请稍候', '正在处理其他广告请求');
      return;
    }

    // Check if SDK is ready
    const isSDKReady = await IntegratedAdService.isSDKReady();
    if (!isSDKReady) {
      Alert.alert('错误', 'SDK未准备就绪，请稍后重试');
      return;
    }

    setLoadingAdType(adType);
    updateAdButtonState(adType, 'loading');
    const callbacks = createAdCallbacks(adType);

    try {
      switch (adType) {
        case AdType.SPLASH:
          await IntegratedAdService.loadAndShowSplashAd(callbacks);
          break;
        case AdType.REWARD_VIDEO:
          await IntegratedAdService.loadAndShowRewardVideoAd(callbacks);
          break;
        case AdType.INTERSTITIAL:
          await IntegratedAdService.loadAndShowInterstitialAd(callbacks);
          break;

        default:
          throw new Error(`Unsupported ad type: ${adType}`);
      }
    } catch (error: any) {
      console.error(`Failed to load ${adType} ad:`, error);
      setLoadingAdType(null);
      updateAdButtonState(adType, 'idle');
      Alert.alert(
        '广告加载失败',
        `${getAdTypeDisplayName(adType)}加载失败，请检查网络连接后重试。`,
        [{ text: '确定' }]
      );
    }
  }, [user, isAuthenticated, loadingAdType, createAdCallbacks]);



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


        {/* User Information Card */}
        <View style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.nickName || user.userName}</Text>
              <Text style={styles.userSubtitle}>今日完播次数</Text>
              <View style={styles.todayRevenueContainer}>
                <Text style={styles.todayRevenue}>
                  {revenueData?.todayCompletedCount || revenueData?.todayWatchCount || 0}
                </Text>
                <Text style={styles.todayRevenueUnit}>次</Text>
              </View>
            </View>
            
            <View style={styles.userActions}>
              <TouchableOpacity style={styles.userActionButton}>
                {/* <Text style={styles.userActionIcon}>📊</Text> */}
                <Image source={Icon} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* User Stats Row */}
          <View style={styles.userStatsRow}>
            <View style={styles.userStatItem}>
              <View style={styles.userStatIconContainer}>
                <Text style={styles.userStatIcon}>✅</Text>
              </View>
              <Text style={styles.userStatValue}>
                {revenueData?.totalCompletedCount || revenueData?.totalWatchCount || 0}
              </Text>
              <Text style={styles.userStatLabel}>总完播</Text>
            </View>
            <View style={styles.userStatDivider} />
            <View style={styles.userStatItem}>
              <View style={styles.userStatIconContainer}>
                <Text style={styles.userStatIcon}>💰</Text>
              </View>
              <Text style={styles.userStatValue}>
                ¥{((revenueData?.totalCompletedCount || revenueData?.totalWatchCount || 0) * (revenueData?.singleRevenueAmount || 0.05)).toFixed(2)}
              </Text>
              <Text style={styles.userStatLabel}>预计收益</Text>
            </View>
            <View style={styles.userStatDivider} />
            <View style={styles.userStatItem}>
              <View style={styles.userStatIconContainer}>
                <Text style={styles.userStatIcon}>⏳</Text>
              </View>
              <Text style={styles.userStatValue}>
                {revenueData?.remainingWatchCount || 0}
              </Text>
              <Text style={styles.userStatLabel}>剩余次数</Text>
            </View>
          </View>
        </View>



        {/* Ad Buttons */}
        <View style={styles.adSection}>
          <View style={styles.adButtonsContainer}>
            {AD_TYPE_CONFIG.map((config) => (
              <TouchableOpacity
                key={config.type}
                style={[
                  styles.adButton,
                  { borderLeftColor: config.color },
                  adButtonStates[config.type] !== 'idle' && styles.adButtonLoading
                ]}
                onPress={() => handleAdButtonPress(config.type)}
                disabled={adButtonStates[config.type] !== 'idle'}
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
                    {adButtonStates[config.type] === 'loading' ? (
                      <ActivityIndicator size="small" color={config.color} />
                    ) : adButtonStates[config.type] === 'playing' ? (
                      <Text style={[styles.adButtonArrow, { color: config.color }]}>⏸️</Text>
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
            • 完整观看广告可获得观看次数统计{'\n'}
            • 每次完播可获得 ¥{revenueData?.singleRevenueAmount?.toFixed(2) || '0.05'} 收益
          </Text>
        </View>
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
    marginTop: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },

  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 34,
    paddingTop: 20,
    paddingBottom: 20,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  todayRevenueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  todayRevenue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#059669',
  },
  todayRevenueUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 4,
  },
  userActions: {
    alignItems: 'center',
  },
  userActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userActionIcon: {
    fontSize: 20,
  },
  userStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userStatItem: {
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  userStatIconContainer: {
    marginBottom: 2,
    alignItems: 'center',
  },
  userStatIcon: {
    fontSize: 20,
  },
  userStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  userStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  userStatDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    height: 40,
  },





  // Ad Section Styles
  adSection: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 20,
    fontWeight: '500',
  },
  adButtonsContainer: {
    gap: 16,
  },
  adButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  adButtonLoading: {
    opacity: 0.6,
    transform: [{ scale: 0.98 }],
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
    fontSize: 32,
    marginRight: 16,
  },
  adButtonText: {
    flex: 1,
  },
  adButtonTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  adButtonDescription: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  adButtonRight: {
    marginLeft: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adButtonArrow: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Info Card Styles
  infoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    fontWeight: '500',
  },
});

export default HomeScreen;