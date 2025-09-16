# 设计文档

## 概述

本设计文档描述了如何创建一个名为"丁丁猫"的 React Native 应用，并集成穿山甲聚合广告 SDK。该应用将专注于 Android 平台，提供一个简洁的首页界面，包含各类广告展示的触发按钮。设计严格遵循穿山甲官方文档和 Demo 实现模式，确保 SDK 集成的正确性和稳定性。

**设计决策理由**: 基于工作区中的穿山甲官方 Demo 分析，采用官方推荐的初始化模式、广告加载流程和错误处理机制，确保集成的可靠性。

## 架构

### 整体架构
```
丁丁猫应用
├── React Native 层
│   ├── 首页组件 (HomeScreen)
│   ├── 广告按钮组件 (AdButton)
│   └── 导航配置
├── 原生桥接层
│   ├── 穿山甲 SDK 桥接模块
│   └── 广告事件处理
└── Android 原生层
    ├── 穿山甲 SDK 集成
    ├── 各类广告实现
    └── 权限配置
```

### 技术栈
- **前端框架**: React Native
- **广告 SDK**: 穿山甲聚合广告 SDK v7.1.1.4
- **目标平台**: Android (minSdkVersion 24, targetSdkVersion 30)
- **开发语言**: JavaScript/TypeScript (RN层), Java/Kotlin (Android层)
- **测试配置**: 使用测试应用 ID 5738209 和相应的测试广告位 ID

**设计决策理由**: 基于官方 Demo 的版本配置，确保兼容性和稳定性。使用用户提供的测试 ID 进行开发和验证。

## 组件和接口

### React Native 组件

#### HomeScreen 组件
- **功能**: 应用主页面，展示所有广告类型的触发按钮
- **状态管理**: 使用 React Hooks 管理广告加载状态
- **布局**: 垂直排列的按钮列表，每个按钮对应一种广告类型

#### AdButton 组件
- **功能**: 可复用的广告触发按钮组件
- **属性**:
  - `title`: 按钮显示文本
  - `adType`: 广告类型标识
  - `onPress`: 点击回调函数
  - `loading`: 加载状态

### 原生桥接模块

#### PangleAdModule
- **功能**: React Native 与穿山甲 SDK 的桥接模块
- **初始化方法**:
  - `initializeSDK(appId: string)`: 使用测试应用 ID 5738209 初始化 SDK
  - `startSDK()`: 启动 SDK（两步初始化模式）
- **广告加载方法**:
  - `loadSplashAd(adId: string)`: 加载开屏广告，使用广告 ID 892641054
  - `loadRewardVideoAd(adId: string)`: 加载激励视频广告
  - `loadInterstitialAd(adId: string)`: 加载新插屏广告
  - `loadBannerAd(adId: string)`: 加载 Banner 广告
  - `loadFeedAd(adId: string)`: 加载信息流广告
  - `loadDrawFeedAd(adId: string)`: 加载 Draw 信息流广告

**设计决策理由**: 采用官方 Demo 的两步初始化模式（init + start），确保 SDK 正确启动。每个广告方法接受广告位 ID 参数，提供灵活性。

### Android 原生实现

#### 广告管理器类
每种广告类型对应一个管理器类：
- `SplashAdManager`: 开屏广告管理
- `RewardVideoAdManager`: 激励视频广告管理
- `InterstitialAdManager`: 插屏广告管理
- `BannerAdManager`: Banner 广告管理
- `FeedAdManager`: 信息流广告管理
- `DrawFeedAdManager`: Draw 信息流广告管理

## 数据模型

### 广告配置模型
```javascript
interface AdConfig {
  appId: string;          // 穿山甲应用 ID: "5738209"
  splashAdId: string;     // 开屏广告位 ID: "892641054"
  rewardVideoAdId: string; // 激励视频广告位 ID
  interstitialAdId: string; // 插屏广告位 ID
  bannerAdId: string;     // Banner 广告位 ID
  feedAdId: string;       // 信息流广告位 ID
  drawFeedAdId: string;   // Draw 信息流广告位 ID
}
```

### 广告按钮配置模型
```javascript
interface AdButtonConfig {
  title: string;          // 按钮显示文本
  adType: string;         // 广告类型标识
  adId: string;          // 对应的广告位 ID
  enabled: boolean;       // 按钮是否可用
}
```

**设计决策理由**: 明确指定测试 ID，确保开发过程中使用正确的配置。添加按钮配置模型以支持首页界面的动态渲染。

### 广告状态模型
```javascript
interface AdState {
  isLoading: boolean;     // 是否正在加载
  isLoaded: boolean;      // 是否已加载
  error: string | null;   // 错误信息
}
```

## 错误处理

### 错误类型
1. **SDK 初始化失败**: 应用 ID 无效或网络问题
2. **SDK 启动失败**: 两步初始化中的启动阶段失败
3. **广告加载失败**: 广告位 ID 无效或无广告填充
4. **广告展示失败**: 广告未加载完成或展示过程中出错
5. **网络错误**: 网络连接问题导致的各种错误
6. **权限错误**: 必要权限未授予导致的功能异常

