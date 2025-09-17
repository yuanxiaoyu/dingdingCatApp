/**
 * HistoryScreen - Ad watching history interface
 * 
 * Features:
 * - Display paginated ad watching history
 * - Filter by date range and ad type
 * - Pull-to-refresh and load more functionality
 * - History item detail view
 * - Integration with AdService for history data
 */

import React, { useEffect, useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { 
  selectUser, 
  selectIsAuthenticated 
} from '../store/slices/authSlice';
import { 
  selectAdHistory,
  selectAdLoading,
  selectAdError,
  fetchAdHistory,
  loadMoreHistory,
  clearError,
  clearHistory
} from '../store/slices/adSlice';
import { AdType, AdHistoryItem, AdHistoryRequest } from '../types';

const { width } = Dimensions.get('window');

// Filter types
type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom';
type AdTypeFilter = 'all' | AdType;

interface FilterState {
  dateFilter: DateFilter;
  adTypeFilter: AdTypeFilter;
  startDate?: string;
  endDate?: string;
}

interface HistoryItemProps {
  item: AdHistoryItem;
  onPress: (item: AdHistoryItem) => void;
}

interface FilterModalProps {
  visible: boolean;
  filters: FilterState;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
}

interface DetailModalProps {
  visible: boolean;
  item: AdHistoryItem | null;
  onClose: () => void;
}

const HistoryScreen: React.FC = () => {
  const dispatch = useDispatch();
  
  // Redux state
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const history = useSelector(selectAdHistory);
  const adLoading = useSelector(selectAdLoading);
  const adError = useSelector(selectAdError);

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AdHistoryItem | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    dateFilter: 'all',
    adTypeFilter: 'all',
  });

  const pageSize = 20;

  // Load initial data
  useEffect(() => {
    if (isAuthenticated && user) {
      loadHistoryData(true);
    }
  }, [isAuthenticated, user, filters]);

  // Clear ad errors when component mounts
  useEffect(() => {
    if (adError) {
      dispatch(clearError());
    }
  }, []);

  // Generate date range based on filter
  const getDateRange = useCallback((dateFilter: DateFilter): { startDate?: string; endDate?: string } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateFilter) {
      case 'today':
        return {
          startDate: today.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return {
          startDate: weekStart.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        };
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          startDate: monthStart.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        };
      case 'custom':
        return {
          startDate: filters.startDate,
          endDate: filters.endDate,
        };
      default:
        return {};
    }
  }, [filters.startDate, filters.endDate]);

  // Build history request
  const buildHistoryRequest = useCallback((pageNum: number): AdHistoryRequest => {
    const dateRange = getDateRange(filters.dateFilter);
    
    return {
      userId: user!.userId,
      appKey: user!.appKey,
      pageNum,
      pageSize,
      adType: filters.adTypeFilter !== 'all' ? filters.adTypeFilter : undefined,
      ...dateRange,
    };
  }, [user, filters, getDateRange]);

  // Load history data
  const loadHistoryData = useCallback(async (reset = false) => {
    if (!user) return;
    
    try {
      const pageNum = reset ? 1 : currentPage;
      const request = buildHistoryRequest(pageNum);
      
      if (reset) {
        dispatch(clearHistory());
        const response = await dispatch(fetchAdHistory(request)).unwrap();
        setCurrentPage(2);
        setHasMoreData(response.historyList.length === pageSize);
      } else {
        const response = await dispatch(loadMoreHistory(request)).unwrap();
        setCurrentPage(pageNum + 1);
        setHasMoreData(response.historyList.length === pageSize);
      }
    } catch (error: any) {
      console.error('Failed to load history data:', error);
      Alert.alert('加载失败', error.message || '获取历史记录失败，请稍后重试');
    }
  }, [dispatch, user, currentPage, buildHistoryRequest]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistoryData(true);
    setRefreshing(false);
  }, [loadHistoryData]);

  // Handle load more
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData || adLoading) return;
    
    setLoadingMore(true);
    await loadHistoryData(false);
    setLoadingMore(false);
  }, [loadingMore, hasMoreData, adLoading, loadHistoryData]);

  // Handle filter apply
  const handleFilterApply = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setShowFilterModal(false);
    setCurrentPage(1);
    setHasMoreData(true);
  }, []);

  // Handle item press
  const handleItemPress = useCallback((item: AdHistoryItem) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  }, []);

  // Get ad type display name
  const getAdTypeDisplayName = useCallback((adType: AdType): string => {
    switch (adType) {
      case AdType.SPLASH:
        return '开屏广告';
      case AdType.REWARD_VIDEO:
        return '视频激励';
      case AdType.INTERSTITIAL:
        return '插屏广告';
      case AdType.BANNER:
        return 'Banner广告';
      default:
        return '未知类型';
    }
  }, []);

  // Get status color
  const getStatusColor = useCallback((item: AdHistoryItem): string => {
    if (item.isCompleted) return '#52C41A';
    if (item.isSkipped) return '#FA8C16';
    return '#FF4D4F';
  }, []);

  // Get status text
  const getStatusText = useCallback((item: AdHistoryItem): string => {
    if (item.isCompleted) return '已完成';
    if (item.isSkipped) return '已跳过';
    return '未完成';
  }, []);

  // Filter summary text
  const filterSummaryText = useMemo(() => {
    const parts: string[] = [];
    
    if (filters.dateFilter !== 'all') {
      switch (filters.dateFilter) {
        case 'today':
          parts.push('今日');
          break;
        case 'week':
          parts.push('本周');
          break;
        case 'month':
          parts.push('本月');
          break;
        case 'custom':
          if (filters.startDate && filters.endDate) {
            parts.push(`${filters.startDate} 至 ${filters.endDate}`);
          }
          break;
      }
    }
    
    if (filters.adTypeFilter !== 'all') {
      parts.push(getAdTypeDisplayName(filters.adTypeFilter));
    }
    
    return parts.length > 0 ? parts.join(' · ') : '全部记录';
  }, [filters, getAdTypeDisplayName]);

  // History Item Component
  const HistoryItem: React.FC<HistoryItemProps> = ({ item, onPress }) => (
    <TouchableOpacity style={styles.historyItem} onPress={() => onPress(item)}>
      <View style={styles.itemHeader}>
        <View style={styles.itemTypeContainer}>
          <Text style={styles.itemType}>{getAdTypeDisplayName(item.adType)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item) }]}>
            <Text style={styles.statusText}>{getStatusText(item)}</Text>
          </View>
        </View>
        <Text style={styles.itemTime}>
          {new Date(item.playTime).toLocaleString('zh-CN')}
        </Text>
      </View>
      
      <View style={styles.itemContent}>
        <View style={styles.itemStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>播放时长</Text>
            <Text style={styles.statValue}>{item.playDuration}秒</Text>
          </View>
          {item.stayDuration && (
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>停留时长</Text>
              <Text style={styles.statValue}>{item.stayDuration}秒</Text>
            </View>
          )}
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>收益</Text>
            <Text style={[styles.statValue, { color: '#52C41A' }]}>
              ¥{item.rewardAmount.toFixed(3)}
            </Text>
          </View>
        </View>
        
        <View style={styles.itemActions}>
          {item.isClicked && (
            <View style={styles.actionBadge}>
              <Text style={styles.actionText}>已点击</Text>
            </View>
          )}
          <Text style={styles.viewDetail}>查看详情 {'>'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Filter Modal Component
  const FilterModal: React.FC<FilterModalProps> = ({ visible, filters, onClose, onApply }) => {
    const [localFilters, setLocalFilters] = useState<FilterState>(filters);

    useEffect(() => {
      setLocalFilters(filters);
    }, [filters]);

    const handleApply = () => {
      onApply(localFilters);
    };

    const handleReset = () => {
      setLocalFilters({
        dateFilter: 'all',
        adTypeFilter: 'all',
      });
    };

    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>筛选条件</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Date Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>时间范围</Text>
                <View style={styles.filterOptions}>
                  {[
                    { key: 'all', label: '全部' },
                    { key: 'today', label: '今日' },
                    { key: 'week', label: '本周' },
                    { key: 'month', label: '本月' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.filterOption,
                        localFilters.dateFilter === option.key && styles.filterOptionActive
                      ]}
                      onPress={() => setLocalFilters({ ...localFilters, dateFilter: option.key as DateFilter })}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        localFilters.dateFilter === option.key && styles.filterOptionTextActive
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Ad Type Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>广告类型</Text>
                <View style={styles.filterOptions}>
                  {[
                    { key: 'all', label: '全部类型' },
                    { key: AdType.SPLASH, label: '开屏广告' },
                    { key: AdType.REWARD_VIDEO, label: '视频激励' },
                    { key: AdType.INTERSTITIAL, label: '插屏广告' },
                    { key: AdType.BANNER, label: 'Banner广告' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.filterOption,
                        localFilters.adTypeFilter === option.key && styles.filterOptionActive
                      ]}
                      onPress={() => setLocalFilters({ ...localFilters, adTypeFilter: option.key as AdTypeFilter })}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        localFilters.adTypeFilter === option.key && styles.filterOptionTextActive
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                <Text style={styles.resetButtonText}>重置</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                <Text style={styles.applyButtonText}>应用</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Detail Modal Component
  const DetailModal: React.FC<DetailModalProps> = ({ visible, item, onClose }) => {
    if (!item) return null;

    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.detailModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>观看详情</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>基本信息</Text>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>广告类型</Text>
                  <Text style={styles.detailValue}>{getAdTypeDisplayName(item.adType)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>广告ID</Text>
                  <Text style={styles.detailValue}>{item.adId}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>观看时间</Text>
                  <Text style={styles.detailValue}>
                    {new Date(item.playTime).toLocaleString('zh-CN')}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>设备类型</Text>
                  <Text style={styles.detailValue}>{item.deviceType || '未知'}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>播放数据</Text>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>播放时长</Text>
                  <Text style={styles.detailValue}>{item.playDuration} 秒</Text>
                </View>
                {item.stayDuration && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>停留时长</Text>
                    <Text style={styles.detailValue}>{item.stayDuration} 秒</Text>
                  </View>
                )}
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>是否点击</Text>
                  <Text style={[styles.detailValue, { color: item.isClicked ? '#52C41A' : '#999999' }]}>
                    {item.isClicked ? '是' : '否'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>是否跳过</Text>
                  <Text style={[styles.detailValue, { color: item.isSkipped ? '#FA8C16' : '#999999' }]}>
                    {item.isSkipped ? '是' : '否'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>是否完成</Text>
                  <Text style={[styles.detailValue, { color: item.isCompleted ? '#52C41A' : '#FF4D4F' }]}>
                    {item.isCompleted ? '是' : '否'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>收益信息</Text>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>获得收益</Text>
                  <Text style={[styles.detailValue, { color: '#52C41A', fontSize: 18, fontWeight: 'bold' }]}>
                    ¥{item.rewardAmount.toFixed(3)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>状态描述</Text>
                  <Text style={[styles.detailValue, { color: getStatusColor(item) }]}>
                    {item.statusDescription || getStatusText(item)}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

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
        <Text style={styles.headerTitle}>观看历史</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Text style={styles.filterButtonText}>筛选</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Summary */}
      <View style={styles.filterSummary}>
        <Text style={styles.filterSummaryText}>{filterSummaryText}</Text>
        <Text style={styles.filterSummaryCount}>共 {history.length} 条记录</Text>
      </View>

      {/* History List */}
      <FlatList
        data={history}
        keyExtractor={(item) => item.statId.toString()}
        renderItem={({ item }) => (
          <HistoryItem item={item} onPress={handleItemPress} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1890FF']}
            tintColor="#1890FF"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无观看记录</Text>
            <Text style={styles.emptySubtext}>开始观看广告来获得收益吧</Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color="#1890FF" />
              <Text style={styles.loadMoreText}>加载更多...</Text>
            </View>
          ) : !hasMoreData && history.length > 0 ? (
            <View style={styles.loadMoreContainer}>
              <Text style={styles.noMoreText}>没有更多记录了</Text>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        filters={filters}
        onClose={() => setShowFilterModal(false)}
        onApply={handleFilterApply}
      />

      {/* Detail Modal */}
      <DetailModal
        visible={showDetailModal}
        item={selectedItem}
        onClose={() => setShowDetailModal(false)}
      />

      {/* Loading Overlay */}
      {adLoading && !refreshing && !loadingMore && (
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
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#1890FF',
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  filterSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterSummaryText: {
    fontSize: 14,
    color: '#666666',
  },
  filterSummaryCount: {
    fontSize: 12,
    color: '#999999',
  },
  listContent: {
    paddingVertical: 8,
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

  // History Item Styles
  historyItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemTypeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  itemTime: {
    fontSize: 12,
    color: '#999999',
  },
  itemContent: {
    gap: 12,
  },
  itemStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionBadge: {
    backgroundColor: '#E6F7FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#1890FF',
  },
  viewDetail: {
    fontSize: 12,
    color: '#1890FF',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
  },

  // Load More
  loadMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
  },
  noMoreText: {
    fontSize: 14,
    color: '#999999',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  detailModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  modalClose: {
    fontSize: 20,
    color: '#999999',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Filter Modal
  filterSection: {
    marginVertical: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
  },
  filterOptionActive: {
    borderColor: '#1890FF',
    backgroundColor: '#E6F7FF',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666666',
  },
  filterOptionTextActive: {
    color: '#1890FF',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    color: '#666666',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: '#1890FF',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },

  // Detail Modal
  detailSection: {
    marginVertical: 16,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
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

export default HistoryScreen;