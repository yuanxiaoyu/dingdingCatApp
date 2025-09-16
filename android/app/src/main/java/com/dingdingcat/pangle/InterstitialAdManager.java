package com.dingdingcat.pangle;

import android.app.Activity;
import android.util.Log;

import com.bytedance.sdk.openadsdk.AdSlot;
import com.bytedance.sdk.openadsdk.CSJAdError;
import com.bytedance.sdk.openadsdk.TTAdNative;
import com.bytedance.sdk.openadsdk.TTAdSdk;
import com.bytedance.sdk.openadsdk.TTFullScreenVideoAd;
import com.bytedance.sdk.openadsdk.TTAdConstant;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

/**
 * 新插屏广告管理器
 * Interstitial Ad Manager
 * 
 * 基于穿山甲官方 Demo 实现，负责新插屏广告的加载、展示和回调处理
 * Based on official Pangle Demo implementation, handles interstitial ad loading, display and callbacks
 */
public class InterstitialAdManager {
    private static final String TAG = "InterstitialAdManager";
    
    private Activity activity;
    private TTFullScreenVideoAd ttFullScreenVideoAd;
    private TTAdNative.FullScreenVideoAdListener fullScreenVideoListener;
    private TTFullScreenVideoAd.FullScreenVideoAdInteractionListener fullScreenVideoAdInteractionListener;
    private Promise loadPromise;
    private Promise showPromise;
    private boolean isLoading = false;
    
    public InterstitialAdManager(Activity activity) {
        this.activity = activity;
        initListeners();
    }
    
    /**
     * 加载新插屏广告
     * Load interstitial ad
     */
    public void loadInterstitialAd(String adId, Promise promise) {
        if (activity == null) {
            promise.reject("ACTIVITY_ERROR", "Activity is null");
            return;
        }
        
        if (isLoading) {
            promise.reject("LOADING_ERROR", "Interstitial ad is already loading");
            return;
        }
        
        if (ttFullScreenVideoAd != null) {
            promise.reject("ALREADY_LOADED", "Interstitial ad is already loaded, please show it first");
            return;
        }
        
        try {
            Log.d(TAG, "Loading interstitial ad with ID: " + adId);
            Log.d(TAG, "SDK initialized: " + TTAdSdk.isInitSuccess());
            isLoading = true;
            loadPromise = promise;
            
            // 检查SDK是否已初始化
            if (!TTAdSdk.isInitSuccess()) {
                isLoading = false;
                promise.reject("SDK_NOT_INITIALIZED", "Pangle SDK is not initialized");
                return;
            }
            
            // 1、创建AdSlot对象
            AdSlot adSlot = new AdSlot.Builder()
                    .setCodeId(adId)
                    .setOrientation(TTAdConstant.ORIENTATION_VERTICAL)
                    .build();
            
            // 2、创建TTAdNative对象
            TTAdNative adNativeLoader = TTAdSdk.getAdManager().createAdNative(activity);
            
            // 4、加载广告
            if (adNativeLoader != null) {
                Log.d(TAG, "Starting to load full screen video ad with slot: " + adId);
                adNativeLoader.loadFullScreenVideoAd(adSlot, fullScreenVideoListener);
            } else {
                isLoading = false;
                promise.reject("AD_NATIVE_ERROR", "Failed to create ad native loader");
            }
            
        } catch (Exception e) {
            isLoading = false;
            Log.e(TAG, "Exception during interstitial ad loading", e);
            promise.reject("LOAD_EXCEPTION", "Interstitial ad loading exception: " + e.getMessage());
        }
    }
    
    /**
     * 展示新插屏广告
     * Show interstitial ad
     */
    public void showInterstitialAd(Promise promise) {
        if (ttFullScreenVideoAd == null) {
            promise.reject("NOT_LOADED", "Interstitial ad is not loaded");
            return;
        }
        
        try {
            Log.d(TAG, "Showing interstitial ad");
            showPromise = promise;
            
            // 5、设置展示监听器，展示广告
            ttFullScreenVideoAd.setFullScreenVideoAdInteractionListener(fullScreenVideoAdInteractionListener);
            ttFullScreenVideoAd.showFullScreenVideoAd(activity);
            
            // 展示开始时立即返回成功
            WritableMap result = Arguments.createMap();
            result.putString("status", "showing");
            result.putString("message", "Interstitial ad started showing");
            promise.resolve(result);
            showPromise = null;
            
        } catch (Exception e) {
            Log.e(TAG, "Exception during interstitial ad showing", e);
            promise.reject("SHOW_EXCEPTION", "Interstitial ad showing exception: " + e.getMessage());
            showPromise = null;
        }
    }
    
