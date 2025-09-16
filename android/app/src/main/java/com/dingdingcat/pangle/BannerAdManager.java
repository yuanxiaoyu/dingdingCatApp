package com.dingdingcat.pangle;

import android.app.Activity;
import android.util.Log;
import android.view.View;
import android.widget.FrameLayout;

import com.bytedance.sdk.openadsdk.AdSlot;
import com.bytedance.sdk.openadsdk.TTAdDislike;
import com.bytedance.sdk.openadsdk.TTAdNative;
import com.bytedance.sdk.openadsdk.TTAdSdk;
import com.bytedance.sdk.openadsdk.TTNativeExpressAd;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

import java.util.List;

/**
 * Banner 广告管理器
 * Banner Ad Manager
 * 
 * 基于穿山甲官方 Demo 实现，负责 Banner 广告的加载、展示和回调处理
 * Based on official Pangle Demo implementation, handles banner ad loading, display and callbacks
 */
public class BannerAdManager {
    private static final String TAG = "BannerAdManager";
    
    private Activity activity;
    private TTNativeExpressAd ttBannerAd;
    private TTAdNative.NativeExpressAdListener bannerListener;
    private TTNativeExpressAd.ExpressAdInteractionListener bannerInteractionListener;
    private TTAdDislike.DislikeInteractionCallback dislikeCallback;
    private Promise loadPromise;
    private Promise showPromise;
    private boolean isLoading = false;
    
    public BannerAdManager(Activity activity) {
        this.activity = activity;
        initListeners();
    }
    
    /**
     * 加载 Banner 广告
     * Load banner ad
     */
    public void loadBannerAd(String adId, Promise promise) {
        if (activity == null) {
            promise.reject("ACTIVITY_ERROR", "Activity is null");
            return;
        }
        
        if (isLoading) {
            promise.reject("LOADING_ERROR", "Banner ad is already loading");
            return;
        }
        
        if (ttBannerAd != null) {
            promise.reject("ALREADY_LOADED", "Banner ad is already loaded, please show it first");
            return;
        }
        
        try {
            Log.d(TAG, "Loading banner ad with ID: " + adId);
            isLoading = true;
            loadPromise = promise;
            
            // 1、创建AdSlot对象
            AdSlot adSlot = new AdSlot.Builder()
                    .setCodeId(adId)
                    .setImageAcceptedSize(dp2px(320f), dp2px(150f)) // 设置Banner广告尺寸，单位px
                    .build();
            
            // 2、创建TTAdNative对象
            TTAdNative adNativeLoader = TTAdSdk.getAdManager().createAdNative(activity);
            
            // 4、加载广告
            if (adNativeLoader != null) {
                adNativeLoader.loadBannerExpressAd(adSlot, bannerListener);
            } else {
                isLoading = false;
                promise.reject("AD_NATIVE_ERROR", "Failed to create ad native loader");
            }
            
        } catch (Exception e) {
            isLoading = false;
            Log.e(TAG, "Exception during banner ad loading", e);
            promise.reject("LOAD_EXCEPTION", "Banner ad loading exception: " + e.getMessage());
        }
    }
    
