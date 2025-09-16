/**
 * SDK 测试界面
 * SDK Test Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import PangleAdService from '../services/PangleAdService';
import AdConfig from '../config/adConfig';

const SDKTestScreen = () => {
  const [sdkStatus, setSdkStatus] = useState({
    initialized: false,
    started: false,
    version: null,
  });
  const [loading, setLoading] = useState(false);
  const [splashAdStatus, setSplashAdStatus] = useState({
    loaded: false,
    loading: false,
  });
  const [rewardVideoAdStatus, setRewardVideoAdStatus] = useState({
    loaded: false,
    loading: false,
  });
  const [interstitialAdStatus, setInterstitialAdStatus] = useState({
    loaded: false,
    loading: false,
  });

  useEffect(() => {
    checkSDKStatus();
  }, []);

  const checkSDKStatus = async () => {
    try {
      const initialized = await PangleAdService.isSDKInitialized();
      const started = await PangleAdService.isSDKStarted();
      let version = null;
      
      try {
        version = await PangleAdService.getSDKVersion();
      } catch (error) {
        console.log('Cannot get version yet:', error.message);
      }

      setSdkStatus({ initialized, started, version });
      
      // 检查开屏广告状态
      if (started) {
        await checkSplashAdStatus();
        await checkRewardVideoAdStatus();
        await checkInterstitialAdStatus();
      }
    } catch (error) {
      console.error('Failed to check SDK status:', error);
    }
  };

  const checkSplashAdStatus = async () => {
    try {
      const loaded = await PangleAdService.isSplashAdLoaded();
      const loading = await PangleAdService.isSplashAdLoading();
      setSplashAdStatus({ loaded, loading });
    } catch (error) {
      console.error('Failed to check splash ad status:', error);
    }
  };

  const checkRewardVideoAdStatus = async () => {
    try {
      const loaded = await PangleAdService.isRewardVideoAdLoaded();
      const loading = await PangleAdService.isRewardVideoAdLoading();
      setRewardVideoAdStatus({ loaded, loading });
    } catch (error) {
      console.error('Failed to check reward video ad status:', error);
    }
  };

  const checkInterstitialAdStatus = async () => {
    try {
      const loaded = await PangleAdService.isInterstitialAdLoaded();
      const loading = await PangleAdService.isInterstitialAdLoading();
      setInterstitialAdStatus({ loaded, loading });
    } catch (error) {
      console.error('Failed to check interstitial ad status:', error);
    }
  };

  const handleInitializeSDK = async () => {
    setLoading(true);
    try {
      await PangleAdService.initializeSDK(AdConfig.appId);
      Alert.alert('成功', 'SDK 初始化成功');
      await checkSDKStatus();
    } catch (error) {
      Alert.alert('错误', `SDK 初始化失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSDK = async () => {
    setLoading(true);
    try {
      await PangleAdService.startSDK();
      Alert.alert('成功', 'SDK 启动成功');
      await checkSDKStatus();
    } catch (error) {
      Alert.alert('错误', `SDK 启动失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFullInitialization = async () => {
    setLoading(true);
    try {
      await PangleAdService.initializeAndStartSDK(AdConfig.appId);
      Alert.alert('成功', 'SDK 完整初始化成功');
      await checkSDKStatus();
    } catch (error) {
      Alert.alert('错误', `SDK 完整初始化失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ==================== 开屏广告相关方法 ====================

  const handleLoadSplashAd = async () => {
    setLoading(true);
    try {
      const result = await PangleAdService.loadSplashAd(AdConfig.splashAdId);
      Alert.alert('成功', `开屏广告加载成功: ${result.message}`);
      await checkSplashAdStatus();
    } catch (error) {
      Alert.alert('错误', `开屏广告加载失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleShowSplashAd = async () => {
    setLoading(true);
    try {
      const result = await PangleAdService.showSplashAd();
      Alert.alert('成功', `开屏广告展示: ${result.message}`);
      await checkSplashAdStatus();
    } catch (error) {
      Alert.alert('错误', `开屏广告展示失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadAndShowSplashAd = async () => {
    setLoading(true);
    try {
      const result = await PangleAdService.loadAndShowSplashAd(AdConfig.splashAdId);
      Alert.alert('成功', '开屏广告加载并展示成功');
      await checkSplashAdStatus();
    } catch (error) {
      Alert.alert('错误', `开屏广告加载并展示失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDestroySplashAd = async () => {
    setLoading(true);
    try {
      const result = await PangleAdService.destroySplashAd();
      Alert.alert('成功', `开屏广告销毁成功: ${result}`);
      await checkSplashAdStatus();
    } catch (error) {
      Alert.alert('错误', `开屏广告销毁失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ==================== 激励视频广告相关方法 ====================

  const handleLoadRewardVideoAd = async () => {
    setLoading(true);
    try {
      const result = await PangleAdService.loadRewardVideoAd(AdConfig.rewardVideoAdId);
      Alert.alert('成功', `激励视频广告加载成功: ${result.message}`);
      await checkRewardVideoAdStatus();
    } catch (error) {
      Alert.alert('错误', `激励视频广告加载失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleShowRewardVideoAd = async () => {
    setLoading(true);
    try {
      const result = await PangleAdService.showRewardVideoAd();
      Alert.alert('成功', `激励视频广告展示: ${result.message}`);
      await checkRewardVideoAdStatus();
    } catch (error) {
      Alert.alert('错误', `激励视频广告展示失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadAndShowRewardVideoAd = async () => {
    setLoading(true);
    try {
      const result = await PangleAdService.loadAndShowRewardVideoAd(AdConfig.rewardVideoAdId);
      Alert.alert('成功', '激励视频广告加载并展示成功');
      await checkRewardVideoAdStatus();
    } catch (error) {
      Alert.alert('错误', `激励视频广告加载并展示失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDestroyRewardVideoAd = async () => {
    setLoading(true);
    try {
      const result = await PangleAdService.destroyRewardVideoAd();
      Alert.alert('成功', `激励视频广告销毁成功: ${result}`);
      await checkRewardVideoAdStatus();
    } catch (error) {
      Alert.alert('错误', `激励视频广告销毁失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ==================== 新插屏广告相关方法 ====================

  const handleLoadInterstitialAd = async () => {
    setLoading(true);
    try {
      const result = await PangleAdService.loadInterstitialAd(AdConfig.interstitialAdId);
      Alert.alert('成功', `新插屏广告加载成功: ${result.message}`);
      await checkInterstitialAdStatus();
    } catch (error) {
      Alert.alert('错误', `新插屏广告加载失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleShowInterstitialAd = async () => {
    setLoading(true);
    try {
      const result = await PangleAdService.showInterstitialAd();
      Alert.alert('成功', `新插屏广告展示: ${result.message}`);
      await checkInterstitialAdStatus();
    } catch (error) {
      Alert.alert('错误', `新插屏广告展示失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadAndShowInterstitialAd = async () => {
    setLoading(true);
    try {
      const result = await PangleAdService.loadAndShowInterstitialAd(AdConfig.interstitialAdId);
      Alert.alert('成功', '新插屏广告加载并展示成功');
      await checkInterstitialAdStatus();
    } catch (error) {
      Alert.alert('错误', `新插屏广告加载并展示失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDestroyInterstitialAd = async () => {
    setLoading(true);
    try {
      const result = await PangleAdService.destroyInterstitialAd();
      Alert.alert('成功', `新插屏广告销毁成功: ${result}`);
      await checkInterstitialAdStatus();
    } catch (error) {
      Alert.alert('错误', `新插屏广告销毁失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>穿山甲 SDK 测试</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>SDK 状态</Text>
        <Text style={styles.statusText}>
          应用 ID: {AdConfig.appId}
        </Text>
        <Text style={styles.statusText}>
          已初始化: {sdkStatus.initialized ? '是' : '否'}
        </Text>
        <Text style={styles.statusText}>
          已启动: {sdkStatus.started ? '是' : '否'}
        </Text>
        <Text style={styles.statusText}>
          SDK 版本: {sdkStatus.version || '未获取'}
        </Text>
      </View>

      {/* 开屏广告状态 */}
      {sdkStatus.started && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>开屏广告状态</Text>
          <Text style={styles.statusText}>
            广告位 ID: {AdConfig.splashAdId}
          </Text>
          <Text style={styles.statusText}>
            已加载: {splashAdStatus.loaded ? '是' : '否'}
          </Text>
          <Text style={styles.statusText}>
            加载中: {splashAdStatus.loading ? '是' : '否'}
          </Text>
        </View>
      )}

      {/* 激励视频广告状态 */}
      {sdkStatus.started && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>激励视频广告状态</Text>
          <Text style={styles.statusText}>
            广告位 ID: {AdConfig.rewardVideoAdId}
          </Text>
          <Text style={styles.statusText}>
            已加载: {rewardVideoAdStatus.loaded ? '是' : '否'}
          </Text>
          <Text style={styles.statusText}>
            加载中: {rewardVideoAdStatus.loading ? '是' : '否'}
          </Text>
        </View>
      )}

      {/* 新插屏广告状态 */}
      {sdkStatus.started && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>新插屏广告状态</Text>
          <Text style={styles.statusText}>
            广告位 ID: {AdConfig.interstitialAdId}
          </Text>
          <Text style={styles.statusText}>
            已加载: {interstitialAdStatus.loaded ? '是' : '否'}
          </Text>
          <Text style={styles.statusText}>
            加载中: {interstitialAdStatus.loading ? '是' : '否'}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleInitializeSDK}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? '处理中...' : '初始化 SDK (第一步)'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleStartSDK}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? '处理中...' : '启动 SDK (第二步)'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
        onPress={handleFullInitialization}
        disabled={loading}
      >
        <Text style={[styles.buttonText, styles.primaryButtonText]}>
          {loading ? '处理中...' : '完整初始化 SDK (两步合一)'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={checkSDKStatus}
      >
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>
          刷新状态
        </Text>
      </TouchableOpacity>

      {/* 开屏广告测试按钮 */}
      {sdkStatus.started && (
        <>
          <View style={styles.sectionDivider}>
            <Text style={styles.sectionTitle}>开屏广告测试</Text>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.adButton, loading && styles.buttonDisabled]}
            onPress={handleLoadSplashAd}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '处理中...' : '加载开屏广告'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button, 
              styles.adButton, 
              (!splashAdStatus.loaded || loading) && styles.buttonDisabled
            ]}
            onPress={handleShowSplashAd}
            disabled={!splashAdStatus.loaded || loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '处理中...' : '展示开屏广告'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleLoadAndShowSplashAd}
            disabled={loading}
          >
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              {loading ? '处理中...' : '加载并展示开屏广告'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button, 
              styles.warningButton, 
              (!splashAdStatus.loaded || loading) && styles.buttonDisabled
            ]}
            onPress={handleDestroySplashAd}
            disabled={!splashAdStatus.loaded || loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '处理中...' : '销毁开屏广告'}
            </Text>
          </TouchableOpacity>

          {/* 激励视频广告测试按钮 */}
          <View style={styles.sectionDivider}>
            <Text style={styles.sectionTitle}>激励视频广告测试</Text>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.adButton, loading && styles.buttonDisabled]}
            onPress={handleLoadRewardVideoAd}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '处理中...' : '加载激励视频广告'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button, 
              styles.adButton, 
              (!rewardVideoAdStatus.loaded || loading) && styles.buttonDisabled
            ]}
            onPress={handleShowRewardVideoAd}
            disabled={!rewardVideoAdStatus.loaded || loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '处理中...' : '展示激励视频广告'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleLoadAndShowRewardVideoAd}
            disabled={loading}
          >
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              {loading ? '处理中...' : '加载并展示激励视频广告'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button, 
              styles.warningButton, 
              (!rewardVideoAdStatus.loaded || loading) && styles.buttonDisabled
            ]}
            onPress={handleDestroyRewardVideoAd}
            disabled={!rewardVideoAdStatus.loaded || loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '处理中...' : '销毁激励视频广告'}
            </Text>
          </TouchableOpacity>

          {/* 新插屏广告测试按钮 */}
          <View style={styles.sectionDivider}>
            <Text style={styles.sectionTitle}>新插屏广告测试</Text>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.adButton, loading && styles.buttonDisabled]}
            onPress={handleLoadInterstitialAd}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '处理中...' : '加载新插屏广告'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button, 
              styles.adButton, 
              (!interstitialAdStatus.loaded || loading) && styles.buttonDisabled
            ]}
            onPress={handleShowInterstitialAd}
            disabled={!interstitialAdStatus.loaded || loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '处理中...' : '展示新插屏广告'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleLoadAndShowInterstitialAd}
            disabled={loading}
          >
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              {loading ? '处理中...' : '加载并展示新插屏广告'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button, 
              styles.warningButton, 
              (!interstitialAdStatus.loaded || loading) && styles.buttonDisabled
            ]}
            onPress={handleDestroyInterstitialAd}
            disabled={!interstitialAdStatus.loaded || loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '处理中...' : '销毁新插屏广告'}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  statusText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  primaryButton: {
    backgroundColor: '#34C759',
  },
  primaryButtonText: {
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  sectionDivider: {
    marginTop: 20,
    marginBottom: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  adButton: {
    backgroundColor: '#FF9500',
  },
  warningButton: {
    backgroundColor: '#FF3B30',
  },
});

export default SDKTestScreen;