    /**
     * 销毁新插屏广告
     * Destroy interstitial ad
     */
    public void destroyInterstitialAd() {
        Log.d(TAG, "Destroying interstitial ad");
        
        if (ttFullScreenVideoAd != null && ttFullScreenVideoAd.getMediationManager() != null) {
            ttFullScreenVideoAd.getMediationManager().destroy();
        }
        
        ttFullScreenVideoAd = null;
        isLoading = false;
        loadPromise = null;
        showPromise = null;
    }
    
    /**
     * 检查广告是否已加载
     * Check if ad is loaded
     */
    public boolean isAdLoaded() {
        return ttFullScreenVideoAd != null;
    }
    
    /**
     * 检查是否正在加载
     * Check if loading
     */
    public boolean isLoading() {
        return isLoading;
    }
    
    /**
     * 初始化监听器
     * Initialize listeners
     */
    private void initListeners() {
        // 广告加载监听器
        this.fullScreenVideoListener = new TTAdNative.FullScreenVideoAdListener() {
            @Override
            public void onError(int code, String message) {
                Log.e(TAG, "Interstitial ad load fail: errCode: " + code + ", errMsg: " + message);
                isLoading = false;
                ttFullScreenVideoAd = null;
                
                if (loadPromise != null) {
                    loadPromise.reject("LOAD_FAILED", "Interstitial ad load failed: " + message + " (code: " + code + ")");
                    loadPromise = null;
                }
            }
            
            @Override
            public void onFullScreenVideoAdLoad(TTFullScreenVideoAd fullScreenVideoAd) {
                Log.d(TAG, "Interstitial ad load success");
                ttFullScreenVideoAd = fullScreenVideoAd;
                isLoading = false;
                
                if (loadPromise != null) {
                    WritableMap result = Arguments.createMap();
                    result.putString("status", "loaded");
                    result.putString("message", "Interstitial ad loaded successfully");
                    result.putString("adType", getAdType(fullScreenVideoAd.getFullVideoAdType()));
                    loadPromise.resolve(result);
                    loadPromise = null;
                }
            }
            
            @Override
            public void onFullScreenVideoCached() {
                Log.d(TAG, "Interstitial ad cached success (deprecated method)");
                // 已废弃 请使用 onFullScreenVideoCached(TTFullScreenVideoAd ad) 方法
            }
            
            @Override
            public void onFullScreenVideoCached(TTFullScreenVideoAd fullScreenVideoAd) {
                Log.d(TAG, "Interstitial ad cached success");
                ttFullScreenVideoAd = fullScreenVideoAd;
                // 缓存成功，广告已准备好展示
            }
        };
        
        // 广告展示监听器
        this.fullScreenVideoAdInteractionListener = new TTFullScreenVideoAd.FullScreenVideoAdInteractionListener() {
            @Override
            public void onAdShow() {
                Log.d(TAG, "Interstitial ad show");
                // 广告展示
            }
            
            @Override
            public void onAdVideoBarClick() {
                Log.d(TAG, "Interstitial ad click");
                // 广告点击
            }
            
            @Override
            public void onAdClose() {
                Log.d(TAG, "Interstitial ad close");
                // 广告关闭后自动销毁
                destroyInterstitialAd();
            }
            
            @Override
            public void onVideoComplete() {
                Log.d(TAG, "Interstitial ad video complete");
                // 视频播放完成
            }
            
            @Override
            public void onSkippedVideo() {
                Log.d(TAG, "Interstitial ad video skipped");
                // 用户跳过视频
            }
        };
    }
    
    /**
     * 获取广告类型描述
     * Get ad type description
     */
    private String getAdType(int type) {
        switch (type) {
            case TTAdConstant.AD_TYPE_COMMON_VIDEO:
                return "普通全屏视频";
            case TTAdConstant.AD_TYPE_PLAYABLE_VIDEO:
                return "Playable全屏视频";
            case TTAdConstant.AD_TYPE_PLAYABLE:
                return "纯Playable";
            case TTAdConstant.AD_TYPE_LIVE:
                return "直播流";
            default:
                return "未知类型";
        }
    }
}