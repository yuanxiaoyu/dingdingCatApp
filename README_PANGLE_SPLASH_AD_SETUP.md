# 穿山甲开屏广告配置和测试

## 概述
本文档说明如何使用穿山甲官方测试ID配置和展示开屏广告。

## 配置文件

### 1. 广告配置文件 (src/config/adConfig.js)
```javascript
const AdConfig = {
  // 穿山甲官方测试应用ID
  appId: '5001121',
  
  // 穿山甲官方测试广告位ID
  splashAdId: '102117864',        // 开屏广告
  rewardVideoAdId: '945700410',   // 激励视频广告
  interstitialAdId: '945493675',  // 插屏广告
  bannerAdId: '945493677',        // Banner广告
  
  // 广告类型常量
  adTypes: {
    SPLASH: 'splash',
    REWARD_VIDEO: 'reward_video',
    INTERSTITIAL: 'interstitial',
    BANNER: 'banner'
  },
  
  // 广告按钮配置
  adButtons: [
    {
      title: '开屏广告',
      adType: 'splash',
      adId: '102117864',
      enabled: true
    },
    // ... 其他广告类型配置
  ]
};
```

### 2. Mock服务集成
MockService已更新为使用穿山甲测试ID：

```typescript
public async getMockAdConfig(): Promise<AdConfig> {
  // 导入穿山甲测试配置
  const PangleAdConfig = require('../config/adConfig.js').default;
  
  return {
    appKey: ENV_CONFIG.APP_KEY,
    configVersion: '1.0.0-pangle-test',
    splashAdConfig: {
      enabled: true,
      adId: PangleAdConfig.splashAdId, // 使用穿山甲测试ID: 102117864
      timeout: 5000,
      skipDelay: 3000,
    },
    // ... 其他广告配置
  };
}
```

## 开屏广告展示流程

### 1. 应用启动流程
```
应用启动 → 初始化服务 → 检查用户状态 → 决定是否显示开屏广告
```

### 2. AppFlowManager决策逻辑
```typescript
// 1. 检查用户认证状态
const isAuthenticated = await authService.isAuthenticated();

if (!isAuthenticated) {
  // 未登录 → 显示登录页面
  return { state: AppFlowState.LOGIN_REQUIRED };
}

// 2. 已登录 → 检查是否应该显示开屏广告
const shouldShowSplashAd = await this.shouldShowSplashAd();

if (shouldShowSplashAd) {
  // 显示开屏广告
  return { state: AppFlowState.SPLASH_AD };
} else {
  // 直接进入主应用
  return { state: AppFlowState.MAIN_APP };
}
```

### 3. 开屏广告显示条件
- ✅ 用户已登录
- ✅ 广告配置中开屏广告已启用
- ✅ 满足广告间隔时间要求
- ✅ 未超过每日广告观看限制

## Mock模式测试

### 1. 环境变量控制
```bash
# 启用Mock模式
MOCK_ENABLED=1

# 设置用户状态
MOCK_USER_STATE=1  # 1=已登录，0=未登录
```

### 2. 手动测试不同状态
```typescript
// 测试未登录状态（不显示开屏广告）
await mockService.setMockState(MockUserState.NOT_LOGGED_IN);

// 测试已登录状态（显示开屏广告）
await mockService.setMockState(MockUserState.LOGGED_IN);

// 测试首次用户状态（显示开屏广告）
await mockService.setMockState(MockUserState.FIRST_TIME_USER);
```

### 3. 开屏广告测试工具
使用 `src/utils/testSplashAd.ts` 进行完整测试：

```typescript
// 在开发者控制台中运行
global.testSplashAd.runFullTest();
```

测试内容包括：
- ✅ 穿山甲配置验证
- ✅ Mock服务配置验证
- ✅ 不同用户状态下的广告显示逻辑
- ✅ 广告请求和上报流程

## SplashAdScreen组件

### 1. 组件功能
- 加载服务器广告配置
- 请求开屏广告数据
- 集成穿山甲SDK显示广告
- 处理广告事件上报
- 支持跳过功能和倒计时

### 2. 使用方式
```typescript
<SplashAdScreen
  userId={user.userId}
  onAdComplete={() => {
    // 广告播放完成，进入主应用
    navigation.navigate('MainTabs');
  }}
  onAdSkipped={() => {
    // 用户跳过广告，进入主应用
    navigation.navigate('MainTabs');
  }}
  onAdError={(error) => {
    // 广告加载失败，进入主应用
    console.error('Splash ad error:', error);
    navigation.navigate('MainTabs');
  }}
/>
```

## 广告事件上报

### 1. 自动上报事件
- **广告请求**: 向服务器请求广告数据
- **广告展示**: 广告开始显示时上报
- **广告点击**: 用户点击广告时上报
- **广告完成**: 广告播放完成时上报
- **广告跳过**: 用户跳过广告时上报

### 2. 上报数据示例
```typescript
// 广告展示上报
await adService.reportAdShow({
  userId: user.userId,
  appKey: user.appKey,
  adId: '102117864',
  adType: AdType.SPLASH,
  showTime: Date.now(),
  ipAddress: deviceInfo.ipAddress,
});
```

## 开发调试

### 1. 日志输出
开屏广告相关的日志会输出到控制台：
```
AppFlowManager: Checking splash ad display
AppFlowManager: Should show splash ad: true
SplashAdScreen: Loading ad configuration
SplashAdScreen: Requesting splash ad
SplashAdScreen: Ad loaded successfully
```

### 2. DevTools支持
在开发工具中可以：
- 查看当前Mock状态
- 切换用户登录状态
- 测试开屏广告显示逻辑
- 重置Mock服务状态

### 3. 错误处理
- 广告加载失败时自动跳过
- 网络错误时显示友好提示
- 超时保护机制
- 降级到主应用界面

## 生产环境配置

### 1. 替换测试ID
在生产环境中，需要将测试ID替换为真实的广告位ID：

```javascript
const AdConfig = {
  appId: 'YOUR_REAL_APP_ID',
  splashAdId: 'YOUR_REAL_SPLASH_AD_ID',
  // ... 其他真实ID
};
```

### 2. 关闭Mock模式
```bash
MOCK_ENABLED=0
DEBUG_MODE=false
```

### 3. 配置服务器端点
确保API端点指向生产服务器：
```typescript
const API_BASE_URL = 'https://api.dingdingcat.com';
```

现在开屏广告已经完全配置好，使用穿山甲官方测试ID，可以在开发环境中正常测试和展示！