# 测试登录流程修改

## 修改内容

### 1. InitializationService 修改
- 未登录用户只执行基础初始化（认证检查）
- 跳过配置加载、风控初始化、设备信息收集等
- 添加了 `initializeAuthenticatedFeatures()` 方法用于登录后初始化

### 2. AuthSlice 修改
- 添加了 `initializeAuthenticatedFeatures` thunk
- 在登录成功后自动触发认证功能初始化

### 3. LoginScreen 修改
- 使用 Redux thunk 而不是直接调用 AuthService
- 登录成功后自动调用认证功能初始化

## 预期行为

### 未登录状态启动
```
应用启动 → 品牌启动页 → 基础初始化（只检查认证状态）→ 登录页面
```

控制台应该显示：
```
User not authenticated, skipping configuration loading and other authenticated-only initialization steps
跳过配置加载（未登录）...
```

### 登录成功后
```
用户点击微信登录 → 登录成功 → 初始化认证功能 → 主应用
```

控制台应该显示：
```
Login successful: [用户名]
Initializing authenticated features...
Starting authenticated features initialization...
加载应用配置...
初始化广告SDK...
收集设备信息...
初始化风控系统...
同步离线数据...
认证功能初始化完成
Authenticated features initialized successfully
```

## 测试步骤

1. **清理缓存并重启**
   ```bash
   npx react-native start --reset-cache
   npx react-native run-ios  # 或 run-android
   ```

2. **验证未登录启动**
   - 确认 .env 文件中 `MOCK_USER_STATE=0`
   - 确认 appSettings.json 中 `"userState": 0`
   - 启动应用，应该直接进入登录页面
   - 控制台不应该显示"加载应用配置"、"拉取风控配置"等消息

3. **验证登录流程**
   - 点击微信登录
   - 登录成功后应该看到认证功能初始化的日志
   - 然后进入主应用

## 调试命令

如果需要调试，可以在控制台运行：

```javascript
// 查看当前初始化状态
global.debugEnvLoading && global.debugEnvLoading();

// 清理所有Mock缓存
global.clearAllMockCache && global.clearAllMockCache();

// 查看Mock状态
global.getMockDebug && global.getMockDebug();
```