import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import mockService from '../services/MockService';
import AdConfig from '../config/adConfig';
import { ENV_CONFIG } from '../config/env';

const { width } = Dimensions.get('window');

interface SimpleBannerAdProps {
  userId?: number;
  onAdClick?: (adData: any) => void;
  style?: any;
}

/**
 * 简化的Banner广告组件
 * 确保在任何情况下都能显示广告位
 */
const SimpleBannerAd: React.FC<SimpleBannerAdProps> = ({
  userId,
  onAdClick,
  style,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [adData, setAdData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBannerAd();
  }, []);

  const loadBannerAd = async () => {
    try {
      console.log('SimpleBannerAd: Loading banner ad...');
      setIsLoading(true);
      setError(null);

      // 简单延迟模拟加载
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 创建简单的广告数据
      const bannerData = {
        adId: AdConfig.bannerAdId,
        adTitle: '丁丁猫Banner广告',
        adSubtitle: '点击查看详情 • 奖励 ¥0.05',
        clickUrl: 'https://www.dingdingcat.com',
        reward: 0.05,
      };

      console.log('SimpleBannerAd: Banner ad loaded:', bannerData);
      setAdData(bannerData);
      setIsLoading(false);

    } catch (error) {
      console.error('SimpleBannerAd: Load error:', error);
      setError((error as Error).message);
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    if (!adData) return;

    console.log('SimpleBannerAd: Banner clicked');
    
    if (onAdClick) {
      onAdClick(adData);
    }
  };

  const handleRetry = () => {
    loadBannerAd();
  };

  // 加载状态
  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#1890FF" />
          <Text style={styles.loadingText}>加载广告中...</Text>
        </View>
      </View>
    );
  }

  // 错误状态
  if (error) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>广告加载失败</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 广告内容
  if (adData) {
    return (
      <View style={[styles.container, style]}>
        <TouchableOpacity
          style={styles.bannerContainer}
          onPress={handleClick}
          activeOpacity={0.8}
        >
          {/* Banner内容 */}
          <View style={styles.bannerContent}>
            {/* 左侧图标 */}
            <View style={styles.bannerIcon}>
              <Text style={styles.iconText}>📰</Text>
            </View>
            
            {/* 中间内容 */}
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle} numberOfLines={1}>
                {adData.adTitle}
              </Text>
              <Text style={styles.bannerSubtitle} numberOfLines={1}>
                {adData.adSubtitle}
              </Text>
            </View>
            
            {/* 右侧箭头 */}
            <View style={styles.bannerArrow}>
              <Text style={styles.arrowText}>▶</Text>
            </View>
          </View>

          {/* 广告标识 */}
          <View style={styles.adLabel}>
            <Text style={styles.adLabelText}>广告</Text>
          </View>

          {/* Debug信息 */}
          {ENV_CONFIG.DEBUG_MODE && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>
                ID: {adData.adId} | Simple Banner
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // 默认不显示
  return null;
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  loadingContainer: {
    height: 80,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderStyle: 'dashed',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
  },
  errorContainer: {
    height: 80,
    backgroundColor: '#FFF2F0',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCCC7',
  },
  errorText: {
    fontSize: 14,
    color: '#FF4D4F',
    marginRight: 12,
  },
  retryButton: {
    backgroundColor: '#FF4D4F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  bannerContainer: {
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  bannerTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#666666',
  },
  bannerArrow: {
    marginLeft: 8,
  },
  arrowText: {
    fontSize: 14,
    color: '#1890FF',
    fontWeight: 'bold',
  },
  adLabel: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adLabelText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  debugInfo: {
    position: 'absolute',
    bottom: 4,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: 'monospace',
  },
});

export default SimpleBannerAd;