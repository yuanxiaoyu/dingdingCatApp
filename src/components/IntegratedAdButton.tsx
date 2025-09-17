/**
 * IntegratedAdButton - React component that demonstrates the integrated ad service
 * 
 * This component provides buttons for testing all 4 ad types with full API integration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import IntegratedAdService, { AdEventCallbacks } from '../services/IntegratedAdService';
import { AdType, User } from '../types';
import { useSelector } from 'react-redux';
import { RootState } from '../types';

interface IntegratedAdButtonProps {
  adType: AdType;
  title: string;
  disabled?: boolean;
  onRewardEarned?: (reward: number) => void;
}

const IntegratedAdButton: React.FC<IntegratedAdButtonProps> = ({
  adType,
  title,
  disabled = false,
  onRewardEarned,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSDKReady, setIsSDKReady] = useState(false);
  
  // Get current user from Redux store
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    checkSDKStatus();
  }, []);

  useEffect(() => {
    if (user) {
      IntegratedAdService.setCurrentUser(user);
    }
  }, [user]);

  const checkSDKStatus = async () => {
    try {
      const ready = await IntegratedAdService.isSDKReady();
      setIsSDKReady(ready);
    } catch (error) {
      console.error('Error checking SDK status:', error);
      setIsSDKReady(false);
    }
  };

  const createAdCallbacks = (): AdEventCallbacks => ({
    onAdLoaded: (adId: string, adType: AdType) => {
      console.log(`Ad loaded: ${adType} - ${adId}`);
    },
    
    onAdShown: (adId: string, adType: AdType) => {
      console.log(`Ad shown: ${adType} - ${adId}`);
    },
    
    onAdClicked: (adId: string, adType: AdType) => {
      console.log(`Ad clicked: ${adType} - ${adId}`);
    },
    
    onAdCompleted: (adId: string, adType: AdType, reward: number) => {
      console.log(`Ad completed: ${adType} - ${adId}, reward: ${reward}`);
      setIsLoading(false);
      
      if (reward > 0) {
        Alert.alert(
          '恭喜获得奖励！',
          `您观看${getAdTypeDisplayName(adType)}获得了 ${reward} 元奖励！`,
          [{ text: '确定', onPress: () => onRewardEarned?.(reward) }]
        );
      } else {
        Alert.alert('广告播放完成', '感谢您的观看！');
      }
    },
    
    onAdSkipped: (adId: string, adType: AdType) => {
      console.log(`Ad skipped: ${adType} - ${adId}`);
      setIsLoading(false);
      Alert.alert('广告已跳过', '您跳过了广告播放');
    },
    
    onAdClosed: (adId: string, adType: AdType) => {
      console.log(`Ad closed: ${adType} - ${adId}`);
      setIsLoading(false);
    },
    
    onAdError: (adId: string, adType: AdType, error: Error) => {
      console.error(`Ad error: ${adType} - ${adId}:`, error);
      setIsLoading(false);
      Alert.alert(
        '广告加载失败',
        `${getAdTypeDisplayName(adType)}加载失败，请稍后重试。\n错误信息：${error.message}`,
        [{ text: '确定' }]
      );
    },
  });

  const handleAdButtonPress = async () => {
    if (!user) {
      Alert.alert('错误', '请先登录');
      return;
    }

    if (!isSDKReady) {
      Alert.alert('错误', 'SDK未准备就绪，请稍后重试');
      return;
    }

    setIsLoading(true);
    const callbacks = createAdCallbacks();

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
    } catch (error) {
      console.error(`Error loading ${adType} ad:`, error);
      setIsLoading(false);
      Alert.alert(
        '广告加载失败',
        `${getAdTypeDisplayName(adType)}加载失败，请检查网络连接后重试。`,
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

  const getButtonColor = (adType: AdType): string => {
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

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: disabled || isLoading ? '#BDC3C7' : getButtonColor(adType) },
      ]}
      onPress={handleAdButtonPress}
      disabled={disabled || isLoading || !isSDKReady}
    >
      <View style={styles.buttonContent}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>{title}</Text>
        )}
        {!isSDKReady && (
          <Text style={styles.statusText}>SDK未就绪</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Component for displaying all ad types
const IntegratedAdPanel: React.FC = () => {
  const [totalReward, setTotalReward] = useState(0);
  const user = useSelector((state: RootState) => state.auth.user);

  const handleRewardEarned = (reward: number) => {
    setTotalReward(prev => prev + reward);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.loginPrompt}>请先登录以使用广告功能</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>集成广告测试面板</Text>
      <Text style={styles.subtitle}>用户: {user.nickName}</Text>
      <Text style={styles.rewardText}>累计奖励: ¥{totalReward.toFixed(2)}</Text>
      
      <View style={styles.buttonContainer}>
        <IntegratedAdButton
          adType={AdType.SPLASH}
          title="开屏广告"
          onRewardEarned={handleRewardEarned}
        />
        
        <IntegratedAdButton
          adType={AdType.REWARD_VIDEO}
          title="激励视频广告"
          onRewardEarned={handleRewardEarned}
        />
        
        <IntegratedAdButton
          adType={AdType.INTERSTITIAL}
          title="插屏广告"
          onRewardEarned={handleRewardEarned}
        />
        
        <IntegratedAdButton
          adType={AdType.BANNER}
          title="Banner广告"
          onRewardEarned={handleRewardEarned}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#2C3E50',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: '#7F8C8D',
  },
  rewardText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#27AE60',
  },
  loginPrompt: {
    fontSize: 18,
    textAlign: 'center',
    color: '#E74C3C',
    marginTop: 50,
  },
  buttonContainer: {
    gap: 15,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 24,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8,
  },
});

export default IntegratedAdButton;
export { IntegratedAdPanel };