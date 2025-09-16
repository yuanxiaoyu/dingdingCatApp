/**
 * AdButton 组件使用示例
 * AdButton Component Usage Example
 */

import React, { useState } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import AdButton from './AdButton';
import AdConfig from '../config/adConfig';

const AdButtonExample: React.FC = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // 处理广告按钮点击
  const handleAdButtonPress = async (adType: string, adId: string) => {
    console.log(`Ad button pressed: ${adType} with ID: ${adId}`);
    
    // 设置加载状态
    setLoadingStates(prev => ({ ...prev, [adType]: true }));
    
    try {
      // 模拟广告加载过程
      await new Promise<void>(resolve => setTimeout(resolve, 2000));
      
      Alert.alert('成功', `${adType} 广告加载成功！`);
    } catch (error) {
      Alert.alert('错误', `${adType} 广告加载失败`);
    } finally {
      // 清除加载状态
      setLoadingStates(prev => ({ ...prev, [adType]: false }));
    }
  };

  return (
    <View style={styles.container}>
      {/* 使用配置文件中的广告按钮配置 */}
      {AdConfig.adButtons.map((buttonConfig) => (
        <AdButton
          key={buttonConfig.adType}
          title={buttonConfig.title}
          adType={buttonConfig.adType}
          adId={buttonConfig.adId}
          enabled={buttonConfig.enabled}
          loading={loadingStates[buttonConfig.adType] || false}
          onPress={handleAdButtonPress}
        />
      ))}
      
      {/* 自定义样式的按钮示例 */}
      <AdButton
        title="自定义样式广告"
        adType="custom"
        adId="custom_123"
        onPress={handleAdButtonPress}
        buttonStyle={styles.customButton}
        textStyle={styles.customText}
      />
      
      {/* 禁用状态的按钮示例 */}
      <AdButton
        title="禁用的广告按钮"
        adType="disabled"
        adId="disabled_123"
        disabled={true}
        onPress={handleAdButtonPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  customButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
  },
  customText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AdButtonExample;