# 设计文档

## 概述

本设计文档描述了如何在现有的丁丁猫 React Native 应用基础上，集成完整的后端 API 系统。设计将严格遵循 API.md 中定义的接口规范，实现微信登录、配置管理、风控校验、广告统计等核心功能，构建一个完整的广告收益管理应用。

**设计决策理由**: 基于现有的 Pangle SDK 集成基础，扩展应用功能以支持完整的后端 API 集成，确保数据一致性和用户体验的连贯性。

## 架构

### 整体架构
```
丁丁猫广告收益管理应用
├── 表现层 (Presentation Layer)
│   ├── 登录界面 (LoginScreen)
│   ├── 主界面 (HomeScreen) 
│   ├── 收益界面 (RevenueScreen)
│   ├── 历史记录界面 (HistoryScreen)
│   └── 设置界面 (SettingsScreen)
├── 业务逻辑层 (Business Logic Layer)
│   ├── 认证服务 (AuthService)
│   ├── 配置服务 (ConfigService)
│   ├── 风控服务 (RiskControlService)
│   ├── 广告服务 (AdService)
│   └── 数据同步服务 (SyncService)
├── 数据访问层 (Data Access Layer)
│   ├── API 客户端 (ApiClient)
│   ├── 本地存储 (LocalStorage)
│   └── 离线队列 (OfflineQueue)
└── 原生集成层 (Native Integration Layer)
    ├── 微信 SDK 集成
    ├── 穿山甲 SDK 集成
    └── 设备信息收集
```

### 技术栈
- **前端框架**: React Native 0.72+
- **状态管理**: Redux Toolkit + RTK Query
- **本地存储**: AsyncStorage + SQLite (离线数据)
- **网络请求**: Axios + 自动重试机制
- **微信集成**: react-native-wechat-lib
- **设备信息**: react-native-device-info
- **加密存储**: react-native-keychain (令牌存储)

**设计决策理由**: 选择成熟稳定的技术栈，RTK Query 提供强大的缓存和同步能力，SQLite 确保离线数据的可靠存储。

### 广告类型配置

应用支持以下4种广告类型，严格按照穿山甲SDK规范实现：

#### 1. 开屏广告 (Splash Ad)
- **类型标识**: `splash`
- **展示时机**: 应用启动时
- **特点**: 全屏展示，支持跳过
- **收益模式**: 展示完成即可获得收益
- **技术实现**: 基于现有SplashAdManager

#### 2. 视频激励广告 (Reward Video Ad)  
- **类型标识**: `video`
- **展示时机**: 用户主动点击观看
- **特点**: 必须观看完整视频才能获得奖励
- **收益模式**: 完播后获得最高收益
- **技术实现**: 基于现有RewardVideoAdManager

#### 3. 插屏广告 (Interstitial Ad)
- **类型标识**: `interstitial`  
- **展示时机**: 应用内特定时机弹出
- **特点**: 全屏展示，可点击跳转
- **收益模式**: 展示和点击都有收益
- **技术实现**: 基于现有InterstitialAdManager

#### 4. Banner广告 (Banner Ad)
- **类型标识**: `banner`
- **展示时机**: 页面底部或顶部常驻
- **特点**: 小尺寸，不影响用户操作
- **收益模式**: 展示时长和点击获得收益
- **技术实现**: 基于现有BannerAdManager

**设计决策理由**: 限制为4种核心广告类型，确保每种类型都能得到充分优化和测试，提供稳定的用户体验和收益效果。

## 组件和接口

### 核心服务组件

#### AuthService (认证服务)
- **功能**: 处理微信登录、用户注册、令牌管理
- **主要方法**:
  - `wechatLogin()`: 微信登录流程
  - `autoRegister(wechatInfo)`: 自动注册新用户
  - `refreshToken()`: 刷新访问令牌
  - `logout()`: 用户登出
  - `getUserInfo()`: 获取用户信息
- **API 集成**:
  - POST /auth/wechat/login
  - POST /auth/wechat/register  
  - POST /auth/refresh
  - POST /auth/logout
  - GET /auth/userInfo

