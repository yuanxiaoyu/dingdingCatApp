# 修复Mock状态问题

## 问题描述
.env文件中设置了 `MOCK_USER_STATE=0`，但应用仍然进入首页而不是登录页。

## 原因分析
应用使用了 `MockModeController` 和 `AsyncStorage` 来缓存Mock状态设置。这些缓存的覆盖设置优先级比环境变量更高，导致.env文件的修改不生效。

## 解决方案

### 方案1: 使用开发者工具清理（推荐）

1. 在应用中打开开发者工具 (DevTools)
2. 找到 "Mock状态管理" 部分  
3. 点击 "重置覆盖设置" 按钮
4. 重启应用

### 方案2: 使用控制台命令清理

在React Native调试控制台中运行以下命令：

```javascript
// 清理所有Mock相关缓存
global.clearMockCache && global.clearMockCache();

// 或者手动清理
AsyncStorage.multiRemove([
  '@dingdingcat/mock_mode_override',
  '@dingdingcat/mock_user_state_override', 
  '@dingdingcat/mock_user_state',
  '@dingdingcat/mock_login_state'
]).then(() => {
  console.log('✅ Mock缓存已清理，请重启应用');
});
```

### 方案3: 重置应用数据

**iOS模拟器:**
```bash
# 重置所有模拟器
xcrun simctl erase all
```

**Android:**
```bash
# 清理应用数据
adb shell pm clear com.dingdingcat
```

**或者直接删除应用重新安装**

### 方案4: 重启开发服务器

```bash
# 停止当前服务器 (Ctrl+C)
# 然后重启并清理缓存
npx react-native start --reset-cache

# 重新构建应用
npx react-native run-ios
# 或
npx react-native run-android
```

## 验证修复

修复后，检查以下内容确认问题已解决：

1. **控制台日志**: 查看是否有类似以下的日志
   ```
   Auth check (mock mode): {
     mockEnabled: true,
     mockUserState: 0,
     shouldBeLoggedIn: false
   }
   ```

2. **应用行为**: 应用启动后应该显示登录页面而不是首页

3. **开发者工具**: 在DevTools中确认Mock状态显示为"未登录"

## 预防措施

为避免此问题再次发生：

1. 修改.env文件后，总是重启开发服务器
2. 如果使用了开发者工具修改Mock状态，记得重置覆盖设置
3. 定期清理应用数据，特别是在切换不同的Mock配置时

## 调试命令

如果问题仍然存在，可以使用以下调试命令：

```javascript
// 查看当前Mock状态
global.getMockDebug && global.getMockDebug();

// 查看环境变量
console.log('ENV_CONFIG:', {
  MOCK_ENABLED: process.env.MOCK_ENABLED,
  MOCK_USER_STATE: process.env.MOCK_USER_STATE
});
```