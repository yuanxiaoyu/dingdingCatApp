/**
 * RevenueScreen - Revenue statistics and data display interface
 * 
 * Features:
 * - Revenue overview cards showing key metrics
 * - Revenue trend charts (daily, weekly, monthly)
 * - Detailed statistics data list
 * - Real-time revenue data updates
 * - Pull-to-refresh functionality
 * - Integration with AdService for revenue data
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { 
  selectUser, 
  selectIsAuthenticated 
} from '../store/slices/authSlice';
import { 
  selectRevenueData,
  selectAdLoading,
  selectAdError,
  fetchUserRevenue,
  clearError
} from '../store/slices/adSlice';
import { RevenueData } from '../types';

const { width } = Dimensions.get('window');

// Revenue period types for trend display
type RevenuePeriod = 'today' | 'week' | 'month';

interface RevenueCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color: string;
  icon: string;
}

interface StatItemProps {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
}

const RevenueScreen: React.FC = () => {
  const dispatch = useDispatch();
  
  // Redux state
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const revenueData = useSelector(selectRevenueData);
  const adLoading = useSelector(selectAdLoading);
  const adError = useSelector(selectAdError);

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<RevenuePeriod>('today');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // Auto-refresh interval (30 seconds)
  const AUTO_REFRESH_INTERVAL = 30000;

  // Load initial data
  useEffect(() => {
    if (isAuthenticated && user) {
      loadRevenueData();
    }
  }, [isAuthenticated, user]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefreshEnabled || !isAuthenticated || !user) {
      return;
    }

    const interval = setInterval(() => {
      loadRevenueData(true); // Silent refresh
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, isAuthenticated, user]);

  // Clear ad errors when component mounts
  useEffect(() => {
    if (adError) {
      dispatch(clearError());
    }
  }, []);

  // Load revenue data
  const loadRevenueData = useCallback(async (silent = false) => {
    if (!user) return;
    
    try {
      await dispatch(fetchUserRevenue({
        userId: user.userId,
        appKey: user.appKey,
      })).unwrap();
    } catch (error: any) {
      console.error('Failed to load revenue data:', error);
      if (!silent) {
        Alert.alert('加载失败', error.message || '获取收益数据失败，请稍后重试');
      }
    }
  }, [dispatch, user]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRevenueData();
    setRefreshing(false);
  }, [loadRevenueData]);

  // Toggle auto-refresh
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled(!autoRefreshEnabled);
  }, [autoRefreshEnabled]);

  // Get revenue value by period
  const getRevenueByPeriod = useCallback((period: RevenuePeriod): number => {
    if (!revenueData) return 0;
    
    switch (period) {
      case 'today':
        return revenueData.todayRevenue;
      case 'week':
        return revenueData.weekRevenue;
      case 'month':
        return revenueData.monthRevenue;
      default:
        return 0;
    }
  }, [revenueData]);

  // Get watch count by period
  const getWatchCountByPeriod = useCallback((period: RevenuePeriod): number => {
    if (!revenueData) return 0;
    
    switch (period) {
      case 'today':
        return revenueData.todayWatchCount;
      case 'week':
        return revenueData.weekWatchCount;
      case 'month':
        return revenueData.monthWatchCount;
      default:
        return 0;
    }
  }, [revenueData]);

  // Revenue Card Component
  const RevenueCard: React.FC<RevenueCardProps> = ({ title, value, subtitle, color, icon }) => (
    <View style={[styles.revenueCard, { borderLeftColor: color }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>{icon}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={[styles.cardValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
    </View>
  );

  // Stat Item Component
  const StatItem: React.FC<StatItemProps> = ({ label, value, unit, color = '#333333' }) => (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statValueContainer}>
        <Text style={[styles.statValue, { color }]}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Text>
        {unit && <Text style={styles.statUnit}>{unit}</Text>}
      </View>
    </View>
  );

  // Period Selector Component
  const PeriodSelector = () => (
    <View style={styles.periodSelector}>
      {(['today', 'week', 'month'] as RevenuePeriod[]).map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === period && styles.periodButtonTextActive
          ]}>
            {period === 'today' ? '今日' : period === 'week' ? '本周' : '本月'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Show loading screen if not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1890FF" />
          <Text style={styles.loadingText}>请先登录</Text>
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>收益统计</Text>
        <TouchableOpacity
          style={styles.autoRefreshButton}
          onPress={toggleAutoRefresh}
        >
          <Text style={[
            styles.autoRefreshText,
            { color: autoRefreshEnabled ? '#52C41A' : '#999999' }
          ]}>
            {autoRefreshEnabled ? '🔄 自动刷新' : '⏸️ 已暂停'}
          </Text>
        </TouchableOpacity>
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
        {/* Revenue Overview Cards */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>收益概览</Text>
          
          <View style={styles.cardsContainer}>
            <RevenueCard
              title="总完播次数"
              value={`${revenueData?.totalCompletedCount || revenueData?.totalWatchCount || 0} 次`}
              subtitle={`预计收益 ¥${((revenueData?.totalCompletedCount || revenueData?.totalWatchCount || 0) * (revenueData?.singleRevenueAmount || 0.05)).toFixed(2)}`}
              color="#52C41A"
              icon="💰"
            />
            
            <RevenueCard
              title="今日完播"
              value={`${revenueData?.todayCompletedCount || revenueData?.todayWatchCount || 0} 次`}
              subtitle={`预计收益 ¥${((revenueData?.todayCompletedCount || revenueData?.todayWatchCount || 0) * (revenueData?.singleRevenueAmount || 0.05)).toFixed(2)}`}
              color="#1890FF"
              icon="📈"
            />
            
            <RevenueCard
              title="昨日完播"
              value={`${revenueData?.yesterdayWatchCount || 0} 次`}
              subtitle={`预计收益 ¥${((revenueData?.yesterdayWatchCount || 0) * (revenueData?.singleRevenueAmount || 0.05)).toFixed(2)}`}
              color="#722ED1"
              icon="📊"
            />
            
            <RevenueCard
              title="单次收益"
              value={`¥${revenueData?.singleRevenueAmount?.toFixed(2) || '0.05'}`}
              subtitle="每次完播收益"
              color="#FA8C16"
              icon="⚡"
            />
          </View>
        </View>

        {/* Period Trend Section */}
        <View style={styles.trendSection}>
          <Text style={styles.sectionTitle}>收益趋势</Text>
          
          <PeriodSelector />
          
          <View style={styles.trendCard}>
            <View style={styles.trendHeader}>
              <Text style={styles.trendTitle}>
                {selectedPeriod === 'today' ? '今日' : selectedPeriod === 'week' ? '本周' : '本月'}完播统计
              </Text>
              <Text style={styles.trendValue}>
                {getWatchCountByPeriod(selectedPeriod)} 次
              </Text>
            </View>
            
            <View style={styles.trendStats}>
              <View style={styles.trendStatItem}>
                <Text style={styles.trendStatLabel}>完播次数</Text>
                <Text style={styles.trendStatValue}>
                  {getWatchCountByPeriod(selectedPeriod)}
                </Text>
              </View>
              <View style={styles.trendStatDivider} />
              <View style={styles.trendStatItem}>
                <Text style={styles.trendStatLabel}>预计收益</Text>
                <Text style={styles.trendStatValue}>
                  ¥{(getWatchCountByPeriod(selectedPeriod) * (revenueData?.singleRevenueAmount || 0.05)).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Detailed Statistics */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>详细统计</Text>
          
          <View style={styles.statsCard}>
            <StatItem
              label="总预计收益"
              value={((revenueData?.totalCompletedCount || revenueData?.totalWatchCount || 0) * (revenueData?.singleRevenueAmount || 0.05)).toFixed(2)}
              unit="元"
              color="#52C41A"
            />
            <StatItem
              label="今日预计收益"
              value={((revenueData?.todayCompletedCount || revenueData?.todayWatchCount || 0) * (revenueData?.singleRevenueAmount || 0.05)).toFixed(2)}
              unit="元"
              color="#1890FF"
            />
            <StatItem
              label="昨日预计收益"
              value={((revenueData?.yesterdayWatchCount || 0) * (revenueData?.singleRevenueAmount || 0.05)).toFixed(2)}
              unit="元"
              color="#722ED1"
            />
            <StatItem
              label="本周预计收益"
              value={((revenueData?.weekWatchCount || 0) * (revenueData?.singleRevenueAmount || 0.05)).toFixed(2)}
              unit="元"
              color="#13C2C2"
            />
            <StatItem
              label="本月预计收益"
              value={((revenueData?.monthWatchCount || 0) * (revenueData?.singleRevenueAmount || 0.05)).toFixed(2)}
              unit="元"
              color="#FA8C16"
            />
          </View>

          <View style={styles.statsCard}>
            <StatItem
              label="总完播次数"
              value={revenueData?.totalCompletedCount || revenueData?.totalWatchCount || 0}
              unit="次"
            />
            <StatItem
              label="今日完播次数"
              value={revenueData?.todayCompletedCount || revenueData?.todayWatchCount || 0}
              unit="次"
            />
            <StatItem
              label="昨日完播次数"
              value={revenueData?.yesterdayWatchCount || 0}
              unit="次"
            />
            <StatItem
              label="本周完播次数"
              value={revenueData?.weekWatchCount || 0}
              unit="次"
            />
            <StatItem
              label="本月完播次数"
              value={revenueData?.monthWatchCount || 0}
              unit="次"
            />
          </View>

          <View style={styles.statsCard}>
            <StatItem
              label="剩余观看次数"
              value={revenueData?.remainingWatchCount || 0}
              unit="次"
              color="#52C41A"
            />
            <StatItem
              label="单次完播收益"
              value={revenueData?.singleRevenueAmount?.toFixed(2) || '0.05'}
              unit="元"
              color="#1890FF"
            />
            <StatItem
              label="预计可提现金额"
              value={((revenueData?.totalCompletedCount || revenueData?.totalWatchCount || 0) * (revenueData?.singleRevenueAmount || 0.05)).toFixed(2)}
              unit="元"
              color="#52C41A"
            />
            <StatItem
              label="冻结金额"
              value={revenueData?.frozenAmount?.toFixed(2) || '0.00'}
              unit="元"
              color="#FF4D4F"
            />
            <StatItem
              label="账户状态"
              value={revenueData?.accountStatus || '正常'}
              color={revenueData?.accountStatus === '正常' ? '#52C41A' : '#FF4D4F'}
            />
          </View>
        </View>

        {/* Last Update Info */}
        <View style={styles.updateInfo}>
          <Text style={styles.updateText}>
            最后观看时间: {revenueData?.lastWatchTime 
              ? new Date(revenueData.lastWatchTime).toLocaleString('zh-CN')
              : '暂无记录'
            }
          </Text>
          <Text style={styles.updateText}>
            数据更新时间: {new Date().toLocaleString('zh-CN')}
          </Text>
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      {adLoading && !refreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#1890FF" />
          <Text style={styles.loadingOverlayText}>加载中...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  autoRefreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F5F7FA',
  },
  autoRefreshText: {
    fontSize: 12,
    fontWeight: '500',
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

  // Section Styles
  overviewSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  trendSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  statsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },

  // Revenue Cards
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  revenueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    width: (width - 44) / 2, // 2 cards per row with margins
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  cardTitle: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#999999',
  },

  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: '#1890FF',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },

  // Trend Card
  trendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trendHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  trendTitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  trendValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1890FF',
  },
  trendStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  trendStatLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  trendStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  trendStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E8E8E8',
    marginHorizontal: 20,
  },

  // Stats Card
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
  },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statUnit: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 2,
  },

  // Update Info
  updateInfo: {
    marginTop: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  updateText: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },

  // Loading Overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlayText: {
    marginTop: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default RevenueScreen;