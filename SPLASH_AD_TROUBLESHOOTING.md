# 🚨 开屏广告故障排除指南

## 🔍 快速诊断

### 1. 检查应用流程
在开发者控制台运行：
```javascript
// 调试应用流程决策
global.debugAppFlow();
```

**预期输出：**
```
✅ 应该显示开屏广告
应用状态: SPLASH_AD
是否显示开屏广告: true
是否已认证: true
用户ID: [数字]
```

### 2. 强制测试开屏广告
```javascript
// 强制设置为已登录状态并测试
global.forceTestSplashAd();
```

### 3. 检查组件状态
```javascript
// 检查SplashAdScreen组件和原生模块
global.checkSplashAdScreen();
```

## 🔧 常见问题和解决方案

### 问题1: 应用流程不正确
**症状：** `debugAppFlow()` 显示状态不是 `SPLASH_AD`

**可能原因：**
- Mock状态设置错误
- 用户未登录
- 广告配置禁用

**解决方案：**
```javascript
// 1. 检查Mock状态
global.debugAppFlow();

// 2. 强制设置正确状态
global.forceTestSplashAd();

// 3. 检查环境变量
console.log('MOCK_ENABLED:', process.env.MOCK_ENABLED);
console.log('MOCK_USER_STATE:', process.env.MOCK_USER_STATE);
```

### 问题2: SplashAdScreen组件未渲染
**症状：** 控制台没有 "App: Rendering SplashAdScreen" 日志

**检查项：**
- [ ] `appState === AppState.SPLASH_AD`
- [ ] `flowResult?.shouldShowSplashAd === true`
- [ ] `flowResult.userId` 存在

**解决方案：**
```javascript
// 检查应用状态
console.log('Current app state:', appState);
console.log('Flow result:', flowResult);
```

### 问题3: 穿山甲SDK未初始化
**症状：** `checkSplashAdScreen()` 显示原生模块不可用

**解决方案：**
1. 检查原生模块链接
2. 重新编译应用
3. 检查SDK初始化日志

### 问题4: 广告加载失败
**症状：** SplashAdScreen渲染但广告不显示

**检查日志：**
```
SplashAdScreen: Loading ad in Pangle SDK with ID: 102117864
SplashAdScreen: Ad loaded in SDK: {success: false}
```

**解决方案：**
```javascript
// 测试SDK状态
global.testPangleIntegration.testSDKInit();
```

## 📋 完整诊断流程

### 步骤1: 基础检查
```javascript
// 1. 验证配置
global.validatePangleConfig();

// 2. 检查应用流程
global.debugAppFlow();

// 3. 检查组件状态
global.checkSplashAdScreen();
```

### 步骤2: 强制测试
```javascript
// 强制设置Mock状态并测试
global.forceTestSplashAd();
```

### 步骤3: SDK测试
```javascript
// 测试穿山甲SDK
global.testPangleIntegration.runFullTest();
```

## 🎯 预期的完整日志流程

正常情况下，控制台应该显示以下日志序列：

```
1. 应用启动
DingDingCat App starting...

2. 初始化阶段
Starting application initialization...
Initializing Pangle SDK...
Using Pangle App ID: 5001121
Pangle SDK initialized successfully

3. 流程决策
App initialization completed: {success: true, ...}
App flow determined: {state: "SPLASH_AD", shouldShowSplashAd: true, ...}
App: Setting app state based on flow result: SPLASH_AD
App: Setting state to SPLASH_AD

4. 渲染SplashAdScreen
App: Rendering SplashAdScreen with userId: [数字]

5. 广告加载和展示
SplashAdScreen: Loading ad in Pangle SDK with ID: 102117864
SplashAdScreen: Ad loaded in SDK: {success: true}
SplashAdScreen: Ad shown in SDK: {status: 'completed'}
```

## 🚀 如果所有检查都通过但仍无广告

1. **重新编译应用**
```bash
npx react-native start --reset-cache
npx react-native run-android
```

2. **检查原生模块**
- 确保穿山甲SDK正确集成到原生代码
- 检查PangleAdModule桥接是否正确

3. **检查网络连接**
- 确保设备能访问穿山甲广告服务器
- 检查是否有网络代理或防火墙阻止

4. **检查广告位ID**
- 确认使用的是正确的测试ID: `102117864`
- 确认应用ID: `5001121`

现在请运行 `global.debugAppFlow()` 来诊断问题！