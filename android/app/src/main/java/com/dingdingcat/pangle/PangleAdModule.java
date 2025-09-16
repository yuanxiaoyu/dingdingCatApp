package com.dingdingcat.pangle;

import android.app.Activity;
import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

import com.bytedance.sdk.openadsdk.TTAdConfig;
import com.bytedance.sdk.openadsdk.TTAdConstant;
import com.bytedance.sdk.openadsdk.TTAdSdk;
import com.bytedance.sdk.openadsdk.TTAdManager;

@ReactModule(name = PangleAdModule.NAME)
public class PangleAdModule extends ReactContextBaseJavaModule {
    public static final String NAME = "PangleAdModule";
    private static final String TAG = "PangleAdModule";
    
    private ReactApplicationContext reactContext;
    private boolean isSDKInitialized = false;
    private boolean isSDKStarted = false;
    private SplashAdManager splashAdManager;
    private RewardVideoAdManager rewardVideoAdManager;
    private InterstitialAdManager interstitialAdManager;
    private BannerAdManager bannerAdManager;


    public PangleAdModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    @NonNull
    public String getName() {
        return NAME;
    }

    /**
     * 初始化穿山甲 SDK (第一步)
     * Initialize Pangle SDK (Step 1)
     */
    @ReactMethod
    public void initializeSDK(String appId, Promise promise) {
        try {
            Log.d(TAG, "Initializing Pangle SDK with App ID: " + appId);
            
            if (isSDKInitialized) {
                Log.d(TAG, "SDK already initialized");
                promise.resolve("SDK already initialized");
                return;
            }

            Context context = getReactApplicationContext();
            if (context == null) {
                promise.reject("CONTEXT_ERROR", "React context is null");
                return;
            }

            // 配置 TTAdConfig
            TTAdConfig config = new TTAdConfig.Builder()
                    .appId(appId)
                    .appName("丁丁猫") // 应用名称
                    .debug(true) // 测试阶段打开，可以通过日志排查问题，上线时去除该调用
                    .useMediation(true) // 使用聚合功能此开关必须设置为true，默认为false
                    .build();

            // 初始化 SDK (同步方法，无回调)
            TTAdSdk.init(context, config);
            isSDKInitialized = true;
            Log.d(TAG, "Pangle SDK initialization success");
            promise.resolve("SDK initialized successfully");

        } catch (Exception e) {
            Log.e(TAG, "Exception during SDK initialization", e);
            promise.reject("INIT_EXCEPTION", "SDK initialization exception: " + e.getMessage());
        }
    }

    /**
     * 启动穿山甲 SDK (第二步)
     * Start Pangle SDK (Step 2)
     */
    @ReactMethod
    public void startSDK(Promise promise) {
        try {
            Log.d(TAG, "Starting Pangle SDK");
            
            if (!isSDKInitialized) {
                promise.reject("NOT_INITIALIZED", "SDK must be initialized before starting");
                return;
            }

            if (isSDKStarted) {
                Log.d(TAG, "SDK already started");
                promise.resolve("SDK already started");
                return;
            }

            // 启动 SDK
            TTAdSdk.start(new TTAdSdk.Callback() {
                @Override
                public void success() {
                    Log.d(TAG, "Pangle SDK start success");
                    isSDKStarted = true;
                    promise.resolve("SDK started successfully");
                }

                @Override
                public void fail(int code, String msg) {
                    Log.e(TAG, "Pangle SDK start failed: " + code + ", " + msg);
                    isSDKStarted = false;
                    promise.reject("START_ERROR", "SDK start failed: " + msg + " (code: " + code + ")");
                }
            });

        } catch (Exception e) {
            Log.e(TAG, "Exception during SDK start", e);
            promise.reject("START_EXCEPTION", "SDK start exception: " + e.getMessage());
        }
    }

