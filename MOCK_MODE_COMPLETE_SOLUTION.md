# Mock模式完整解决方案

## 🎯 问题解决

通过在API客户端层面统一拦截所有网络请求，确保在Mock模式下**零网络请求**。

## 🏗️ 解决方案架构

### 1. 配置层 (Configuration Layer)
- `src/config/appSettings.json` - 主配置文件
- `src/config/env.ts` - 环境配置
- `src/config/mockConfig.ts` - Mock配置管理

### 2. 拦截层 (Interception Layer)
- `src/services/apiInterceptor.ts` - API请求拦截器
- `src/services/apiClient.ts` - 修改后的API客户端

### 3. 控制层 (Control Layer)
- `src/utils/mockModeController.ts` - Mock模式控制器
- `src/services/MockService.ts` - Mock数据服务

### 4. 测试层 (Testing Layer)
- `src/utils/testMockInterception.ts` - Mock拦截测试工具

## 🔧 配置文件使用

### 主配置文件 `src/config/appSettings.json`

```json
{
  \"mockMode\": {
    \"enabled\": true,        // 是否启用Mock模式
    \"userState\": 1,         // 用户状态 (0: 未登录, 1: 已登录)
    \"showLogs\": true,       // 是否显示Mock日志
    \"delay\": 100            // Mock延迟时间(ms)
  },
  \"api\": {
    \"baseUrl\": \"https://dev-api.dingdingcat.com\",
    \"timeout\": 30000
  },
  \"debug\": {
    \"enabled\": true,
    \"logLevel\": \"debug\"
  }
}
```

### 一键切换Mock模式

**方法1: 修改配置文件**
```json
{
  \"mockMode\": {
    \"enabled\": false    // 改为false禁用Mock模式
  }
}
```

**方法2: 使用控制器命令**
```javascript
// 在开发者控制台中运行
enableMock()    // 启用Mock模式
disableMock()   // 禁用Mock模式
toggleMock()    // 切换Mock模式
```

## 🚀 使用方法

### 1. 启动应用
应用启动时会自动读取配置文件并初始化Mock模式。

### 2. 检查Mock状态
```javascript
// 查看当前Mock状态
getMockStatus()

// 查看详细调试信息
getMockDebug()
```

### 3. 动态切换模式
```javascript
// 启用Mock模式
await enableMock()

// 禁用Mock模式  
await disableMock()

// 设置用户状态
await setMockUser(1)  // 1: 已登录, 0: 未登录
```

### 4. 测试Mock拦截
```javascript
// 运行完整的Mock拦截测试
await testMockInterception()

// 测试模式切换功能
await testMockModeToggle()
```

## 📊 API拦截映射

所有API请求都会被自动拦截并映射到对应的Mock方法：

| API路径 | HTTP方法 | Mock方法 |
|---------|----------|----------|
| `/auth/wechat/login` | POST | `mockWechatLogin` |
| `/auth/wechat/register` | POST | `mockWechatRegister` |
| `/auth/refresh` | POST | `mockRefreshToken` |
| `/auth/logout` | POST | `mockLogout` |
| `/auth/userInfo` | GET | `mockGetUserInfo` |
| `/config` | GET | `mockGetAppConfig` |
| `/config/ad` | GET | `mockGetAdConfig` |
| `/config/risk` | GET | `mockGetRiskConfig` |
| `/config/channel` | GET | `mockGetChannelConfig` |
| `/ad/request` | POST | `mockAdRequest` |
| `/ad/show` | POST | `mockAdShow` |
| `/ad/click` | POST | `mockAdClick` |
| `/ad/complete` | POST | `mockAdComplete` |
| `/ad/skip` | POST | `mockAdSkip` |
| `/ad/close` | POST | `mockAdClose` |
| `/ad/batchReport` | POST | `mockBatchReport` |
| `/ad/revenue` | GET | `mockGetUserRevenue` |
| `/ad/history` | GET | `mockGetAdHistory` |
| `/user/device` | POST | `mockReportDevice` |

## 🔍 验证Mock拦截

### 运行测试
```javascript
// 运行完整测试
const result = await testMockInterception();
console.log(result);
```

### 预期结果
```
✅ Mock拦截测试成功！所有 15 个API调用都被Mock拦截，没有发送网络请求。
⏱️ 总耗时: 2340ms

📋 测试结果汇总:
  📁 认证 (2/2)
    ✅ 微信登录 (156ms)
    ✅ 获取用户信息 (234ms)
    
  📁 配置 (4/4)
    ✅ 应用配置 (345ms)
    ✅ 广告配置 (123ms)
    ✅ 风控配置 (267ms)
    ✅ 渠道配置 (189ms)
    
  📁 广告 (7/7)
    ✅ Banner广告请求 (234ms)
    ✅ 视频广告请求 (345ms)
    ✅ 广告展示上报 (123ms)
    ✅ 广告点击上报 (156ms)
    ✅ 广告完播上报 (234ms)
    ✅ 收益数据获取 (189ms)
    ✅ 广告历史获取 (267ms)
```

## 🎮 开发者控制台命令

在开发环境下，以下命令可在浏览器控制台中使用：

### Mock模式控制
```javascript
enableMock()        // 启用Mock模式
disableMock()       // 禁用Mock模式
toggleMock()        // 切换Mock模式
setMockUser(0|1)    // 设置用户状态
getMockStatus()     // 查看Mock状态
getMockDebug()      // 查看调试信息
```

### 测试工具
```javascript
testMockInterception()    // 测试Mock拦截
testMockModeToggle()      // 测试模式切换
```

## 🔧 故障排除

### 1. 仍有网络请求
```javascript
// 检查Mock状态
const status = getMockStatus();
console.log('Mock启用:', status.enabled);

// 强制启用Mock
await enableMock();

// 运行拦截测试
await testMockInterception();
```

### 2. Mock数据不正确
```javascript
// 检查Mock服务状态
const debug = getMockDebug();
console.log(debug);

// 重置Mock设置
mockModeController.resetOverrides();
```

### 3. 配置文件不生效
- 确保 `src/config/appSettings.json` 文件存在
- 检查JSON格式是否正确
- 重启应用以重新加载配置

## 🎉 优势特点

### ✅ 完全拦截
- 在API客户端层面拦截，确保100%覆盖
- 支持所有HTTP方法 (GET, POST, PUT, DELETE)
- 自动映射到对应的Mock方法

### ✅ 灵活配置
- 支持配置文件和运行时动态切换
- 可以单独控制每个功能模块
- 支持不同的用户状态模拟

### ✅ 开发友好
- 丰富的控制台命令
- 详细的测试和调试工具
- 清晰的日志输出

### ✅ 生产安全
- 生产环境默认禁用Mock
- 不影响真实API的性能
- 可以快速切换到真实API

## 📝 总结

现在你可以：

1. **通过配置文件一键切换** - 修改 `appSettings.json` 中的 `mockMode.enabled`
2. **通过命令动态切换** - 使用 `enableMock()` / `disableMock()`
3. **完全拦截网络请求** - 所有API调用都会被Mock拦截
4. **实时验证拦截效果** - 使用 `testMockInterception()` 验证

Mock模式现在完全可控，确保开发环境下零网络请求！