#### ConfigService (配置服务)
- **功能**: 管理应用配置、广告配置、渠道配置的获取和缓存
- **主要方法**:
  - `getAppConfig()`: 获取应用基础配置
  - `getAdConfig()`: 获取广告配置
  - `getChannelConfig()`: 获取渠道配置
  - `getRiskConfig()`: 获取风控配置
  - `checkConfigVersion()`: 检查配置版本更新
- **API 集成**:
  - GET /config?appKey={appKey}
  - GET /config/ad?appKey={appKey}
  - GET /config/channel?appKey={appKey}
  - GET /config/risk?appKey={appKey}

#### RiskControlService (风控服务)
- **功能**: 执行各种风控检测和校验
- **主要方法**:
  - `detectDeviceEnvironment()`: 设备环境检测
  - `checkAdInterval(lastAdTime)`: 广告间隔检测
  - `validateRevenueLimit(amount)`: 收益限制校验
  - `checkDailyLimits(userId)`: 每日限制检查
  - `validateIpLimits(ipAddress)`: IP限制校验
- **检测规则**:
  - ROOT/模拟器检测
  - 广告间隔时间校验
  - 单次收益金额限制
  - 每日观看次数限制
  - 同IP用户数限制

#### AdService (广告服务)
- **功能**: 处理广告请求、播放统计、收益计算
- **主要方法**:
  - `requestSplashAd()`: 请求开屏广告
  - `requestRewardVideoAd()`: 请求视频激励广告
  - `requestInterstitialAd()`: 请求插屏广告
  - `requestBannerAd()`: 请求Banner广告
  - `reportAdShow(adId, adType)`: 上报广告展示
  - `reportAdClick(adId, adType)`: 上报广告点击
  - `reportAdComplete(adId, adType, playData)`: 上报广告完播
  - `reportAdSkip(adId, adType, playData)`: 上报广告跳过
  - `reportAdClose(adId, adType, playData)`: 上报广告关闭
  - `getUserRevenue()`: 获取用户收益
  - `getAdHistory(adType?)`: 获取观看历史（可按类型筛选）
- **API 集成**:
  - POST /ad/request
  - POST /ad/show
  - POST /ad/click
  - POST /ad/complete
  - POST /ad/skip
  - POST /ad/close
  - POST /ad/batchReport
  - GET /ad/revenue
  - GET /ad/history

#### SyncService (数据同步服务)
- **功能**: 管理离线数据存储和批量同步
- **主要方法**:
  - `queueOfflineData(data)`: 离线数据入队
  - `syncOfflineData()`: 同步离线数据
  - `batchReportAds(dataList)`: 批量上报广告数据
  - `clearSyncedData()`: 清除已同步数据
- **存储结构**:
  - SQLite 表存储离线广告数据
  - 自动重试机制
  - 数据完整性校验

### UI 组件设计

#### LoginScreen (登录界面)
- **功能**: 微信登录入口，用户身份验证
- **组件结构**:
  - 应用 Logo 和标题
  - 微信登录按钮
  - 登录状态指示器
  - 错误提示组件
- **状态管理**:
  - 登录加载状态
  - 错误信息显示
  - 自动跳转逻辑

#### HomeScreen (主界面)
- **功能**: 应用主入口，广告观看和收益查看
- **组件结构**:
  - 用户信息卡片（头像、昵称、今日收益）
  - 广告观看区域（4种广告类型按钮）
    - 开屏广告按钮
    - 视频激励广告按钮
    - 插屏广告按钮
    - Banner广告按钮
  - 快速统计卡片（总收益、观看次数）
  - 底部导航栏
- **交互逻辑**:
  - 广告按钮点击处理
  - 实时收益更新
  - 风控状态提示

#### RevenueScreen (收益界面)
- **功能**: 详细收益统计和数据展示
- **组件结构**:
  - 收益概览卡片
  - 收益趋势图表
  - 统计数据列表
  - 提现按钮（预留）
- **数据展示**:
  - 总收益、今日收益、昨日收益
  - 周收益、月收益统计
  - 平均每次观看收益
  - 剩余观看次数

