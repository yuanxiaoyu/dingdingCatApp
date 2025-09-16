# 穿山甲官方 Demo 实现分析

## 项目结构分析

### 1. 整体架构
```
Demo/
├── adapter/                    # 聚合广告适配器 AAR 文件
├── adn/                       # 第三方广告网络 SDK AAR 文件
├── demo/                      # 主要 Demo 应用
│   ├── app/
│   │   ├── libs/             # 本地 AAR 依赖库
│   │   │   ├── adapter/      # 聚合适配器
│   │   │   └── adn/          # 第三方 ADN SDK
│   │   └── src/main/
│   │       ├── java/com/union_test/toutiao/
│   │       │   ├── activity/          # 各类广告展示 Activity
│   │       │   ├── config/            # SDK 配置管理
│   │       │   ├── utils/             # 工具类
│   │       │   └── DemoApplication.java
│   │       ├── res/                   # 资源文件
│   │       └── AndroidManifest.xml
│   └── build.gradle
├── open_ad_sdk_7.1.1.4.aar   # 穿山甲主 SDK
└── tools-release.aar          # 测试工具
```

### 2. 核心 SDK 版本
- **穿山甲 SDK 版本**: 7.1.1.4
- **编译 SDK 版本**: 30
- **最小 SDK 版本**: 24
- **目标 SDK 版本**: 30

## 关键配置分析

### 1. Gradle 配置 (build.gradle)

#### 项目级配置
```gradle
buildscript {
    repositories {
        maven { url "https://dl-maven-android.mintegral.com/repository/mbridge_android_sdk_support/" }
        maven { url "https://artifact.bytedance.com/repository/pangle" }
        google()
        jcenter()
    }
    dependencies {
        classpath "com.android.tools.build:gradle:4.0.1"
        classpath 'org.jetbrains.kotlin:kotlin-gradle-plugin:1.5.20'
    }
}
```

#### 应用级配置
```gradle
android {
    compileSdkVersion 30
    buildToolsVersion "30.0.2"
    
    defaultConfig {
        applicationId "com.union_test.toutiao"
        minSdkVersion 24
        targetSdkVersion 30
        multiDexEnabled true
        ndk {
            abiFilters 'armeabi', 'arm64-v8a', 'armeabi-v7a'
        }
    }
}

repositories {
    flatDir {
        dirs 'libs','./libs/adn','./libs/adn/mtg','./libs/adn/sigmob','./libs/adapter'
    }
}
```

#### 关键依赖
```gradle
// 穿山甲主 SDK
implementation(name: 'open_ad_sdk', ext: 'aar')
implementation(name: 'tools-release', ext: 'aar')

// 聚合适配器
implementation(name: "mediation_admob_adapter_17.2.0.71", ext: 'aar')
implementation(name: "mediation_baidu_adapter_9.3941.0", ext: 'aar')
implementation(name: "mediation_gdt_adapter_4.642.1512.0", ext: 'aar')
// ... 其他适配器

// 第三方 ADN SDK
implementation(name: "Baidu_MobAds_SDK_v9.3941", ext: 'aar')
implementation(name: "GDTSDK.unionNormal.4.642.1512", ext: 'aar')
// ... 其他 ADN SDK
```

### 2. AndroidManifest.xml 配置

#### 必要权限
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

#### FileProvider 配置
```xml
<provider
    android:name="com.bytedance.sdk.openadsdk.TTFileProvider"
    android:authorities="${applicationId}.TTFileProvider"
    android:exported="false"
    android:grantUriPermissions="true">
    <meta-data
        android:name="android.support.FILE_PROVIDER_PATHS"
        android:resource="@xml/file_paths" />
</provider>

<provider
    android:name="com.bytedance.sdk.openadsdk.multipro.TTMultiProvider"
    android:authorities="${applicationId}.TTMultiProvider"
    android:exported="false" />
```

## SDK 初始化模式分析

### 1. 两步初始化模式 (TTAdManagerHolder.java)

