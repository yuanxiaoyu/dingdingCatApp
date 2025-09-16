package com.dingdingcat.pangle;

import android.app.Activity;
import android.util.Log;
import android.view.View;
import android.widget.FrameLayout;

import com.bytedance.sdk.openadsdk.AdSlot;
import com.bytedance.sdk.openadsdk.CSJAdError;
import com.bytedance.sdk.openadsdk.CSJSplashAd;
import com.bytedance.sdk.openadsdk.CSJSplashCloseType;
import com.bytedance.sdk.openadsdk.TTAdNative;
import com.bytedance.sdk.openadsdk.TTAdSdk;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

/**
 * 开屏广告管理器
 * Splash Ad Manager
 * 
 * 基于穿山甲官方 Demo 实现，负责开屏广告的加载、展示和回调处理
 * Based on official Pangle Demo implementation, handles splash ad loading, display and callbacks
 */
public class SplashAdManager {
    private static final String TAG = "SplashAdManager";
    private static final int SPLASH_TIMEOUT = 3500; // 3.5秒超时，参考官方Demo
    
    private Activity activity;
    private CSJSplashAd csjSplashAd;
    private TTAdNative.CSJSplashAdListener splashAdListener;
    private CSJSplashAd.SplashAdListener splashInteractionListener;
    private Promise loadPromise;
    private boolean isLoading = false;
    
    public SplashAdManager(Activity activity) {
        this.activity = activity;
        initListeners();
    }
    
    /**
     * 加载开屏广告
     * Load splash ad
     */
    public void loadSplashAd(String adId, Promise promise) {
        if (activity == null) {
            promise.reject("ACTIVITY_ERROR", "Activity is null");
            return;
        }
        
        if (isLoading) {
            promise.reject("LOADING_ERROR", "Splash ad is already loading");
            return;
        }
        
        if (csjSplashAd != null) {
            promise.reject("ALREADY_LOADED", "Splash ad is already loaded, please show it first");
            return;
        }
        
        try {
            Log.d(TAG, "Loading splash ad with ID: " + adId);
            isLoading = true;
            loadPromise = promise;
            
            // 1、创建AdSlot对象
            AdSlot adSlot = new AdSlot.Builder()
                    .setCodeId(adId)
                    .setImageAcceptedSize(getScreenWidth(), getScreenHeight())
                    .build();
            
            // 2、创建TTAdNative对象
            TTAdNative adNativeLoader = TTAdSdk.getAdManager().createAdNative(activity);
            
            // 4、加载广告
            if (adNativeLoader != null) {
                adNativeLoader.loadSplashAd(adSlot, splashAdListener, SPLASH_TIMEOUT);
            } else {
                isLoading = false;
                promise.reject("AD_NATIVE_ERROR", "Failed to create ad native loader");
            }
            
        } catch (Exception e) {
            isLoading = false;
            Log.e(TAG, "Exception during splash ad loading", e);
            promise.reject("LOAD_EXCEPTION", "Splash ad loading exception: " + e.getMessage());
        }
    }
    
