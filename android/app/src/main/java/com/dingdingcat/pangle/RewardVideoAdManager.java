package com.dingdingcat.pangle;

import android.app.Activity;
import android.os.Bundle;
import android.util.Log;

import com.bytedance.sdk.openadsdk.AdSlot;
import com.bytedance.sdk.openadsdk.CSJAdError;
import com.bytedance.sdk.openadsdk.TTAdConstant;
import com.bytedance.sdk.openadsdk.TTAdNative;
import com.bytedance.sdk.openadsdk.TTAdSdk;
import com.bytedance.sdk.openadsdk.TTRewardVideoAd;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

/**
 * 激励视频广告管理器
 * Reward Video Ad Manager
 * 
 * 基于穿山甲官方 Demo 实现，负责激励视频广告的加载、展示和回调处理
 * Based on official Pangle Demo implementation, handles reward video ad loading, display and callbacks
 */
public class RewardVideoAdManager {
    private static final String TAG = "RewardVideoAdManager";
    
    private Activity activity;
    private TTRewardVideoAd ttRewardVideoAd;
    private TTAdNative.RewardVideoAdListener rewardVideoListener;
    private TTRewardVideoAd.RewardAdInteractionListener rewardVideoAdInteractionListener;
    private Promise loadPromise;
    private Promise showPromise;
    private boolean isLoading = false;
    
    public RewardVideoAdManager(Activity activity) {
        this.activity = activity;
        initListeners();
    }
    
    /**
     * 加载激励视频广告
     * Load reward video ad
     */
    public void loadRewardVideoAd(String adId, Promise promise) {
        if (activity == null) {
            promise.reject("ACTIVITY_ERROR", "Activity is null");
            return;
        }
        
        if (isLoading) {
            promise.reject("LOADING_ERROR", "Reward video ad is already loading");
            return;
        }
        
        if (ttRewardVideoAd != null) {
            promise.reject("ALREADY_LOADED", "Reward video ad is already loaded, please show it first");
            return;
        }
        
        try {
            Log.d(TAG, "Loading reward video ad with ID: " + adId);
            isLoading = true;
            loadPromise = promise;
            
            // 1、创建AdSlot对象
            AdSlot adSlot = new AdSlot.Builder()
                    .setCodeId(adId)
                    .setOrientation(TTAdConstant.ORIENTATION_VERTICAL) // 设置垂直方向
                    .build();
            
            // 2、创建TTAdNative对象
            TTAdNative adNativeLoader = TTAdSdk.getAdManager().createAdNative(activity);
            
            // 4、加载广告
            if (adNativeLoader != null) {
                adNativeLoader.loadRewardVideoAd(adSlot, rewardVideoListener);
            } else {
                isLoading = false;
                promise.reject("AD_NATIVE_ERROR", "Failed to create ad native loader");
            }
            
        } catch (Exception e) {
            isLoading = false;
            Log.e(TAG, "Exception during reward video ad loading", e);
            promise.reject("LOAD_EXCEPTION", "Reward video ad loading exception: " + e.getMessage());
        }
    }
    
    /**
     * 展示激励视频广告
     * Show reward video ad
     */
    public void showRewardVideoAd(Promise promise) {
        if (ttRewardVideoAd == null) {
            promise.reject("NOT_LOADED", "Reward video ad is not loaded");
            return;
        }
        
        try {
            Log.d(TAG, "Showing reward video ad");
            showPromise = promise;
            
            // 5、设置展示监听器，展示广告
            ttRewardVideoAd.setRewardAdInteractionListener(rewardVideoAdInteractionListener);
            ttRewardVideoAd.showRewardVideoAd(activity);
            
            // 展示开始时立即返回成功
            WritableMap result = Arguments.createMap();
            result.putString("status", "showing");
            result.putString("message", "Reward video ad started showing");
            promise.resolve(result);
            showPromise = null;
            
        } catch (Exception e) {
            Log.e(TAG, "Exception during reward video ad showing", e);
            promise.reject("SHOW_EXCEPTION", "Reward video ad showing exception: " + e.getMessage());
            showPromise = null;
        }
    }
    