    /**
     * 检查 SDK 是否已初始化
     * Check if SDK is initialized
     */
    @ReactMethod
    public void isSDKInitialized(Promise promise) {
        promise.resolve(isSDKInitialized);
    }

    /**
     * 检查 SDK 是否已启动
     * Check if SDK is started
     */
    @ReactMethod
    public void isSDKStarted(Promise promise) {
        promise.resolve(isSDKStarted);
    }

    /**
     * 获取 SDK 版本信息
     * Get SDK version info
     */
    @ReactMethod
    public void getSDKVersion(Promise promise) {
        try {
            String version = TTAdSdk.getAdManager().getSDKVersion();
            promise.resolve(version);
        } catch (Exception e) {
            promise.reject("VERSION_ERROR", "Failed to get SDK version: " + e.getMessage());
        }
    }

    /**
     * 获取当前 Activity
     * Get current activity
     */
    protected Activity getActivity() {
        return getCurrentActivity();
    }

    /**
     * 获取广告管理器
     * Get ad manager
     */
    protected TTAdManager getAdManager() {
        return TTAdSdk.getAdManager();
    }

    /**
     * 获取开屏广告管理器
     * Get splash ad manager
     */
    private SplashAdManager getSplashAdManager() {
        if (splashAdManager == null) {
            Activity activity = getActivity();
            if (activity != null) {
                splashAdManager = new SplashAdManager(activity);
            }
        }
        return splashAdManager;
    }

    /**
     * 获取激励视频广告管理器
     * Get reward video ad manager
     */
    private RewardVideoAdManager getRewardVideoAdManager() {
        if (rewardVideoAdManager == null) {
            Activity activity = getActivity();
            if (activity != null) {
                rewardVideoAdManager = new RewardVideoAdManager(activity);
            }
        }
        return rewardVideoAdManager;
    }

    /**
     * 获取新插屏广告管理器
     * Get interstitial ad manager
     */
    private InterstitialAdManager getInterstitialAdManager() {
        if (interstitialAdManager == null) {
            Activity activity = getActivity();
            if (activity != null) {
                interstitialAdManager = new InterstitialAdManager(activity);
            }
        }
        return interstitialAdManager;
    }

    /**
     * 获取 Banner 广告管理器
     * Get banner ad manager
     */
    private BannerAdManager getBannerAdManager() {
        if (bannerAdManager == null) {
            Activity activity = getActivity();
            if (activity != null) {
                bannerAdManager = new BannerAdManager(activity);
            }
        }
        return bannerAdManager;
    }



    /**
     * 加载开屏广告
     * Load splash ad
     */
    @ReactMethod
    public void loadSplashAd(String adId, Promise promise) {
        try {
            Log.d(TAG, "Loading splash ad with ID: " + adId);
            
            if (!isSDKStarted) {
                promise.reject("SDK_NOT_STARTED", "SDK must be started before loading ads");
                return;
            }

            SplashAdManager manager = getSplashAdManager();
            if (manager != null) {
                manager.loadSplashAd(adId, promise);
            } else {
                promise.reject("MANAGER_ERROR", "Failed to get splash ad manager");
            }

        } catch (Exception e) {
            Log.e(TAG, "Exception during splash ad loading", e);
            promise.reject("LOAD_EXCEPTION", "Splash ad loading exception: " + e.getMessage());
        }
    }

