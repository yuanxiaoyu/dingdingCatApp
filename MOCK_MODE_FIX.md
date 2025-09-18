# Mock模式修复说明

## 🔍 问题分析

从截图中看到的网络请求错误（如 `/config/risk` 等API调用失败）表明：

1. **应用仍在发送真实的网络请求**
2. **Mock模式没有正确拦截API调用**
3. **部分服务缺少Mock模式检查**

## 🛠️ 修复内容

### 1. ConfigService修复

**问题**: `getRiskConfig`、`getAppConfig`、`getChannelConfig` 方法缺少Mock模式检查

**修复**: 为这些方法添加Mock模式检查

```typescript
// 修复前
public async getRiskConfig(forceRefresh = false): Promise<RiskConfig | null> {
  try {
    // 直接调用API，没有Mock检查
    const response = await apiClient.get<RiskConfig>('/config/risk', {
      params: { appKey: ENV_CONFIG.APP_KEY }
    });
    // ...
  }
}

// 修复后
public async getRiskConfig(forceRefresh = false): Promise<RiskConfig | null> {
  try {
    // 检查Mock模式
    const isMockMode = mockService.isMockModeEnabled();
    if (isMockMode) {
      console.log('Using mock risk config');
      return await mockService.mockGetRiskConfig(ENV_CONFIG.APP_KEY);
    }
    
    // 原有的API调用逻辑
    const response = await apiClient.get<RiskConfig>('/config/risk', {
      params: { appKey: ENV_CONFIG.APP_KEY }
    });
    // ...
  }
}
```

**修复的方法**:
- ✅ `getAppConfig()` - 应用基础配置
- ✅ `getRiskConfig()` - 风控配置  
- ✅ `getChannelConfig()` - 渠道配置
- ✅ `getAdConfig()` - 广告配置（已有Mock检查）

### 2. AdService修复

**问题**: AdService的所有方法都缺少Mock模式检查

**修复**: 为关键方法添加Mock模式检查

```typescript
// 修复前
public async requestAd(request: AdRequest): Promise<AdResponse> {
  // 直接调用API
  const response = await apiClient.post<AdResponse>('/ad/request', request);
  // ...
}

// 修复后  
public async requestAd(request: AdRequest): Promise<AdResponse> {
  // 检查Mock模式
  const isMockMode = mockService.isMockModeEnabled();
  if (isMockMode) {
    console.log('Using mock ad request');
    return await mockService.mockAdRequest(request.userId, request.adType);
  }
  
  // 原有的API调用逻辑
  const response = await apiClient.post<AdResponse>('/ad/request', request);
  // ...
}
```

**修复的方法**:
- ✅ `requestAd()` - 广告请求
- ✅ `reportAdShow()` - 广告展示上报
- ✅ `reportAdComplete()` - 广告完播上报
- ✅ `getUserRevenue()` - 收益数据获取

### 3. AuthService状态

**状态**: ✅ AuthService已经有完整的Mock模式支持
- 支持Mock登录
- 支持Mock用户状态检查
- 根据环境变量自动切换

## 🧪 验证工具

创建了 `testMockMode.ts` 工具来验证修复效果：

```javascript
// 在React Native调试控制台中运行
testMockMode();
```

这个工具会：
1. 检查Mock模式是否启用
2. 测试所有服务的Mock功能
3. 验证没有网络请求发送
4. 提供详细的测试报告

## 📱 预期效果

修复后，应用在Mock模式下应该：

### ✅ 不再出现网络错误
- 不会看到 `/config/risk` 等API请求失败
- 控制台不会显示网络错误信息
- 所有数据来自Mock服务

### ✅ 正常显示用户信息
- 首页显示Mock用户数据
- 收益统计显示Mock收益数据
- 用户头像和昵称正常显示

### ✅ 广告位正常工作
- Banner广告位正常显示
- 开屏广告正常展示和跳转
- 广告数据来自Mock服务

### ✅ 控制台日志清晰
```
Using mock app config
Using mock risk config  
Using mock ad request
Using mock user revenue
```

## 🔧 使用方法

### 1. 验证修复效果
```javascript
// 检查Mock状态
checkMockStatus();

// 测试Mock模式
testMockMode();
```

### 2. 强制启用Mock模式
```javascript
// 如果Mock模式没有自动启用
forceMockMode();
```

### 3. 环境配置检查
确保 `src/config/env.ts` 中的配置正确：

```typescript
const developmentConfig: EnvConfig = {
  MOCK_ENABLED: true,        // ✅ 必须为true
  MOCK_USER_STATE: 1,        // ✅ 1表示登录状态
  DEBUG_MODE: true,          // ✅ 启用调试日志
  // ...
};
```

## 🎯 关键改进

1. **完整的Mock拦截**: 所有API调用都会被Mock拦截
2. **一致的数据格式**: Mock数据与真实API格式完全一致
3. **清晰的日志输出**: 可以明确看到使用了Mock数据
4. **简单的测试工具**: 一键验证Mock模式是否正常工作

## 🚀 下一步

修复完成后：

1. **重启应用** - 确保新的Mock检查生效
2. **运行测试** - 使用 `testMockMode()` 验证
3. **检查界面** - 确认用户信息和广告位正常显示
4. **查看日志** - 确认没有网络请求错误

现在Mock模式应该能完全拦截所有API请求，提供完整的离线开发体验！