    /**
     * 展示 Banner 广告
     * Show banner ad
     */
    public void showBannerAd(Promise promise) {
        if (ttBannerAd == null) {
            promise.reject("NOT_LOADED", "Banner ad is not loaded");
            return;
        }
        
        try {
            Log.d(TAG, "Showing banner ad");
            showPromise = promise;
            
            // 5、设置展示监听器，展示广告
            ttBannerAd.setExpressInteractionListener(bannerInteractionListener);
            ttBannerAd.setDislikeCallback(activity, dislikeCallback);
            ttBannerAd.uploadDislikeEvent("banner_dislike_event");
            
            // 注意：使用融合功能时，load成功后可直接调用getExpressAdView获取广告view展示，而无需调用render等onRenderSuccess后
            View bannerView = ttBannerAd.getExpressAdView();
            if (bannerView != null) {
                // 返回成功，让RN层处理视图展示逻辑
                WritableMap result = Arguments.createMap();
                result.putString("status", "ready_to_show");
                result.putString("message", "Banner ad is ready to show");
                result.putInt("width", bannerView.getLayoutParams() != null ? bannerView.getLayoutParams().width : dp2px(320f));
                result.putInt("height", bannerView.getLayoutParams() != null ? bannerView.getLayoutParams().height : dp2px(150f));
                promise.resolve(result);
                showPromise = null;
            } else {
                promise.reject("VIEW_ERROR", "Failed to get banner ad view");
                showPromise = null;
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Exception during banner ad showing", e);
            promise.reject("SHOW_EXCEPTION", "Banner ad showing exception: " + e.getMessage());
            showPromise = null;
        }
    }
    
    /**
     * 获取 Banner 广告视图
     * Get banner ad view
     */
    public View getBannerAdView() {
        if (ttBannerAd != null) {
            return ttBannerAd.getExpressAdView();
        }
        return null;
    }
    
    /**
     * 销毁 Banner 广告
     * Destroy banner ad
     */
    public void destroyBannerAd() {
        Log.d(TAG, "Destroying banner ad");
        
        if (ttBannerAd != null) {
            ttBannerAd.destroy();
        }
        
        ttBannerAd = null;
        isLoading = false;
        loadPromise = null;
        showPromise = null;
    }
    
    /**
     * 检查广告是否已加载
     * Check if ad is loaded
     */
    public boolean isAdLoaded() {
        return ttBannerAd != null;
    }
    
    /**
     * 检查是否正在加载
     * Check if loading
     */
    public boolean isLoading() {
        return isLoading;
    }
    
    /**
     * 触发广告渲染
     * Trigger ad render
     */
    public void triggerRender() {
        if (ttBannerAd != null) {
            try {
                Log.d(TAG, "Triggering banner ad render");
                // 对于穿山甲的ExpressAd，调用render方法可能有助于内容渲染
                ttBannerAd.render();
            } catch (Exception e) {
                Log.w(TAG, "Exception during banner ad render trigger: " + e.getMessage());
            }
        } else {
            Log.w(TAG, "Cannot trigger render - banner ad is null");
        }
    }
    
    /**
     * 初始化监听器
     * Initialize listeners
     */
    private void initListeners() {
        // 广告加载监听器
        this.bannerListener = new TTAdNative.NativeExpressAdListener() {
            @Override
            public void onError(int code, String message) {
                Log.e(TAG, "Banner ad load fail: errCode: " + code + ", errMsg: " + message);
                isLoading = false;
                ttBannerAd = null;
                
                if (loadPromise != null) {
                    loadPromise.reject("LOAD_FAILED", "Banner ad load failed: " + message + " (code: " + code + ")");
                    loadPromise = null;
                }
            }
            
            @Override
            public void onNativeExpressAdLoad(List<TTNativeExpressAd> list) {
                if (list != null && list.size() > 0) {
                    Log.d(TAG, "Banner ad load success");
                    ttBannerAd = list.get(0);
                    isLoading = false;
                    
                    if (loadPromise != null) {
                        WritableMap result = Arguments.createMap();
                        result.putString("status", "loaded");
                        result.putString("message", "Banner ad loaded successfully");
                        loadPromise.resolve(result);
                        loadPromise = null;
                    }
                } else {
                    Log.e(TAG, "Banner ad load success, but list is null or empty");
                    isLoading = false;
                    ttBannerAd = null;
                    
                    if (loadPromise != null) {
                        loadPromise.reject("LOAD_FAILED", "Banner ad load success, but ad list is null or empty");
                        loadPromise = null;
                    }
                }
            }
        };
        
        // 广告展示监听器
        this.bannerInteractionListener = new TTNativeExpressAd.ExpressAdInteractionListener() {
            @Override
            public void onAdClicked(View view, int type) {
                Log.d(TAG, "Banner ad clicked, type: " + type);
                // 广告点击
            }
            
            @Override
            public void onAdShow(View view, int type) {
                Log.d(TAG, "Banner ad showed, type: " + type);
                // 广告展示
            }
            
            @Override
            public void onRenderFail(View view, String msg, int code) {
                Log.e(TAG, "Banner ad render fail: " + msg + " (code: " + code + ")");
                // 注意：使用融合功能时，无需调用render，load成功后可调用ttBannerAd.getExpressAdView()进行展示。
            }
            
            @Override
            public void onRenderSuccess(View view, float width, float height) {
                Log.d(TAG, "Banner ad render success, width: " + width + ", height: " + height);
                // 注意：使用融合功能时，无需调用render，load成功后可调用ttBannerAd.getExpressAdView()获取view进行展示。
                // 如果调用了render，则会直接回调onRenderSuccess，***** 参数view为null，请勿使用。*****
            }
        };
        
        // dislike监听器，广告关闭时会回调onSelected
        this.dislikeCallback = new TTAdDislike.DislikeInteractionCallback() {
            @Override
            public void onShow() {
                Log.d(TAG, "Banner ad dislike dialog show");
            }
            
            @Override
            public void onSelected(int position, String value, boolean enforce) {
                Log.d(TAG, "Banner ad closed by dislike, position: " + position + ", value: " + value + ", enforce: " + enforce);
                // 广告被用户关闭，自动销毁
                destroyBannerAd();
            }
            
            @Override
            public void onCancel() {
                Log.d(TAG, "Banner ad dislike dialog cancel");
            }
        };
    }
    
    /**
     * dp转px
     * Convert dp to px
     */
    private int dp2px(float dpValue) {
        if (activity != null) {
            final float scale = activity.getResources().getDisplayMetrics().density;
            return (int) (dpValue * scale + 0.5f);
        }
        return (int) dpValue; // 默认返回原值
    }
}