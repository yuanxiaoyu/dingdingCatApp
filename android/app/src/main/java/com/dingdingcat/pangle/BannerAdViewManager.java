package com.dingdingcat.pangle;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Map;

/**
 * Banner 广告视图管理器
 * Banner Ad View Manager
 */
public class BannerAdViewManager extends SimpleViewManager<BannerAdView> {
    private static final String REACT_CLASS = "BannerAdView";
    
    @NonNull
    @Override
    public String getName() {
        return REACT_CLASS;
    }
    
    @NonNull
    @Override
    protected BannerAdView createViewInstance(@NonNull ThemedReactContext reactContext) {
        return new BannerAdView(reactContext);
    }
    
    @ReactProp(name = "adId")
    public void setAdId(BannerAdView view, String adId) {
        view.setAdId(adId);
    }
    
    @ReactProp(name = "autoRefresh", defaultBoolean = true)
    public void setAutoRefresh(BannerAdView view, boolean autoRefresh) {
        view.setAutoRefresh(autoRefresh);
    }
    
    @ReactProp(name = "refreshInterval", defaultInt = 30000)
    public void setRefreshInterval(BannerAdView view, int refreshInterval) {
        view.setRefreshInterval(refreshInterval);
    }
    
    @Override
    public void receiveCommand(@NonNull BannerAdView view, String commandId, @Nullable ReadableArray args) {
        switch (commandId) {
            case "loadAd":
                view.loadAd();
                break;
            case "destroyAd":
                view.destroyAd();
                break;
        }
    }
    
    @Override
    public Map<String, Integer> getCommandsMap() {
        return MapBuilder.of(
            "loadAd", 1,
            "destroyAd", 2
        );
    }
    
    @Nullable
    @Override
    public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
        return MapBuilder.<String, Object>builder()
            .put("onAdLoaded", MapBuilder.of("registrationName", "onAdLoaded"))
            .put("onAdLoadFailed", MapBuilder.of("registrationName", "onAdLoadFailed"))
            .put("onAdShowFailed", MapBuilder.of("registrationName", "onAdShowFailed"))
            .put("onAdDestroyed", MapBuilder.of("registrationName", "onAdDestroyed"))
            .put("onAdRefreshed", MapBuilder.of("registrationName", "onAdRefreshed"))
            .build();
    }
}