    /**
     * 销毁激励视频广告
     * Destroy reward video ad
     */
    public void destroyRewardVideoAd() {
        Log.d(TAG, "Destroying reward video ad");
        
        if (ttRewardVideoAd != null && ttRewardVideoAd.getMediationManager() != null) {
            ttRewardVideoAd.getMediationManager().destroy();
        }
        
        ttRewardVideoAd = null;
        isLoading = false;
        loadPromise = null;
        showPromise = null;
    }
    
    /**
     * 检查广告是否已加载
     * Check if ad is loaded
     */
    public boolean isAdLoaded() {
        return ttRewardVideoAd != null;
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
        this.rewardVideoListener = new TTAdNative.RewardVideoAdListener() {
            @Override
            public void onError(int code, String message) {
                Log.e(TAG, "Reward video load fail: errCode: " + code + ", errMsg: " + message);
                isLoading = false;
                ttRewardVideoAd = null;
                
                if (loadPromise != null) {
                    loadPromise.reject("LOAD_FAILED", "Reward video ad load failed: " + message + " (code: " + code + ")");
                    loadPromise = null;
                }
            }
            
            @Override
            public void onRewardVideoAdLoad(TTRewardVideoAd rewardVideoAd) {
                Log.d(TAG, "Reward video load success");
                ttRewardVideoAd = rewardVideoAd;
                isLoading = false;
                
                if (loadPromise != null) {
                    WritableMap result = Arguments.createMap();
                    result.putString("status", "loaded");
                    result.putString("message", "Reward video ad loaded successfully");
                    loadPromise.resolve(result);
                    loadPromise = null;
                }
            }
            
            @Override
            public void onRewardVideoCached() {
                Log.d(TAG, "Reward video cached success");
                // 缓存成功，广告已准备好展示
            }
            
            @Override
            public void onRewardVideoCached(TTRewardVideoAd rewardVideoAd) {
                Log.d(TAG, "Reward video cached success with ad object");
                ttRewardVideoAd = rewardVideoAd;
                // 缓存成功，广告已准备好展示
            }
        };
        
        // 广告展示监听器
        this.rewardVideoAdInteractionListener = new TTRewardVideoAd.RewardAdInteractionListener() {
            @Override
            public void onAdShow() {
                Log.d(TAG, "Reward video ad show");
                // 广告展示
            }
            
            @Override
            public void onAdVideoBarClick() {
                Log.d(TAG, "Reward video ad click");
                // 广告点击
            }
            
            @Override
            public void onAdClose() {
                Log.d(TAG, "Reward video ad close");
                // 广告关闭后自动销毁
                destroyRewardVideoAd();
            }
            
            @Override
            public void onVideoComplete() {
                Log.d(TAG, "Reward video complete");
                // 视频播放完成
            }
            
            @Override
            public void onVideoError() {
                Log.e(TAG, "Reward video error");
                // 视频播放出错
            }
            
            @Override
            public void onRewardVerify(boolean rewardVerify, int rewardAmount, String rewardName, int errorCode, String errorMsg) {
                Log.d(TAG, "Reward verify: " + rewardVerify + ", amount: " + rewardAmount + ", name: " + rewardName);
                if (!rewardVerify) {
                    Log.e(TAG, "Reward verify failed: " + errorMsg + " (code: " + errorCode + ")");
                }
                // 奖励验证回调
            }
            
            @Override
            public void onRewardArrived(boolean isRewardValid, int rewardType, Bundle extraInfo) {
                Log.d(TAG, "Reward arrived: valid=" + isRewardValid + ", type=" + rewardType);
                // 奖励到达回调
                if (isRewardValid) {
                    Log.d(TAG, "用户获得奖励");
                    // 可以在这里发送事件到React Native层通知奖励获得
                } else {
                    Log.d(TAG, "用户未获得奖励");
                }
            }
            
            @Override
            public void onSkippedVideo() {
                Log.d(TAG, "Reward video skipped");
                // 用户跳过视频
            }
        };
    }
}