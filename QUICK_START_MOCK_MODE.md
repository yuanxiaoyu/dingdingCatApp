# Mock模式快速使用指南

## 🚀 立即开始

### 1. 启用Mock模式（配置文件方式）

编辑 `src/config/appSettings.json`：
```json
{
  \"mockMode\": {
    \"enabled\": true
  }
}
```

### 2. 启用Mock模式（命令方式）

在开发者控制台运行：
```javascript
enableMock()
```

### 3. 验证Mock模式

```javascript
// 快速检查
quickStatusCheck()

// 完整验证
runFinalMockVerification()
```

## 🎮 常用命令

```javascript
// Mock模式控制
enableMock()        // 启用Mock
disableMock()       // 禁用Mock
toggleMock()        // 切换Mock
getMockStatus()     // 查看状态

// 用户状态控制
setMockUser(1)      // 设置为已登录
setMockUser(0)      // 设置为未登录

// 测试工具
testMockInterception()     // 测试拦截
runFinalMockVerification() // 完整验证
quickStatusCheck()         // 快速检查
```

## ✅ 预期结果

启用Mock模式后，你应该看到：

### 控制台日志
```
🎭 [Mock] 拦截API请求: GET:/config
🎭 [Mock] 拦截API请求: POST:/auth/wechat/login
🎭 [Mock] 拦截API请求: GET:/ad/revenue
```

### 验证结果
```
✅ Mock拦截测试成功！所有 15 个API调用都被Mock拦截，没有发送网络请求。
```

## 🔧 故障排除

### 问题：仍有网络请求
```javascript
// 1. 检查状态
getMockStatus()

// 2. 强制启用
enableMock()

// 3. 重新验证
runFinalMockVerification()
```

### 问题：Mock数据不对
```javascript
// 检查用户状态
setMockUser(1)  // 确保已登录状态
```

### 问题：配置不生效
- 重启应用
- 检查 `appSettings.json` 格式
- 使用命令方式强制启用

## 🎯 一键切换真实API

### 方法1：修改配置文件
```json
{
  \"mockMode\": {
    \"enabled\": false
  }
}
```

### 方法2：使用命令
```javascript
disableMock()
```

重启应用后即可使用真实API。

## 📱 应用功能验证

启用Mock模式后，以下功能应该正常工作：
- ✅ 用户登录
- ✅ 首页数据加载
- ✅ 广告展示
- ✅ 收益数据
- ✅ 配置加载

所有数据都来自Mock服务，无需网络连接！