    /**
     * 展示开屏广告
     * Show splash ad
     */
    @ReactMethod
    public void showSplashAd(Promise promise) {
        try {
            Log.d(TAG, "Showing splash ad");
            
            SplashAdManager manager = getSplashAdManager();
            if (manager != null) {
                manager.showSplashAd(promise);
            } else {
                promise.reject("MANAGER_ERROR", "Failed to get splash ad manager");
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
    @ReactMethod
    public void destroySplashAd(Promise promise) {
        try {
            Log.d(TAG, "Destroying splash ad");
            
            SplashAdManager manager = getSplashAdManager();
            if (manager != null) {
                manager.destroySplashAd();
                promise.resolve("Splash ad destroyed successfully");
            } else {
                promise.resolve("No splash ad manager to destroy");
            }

        } catch (Exception e) {
            Log.e(TAG, "Exception during splash ad destroying", e);
            promise.reject("DESTROY_EXCEPTION", "Splash ad destroying exception: " + e.getMessage());
        }
    }

    /**
     * 检查开屏广告是否已加载
     * Check if splash ad is loaded
     */
    @ReactMethod
    public void isSplashAdLoaded(Promise promise) {
        try {
            SplashAdManager manager = getSplashAdManager();
            if (manager != null) {
                promise.resolve(manager.isAdLoaded());
            } else {
                promise.resolve(false);
            }
        } catch (Exception e) {
            Log.e(TAG, "Exception during splash ad status check", e);
            promise.reject("STATUS_ERROR", "Failed to check splash ad status: " + e.getMessage());
        }
    }

    /**
     * 检查开屏广告是否正在加载
     * Check if splash ad is loading
     */
    @ReactMethod
    public void isSplashAdLoading(Promise promise) {
        try {
            SplashAdManager manager = getSplashAdManager();
            if (manager != null) {
                promise.resolve(manager.isLoading());
            } else {
                promise.resolve(false);
            }
        } catch (Exception e) {
            Log.e(TAG, "Exception during splash ad loading status check", e);
            promise.reject("STATUS_ERROR", "Failed to check splash ad loading status: " + e.getMessage());
        }
    }

    /**
     * 加载激励视频广告
     * Load reward video ad
     */
    @ReactMethod
    public void loadRewardVideoAd(String adId, Promise promise) {
        try {
            Log.d(TAG, "Loading reward video ad with ID: " + adId);
            
            if (!isSDKStarted) {
                promise.reject("SDK_NOT_STARTED", "SDK must be started before loading ads");
                return;
            }

            RewardVideoAdManager manager = getRewardVideoAdManager();
            if (manager != null) {
                manager.loadRewardVideoAd(adId, promise);
            } else {
                promise.reject("MANAGER_ERROR", "Failed to get reward video ad manager");
            }

        } catch (Exception e) {
            Log.e(TAG, "Exception during reward video ad loading", e);
            promise.reject("LOAD_EXCEPTION", "Reward video ad loading exception: " + e.getMessage());
        }
    }

    /**
     * 展示激励视频广告
     * Show reward video ad
     */
    @ReactMethod
    public void showRewardVideoAd(Promise promise) {
        try {
            Log.d(TAG, "Showing reward video ad");
            
            RewardVideoAdManager manager = getRewardVideoAdManager();
            if (manager != null) {
                manager.showRewardVideoAd(promise);
            } else {
                promise.reject("MANAGER_ERROR", "Failed to get reward video ad manager");
            }

        } catch (Exception e) {
            Log.e(TAG, "Exception during reward video ad showing", e);
            promise.reject("SHOW_EXCEPTION", "Reward video ad showing exception: " + e.getMessage());
        }
    }

    /**
     * 销毁激励视频广告
     * Destroy reward video ad
     */
    @ReactMethod
    public void destroyRewardVideoAd(Promise promise) {
        try {
            Log.d(TAG, "Destroying reward video ad");
            
            RewardVideoAdManager manager = getRewardVideoAdManager();
            if (manager != null) {
                manager.destroyRewardVideoAd();
                promise.resolve("Reward video ad destroyed successfully");
            } else {
                promise.resolve("No reward video ad manager to destroy");
            }

        } catch (Exception e) {
            Log.e(TAG, "Exception during reward video ad destroying", e);
            promise.reject("DESTROY_EXCEPTION", "Reward video ad destroying exception: " + e.getMessage());
        }
    }

    /**
     * 检查激励视频广告是否已加载
     * Check if reward video ad is loaded
     */
    @ReactMethod
    public void isRewardVideoAdLoaded(Promise promise) {
        try {
            RewardVideoAdManager manager = getRewardVideoAdManager();
            if (manager != null) {
                promise.resolve(manager.isAdLoaded());
            } else {
                promise.resolve(false);
            }
        } catch (Exception e) {
            Log.e(TAG, "Exception during reward video ad status check", e);
            promise.reject("STATUS_ERROR", "Failed to check reward video ad status: " + e.getMessage());
        }
    }

    /**
     * 检查激励视频广告是否正在加载
     * Check if reward video ad is loading
     */
    @ReactMethod
    public void isRewardVideoAdLoading(Promise promise) {
        try {
            RewardVideoAdManager manager = getRewardVideoAdManager();
            if (manager != null) {
                promise.resolve(manager.isLoading());
            } else {
                promise.resolve(false);
            }
        } catch (Exception e) {
            Log.e(TAG, "Exception during reward video ad loading status check", e);
            promise.reject("STATUS_ERROR", "Failed to check reward video ad loading status: " + e.getMessage());
        }
    }

    /**
     * 加载新插屏广告
     * Load interstitial ad
     */
    @ReactMethod
    public void loadInterstitialAd(String adId, Promise promise) {
        try {
            Log.d(TAG, "Loading interstitial ad with ID: " + adId);
            
            if (!isSDKStarted) {
                promise.reject("SDK_NOT_STARTED", "SDK must be started before loading ads");
                return;
            }

            InterstitialAdManager manager = getInterstitialAdManager();
            if (manager != null) {
                manager.loadInterstitialAd(adId, promise);
            } else {
                promise.reject("MANAGER_ERROR", "Failed to get interstitial ad manager");
            }

        } catch (Exception e) {
            Log.e(TAG, "Exception during interstitial ad loading", e);
            promise.reject("LOAD_EXCEPTION", "Interstitial ad loading exception: " + e.getMessage());
        }
    }

    /**
     * 展示新插屏广告
     * Show interstitial ad
     */
    @ReactMethod
    public void showInterstitialAd(Promise promise) {
        try {
            Log.d(TAG, "Showing interstitial ad");
            
            InterstitialAdManager manager = getInterstitialAdManager();
            if (manager != null) {
                manager.showInterstitialAd(promise);
            } else {
                promise.reject("MANAGER_ERROR", "Failed to get interstitial ad manager");
            }

        } catch (Exception e) {
            Log.e(TAG, "Exception during interstitial ad showing", e);
            promise.reject("SHOW_EXCEPTION", "Interstitial ad showing exception: " + e.getMessage());
        }
    }

    /**
     * 销毁新插屏广告
     * Destroy interstitial ad
     */
    @ReactMethod
    public void destroyInterstitialAd(Promise promise) {
        try {
            Log.d(TAG, "Destroying interstitial ad");
            
            InterstitialAdManager manager = getInterstitialAdManager();
            if (manager != null) {
                manager.destroyInterstitialAd();
                promise.resolve("Interstitial ad destroyed successfully");
            } else {
                promise.resolve("No interstitial ad manager to destroy");
            }

        } catch (Exception e) {
            Log.e(TAG, "Exception during interstitial ad destroying", e);
            promise.reject("DESTROY_EXCEPTION", "Interstitial ad destroying exception: " + e.getMessage());
        }
    }

    /**
     * 检查新插屏广告是否已加载
     * Check if interstitial ad is loaded
     */
    @ReactMethod
    public void isInterstitialAdLoaded(Promise promise) {
        try {
            InterstitialAdManager manager = getInterstitialAdManager();
            if (manager != null) {
                promise.resolve(manager.isAdLoaded());
            } else {
                promise.resolve(false);
            }
        } catch (Exception e) {
            Log.e(TAG, "Exception during interstitial ad status check", e);
            promise.reject("STATUS_ERROR", "Failed to check interstitial ad status: " + e.getMessage());
        }
    }

    /**
     * 检查新插屏广告是否正在加载
     * Check if interstitial ad is loading
     */
    @ReactMethod
    public void isInterstitialAdLoading(Promise promise) {
        try {
            InterstitialAdManager manager = getInterstitialAdManager();
            if (manager != null) {
                promise.resolve(manager.isLoading());
            } else {
                promise.resolve(false);
            }
        } catch (Exception e) {
            Log.e(TAG, "Exception during interstitial ad loading status check", e);
            promise.reject("STATUS_ERROR", "Failed to check interstitial ad loading status: " + e.getMessage());
        }
    }

    /**
     * 加载 Banner 广告
     * Load banner ad
     */
    @ReactMethod
    public void loadBannerAd(String adId, Promise promise) {
        try {
            Log.d(TAG, "Loading banner ad with ID: " + adId);
            
            if (!isSDKStarted) {
                promise.reject("SDK_NOT_STARTED", "SDK must be started before loading ads");
                return;
            }

            BannerAdManager manager = getBannerAdManager();
            if (manager != null) {
                manager.loadBannerAd(adId, promise);
            } else {
                promise.reject("MANAGER_ERROR", "Failed to get banner ad manager");
            }

        } catch (Exception e) {
            Log.e(TAG, "Exception during banner ad loading", e);
            promise.reject("LOAD_EXCEPTION", "Banner ad loading exception: " + e.getMessage());
        }
    }

    /**
     * 展示 Banner 广告
     * Show banner ad
     */
    @ReactMethod
    public void showBannerAd(Promise promise) {
        try {
            Log.d(TAG, "Showing banner ad");
            
            BannerAdManager manager = getBannerAdManager();
            if (manager != null) {
                manager.showBannerAd(promise);
            } else {
                promise.reject("MANAGER_ERROR", "Failed to get banner ad manager");
            }

        } catch (Exception e) {
            Log.e(TAG, "Exception during banner ad showing", e);
            promise.reject("SHOW_EXCEPTION", "Banner ad showing exception: " + e.getMessage());
        }
    }

    /**
     * 销毁 Banner 广告
     * Destroy banner ad
     */
    @ReactMethod
    public void destroyBannerAd(Promise promise) {
        try {
            Log.d(TAG, "Destroying banner ad");
            
            BannerAdManager manager = getBannerAdManager();
            if (manager != null) {
                manager.destroyBannerAd();
                promise.resolve("Banner ad destroyed successfully");
            } else {
                promise.resolve("No banner ad manager to destroy");
            }

        } catch (Exception e) {
            Log.e(TAG, "Exception during banner ad destroying", e);
            promise.reject("DESTROY_EXCEPTION", "Banner ad destroying exception: " + e.getMessage());
        }
    }

    /**
     * 检查 Banner 广告是否已加载
     * Check if banner ad is loaded
     */
    @ReactMethod
    public void isBannerAdLoaded(Promise promise) {
        try {
            BannerAdManager manager = getBannerAdManager();
            if (manager != null) {
                promise.resolve(manager.isAdLoaded());
            } else {
                promise.resolve(false);
            }
        } catch (Exception e) {
            Log.e(TAG, "Exception during banner ad status check", e);
            promise.reject("STATUS_ERROR", "Failed to check banner ad status: " + e.getMessage());
        }
    }

    /**
     * 检查 Banner 广告是否正在加载
     * Check if banner ad is loading
     */
    @ReactMethod
    public void isBannerAdLoading(Promise promise) {
        try {
            BannerAdManager manager = getBannerAdManager();
            if (manager != null) {
                promise.resolve(manager.isLoading());
            } else {
                promise.resolve(false);
            }
        } catch (Exception e) {
            Log.e(TAG, "Exception during banner ad loading status check", e);
            promise.reject("STATUS_ERROR", "Failed to check banner ad loading status: " + e.getMessage());
        }
    }




}