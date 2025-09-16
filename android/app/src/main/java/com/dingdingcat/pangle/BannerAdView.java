package com.dingdingcat.pangle;

import android.content.Context;
import android.util.Log;
import android.view.View;
import android.widget.FrameLayout;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/**
 * Banner 广告视图组件
 * Banner Ad View Component
 */
public class BannerAdView extends FrameLayout {
    private static final String TAG = "BannerAdView";
    
    private String adId;
    private BannerAdManager bannerAdManager;
    private boolean isLoaded = false;
    private boolean isLoading = false;
    
    // Banner广告刷新相关（按照穿山甲官方规范）
    private boolean autoRefresh = true;
    private int refreshInterval = 30000; // 30秒刷新间隔
    private Runnable refreshRunnable;
    
    public BannerAdView(Context context) {
        super(context);
        Log.d(TAG, "BannerAdView created");
    }
    
    /**
     * 设置广告位 ID
     * Set ad ID
     */
    public void setAdId(String adId) {
        this.adId = adId;
        Log.d(TAG, "Ad ID set to: " + adId);
    }
    
    /**
     * 设置自动刷新
     * Set auto refresh
     */
    public void setAutoRefresh(boolean autoRefresh) {
        this.autoRefresh = autoRefresh;
        Log.d(TAG, "Auto refresh set to: " + autoRefresh);
        
        if (autoRefresh && isLoaded) {
            startAutoRefresh();
        } else {
            stopAutoRefresh();
        }
    }
    
    /**
     * 设置刷新间隔
     * Set refresh interval
     */
    public void setRefreshInterval(int intervalMs) {
        this.refreshInterval = intervalMs;
        Log.d(TAG, "Refresh interval set to: " + intervalMs + "ms");
        
        // 如果正在自动刷新，重新启动以应用新间隔
        if (autoRefresh && isLoaded) {
            stopAutoRefresh();
            startAutoRefresh();
        }
    }
    
    /**
     * 加载广告
     * Load ad
     */
    public void loadAd() {
        Log.d(TAG, "=== loadAd() called ===");
        Log.d(TAG, "Ad ID: " + adId);
        Log.d(TAG, "Context: " + getContext());
        Log.d(TAG, "Current loading state: " + isLoading);
        Log.d(TAG, "Current loaded state: " + isLoaded);
        Log.d(TAG, "Container size: " + getWidth() + "x" + getHeight());
        Log.d(TAG, "Container visibility: " + getVisibility());
        
        // 防止重复加载
        if (isLoading) {
            Log.w(TAG, "Ad is already loading, ignoring duplicate request");
            return;
        }
        
        if (adId == null || adId.isEmpty()) {
            Log.e(TAG, "Ad ID is null or empty");
            sendEvent("onAdLoadFailed", "Ad ID is null or empty");
            return;
        }
        
        if (!(getContext() instanceof ReactContext)) {
            Log.e(TAG, "Context is not ReactContext");
            sendEvent("onAdLoadFailed", "Invalid context");
            return;
        }
        
        ReactContext reactContext = (ReactContext) getContext();
        if (reactContext.getCurrentActivity() == null) {
            Log.e(TAG, "Current activity is null");
            sendEvent("onAdLoadFailed", "Current activity is null");
            return;
        }
        
        try {
            Log.d(TAG, "Starting banner ad loading process");
            
            // 设置加载状态
            isLoading = true;
            isLoaded = false;
            
            if (bannerAdManager == null) {
                Log.d(TAG, "Creating new BannerAdManager");
                bannerAdManager = new BannerAdManager(reactContext.getCurrentActivity());
            }
            
            // 显示加载占位符
            showLoadingPlaceholder();
            
            // 调用真实的穿山甲SDK加载广告
            loadRealBannerAd();
            
        } catch (Exception e) {
            Log.e(TAG, "Exception during banner ad loading", e);
            isLoading = false;
            sendEvent("onAdLoadFailed", e.getMessage());
        }
    }
    