#### 第一步：初始化 SDK
```java
private static void doInit(Context context) {
    if (sInit) {
        Toast.makeText(context, "您已经初始化过了", Toast.LENGTH_LONG).show();
        return;
    }
    TTAdSdk.init(context, buildConfig(context));
    sInit = true;
    Toast.makeText(context, "初始化成功", Toast.LENGTH_LONG).show();
}
```

#### 第二步：启动 SDK
```java
public static void start(Context context) {
    if (!sInit) {
        Toast.makeText(context, "还没初始化SDK，请先进行初始化", Toast.LENGTH_LONG).show();
        return;
    }
    if (sStart) {
        startActivity(context);
        return;
    }
    
    TTAdSdk.start(new TTAdSdk.Callback() {
        @Override
        public void success() {
            Log.i(TAG, "success: " + TTAdSdk.isSdkReady());
            startActivity(context);
        }

        @Override
        public void fail(int code, String msg) {
            sStart = false;
            Log.i(TAG, "fail:  code = " + code + " msg = " + msg);
        }
    });
    sStart = true;
}
```

### 2. SDK 配置构建
```java
private static TTAdConfig buildConfig(Context context) {
    return new TTAdConfig.Builder()
        .appId("5001121")                    // 测试应用 ID
        .appName("APP测试媒体")
        .debug(true)                         // 调试模式
        .useMediation(true)                  // 启用聚合功能
        .build();
}
```

## 广告实现模式分析

### 1. 开屏广告实现 (CSJSplashActivity.java)

#### 关键实现步骤
```java
// Step 1: 创建 TTAdNative 对象
mTTAdNative = TTAdManagerHolder.get().createAdNative(this);

// Step 2: 创建 AdSlot
AdSlot adSlot = new AdSlot.Builder()
    .setCodeId(mCodeId)                                    // 广告位 ID
    .setExpressViewAcceptedSize(splashWidthDp, splashHeightDp)  // 模板广告尺寸 (dp)
    .setImageAcceptedSize(splashWidthPx, splashHeightPx)        // 图片广告尺寸 (px)
    .build();

// Step 3: 加载广告
mTTAdNative.loadSplashAd(adSlot, new TTAdNative.CSJSplashAdListener() {
    @Override
    public void onSplashLoadSuccess(CSJSplashAd ad) {
        mSplashAd = ad;
        mSplashAd.showSplashView(mSplashContainer);
    }

    @Override
    public void onSplashLoadFail(CSJAdError error) {
        Log.e(TAG, "onSplashLoadFail: " + error.getCode() + ", " + error.getMsg());
        goToMainActivity();
    }

    @Override
    public void onSplashRenderSuccess(CSJSplashAd ad) {
        mSplashAd.setSplashAdListener(listener);
        // 设置下载监听器
        if (ad.getInteractionType() == TTAdConstant.INTERACTION_TYPE_DOWNLOAD) {
            mSplashAd.setDownloadListener(downloadListener);
        }
    }

    @Override
    public void onSplashRenderFail(CSJSplashAd ad, CSJAdError error) {
        Log.e(TAG, "onSplashRenderFail: " + error.getCode() + ", " + error.getMsg());
        goToMainActivity();
    }
});
```

#### 关键配置参数
- **默认广告位 ID**: "801121648"
- **加载超时时间**: 3000ms
- **支持半屏开屏**: 通过 `mIsHalfSize` 控制

### 2. 激励视频广告实现 (RewardVideoActivity.java)

#### 关键实现步骤
```java
// Step 1: 创建 AdSlot
AdSlot adSlot = new AdSlot.Builder()
    .setCodeId(codeId)                           // 广告代码位 ID
    .setAdLoadType(TTAdLoadType.LOAD)            // 加载类型：实时/预请求
    .setRewardAmount(123)                        // 奖励数量
    .setRewardName("金币")                       // 奖励名称
    .build();

// Step 2: 加载广告
mTTAdNative.loadRewardVideoAd(adSlot, new TTAdNative.RewardVideoAdListener() {
    @Override
    public void onError(int code, String message) {
        TToast.show(RewardVideoActivity.this, "load error : " + code + ", " + message);
    }

    @Override
    public void onRewardVideoAdLoad(TTRewardVideoAd ad) {
        TToast.show(RewardVideoActivity.this, "rewardVideoAd loaded");
        mttRewardVideoAd = ad;
        // 设置广告交互监听器
        mttRewardVideoAd.setRewardAdInteractionListener(new RewardAdInteractionListener());
        // 设置下载监听器
        mttRewardVideoAd.setDownloadListener(new RewardVideoDownloadListener());
    }

    @Override
    public void onRewardVideoCached() {
        TToast.show(RewardVideoActivity.this, "rewardVideoAd video cached");
    }
});

// Step 3: 展示广告
if (mttRewardVideoAd != null) {
    mttRewardVideoAd.showRewardVideoAd(RewardVideoActivity.this);
}
```

