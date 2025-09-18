# 🚀 开屏广告快速启动指南

## 1️⃣ 环境配置

### 设置环境变量
```bash
# 启用Mock模式
MOCK_ENABLED=1

# 设置为已登录状态（这样才会显示开屏广告）
MOCK_USER_STATE=1

# 启用调试模式
DEBUG_MODE=true
```

## 2️⃣ 启动应用

```bash
# 安装依赖
npm install

# 启动Metro服务器
npx react-native start

# 运行iOS模拟器
npx react-native run-ios

# 或运行Android模拟器
npx react-native run-android
```

## 3️⃣ 测试开屏广告

### 方法1：自动测试
应用启动后会自动：
1. 显示品牌启动页（丁丁猫logo）
2. 进行应用初始化
3. 检查用户状态（Mock为已登录）
4. 显示开屏广告（使用穿山甲测试ID: 102117864）
5. 广告完成后进入主应用

### 方法2：手动测试
在开发者控制台中运行：
```javascript
// 验证配置
global.validatePangleConfig();

// 完整测试
global.testSplashAd.runFullTest();

// 切换用户状态测试
global.MockFlowTester.testUserStates();
```

## 4️⃣ 预期效果

### 已登录用户流程
```
启动页 → 初始化(30%) → 开屏广告(5秒) → 主应用
```

### 未登录用户流程
```
启动页 → 初始化(30%) → 登录页面
```

## 5️⃣ 调试工具

### DevTools面板
点击主页右上角的"🛠️"图标，可以：
- 查看Mock状态
- 切换用户登录状态
- 测试开屏广告逻辑
- 重置Mock服务

### 控制台日志
关注以下关键日志：
```
✅ 穿山甲广告配置验证通过
AppFlowManager: Should show splash ad: true
SplashAdScreen: Using Pangle test ID: 102117864
SplashAdScreen: Ad loaded successfully
```

## 6️⃣ 常见问题

### Q: 开屏广告没有显示？
A: 检查以下设置：
- `MOCK_ENABLED=1`
- `MOCK_USER_STATE=1`（已登录状态）
- 查看控制台是否有错误日志

### Q: 应用卡在初始化页面？
A: 可能的原因：
- 网络连接问题
- Mock服务初始化失败
- 查看控制台错误信息

### Q: 如何跳过开屏广告？
A: 开屏广告会在3秒后显示"跳过"按钮，点击即可跳过

## 7️⃣ 快速验证命令

```javascript
// 在开发者控制台中运行这些命令进行快速验证

// 1. 验证穿山甲配置
global.validatePangleConfig();

// 2. 查看配置信息
global.showPangleConfigInfo();

// 3. 测试开屏广告
global.testSplashAd.testConfig();

// 4. 测试应用流程
global.testSplashAd.testFlow();

// 5. 完整测试
global.testSplashAd.runFullTest();
```

## 8️⃣ 成功标志

如果看到以下内容，说明集成成功：

### 控制台输出
```
🎉 所有配置验证通过！可以正常使用穿山甲广告
✅ 开屏广告测试全部通过！
AppFlowManager: Should show splash ad: true
```

### 应用界面
1. 启动页显示"丁丁猫"logo
2. 初始化页面显示进度条
3. 开屏广告正常显示（穿山甲测试广告）
4. 广告完成后进入主应用界面

现在你可以开始测试开屏广告功能了！🎉