#### HistoryScreen (历史记录界面)
- **功能**: 广告观看历史记录查看
- **组件结构**:
  - 筛选器（日期、广告类型）
  - 历史记录列表
  - 分页加载组件
  - 详情弹窗
- **功能特性**:
  - 下拉刷新
  - 上拉加载更多
  - 按类型筛选
  - 详情查看

## 数据模型

### 用户数据模型
```typescript
interface User {
  userId: number;
  userName: string;
  nickName: string;
  avatar: string;
  phoneNumber?: string;
  email?: string;
  wechatOpenId: string;
  appKey: string;
  registerTime: string;
  lastLoginTime: string;
}
```

### 配置数据模型
```typescript
interface AppConfig {
  appKey: string;
  appName: string;
  wechatAppId: string;
  serverTime: number;
  configVersion: string;
  channels: Channel[];
}

interface AdConfig {
  appKey: string;
  configVersion: string;
  adInterval: number;
  singleRewardLimit: number;
  dailyRewardVideoLimit: number;
  dailyAdViewLimit: number;
  adTypeConfig: string; // "splash,video,interstitial,banner"
  // 各广告类型的配置
  splashAdConfig: {
    enabled: boolean;
    adId: string;
    timeout: number;
  };
  rewardVideoAdConfig: {
    enabled: boolean;
    adId: string;
    minPlayDuration: number;
  };
  interstitialAdConfig: {
    enabled: boolean;
    adId: string;
    showInterval: number;
  };
  bannerAdConfig: {
    enabled: boolean;
    adId: string;
    position: 'top' | 'bottom';
    autoRefresh: boolean;
  };
}

interface RiskConfig {
  appKey: string;
  configVersion: string;
  rootDetectionEnabled: boolean;
  emulatorDetectionEnabled: boolean;
  adIntervalCheckEnabled: boolean;
  adIntervalSeconds: number;
  sameIpUserLimit: number;
  dailyRewardVideoLimit: number;
  singleRevenueLimit: number;
}
```

### 广告数据模型
```typescript
// 支持的广告类型枚举
enum AdType {
  SPLASH = 'splash',        // 开屏广告
  REWARD_VIDEO = 'video',   // 视频激励广告
  INTERSTITIAL = 'interstitial', // 插屏广告
  BANNER = 'banner'         // Banner广告
}

interface AdRequest {
  userId: number;
  appKey: string;
  adType: AdType;
  channelCode?: string;
  deviceType: string;
  ipAddress?: string;
}

interface AdResponse {
  adId: string;
  adType: AdType;
  adTitle: string;
  adVideoUrl?: string;
  adImageUrl?: string;
  expectedReward: number;
  configParams: AdConfigParams;
}

interface AdPlayData {
  adId: string;
  adType: AdType;
  playDuration: number;
  isClicked: boolean;
  isSkipped: boolean;
  stayDuration?: number;
  timestamp: number;
}
```

### 离线数据模型
```typescript
interface OfflineAdData {
  id: string;
  userId: number;
  appKey: string;
  adId: string;
  adType: AdType;
  eventType: 'show' | 'click' | 'complete' | 'skip' | 'close';
  playData: AdPlayData;
  timestamp: number;
  synced: boolean;
  retryCount: number;
}
```

## 错误处理

### 错误分类和处理策略

#### 网络错误
- **超时错误**: 自动重试 3 次，指数退避
- **连接错误**: 显示网络异常提示，提供重试按钮
- **DNS 错误**: 检查网络设置提示

#### API 错误
- **401 未授权**: 自动刷新令牌，失败则跳转登录
- **403 风控拦截**: 显示风控提示，说明违规原因
- **429 限流**: 显示请求频繁提示，自动延迟重试
- **400 参数错误**: 记录错误日志，修正参数重试
- **500 服务器错误**: 显示服务异常提示，稍后重试

#### 业务错误
- **微信登录失败**: 显示登录失败原因，提供重试
- **广告加载失败**: 显示广告暂不可用，记录失败原因
- **风控检测失败**: 显示具体风控规则违规提示
- **收益计算错误**: 显示收益异常提示，联系客服

#### 数据错误
- **配置解析失败**: 使用默认配置，后台重新获取
- **本地数据损坏**: 清除损坏数据，重新初始化
- **同步数据冲突**: 以服务端数据为准，更新本地