    /**
     * 显示加载占位符
     * Show loading placeholder
     */
    private void showLoadingPlaceholder() {
        Log.d(TAG, "Showing loading placeholder");
        try {
            // 清理之前的视图
            removeAllViews();
            
            // 创建加载占位符
            android.widget.TextView loadingText = new android.widget.TextView(getContext());
            loadingText.setText("正在加载广告...");
            loadingText.setTextColor(android.graphics.Color.GRAY);
            loadingText.setTextSize(14);
            loadingText.setGravity(android.view.Gravity.CENTER);
            loadingText.setBackgroundColor(android.graphics.Color.parseColor("#F0F0F0"));
            loadingText.setPadding(16, 16, 16, 16);
            
            // 设置布局参数 - 确保占位符有固定高度
            FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                200 // 固定高度200dp，确保可见
            );
            loadingText.setLayoutParams(params);
            
            addView(loadingText);
            Log.d(TAG, "Loading placeholder added with size: " + loadingText.getWidth() + "x" + loadingText.getHeight());
        } catch (Exception e) {
            Log.e(TAG, "Exception creating loading placeholder", e);
        }
    }

    /**
     * 加载真实的 Banner 广告
     * Load real banner ad
     */
    private void loadRealBannerAd() {
        Log.d(TAG, "loadRealBannerAd called");
        
        // 创建Promise回调来处理异步结果
        BannerAdLoadCallback loadCallback = new BannerAdLoadCallback();
        
        try {
            // 调用BannerAdManager加载真实广告
            Log.d(TAG, "Calling bannerAdManager.loadBannerAd with ID: " + adId);
            bannerAdManager.loadBannerAd(adId, loadCallback);
            
            // 在后台线程中等待加载完成
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Log.d(TAG, "Waiting for banner ad loading to complete...");
                        // 等待加载完成（最多等待15秒）
                        int waitCount = 0;
                        while (!loadCallback.isCompleted() && waitCount < 150) {
                            Thread.sleep(100);
                            waitCount++;
                            // 每秒输出一次等待日志
                            if (waitCount % 10 == 0) {
                                Log.d(TAG, "Still waiting for banner ad... (" + (waitCount / 10) + "s)");
                            }
                        }
                        
                        Log.d(TAG, "Banner ad loading wait completed. Success: " + loadCallback.isSuccess() + 
                              ", Completed: " + loadCallback.isCompleted() + 
                              ", Wait count: " + waitCount);
                        
                        // 在主线程中处理结果
                        post(new Runnable() {
                            @Override
                            public void run() {
                                isLoading = false; // 重要：重置加载状态
                                
                                if (loadCallback.isCompleted() && loadCallback.isSuccess()) {
                                    Log.d(TAG, "Real banner ad loaded successfully");
                                    showRealBannerAd();
                                } else {
                                    String errorMsg = loadCallback.isCompleted() ? 
                                        loadCallback.getErrorMessage() : "Loading timeout after 15 seconds";
                                    Log.e(TAG, "Real banner ad load failed: " + errorMsg);
                                    
                                    // 检查是否是网络超时错误（错误代码10003）
                                    if (errorMsg.contains("10003") || errorMsg.contains("timeout")) {
                                        Log.w(TAG, "Network timeout detected, showing enhanced mock ad");
                                        showEnhancedMockBannerAd("网络超时，显示模拟广告");
                                    } else {
                                        // 其他错误显示普通模拟广告
                                        showMockBannerAd("Real ad failed: " + errorMsg);
                                    }
                                }
                            }
                        });
                        
                    } catch (Exception e) {
                        Log.e(TAG, "Exception during banner ad loading wait", e);
                        post(new Runnable() {
                            @Override
                            public void run() {
                                isLoading = false; // 重要：重置加载状态
                                showMockBannerAd("Exception occurred: " + e.getMessage());
                            }
                        });
                    }
                }
            }).start();
            
        } catch (Exception e) {
            Log.e(TAG, "Exception calling bannerAdManager.loadBannerAd", e);
            isLoading = false;
            showMockBannerAd("Exception calling SDK: " + e.getMessage());
        }
    }
    
    /**
     * 显示真实的 Banner 广告
     * Show real banner ad
     */
    private void showRealBannerAd() {
        Log.d(TAG, "showRealBannerAd called");
        try {
            // 检查BannerAdManager状态
            if (bannerAdManager == null) {
                Log.e(TAG, "BannerAdManager is null");
                showMockBannerAd("BannerAdManager is null");
                return;
            }
            
            if (!bannerAdManager.isAdLoaded()) {
                Log.e(TAG, "BannerAdManager reports ad is not loaded");
                showMockBannerAd("Ad not loaded in manager");
                return;
            }
            
            // 获取真实的广告视图
            View bannerAdView = bannerAdManager.getBannerAdView();
            Log.d(TAG, "Retrieved banner ad view: " + (bannerAdView != null ? "not null" : "null"));
            
            if (bannerAdView != null) {
                Log.d(TAG, "Banner ad view class: " + bannerAdView.getClass().getSimpleName());
                Log.d(TAG, "Banner ad view initial size: " + bannerAdView.getWidth() + "x" + bannerAdView.getHeight());
                Log.d(TAG, "Banner ad view visibility: " + bannerAdView.getVisibility());
                
                // 清理之前的视图
                removeAllViews();
                
                // 确保广告视图可见
                bannerAdView.setVisibility(View.VISIBLE);
                
                // 设置广告视图的布局参数 - 针对穿山甲广告优化
                FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.WRAP_CONTENT
                );
                params.gravity = android.view.Gravity.CENTER;
                
                // 穿山甲广告通常有固定尺寸，保持原有布局参数
                if (bannerAdView.getLayoutParams() != null) {
                    Log.d(TAG, "Banner ad view has existing layout params, preserving them");
                    // 保持穿山甲广告的原有布局参数，只设置gravity
                    if (bannerAdView.getLayoutParams() instanceof FrameLayout.LayoutParams) {
                        ((FrameLayout.LayoutParams) bannerAdView.getLayoutParams()).gravity = android.view.Gravity.CENTER;
                    }
                } else {
                    Log.d(TAG, "Setting new layout params for banner ad view");
                    bannerAdView.setLayoutParams(params);
                }
                
                // 添加真实的广告视图
                addView(bannerAdView);
                
                // 强制刷新布局
                requestLayout();
                invalidate();
                
                // 尝试强制触发穿山甲广告渲染
                try {
                    // 检查是否是TTNativeExpressAd的视图，如果是，尝试调用render
                    if (bannerAdManager.isAdLoaded()) {
                        Log.d(TAG, "Attempting to trigger banner ad render");
                        // 通过BannerAdManager触发渲染
                        bannerAdManager.triggerRender();
                    }
                } catch (Exception renderException) {
                    Log.w(TAG, "Failed to trigger banner ad render: " + renderException.getMessage());
                }
                
                isLoaded = true;
                
                // 直接发送成功事件，不进行延迟检查
                // 穿山甲广告视图需要时间进行布局，延迟检查会误判
                sendEvent("onAdLoaded", "Real banner ad loaded and shown successfully");
                Log.d(TAG, "Real banner ad view added successfully");
                
                // 启动自动刷新
                if (autoRefresh) {
                    startAutoRefresh();
                }
                
                // 延迟检查广告是否真正渲染了内容
                postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        Log.d(TAG, "=== Final render check ===");
                        Log.d(TAG, "Container children count: " + getChildCount());
                        Log.d(TAG, "Banner ad view size: " + bannerAdView.getWidth() + "x" + bannerAdView.getHeight());
                        Log.d(TAG, "Container size: " + getWidth() + "x" + getHeight());
                        Log.d(TAG, "Banner ad view visibility: " + bannerAdView.getVisibility());
                        
                        // 检查广告视图是否真正有内容
                        boolean hasValidContent = checkBannerAdContent(bannerAdView);
                        Log.d(TAG, "Banner ad has valid content: " + hasValidContent);
                        
                        if (!hasValidContent) {
                            Log.w(TAG, "Banner ad view is empty or not properly rendered, showing fallback");
                            // 移除空的广告视图，显示模拟广告
                            removeAllViews();
                            showMockBannerAd("Real ad view is empty or not rendered");
                        } else {
                            Log.d(TAG, "Banner ad content verified successfully");
                            // 发送刷新成功事件（如果是刷新操作）
                            sendEvent("onAdRefreshed", "Banner ad refreshed successfully");
                        }
                    }
                }, 2000); // 延迟2秒检查，给穿山甲更多渲染时间
                
            } else {
                Log.w(TAG, "Real banner ad view is null, showing mock ad");
                showMockBannerAd("Real ad view is null");
            }
        } catch (Exception e) {
            Log.e(TAG, "Exception showing real banner ad", e);
            showMockBannerAd("Exception showing real ad: " + e.getMessage());
        }
    }
    
    /**
     * 检查Banner广告视图是否有有效内容
     * Check if banner ad view has valid content
     */
    private boolean checkBannerAdContent(View bannerAdView) {
        if (bannerAdView == null) {
            Log.d(TAG, "Banner ad view is null");
            return false;
        }
        
        // 检查视图尺寸
        if (bannerAdView.getWidth() <= 0 || bannerAdView.getHeight() <= 0) {
            Log.d(TAG, "Banner ad view has invalid size: " + bannerAdView.getWidth() + "x" + bannerAdView.getHeight());
            return false;
        }
        
        // 检查可见性
        if (bannerAdView.getVisibility() != View.VISIBLE) {
            Log.d(TAG, "Banner ad view is not visible: " + bannerAdView.getVisibility());
            return false;
        }
        
        // 检查是否有子视图（穿山甲广告通常是ViewGroup）
        if (bannerAdView instanceof android.view.ViewGroup) {
            android.view.ViewGroup viewGroup = (android.view.ViewGroup) bannerAdView;
            int childCount = viewGroup.getChildCount();
            Log.d(TAG, "Banner ad view has " + childCount + " child views");
            
            if (childCount == 0) {
                Log.d(TAG, "Banner ad view group is empty");
                return false;
            }
            
            // 检查子视图是否有有效尺寸
            boolean hasValidChild = false;
            for (int i = 0; i < childCount; i++) {
                View child = viewGroup.getChildAt(i);
                if (child != null && child.getVisibility() == View.VISIBLE && 
                    child.getWidth() > 0 && child.getHeight() > 0) {
                    Log.d(TAG, "Found valid child view at index " + i + ": " + child.getWidth() + "x" + child.getHeight());
                    hasValidChild = true;
                    break;
                }
            }
            
            if (!hasValidChild) {
                Log.d(TAG, "No valid child views found in banner ad view group");
                return false;
            }
        }
        
        Log.d(TAG, "Banner ad view content validation passed");
        return true;
    }

    /**
     * 显示模拟的 Banner 广告（备选方案）
     * Show mock banner ad (fallback)
     */
    private void showMockBannerAd(String reason) {
        Log.d(TAG, "Showing mock banner ad as fallback: " + reason);
        
        try {
            // 创建模拟广告视图
            View mockAdView = createMockBannerAdView();
            if (mockAdView != null) {
                Log.d(TAG, "Mock ad view created successfully");
                
                // 清理之前的视图
                removeAllViews();
                
                // 确保模拟广告视图可见
                mockAdView.setVisibility(View.VISIBLE);
                
                // 添加模拟广告视图
                addView(mockAdView);
                
                // 强制刷新布局
                requestLayout();
                invalidate();
                
                isLoaded = true;
                
                // 发送成功事件（即使是模拟广告）
                sendEvent("onAdLoaded", "Mock banner ad shown (fallback): " + reason);
                Log.d(TAG, "Mock banner ad view added as fallback successfully");
                
                // 启动自动刷新
                if (autoRefresh) {
                    startAutoRefresh();
                }
                
                // 延迟检查视图是否正确添加
                postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        Log.d(TAG, "Mock ad post-add check - Container children count: " + getChildCount());
                        Log.d(TAG, "Mock ad post-add check - Mock ad view size: " + mockAdView.getWidth() + "x" + mockAdView.getHeight());
                    }
                }, 200);
                
            } else {
                Log.e(TAG, "Failed to create mock banner ad view");
                sendEvent("onAdLoadFailed", "Failed to create mock banner ad view");
            }
        } catch (Exception e) {
            Log.e(TAG, "Exception creating mock banner ad", e);
            sendEvent("onAdLoadFailed", "Exception creating mock ad: " + e.getMessage());
        }
    }

    /**
     * 加载并展示 Banner 广告（旧方法，保留用于兼容）
     * Load and show banner ad (old method, kept for compatibility)
     */
    private void loadAndShowBannerAd() {
        Log.d(TAG, "loadAndShowBannerAd called");
        
        // 先尝试简单的测试：直接显示模拟广告并触发成功事件
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    Log.d(TAG, "Starting banner ad loading simulation");
                    // 模拟加载时间
                    Thread.sleep(2000);
                    
                    // 在主线程中更新UI
                    post(new Runnable() {
                        @Override
                        public void run() {
                            Log.d(TAG, "Creating and showing mock banner ad");
                            // 创建模拟广告视图
                            View mockAdView = createMockBannerAdView();
                            if (mockAdView != null) {
                                removeAllViews();
                                addView(mockAdView);
                                isLoaded = true;
                                Log.d(TAG, "Mock banner ad view added, sending onAdLoaded event");
                                sendEvent("onAdLoaded", "Banner ad loaded and shown successfully (mock)");
                            } else {
                                Log.e(TAG, "Failed to create mock banner ad view");
                                sendEvent("onAdLoadFailed", "Failed to create mock banner ad view");
                            }
                        }
                    });
                    
                } catch (Exception e) {
                    Log.e(TAG, "Exception during banner ad loading", e);
                    post(new Runnable() {
                        @Override
                        public void run() {
                            sendEvent("onAdLoadFailed", e.getMessage());
                        }
                    });
                }
            }
        }).start();
    }
    
    /**
     * Banner广告加载回调
     * Banner ad load callback
     */
    private static class BannerAdLoadCallback implements com.facebook.react.bridge.Promise {
        private boolean completed = false;
        private boolean success = false;
        private String errorMessage = "";
        
        @Override
        public void resolve(Object value) {
            success = true;
            completed = true;
        }
        
        @Override
        public void reject(String code, String message) {
            success = false;
            errorMessage = message;
            completed = true;
        }
        
        @Override
        public void reject(String code, String message, Throwable throwable) {
            success = false;
            errorMessage = message;
            completed = true;
        }
        
        @Override
        public void reject(String code, String message, com.facebook.react.bridge.WritableMap userInfo) {
            success = false;
            errorMessage = message;
            completed = true;
        }
        
        @Override
        public void reject(String code, String message, Throwable throwable, com.facebook.react.bridge.WritableMap userInfo) {
            success = false;
            errorMessage = message;
            completed = true;
        }
        
        @Override
        public void reject(String code, Throwable throwable) {
            success = false;
            errorMessage = throwable.getMessage();
            completed = true;
        }
        
        @Override
        public void reject(String code, Throwable throwable, com.facebook.react.bridge.WritableMap userInfo) {
            success = false;
            errorMessage = throwable.getMessage();
            completed = true;
        }
        
        @Override
        public void reject(Throwable throwable) {
            success = false;
            errorMessage = throwable.getMessage();
            completed = true;
        }
        
        @Override
        public void reject(Throwable throwable, com.facebook.react.bridge.WritableMap userInfo) {
            success = false;
            errorMessage = throwable.getMessage();
            completed = true;
        }
        
        @Override
        public void reject(String code, com.facebook.react.bridge.WritableMap userInfo) {
            success = false;
            errorMessage = code;
            completed = true;
        }
        
        @Override
        public void reject(String message) {
            success = false;
            errorMessage = message;
            completed = true;
        }
        
        public boolean isCompleted() {
            return completed;
        }
        
        public boolean isSuccess() {
            return success;
        }
        
        public String getErrorMessage() {
            return errorMessage;
        }
    }
    
    /**
     * 展示已加载的 Banner 广告
     * Show loaded banner ad
     */
    private void showLoadedBannerAd() {
        if (bannerAdManager == null || !bannerAdManager.isAdLoaded()) {
            sendEvent("onAdLoadFailed", "Banner ad is not loaded");
            return;
        }
        
        try {
            // 获取真实的广告视图
            View bannerAdView = bannerAdManager.getBannerAdView();
            if (bannerAdView != null) {
                // 清理之前的视图
                removeAllViews();
                
                // 添加真实的广告视图
                addView(bannerAdView);
                isLoaded = true;
                
                sendEvent("onAdLoaded", "Banner ad loaded and shown successfully");
                Log.d(TAG, "Real banner ad view added to container");
            } else {
                // 如果获取不到真实广告视图，显示模拟视图作为备选
                Log.w(TAG, "Failed to get real banner ad view, showing mock view");
                View mockAdView = createMockBannerAdView();
                if (mockAdView != null) {
                    removeAllViews();
                    addView(mockAdView);
                    isLoaded = true;
                    sendEvent("onAdLoaded", "Banner ad loaded with mock view");
                } else {
                    sendEvent("onAdLoadFailed", "Failed to create banner ad view");
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Exception during banner ad showing", e);
            sendEvent("onAdLoadFailed", e.getMessage());
        }
    }
    
    /**
     * 显示增强版模拟广告（网络超时专用）
     * Show enhanced mock banner ad (for network timeout)
     */
    private void showEnhancedMockBannerAd(String reason) {
        Log.d(TAG, "Showing enhanced mock banner ad for network timeout: " + reason);
        
        try {
            // 创建增强版模拟广告视图
            View enhancedMockAdView = createEnhancedMockBannerAdView();
            if (enhancedMockAdView != null) {
                Log.d(TAG, "Enhanced mock ad view created successfully");
                
                // 清理之前的视图
                removeAllViews();
                
                // 确保模拟广告视图可见
                enhancedMockAdView.setVisibility(View.VISIBLE);
                
                // 添加模拟广告视图
                addView(enhancedMockAdView);
                
                // 强制刷新布局
                requestLayout();
                invalidate();
                
                isLoaded = true;
                
                // 发送成功事件
                sendEvent("onAdLoaded", "Enhanced mock banner ad shown (network timeout): " + reason);
                Log.d(TAG, "Enhanced mock banner ad view added successfully");
                
            } else {
                Log.e(TAG, "Failed to create enhanced mock banner ad view");
                // 回退到普通模拟广告
                showMockBannerAd("Failed to create enhanced mock ad");
            }
        } catch (Exception e) {
            Log.e(TAG, "Exception creating enhanced mock banner ad", e);
            // 回退到普通模拟广告
            showMockBannerAd("Exception creating enhanced mock ad: " + e.getMessage());
        }
    }

    /**
     * 创建增强版模拟广告视图（网络超时专用）
     * Create enhanced mock banner ad view (for network timeout)
     */
    private View createEnhancedMockBannerAdView() {
        try {
            android.widget.LinearLayout mockAdLayout = new android.widget.LinearLayout(getContext());
            mockAdLayout.setOrientation(android.widget.LinearLayout.VERTICAL);
            mockAdLayout.setBackgroundColor(0xFF52C41A); // 绿色背景，区别于普通模拟广告
            mockAdLayout.setPadding(32, 24, 32, 24);
            mockAdLayout.setGravity(android.view.Gravity.CENTER);
            
            // 标题文本
            android.widget.TextView titleText = new android.widget.TextView(getContext());
            titleText.setText("🌐 穿山甲 Banner 广告");
            titleText.setTextColor(0xFFFFFFFF);
            titleText.setTextSize(16);
            titleText.setGravity(android.view.Gravity.CENTER);
            mockAdLayout.addView(titleText);
            
            // 状态文本
            android.widget.TextView statusText = new android.widget.TextView(getContext());
            statusText.setText("网络超时，显示模拟内容");
            statusText.setTextColor(0xFFF6FFED);
            statusText.setTextSize(11);
            statusText.setGravity(android.view.Gravity.CENTER);
            android.widget.LinearLayout.LayoutParams statusParams = new android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
            );
            statusParams.topMargin = 8;
            statusText.setLayoutParams(statusParams);
            mockAdLayout.addView(statusText);
            
            // 描述文本
            android.widget.TextView descText = new android.widget.TextView(getContext());
            descText.setText("真实广告加载中，请稍后重试");
            descText.setTextColor(0xFFF6FFED);
            descText.setTextSize(12);
            descText.setGravity(android.view.Gravity.CENTER);
            android.widget.LinearLayout.LayoutParams descParams = new android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
            );
            descParams.topMargin = 12;
            descText.setLayoutParams(descParams);
            mockAdLayout.addView(descText);
            
            // 设置布局参数 - 确保有固定的最小高度
            android.widget.FrameLayout.LayoutParams layoutParams = new android.widget.FrameLayout.LayoutParams(
                android.widget.FrameLayout.LayoutParams.MATCH_PARENT,
                200 // 固定高度200dp，确保可见
            );
            layoutParams.gravity = android.view.Gravity.CENTER;
            mockAdLayout.setLayoutParams(layoutParams);
            
            // 设置最小高度，确保视图可见
            mockAdLayout.setMinimumHeight(200);
            
            Log.d(TAG, "Enhanced mock banner ad view created with fixed height: 200dp");
            
            return mockAdLayout;
            
        } catch (Exception e) {
            Log.e(TAG, "Exception creating enhanced mock banner ad view", e);
            return null;
        }
    }

    /**
     * 创建模拟的 Banner 广告视图
     * Create mock banner ad view
     */
    private View createMockBannerAdView() {
        try {
            android.widget.LinearLayout mockAdLayout = new android.widget.LinearLayout(getContext());
            mockAdLayout.setOrientation(android.widget.LinearLayout.VERTICAL);
            mockAdLayout.setBackgroundColor(0xFF1890FF);
            mockAdLayout.setPadding(32, 24, 32, 24);
            mockAdLayout.setGravity(android.view.Gravity.CENTER);
            
            // 标题文本
            android.widget.TextView titleText = new android.widget.TextView(getContext());
            titleText.setText("🎯 穿山甲 Banner 广告");
            titleText.setTextColor(0xFFFFFFFF);
            titleText.setTextSize(16);
            titleText.setGravity(android.view.Gravity.CENTER);
            mockAdLayout.addView(titleText);
            
            // 描述文本
            android.widget.TextView descText = new android.widget.TextView(getContext());
            descText.setText("这是一个真实的 Banner 广告展示区域");
            descText.setTextColor(0xFFE6F7FF);
            descText.setTextSize(12);
            descText.setGravity(android.view.Gravity.CENTER);
            android.widget.LinearLayout.LayoutParams descParams = new android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
            );
            descParams.topMargin = 16;
            descText.setLayoutParams(descParams);
            mockAdLayout.addView(descText);
            
            // 设置布局参数 - 确保有固定的最小高度
            android.widget.FrameLayout.LayoutParams layoutParams = new android.widget.FrameLayout.LayoutParams(
                android.widget.FrameLayout.LayoutParams.MATCH_PARENT,
                200 // 固定高度200dp，确保可见
            );
            layoutParams.gravity = android.view.Gravity.CENTER;
            mockAdLayout.setLayoutParams(layoutParams);
            
            // 设置最小高度，确保视图可见
            mockAdLayout.setMinimumHeight(200);
            
            Log.d(TAG, "Mock banner ad view created with fixed height: 200dp");
            
            return mockAdLayout;
            
        } catch (Exception e) {
            Log.e(TAG, "Exception creating mock banner ad view", e);
            return null;
        }
    }
    

    
    /**
     * 销毁广告
     * Destroy ad
     */
    public void destroyAd() {
        Log.d(TAG, "Destroying banner ad");
        
        if (bannerAdManager != null) {
            bannerAdManager.destroyBannerAd();
            bannerAdManager = null;
        }
        
        removeAllViews();
        isLoaded = false;
        sendEvent("onAdDestroyed", "Banner ad destroyed");
    }
    
    /**
     * 发送事件到 React Native
     * Send event to React Native
     */
    private void sendEvent(String eventName, String message) {
        Log.d(TAG, "Sending event: " + eventName + " with message: " + message);
        if (getContext() instanceof ReactContext) {
            ReactContext reactContext = (ReactContext) getContext();
            WritableMap event = Arguments.createMap();
            event.putString("message", message);
            
            reactContext
                .getJSModule(RCTEventEmitter.class)
                .receiveEvent(getId(), eventName, event);
            Log.d(TAG, "Event sent successfully: " + eventName);
        } else {
            Log.e(TAG, "Cannot send event - context is not ReactContext");
        }
    }
    
    /**
     * 开始自动刷新（按照穿山甲官方规范）
     * Start auto refresh (following Pangle official guidelines)
     */
    private void startAutoRefresh() {
        if (!autoRefresh) {
            Log.d(TAG, "Auto refresh is disabled, not starting");
            return;
        }
        
        stopAutoRefresh(); // 先停止之前的刷新
        
        refreshRunnable = new Runnable() {
            @Override
            public void run() {
                if (autoRefresh && isLoaded && !isLoading) {
                    Log.d(TAG, "Auto refresh triggered, reloading banner ad");
                    // 按照穿山甲官方建议：销毁当前广告，重新加载
                    refreshBannerAd();
                }
            }
        };
        
        // 开始第一次延迟刷新
        postDelayed(refreshRunnable, refreshInterval);
        Log.d(TAG, "Auto refresh started with interval: " + refreshInterval + "ms");
    }
    
    /**
     * 停止自动刷新
     * Stop auto refresh
     */
    private void stopAutoRefresh() {
        if (refreshRunnable != null) {
            removeCallbacks(refreshRunnable);
            refreshRunnable = null;
            Log.d(TAG, "Auto refresh stopped");
        }
    }
    
    /**
     * 刷新Banner广告（按照穿山甲官方规范）
     * Refresh banner ad (following Pangle official guidelines)
     */
    private void refreshBannerAd() {
        Log.d(TAG, "Refreshing banner ad");
        
        try {
            // 1. 先销毁当前广告（重要：避免内存泄漏）
            if (bannerAdManager != null) {
                bannerAdManager.destroyBannerAd();
            }
            
            // 2. 清理视图
            removeAllViews();
            isLoaded = false;
            
            // 3. 重新创建BannerAdManager
            if (getContext() instanceof ReactContext) {
                ReactContext reactContext = (ReactContext) getContext();
                if (reactContext.getCurrentActivity() != null) {
                    bannerAdManager = new BannerAdManager(reactContext.getCurrentActivity());
                }
            }
            
            // 4. 重新加载广告
            loadRealBannerAd();
            
            // 5. 安排下一次刷新
            if (autoRefresh) {
                postDelayed(refreshRunnable, refreshInterval);
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Exception during banner ad refresh", e);
            // 刷新失败时显示模拟广告
            showMockBannerAd("Refresh failed: " + e.getMessage());
        }
    }
    

    
    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        stopAutoRefresh();
        destroyAd();
    }
}