### 错误处理策略
- **用户友好提示**: 显示简洁的错误信息给用户，符合需求中的错误提示要求
- **日志记录**: 详细记录错误信息用于调试，使用 CSJAdError 统一错误格式
- **重试机制**: 对于网络错误提供重试选项
- **降级处理**: 广告加载失败时不影响应用主要功能
- **超时处理**: 为广告加载设置合理的超时时间（参考官方 Demo 的 3000ms）

**设计决策理由**: 基于官方 Demo 的错误处理模式，确保所有广告加载失败都有相应的错误提示，满足需求文档中每个广告类型的错误处理要求。

## 测试策略

### 集成测试
1. **SDK 初始化测试**: 验证使用测试应用 ID 5738209 能够正确初始化穿山甲 SDK
2. **SDK 启动测试**: 验证两步初始化模式的启动流程
3. **广告加载测试**: 验证六种广告类型都能够正确加载
4. **广告展示测试**: 验证广告能够正确展示和交互
5. **错误处理测试**: 验证各种错误情况的处理和用户提示

### 功能测试
1. **首页界面测试**: 验证首页显示六个广告类型按钮
2. **按钮交互测试**: 验证所有广告按钮的点击响应和触发功能
3. **开屏广告测试**: 验证使用广告 ID 892641054 的开屏广告展示
4. **各类广告测试**: 验证激励视频、新插屏、Banner、信息流、Draw 信息流广告的展示效果
5. **Android 平台测试**: 验证应用在 Android 平台上的稳定运行

**设计决策理由**: 测试策略覆盖需求文档中的所有验收标准，确保每个广告类型都能正确加载、展示，并在失败时显示错误提示。

## 实现细节

### 项目结构
```
DingDingCat/
├── android/
│   ├── app/
│   │   ├── src/main/java/com/dingdingcat/
│   │   │   ├── MainActivity.java
│   │   │   ├── MainApplication.java
│   │   │   └── pangle/
│   │   │       ├── PangleAdModule.java
│   │   │       ├── PangleAdPackage.java
│   │   │       └── managers/
│   │   │           ├── SplashAdManager.java
│   │   │           ├── RewardVideoAdManager.java
│   │   │           ├── InterstitialAdManager.java
│   │   │           ├── BannerAdManager.java
│   │   │           ├── FeedAdManager.java
│   │   │           └── DrawFeedAdManager.java
│   │   ├── build.gradle
│   │   └── libs/ (穿山甲 SDK 文件)
│   └── build.gradle
├── src/
│   ├── components/
│   │   ├── HomeScreen.js
│   │   └── AdButton.js
│   ├── config/
│   │   └── adConfig.js
│   └── App.js
└── package.json
```

### SDK 集成步骤
1. **添加 SDK 依赖**: 将穿山甲 SDK AAR 文件从 Demo 目录复制到 Android 项目的 libs 目录
2. **配置 Gradle**: 修改 build.gradle 文件添加 SDK 依赖和必要配置
3. **配置权限**: 在 AndroidManifest.xml 中添加必要权限（网络、存储等）
4. **两步初始化 SDK**: 
   - 第一步：使用测试应用 ID 5738209 初始化 SDK
   - 第二步：启动 SDK 并处理回调
5. **创建桥接模块**: 实现 React Native 与原生代码的通信
6. **实现广告管理器**: 为六种广告类型创建对应的管理器
7. **配置测试广告位**: 使用提供的测试广告 ID 进行各类广告展示

**设计决策理由**: 严格按照官方 Demo 的集成模式，确保 SDK 正确集成。使用用户提供的测试 ID，保证开发过程中的广告展示效果。

### 广告实现流程
1. **用户点击按钮** → **调用桥接方法** → **原生代码加载广告** → **展示广告**
2. **广告事件回调** → **桥接模块处理** → **React Native 层状态更新**

### 配置参数
- **应用 ID**: 5738209（用户提供的测试应用 ID）
- **开屏广告位 ID**: 892641054（用户明确指定的开屏广告 ID）
- **其他广告位 ID**: 根据广告类型使用相应的测试广告位 ID
- **测试模式**: 启用调试模式进行开发和调试
- **聚合功能**: 启用穿山甲聚合广告功能

**设计决策理由**: 使用用户明确提供的测试 ID，确保开发过程中能够正确展示广告效果。参考官方 Demo 的配置模式，启用调试和聚合功能。

### 首页界面设计
- **布局方式**: 垂直滚动列表，包含六个广告类型按钮
- **按钮设计**: 统一样式的可复用 AdButton 组件
- **广告类型**: 开屏广告、激励视频广告、新插屏广告、Banner 广告、信息流广告、Draw 信息流广告
- **交互反馈**: 点击按钮触发对应广告加载和展示，提供加载状态和错误提示

**设计决策理由**: 满足需求文档中关于首页界面的所有要求，确保用户能够通过点击按钮触发各类广告展示功能。