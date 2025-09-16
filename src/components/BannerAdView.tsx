/**
 * Banner 广告视图组件
 * Banner Ad View Component
 */

import React, { useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import {
  requireNativeComponent,
  UIManager,
  findNodeHandle,
  ViewStyle,
  NativeSyntheticEvent,
} from 'react-native';

// 原生组件接口
interface NativeBannerAdViewProps {
  adId: string;
  style?: ViewStyle;
  onAdLoaded?: (event: NativeSyntheticEvent<{ message: string }>) => void;
  onAdLoadFailed?: (event: NativeSyntheticEvent<{ message: string }>) => void;
  onAdShowFailed?: (event: NativeSyntheticEvent<{ message: string }>) => void;
  onAdDestroyed?: (event: NativeSyntheticEvent<{ message: string }>) => void;
}

// Banner 广告视图属性接口
interface BannerAdViewProps {
  adId: string;
  style?: ViewStyle;
  onAdLoaded?: (message: string) => void;
  onAdLoadFailed?: (message: string) => void;
  onAdShowFailed?: (message: string) => void;
  onAdDestroyed?: (message: string) => void;
}

// Banner 广告视图引用接口
export interface BannerAdViewRef {
  loadAd: () => void;
  destroyAd: () => void;
}

// 获取原生组件
const NativeBannerAdView = requireNativeComponent<NativeBannerAdViewProps>('BannerAdView');

/**
 * Banner 广告视图组件
 */
const BannerAdView = forwardRef<BannerAdViewRef, BannerAdViewProps>(
  ({ adId, style, onAdLoaded, onAdLoadFailed, onAdShowFailed, onAdDestroyed }, ref) => {
    const nativeRef = useRef(null);

    // 加载广告
    const loadAd = useCallback(() => {
      const node = findNodeHandle(nativeRef.current);
      if (node) {
        UIManager.dispatchViewManagerCommand(node, 'loadAd', []);
      }
    }, []);

    // 销毁广告
    const destroyAd = useCallback(() => {
      const node = findNodeHandle(nativeRef.current);
      if (node) {
        UIManager.dispatchViewManagerCommand(node, 'destroyAd', []);
      }
    }, []);

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      loadAd,
      destroyAd,
    }), [loadAd, destroyAd]);

    // 事件处理
    const handleAdLoaded = useCallback((event: NativeSyntheticEvent<{ message: string }>) => {
      onAdLoaded?.(event.nativeEvent.message);
    }, [onAdLoaded]);

    const handleAdLoadFailed = useCallback((event: NativeSyntheticEvent<{ message: string }>) => {
      onAdLoadFailed?.(event.nativeEvent.message);
    }, [onAdLoadFailed]);

    const handleAdShowFailed = useCallback((event: NativeSyntheticEvent<{ message: string }>) => {
      onAdShowFailed?.(event.nativeEvent.message);
    }, [onAdShowFailed]);

    const handleAdDestroyed = useCallback((event: NativeSyntheticEvent<{ message: string }>) => {
      onAdDestroyed?.(event.nativeEvent.message);
    }, [onAdDestroyed]);

    return (
      <NativeBannerAdView
        ref={nativeRef}
        adId={adId}
        style={style || {}}
        onAdLoaded={handleAdLoaded}
        onAdLoadFailed={handleAdLoadFailed}
        onAdShowFailed={handleAdShowFailed}
        onAdDestroyed={handleAdDestroyed}
      />
    );
  }
);

BannerAdView.displayName = 'BannerAdView';

export default BannerAdView;