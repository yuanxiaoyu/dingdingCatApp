# 🎯 穿山甲开屏广告完整指南

## 🚀 快速开始

### 1. 环境配置
```bash
# 设置环境变量
MOCK_ENABLED=1
MOCK_USER_STATE=1  # 已登录状态才显示开屏广告
DEBUG_MODE=true
```

### 2. 启动应用
```bash
npm install
npx react-native start
npx react-native run-android  # 或 run-ios
```

### 3. 验证集成
在开发者控制台运行：
```javascript
// 完整测试
global.testPangleIntegration.runFullTest();

// 单独测试SDK初始化
global.testPangleIntegration.testSDKInit();

// 单独测试开屏广告
global.testPangleIntegration.testSplashAd();
```

## 📋 集成清单

### ✅ 已完成的功能

1. **配置文件** (`src/config/adConfig.js`)
   - 穿山甲官方测试应用ID: `5001121`
   - 开屏广告位ID: `102117864`
   - 其他广告位ID配置完整

2. **SDK初始化** (`src/services/InitializationService.ts`)
   - 在应用启动时自动初始化穿山甲SDK
   - 使用配置文件中的应用ID
   - 包含错误处理和状态检查

3. **Mock服务集成** (`src/services/MockService.ts`)
   - 使用真实的穿山甲测试ID
   - 支持不同用户状态的广告显示逻辑

4. **开屏广告组件** (`src/components/SplashAdScreen.tsx`)
   - 在Mock模式下调用真实的穿山甲SDK
   - 完整的广告加载、展示、事件处理流程
   - 支持跳过功能和倒计时

5. **应用流程管理** (`src/services/AppFlowManager.ts`)
   - 根据用户登录状态决定是否显示开屏广告
   - 完整的应用启动流程控制

6. **测试工具**
   - 配置验证工具
   - 开屏广告测试工具
   - 完整集成测试工具

## 🎬 开屏广告展示流程

### 流程图
```
应用启动 → 品牌启动页 → 初始化(含SDK初始化) → 检查用户状态 → 决定是否显示开屏广告
    ↓
未登录: 显示登录页面
已登录: 显示开屏广告 → 广告完成 → 主应用
```

### 关键代码路径

1. **应用启动**: `App.tsx`
2. **初始化**: `InitializationService.ts` → `initializePangleSDK()`
3. **流程决策**: `AppFlowManager.ts` → `determineAppFlow()`
4. **广告展示**: `SplashAdScreen.tsx` → `showRealSplashAd()`
5. **SDK调用**: `PangleAdService.js` → `loadAndShowSplashAd()`

## 🔧 调试和测试

### 1. 控制台日志
关注以下关键日志：
```
✅ 穿山甲广告配置验证通过
Initializing Pangle SDK...
Pangle SDK initialized successfully
AppFlowManager: Should show splash ad: true
SplashAdScreen: Loading ad in Pangle SDK with ID: 102117864
SplashAdScreen: Ad loaded in SDK: {success: true}
SplashAdScreen: Ad shown in SDK: {status: 'completed'}
```

### 2. 测试命令
```javascript
// 验证配置
global.validatePangleConfig();

// 测试开屏广告
global.testSplashAd.runFullTest();

// 测试穿山甲集成
global.testPangleIntegration.runFullTest();
```

### 3. DevTools面板
- 点击主页右上角的"🛠️"图标
- 查看Mock状态
- 切换用户登录状态
- 测试开屏广告逻辑

## 🎯 预期效果

### 已登录用户
1. 显示品牌启动页（丁丁猫logo）
2. 显示初始化进度（包含"初始化广告SDK..."）
3. **显示穿山甲开屏广告**（使用测试ID 102117864）
4. 广告完成后进入主应用

### 未登录用户
1. 显示品牌启动页
2. 显示初始化进度
3. 直接显示登录页面（不显示开屏广告）

## 🚨 故障排除

### 问题1: 开屏广告不显示
**检查项目：**
- [ ] `MOCK_ENABLED=1`
- [ ] `MOCK_USER_STATE=1`（已登录状态）
- [ ] 控制台是否有SDK初始化成功的日志
- [ ] 是否有广告加载失败的错误日志

**解决方案：**
```javascript
// 检查SDK状态
global.testPangleIntegration.testSDKInit();

// 检查应用流程
global.testPangleIntegration.testAppFlow();
```

### 问题2: SDK初始化失败
**可能原因：**
- 穿山甲SDK原生模块未正确链接
- 应用ID配置错误
- 网络连接问题

**解决方案：**
```javascript
// 验证配置
global.validatePangleConfig();

// 检查原生模块
console.log('PangleAdModule available:', !!require('react-native').NativeModules.PangleAdModule);
```

### 问题3: 广告加载失败
**可能原因：**
- 广告位ID错误
- 网络连接问题
- SDK未正确初始化

**解决方案：**
```javascript
// 测试广告加载
global.testPangleIntegration.testSplashAd();
```

## 📱 生产环境部署

### 1. 替换测试ID
```javascript
// src/config/adConfig.js
const AdConfig = {
  appId: 'YOUR_PRODUCTION_APP_ID',
  splashAdId: 'YOUR_PRODUCTION_SPLASH_AD_ID',
  // ... 其他生产环境ID
};
```

### 2. 关闭开发功能
```bash
MOCK_ENABLED=0
DEBUG_MODE=false
```

### 3. 配置生产API
```typescript
const API_BASE_URL = 'https://api.dingdingcat.com';
```

## 🎉 成功标志

如果看到以下内容，说明集成成功：

### 控制台输出
```
🎉 所有测试通过！穿山甲集成成功！
✅ SDK初始化成功
✅ 开屏广告测试成功
✅ 应用流程测试成功
```

### 应用界面
1. 品牌启动页正常显示
2. 初始化进度包含"初始化广告SDK..."
3. **穿山甲开屏广告正常显示**
4. 广告完成后正确跳转到主应用

现在你的应用已经完全集成了穿山甲开屏广告功能！🚀