    /**
     * 展示开屏广告
     * Show splash ad
     */
    public void showSplashAd(Promise promise) {
        if (csjSplashAd == null) {
            promise.reject("NOT_LOADED", "Splash ad is not loaded");
            return;
        }
        
        try {
            Log.d(TAG, "Showing splash ad");
            
            // 设置交互监听器
            csjSplashAd.setSplashAdListener(splashInteractionListener);
            
            // 获取广告视图
            View splashView = csjSplashAd.getSplashView();
            if (splashView != null && activity != null) {
                // 在主线程中添加广告视图到Activity
                activity.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        try {
                            // 获取Activity的根视图
                            FrameLayout rootView = (FrameLayout) activity.findViewById(android.R.id.content);
                            if (rootView != null) {
                                // 创建全屏布局参数
                                FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                                    FrameLayout.LayoutParams.MATCH_PARENT,
                                    FrameLayout.LayoutParams.MATCH_PARENT
                                );
                                
                                // 添加广告视图到根视图
                                rootView.addView(splashView, params);
                                Log.d(TAG, "Splash ad view added to root view");
                                
                                // 返回成功结果
                                WritableMap result = Arguments.createMap();
                                result.putString("status", "showing");
                                result.putString("message", "Splash ad is now showing");
                                promise.resolve(result);
                            } else {
                                promise.reject("ROOT_VIEW_ERROR", "Failed to get root view from activity");
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "Exception adding splash view to activity", e);
                            promise.reject("ADD_VIEW_EXCEPTION", "Failed to add splash view: " + e.getMessage());
                        }
                    }
                });
            } else {
                if (splashView == null) {
                    promise.reject("VIEW_ERROR", "Failed to get splash ad view");
                } else {
                    promise.reject("ACTIVITY_ERROR", "Activity is null when showing splash ad");
                }
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Exception during splash ad showing", e);
            promise.reject("SHOW_EXCEPTION", "Splash ad showing exception: " + e.getMessage());
        }
    }
    
    /**
     * 销毁开屏广告
     * Destroy splash ad
     */
    public void destroySplashAd() {
        Log.d(TAG, "Destroying splash ad");
        
        if (csjSplashAd != null && csjSplashAd.getMediationManager() != null) {
            csjSplashAd.getMediationManager().destroy();
        }
        
        csjSplashAd = null;
        isLoading = false;
        loadPromise = null;
    }
    
    /**
     * 检查广告是否已加载
     * Check if ad is loaded
     */
    public boolean isAdLoaded() {
        return csjSplashAd != null;
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
        this.splashAdListener = new TTAdNative.CSJSplashAdListener() {
            @Override
            public void onSplashRenderSuccess(CSJSplashAd csjSplashAd) {
                Log.d(TAG, "Splash render success");
                SplashAdManager.this.csjSplashAd = csjSplashAd;
                isLoading = false;
                
                if (loadPromise != null) {
                    WritableMap result = Arguments.createMap();
                    result.putString("status", "loaded");
                    result.putString("message", "Splash ad loaded and rendered successfully");
                    loadPromise.resolve(result);
                    loadPromise = null;
                }
            }
            
            @Override
            public void onSplashLoadSuccess(CSJSplashAd csjSplashAd) {
                Log.d(TAG, "Splash load success with ad object");
            }
            
            @Override
            public void onSplashLoadFail(CSJAdError csjAdError) {
                Log.e(TAG, "Splash load fail, errCode: " + csjAdError.getCode() + ", errMsg: " + csjAdError.getMsg());
                isLoading = false;
                csjSplashAd = null;
                
                if (loadPromise != null) {
                    loadPromise.reject("LOAD_FAILED", "Splash ad load failed: " + csjAdError.getMsg() + " (code: " + csjAdError.getCode() + ")");
                    loadPromise = null;
                }
            }
            
            @Override
            public void onSplashRenderFail(CSJSplashAd csjSplashAd, CSJAdError csjAdError) {
                Log.e(TAG, "Splash render fail, errCode: " + csjAdError.getCode() + ", errMsg: " + csjAdError.getMsg());
                isLoading = false;
                SplashAdManager.this.csjSplashAd = null;
                
                if (loadPromise != null) {
                    loadPromise.reject("RENDER_FAILED", "Splash ad render failed: " + csjAdError.getMsg() + " (code: " + csjAdError.getCode() + ")");
                    loadPromise = null;
                }
            }
        };
        
        // 广告展示监听器
        this.splashInteractionListener = new CSJSplashAd.SplashAdListener() {
            @Override
            public void onSplashAdShow(CSJSplashAd csjSplashAd) {
                Log.d(TAG, "Splash ad show");
                // 可以发送事件到React Native层
            }
            
            @Override
            public void onSplashAdClick(CSJSplashAd csjSplashAd) {
                Log.d(TAG, "Splash ad click");
                // 可以发送事件到React Native层
            }
            
            @Override
            public void onSplashAdClose(CSJSplashAd csjSplashAd, int closeType) {
                Log.d(TAG, "Splash ad close, closeType: " + closeType);
                
                if (closeType == CSJSplashCloseType.CLICK_SKIP) {
                    Log.d(TAG, "开屏广告点击跳过");
                } else if (closeType == CSJSplashCloseType.COUNT_DOWN_OVER) {
                    Log.d(TAG, "开屏广告倒计时结束");
                } else if (closeType == CSJSplashCloseType.CLICK_JUMP) {
                    Log.d(TAG, "开屏广告点击跳转");
                }
                
                // 在主线程中移除广告视图
                if (activity != null) {
                    activity.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            try {
                                // 获取广告视图
                                View splashView = csjSplashAd.getSplashView();
                                if (splashView != null) {
                                    // 获取Activity的根视图
                                    FrameLayout rootView = (FrameLayout) activity.findViewById(android.R.id.content);
                                    if (rootView != null) {
                                        // 从根视图中移除广告视图
                                        rootView.removeView(splashView);
                                        Log.d(TAG, "Splash ad view removed from root view");
                                    }
                                }
                            } catch (Exception e) {
                                Log.e(TAG, "Exception removing splash view from activity", e);
                            }
                        }
                    });
                }
                
                // 广告关闭后自动销毁
                destroySplashAd();
            }
        };
    }
    
    /**
     * 获取屏幕宽度
     * Get screen width
     */
    private int getScreenWidth() {
        if (activity != null) {
            return activity.getResources().getDisplayMetrics().widthPixels;
        }
        return 1080; // 默认值
    }
    
    /**
     * 获取屏幕高度
     * Get screen height
     */
    private int getScreenHeight() {
        if (activity != null) {
            return activity.getResources().getDisplayMetrics().heightPixels;
        }
        return 1920; // 默认值
    }
}