### 错误恢复机制
```typescript
interface ErrorRecovery {
  // 自动重试配置
  retryConfig: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  
  // 降级策略
  fallbackStrategy: {
    useCache: boolean;
    showOfflineMode: boolean;
    disableFeature: boolean;
  };
  
  // 用户提示
  userNotification: {
    showError: boolean;
    errorMessage: string;
    actionButton?: string;
  };
}
```

## 测试策略

### 单元测试
- **服务层测试**: 测试各个服务的核心方法
- **工具函数测试**: 测试数据处理、验证函数
- **组件测试**: 测试 UI 组件的渲染和交互

### 集成测试
- **API 集成测试**: 测试与后端 API 的完整交互流程
- **微信 SDK 测试**: 测试微信登录和授权流程
- **穿山甲 SDK 测试**: 测试广告加载和播放流程
- **数据同步测试**: 测试离线数据存储和同步

### 端到端测试
- **用户登录流程**: 完整的微信登录到主界面流程
- **广告观看流程**: 从请求广告到收益到账的完整流程
- **配置更新流程**: 配置版本检查和更新流程
- **风控触发流程**: 各种风控规则的触发和处理

### 性能测试
- **启动性能**: 应用冷启动和热启动时间
- **内存使用**: 长时间使用的内存泄漏检测
- **网络性能**: API 请求响应时间和成功率
- **离线性能**: 大量离线数据的存储和同步性能

## 安全设计

### 数据安全
- **令牌存储**: 使用 Keychain 安全存储访问令牌
- **敏感信息加密**: 本地敏感数据 AES 加密存储
- **传输安全**: 所有 API 请求使用 HTTPS
- **参数验证**: 客户端和服务端双重参数验证

### 风控安全
- **设备指纹**: 收集设备唯一标识进行风控
- **行为分析**: 监控用户操作频率和模式
- **IP 检测**: 检测异常 IP 和代理使用
- **时间校验**: 验证操作时间间隔的合理性

### 代码安全
- **代码混淆**: 发布版本进行代码混淆
- **反调试**: 添加反调试和反逆向工程保护
- **完整性校验**: 应用包完整性验证
- **运行时保护**: 检测 Hook 和注入攻击

## 性能优化

### 网络优化
- **请求合并**: 合并相关 API 请求减少网络开销
- **缓存策略**: 智能缓存配置和用户数据
- **压缩传输**: 启用 GZIP 压缩减少传输量
- **连接复用**: 使用 HTTP/2 和连接池

### 存储优化
- **数据分层**: 热数据内存缓存，冷数据本地存储
- **清理策略**: 定期清理过期缓存和日志
- **压缩存储**: 大数据使用压缩算法存储
- **索引优化**: SQLite 数据库添加合适索引

### UI 优化
- **懒加载**: 非关键组件延迟加载
- **虚拟列表**: 长列表使用虚拟滚动
- **图片优化**: 图片压缩和缓存策略
- **动画优化**: 使用原生动画提升流畅度

### 内存优化
- **对象池**: 复用频繁创建的对象
- **及时释放**: 及时释放不需要的资源
- **内存监控**: 监控内存使用情况
- **垃圾回收**: 合理触发垃圾回收

## 部署和监控

### 应用部署
- **多环境配置**: 开发、测试、生产环境配置
- **版本管理**: 语义化版本号和发布流程
- **热更新**: 支持 CodePush 热更新机制
- **灰度发布**: 分批次发布降低风险

### 监控体系
- **性能监控**: 应用性能指标实时监控
- **错误监控**: 崩溃和错误自动上报
- **用户行为**: 用户操作路径和转化率分析
- **业务监控**: 广告观看率和收益转化监控

### 日志系统
- **分级日志**: DEBUG、INFO、WARN、ERROR 分级
- **结构化日志**: JSON 格式便于分析
- **本地日志**: 关键操作本地日志记录
- **远程日志**: 错误和异常远程上报

**设计决策理由**: 完整的监控和日志体系确保应用稳定运行，快速定位和解决问题，为产品优化提供数据支持。