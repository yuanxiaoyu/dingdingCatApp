/**
 * AdTestScreen - Test screen for integrated ad functionality
 * 
 * This screen provides a comprehensive testing interface for the integrated
 * Pangle SDK + API service functionality, allowing developers to test
 * all ad types and monitor the complete ad lifecycle.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';

import { selectUser, selectIsAuthenticated } from '../store/slices/authSlice';
import { selectRevenueData } from '../store/slices/adSlice';
import IntegratedAdService, { AdEventCallbacks } from '../services/IntegratedAdService';
import { AdType } from '../types';

interface AdTestResult {
  adType: AdType;
  status: 'success' | 'error' | 'loading';
  message: string;
  reward?: number;
  timestamp: number;
}

const AdTestScreen: React.FC = () => {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const revenueData = useSelector(selectRevenueData);

  const [isSDKReady, setIsSDKReady] = useState(false);
  const [sdkVersion, setSDKVersion] = useState('unknown');
  const [testResults, setTestResults] = useState<AdTestResult[]>([]);
  const [loadingAdType, setLoadingAdType] = useState<AdType | null>(null);

  useEffect(() => {
    initializeSDKStatus();
  }, []);

  useEffect(() => {
    if (user) {
      IntegratedAdService.setCurrentUser(user);
    }
  }, [user]);

  const initializeSDKStatus = async () => {
    try {
      const ready = await IntegratedAdService.isSDKReady();
      const version = await IntegratedAdService.getSDKVersion();
      setIsSDKReady(ready);
      setSDKVersion(version);
    } catch (error) {
      console.error('Error checking SDK status:', error);
      setIsSDKReady(false);
      setSDKVersion('error');
    }
  };

  const addTestResult = (result: AdTestResult) => {
    setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  const createAdCallbacks = (adType: AdType): AdEventCallbacks => ({
    onAdLoaded: (adId: string, adType: AdType) => {
      console.log(`[TEST] Ad loaded: ${adType} - ${adId}`);
    },
    
    onAdShown: (adId: string, adType: AdType) => {
      console.log(`[TEST] Ad shown: ${adType} - ${adId}`);
    },
    
    onAdClicked: (adId: string, adType: AdType) => {
      console.log(`[TEST] Ad clicked: ${adType} - ${adId}`);
    },
    
    onAdCompleted: (adId: string, adType: AdType, reward: number) => {
      console.log(`[TEST] Ad completed: ${adType} - ${adId}, reward: ${reward}`);
      setLoadingAdType(null);
      
      addTestResult({
        adType,
        status: 'success',
        message: `广告播放完成，获得奖励 ¥${reward.toFixed(2)}`,
        reward,
        timestamp: Date.now(),
      });

      Alert.alert(
        '测试成功',
        `${getAdTypeDisplayName(adType)}播放完成\n获得奖励: ¥${reward.toFixed(2)}`,
        [{ text: '确定' }]
      );
    },
    
    onAdSkipped: (adId: string, adType: AdType) => {
      console.log(`[TEST] Ad skipped: ${adType} - ${adId}`);
      setLoadingAdType(null);
      
      addTestResult({
        adType,
        status: 'success',
        message: '广告被跳过',
        timestamp: Date.now(),
      });

      Alert.alert('测试结果', `${getAdTypeDisplayName(adType)}被跳过`);
    },
    
    onAdClosed: (adId: string, adType: AdType) => {
      console.log(`[TEST] Ad closed: ${adType} - ${adId}`);
      setLoadingAdType(null);
      
      addTestResult({
        adType,
        status: 'success',
        message: '广告被关闭',
        timestamp: Date.now(),
      });
    },
    
    onAdError: (adId: string, adType: AdType, error: Error) => {
      console.error(`[TEST] Ad error: ${adType} - ${adId}:`, error);
      setLoadingAdType(null);
      
      addTestResult({
        adType,
        status: 'error',
        message: `错误: ${error.message}`,
        timestamp: Date.now(),
      });

      Alert.alert(
        '测试失败',
        `${getAdTypeDisplayName(adType)}测试失败\n错误: ${error.message}`,
        [{ text: '确定' }]
      );
    },
  });

  const testAdType = async (adType: AdType) => {
    if (!user || !isAuthenticated) {
      Alert.alert('错误', '请先登录');
      return;
    }

    if (!isSDKReady) {
      Alert.alert('错误', 'SDK未准备就绪');
      return;
    }

    if (loadingAdType) {
      Alert.alert('请稍候', '正在测试其他广告类型');
      return;
    }

    setLoadingAdType(adType);
    const callbacks = createAdCallbacks(adType);

    addTestResult({
      adType,
      status: 'loading',
      message: '开始测试...',
      timestamp: Date.now(),
    });

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
        case AdType.BANNER:
          await IntegratedAdService.loadAndShowBannerAd(callbacks);
          break;
        default:
          throw new Error(`Unsupported ad type: ${adType}`);
      }
    } catch (error: any) {
      console.error(`[TEST] Failed to test ${adType} ad:`, error);
      setLoadingAdType(null);
      
      addTestResult({
        adType,
        status: 'error',
        message: `测试失败: ${error.message}`,
        timestamp: Date.now(),
      });

      Alert.alert(
        '测试失败',
        `${getAdTypeDisplayName(adType)}测试失败\n${error.message}`,
        [{ text: '确定' }]
      );
    }
  };

  const getAdTypeDisplayName = (adType: AdType): string => {
    switch (adType) {
      case AdType.SPLASH:
        return '开屏广告';
      case AdType.REWARD_VIDEO:
        return '激励视频广告';
      case AdType.INTERSTITIAL:
        return '插屏广告';
      case AdType.BANNER:
        return 'Banner广告';
      default:
        return '广告';
    }
  };

  const getAdTypeColor = (adType: AdType): string => {
    switch (adType) {
      case AdType.SPLASH:
        return '#FF6B6B';
      case AdType.REWARD_VIDEO:
        return '#4ECDC4';
      case AdType.INTERSTITIAL:
        return '#45B7D1';
      case AdType.BANNER:
        return '#96CEB4';
      default:
        return '#95A5A6';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'success':
        return '#52C41A';
      case 'error':
        return '#FF4D4F';
      case 'loading':
        return '#1890FF';
      default:
        return '#666666';
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>请先登录以使用广告测试功能</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>广告集成测试</Text>
          <Text style={styles.subtitle}>测试 Pangle SDK + API 集成</Text>
        </View>

        {/* SDK Status */}
        <View style={styles.statusCard}>
          <Text style={styles.cardTitle}>SDK 状态</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>SDK 状态:</Text>
            <Text style={[styles.statusValue, { color: isSDKReady ? '#52C41A' : '#FF4D4F' }]}>
              {isSDKReady ? '已就绪' : '未就绪'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>SDK 版本:</Text>
            <Text style={styles.statusValue}>{sdkVersion}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>用户:</Text>
            <Text style={styles.statusValue}>{user.nickName}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>今日收益:</Text>
            <Text style={styles.statusValue}>¥{revenueData?.todayRevenue?.toFixed(2) || '0.00'}</Text>
          </View>
        </View>

        {/* Test Buttons */}
        <View style={styles.testSection}>
          <Text style={styles.cardTitle}>广告类型测试</Text>
          <View style={styles.buttonGrid}>
            {Object.values(AdType).map((adType) => (
              <TouchableOpacity
                key={adType}
                style={[
                  styles.testButton,
                  { borderColor: getAdTypeColor(adType) },
                  loadingAdType === adType && styles.testButtonLoading,
                ]}
                onPress={() => testAdType(adType)}
                disabled={!isSDKReady || !!loadingAdType}
              >
                <View style={styles.testButtonContent}>
                  {loadingAdType === adType ? (
                    <ActivityIndicator size="small" color={getAdTypeColor(adType)} />
                  ) : (
                    <Text style={[styles.testButtonText, { color: getAdTypeColor(adType) }]}>
                      {getAdTypeDisplayName(adType)}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Test Results */}
        <View style={styles.resultsSection}>
          <View style={styles.resultsHeader}>
            <Text style={styles.cardTitle}>测试结果</Text>
            <TouchableOpacity onPress={clearTestResults} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>清除</Text>
            </TouchableOpacity>
          </View>
          
          {testResults.length === 0 ? (
            <View style={styles.emptyResults}>
              <Text style={styles.emptyText}>暂无测试结果</Text>
            </View>
          ) : (
            <View style={styles.resultsList}>
              {testResults.map((result, index) => (
                <View key={index} style={styles.resultItem}>
                  <View style={styles.resultHeader}>
                    <Text style={[styles.resultAdType, { color: getAdTypeColor(result.adType) }]}>
                      {getAdTypeDisplayName(result.adType)}
                    </Text>
                    <Text style={styles.resultTime}>{formatTimestamp(result.timestamp)}</Text>
                  </View>
                  <View style={styles.resultContent}>
                    <Text style={[styles.resultStatus, { color: getStatusColor(result.status) }]}>
                      {result.status === 'success' ? '✓' : result.status === 'error' ? '✗' : '⏳'}
                    </Text>
                    <Text style={styles.resultMessage}>{result.message}</Text>
                    {result.reward && (
                      <Text style={styles.resultReward}>+¥{result.reward.toFixed(2)}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF4D4F',
    textAlign: 'center',
  },

  // Header
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },

  // Status Card
  statusCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666666',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },

  // Test Section
  testSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  testButton: {
    flex: 1,
    minWidth: '45%',
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  testButtonLoading: {
    opacity: 0.7,
  },
  testButtonContent: {
    minHeight: 20,
    justifyContent: 'center',
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Results Section
  resultsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
  },
  clearButtonText: {
    fontSize: 12,
    color: '#666666',
  },
  emptyResults: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
  },
  resultsList: {
    gap: 8,
  },
  resultItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#E8E8E8',
    paddingLeft: 12,
    paddingVertical: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultAdType: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultTime: {
    fontSize: 12,
    color: '#999999',
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultStatus: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultMessage: {
    flex: 1,
    fontSize: 13,
    color: '#666666',
  },
  resultReward: {
    fontSize: 13,
    fontWeight: '600',
    color: '#52C41A',
  },
});

export default AdTestScreen;