### 3. Banner 广告实现 (BannerExpressActivity.java)

#### 关键实现步骤
```java
// Step 1: 创建 TTAdNative (需要传入 Activity 对象)
mTTAdNative = TTAdManagerHolder.get().createAdNative(this);

// Step 2: 创建 AdSlot
AdSlot adSlot = new AdSlot.Builder()
    .setCodeId(codeId)
    .setExpressViewAcceptedSize(width, height)    // Banner 尺寸
    .setAdCount(1)                                // 广告数量
    .build();

// Step 3: 加载广告
mTTAdNative.loadBannerExpressAd(adSlot, new TTAdNative.NativeExpressAdListener() {
    @Override
    public void onError(int code, String message) {
        TToast.show(context, "load error : " + code + ", " + message);
    }

    @Override
    public void onNativeExpressAdLoad(List<TTNativeExpressAd> ads) {
        if (ads == null || ads.size() == 0) {
            return;
        }
        mTTAd = ads.get(0);
        bindAdListener(mTTAd);
        startTime = System.currentTimeMillis();
        mTTAd.render();
    }
});
```

## 错误处理模式

### 1. 统一错误处理
```java
@Override
public void onError(int code, String message) {
    Log.e(TAG, "广告加载失败: code=" + code + ", message=" + message);
    TToast.show(context, "load error : " + code + ", " + message);
}
```

### 2. CSJAdError 错误信息
```java
@Override
public void onSplashLoadFail(CSJAdError error) {
    Log.e(TAG, "errorCode: " + error.getCode() + ", errorMsg: " + error.getMsg());
    showToast(error.getMsg());
    goToMainActivity();
}
```

## 测试配置信息

### 1. 应用配置
- **测试应用 ID**: "5001121" (在 TTAdManagerHolder 中)
- **应用包名**: "com.union_test.toutiao"
- **应用名称**: "APP测试媒体"

### 2. 广告位 ID 示例
- **开屏广告**: "801121648"
- **激励视频**: 通过 Intent 传递，支持横屏和竖屏
- **Banner 广告**: 支持多种尺寸配置

### 3. 调试配置
- **调试模式**: `debug(true)`
- **聚合功能**: `useMediation(true)`
- **权限申请**: 在合适时机调用 `requestPermissionIfNecessary()`

## 关键集成要点

### 1. 依赖管理
- 使用 `flatDir` 方式引入本地 AAR 文件
- 分别管理主 SDK、适配器和第三方 ADN SDK
- 支持多 DEX 配置

### 2. 权限管理
- 必须申请网络相关权限
- 建议申请位置和设备信息权限以提升广告效果
- Android 13+ 需要通知权限

### 3. 生命周期管理
- 在 Application 中进行 SDK 初始化
- 在 Activity 中创建 AdNative 对象
- 正确处理广告的加载、展示和销毁

### 4. 聚合配置
- 启用 `useMediation(true)`
- 配置各种第三方 ADN 适配器
- 设置对应的 FileProvider

## 最佳实践总结

1. **两步初始化**: 先 `init()` 再 `start()`，确保 SDK 正确启动
2. **权限申请**: 在 SDK 初始化前申请必要权限
3. **错误处理**: 统一处理广告加载失败，提供用户友好提示
4. **超时设置**: 开屏广告建议设置 3000ms 超时
5. **生命周期**: 正确管理广告对象的生命周期，避免内存泄漏
6. **测试模式**: 开发阶段启用 debug 模式，上线前关闭
7. **聚合功能**: 使用聚合功能时必须设置 `useMediation(true)`