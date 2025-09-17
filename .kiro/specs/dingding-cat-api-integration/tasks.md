# 实施计划

- [x] 1. 项目基础设施搭建
  - 安装和配置必要的依赖包（Redux Toolkit、RTK Query、AsyncStorage、react-native-wechat-lib、react-native-device-info、react-native-keychain）
  - 配置 TypeScript 类型定义和项目结构
  - 设置开发环境和调试工具
  - _需求: 1.1, 2.1, 7.1_

- [x] 2. 创建核心数据模型和类型定义
  - 创建 src/types/index.ts 定义所有 TypeScript 接口
  - 实现 User、AdConfig、RiskConfig、AdRequest、AdResponse、AdPlayData 等数据模型
  - 定义 AdType 枚举（splash、video、interstitial、banner）
  - 创建 API 响应和错误类型定义
  - _需求: 1.5, 2.4, 3.1, 4.1_

- [x] 3. 实现 API 客户端基础架构
  - 创建 src/services/apiClient.ts 实现 HTTP 客户端
  - 配置请求拦截器添加认证头和公共参数
  - 配置响应拦截器处理通用错误和令牌刷新
  - 实现自动重试机制和网络错误处理
  - _需求: 1.2, 8.1, 8.2_

- [x] 4. 实现认证服务 (AuthService)
  - 创建 src/services/AuthService.ts 实现微信登录功能
  - 集成微信 SDK 获取授权码
  - 实现调用 /auth/wechat/login 接口的登录方法
  - 实现调用 /auth/wechat/register 接口的自动注册方法
  - 实现随机昵称生成（user_xxxx 格式）
  - 实现令牌存储和刷新机制
  - _需求: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 5. 实现配置服务 (ConfigService)
  - 创建 src/services/ConfigService.ts 实现配置管理
  - 实现调用 /config 接口获取应用基础配置
  - 实现调用 /config/ad 接口获取广告配置
  - 实现调用 /config/channel 接口获取渠道配置
  - 实现本地配置缓存和版本检查机制
  - _需求: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 6. 实现风控服务 (RiskControlService)
  - 创建 src/services/RiskControlService.ts 实现风控检测
  - 实现调用 /config/risk 接口获取风控配置
  - 实现 ROOT/模拟器检测功能
  - 实现广告间隔时间检测
  - 实现各种限制校验（收益限制、观看次数限制、IP限制）
  - 实现风控规则违规提示机制
  - _需求: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 7. 实现广告服务 (AdService)
  - 创建 src/services/AdService.ts 实现广告管理
  - 实现调用 /ad/request 接口请求4种类型广告
  - 实现调用 /ad/show 接口上报广告展示
  - 实现调用 /ad/click 接口上报广告点击
  - 实现调用 /ad/complete 接口上报广告完播并获取收益
  - 实现调用 /ad/skip 和 /ad/close 接口上报广告跳过和关闭
  - _需求: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 8. 实现离线数据同步服务 (SyncService)
  - 创建 src/services/SyncService.ts 实现数据同步
  - 配置 SQLite 数据库存储离线广告数据
  - 实现离线数据入队和本地存储
  - 实现调用 /ad/batchReport 接口批量上报功能
  - 实现网络状态监听和自动同步机制
  - _需求: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 9. 实现设备信息收集和上报
  - 创建 src/services/DeviceService.ts 实现设备信息管理
  - 集成 react-native-device-info 收集设备基本信息
  - 实现设备环境检测（ROOT、模拟器检测）
  - 实现调用 /user/device 接口上报设备信息
  - 实现设备信息变化监听和更新机制
  - _需求: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 10. 创建 Redux Store 和状态管理
  - 创建 src/store/index.ts 配置 Redux Toolkit store
  - 创建认证状态切片 (authSlice) 管理用户登录状态
  - 创建配置状态切片 (configSlice) 管理应用配置
  - 创建广告状态切片 (adSlice) 管理广告数据和状态
  - 配置 RTK Query API 切片处理服务端数据
  - _需求: 1.5, 2.4, 4.1, 6.1_

- [x] 11. 实现登录界面 (LoginScreen)
  - 创建 src/screens/LoginScreen.tsx 登录页面组件
  - 实现微信登录按钮和登录流程
  - 实现登录状态指示器和错误提示
  - 实现自动跳转到主界面的逻辑
  - 集成 AuthService 处理登录和注册
  - _需求: 1.1, 1.2, 1.3, 9.1_

- [x] 12. 实现主界面 (HomeScreen)
  - 创建 src/screens/HomeScreen.tsx 主页面组件
  - 实现用户信息卡片显示头像、昵称、今日收益
  - 实现4种广告类型按钮（开屏、视频激励、插屏、Banner）
  - 实现快速统计卡片显示总收益和观看次数
  - 集成 AdService 处理广告请求和播放
  - _需求: 4.1, 6.2, 9.1, 9.2, 9.3_

- [x] 13. 实现收益界面 (RevenueScreen)
  - 创建 src/screens/RevenueScreen.tsx 收益页面组件
  - 实现调用 /ad/revenue 接口获取收益统计
  - 实现收益概览卡片和趋势图表
  - 实现详细统计数据列表展示
  - 实现收益数据的实时更新
  - _需求: 6.1, 6.2, 9.4_

- [x] 14. 实现历史记录界面 (HistoryScreen)
  - 创建 src/screens/HistoryScreen.tsx 历史记录页面组件
  - 实现调用 /ad/history 接口获取观看历史
  - 实现筛选器支持按日期和广告类型筛选
  - 实现分页加载和下拉刷新功能
  - 实现历史记录详情查看
  - _需求: 6.3, 6.4, 6.5_

- [x] 15. 集成穿山甲广告 SDK 与 API 服务
  - 修改现有的 PangleAdModule 桥接模块
  - 集成 AdService 在广告事件回调中调用相应 API
  - 实现开屏广告与 /ad/show、/ad/complete 接口集成
  - 实现视频激励广告与完整播放流程 API 集成
  - 实现插屏广告和 Banner 广告的 API 集成
  - _需求: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 16. 实现导航和路由配置
  - 配置 React Navigation 导航系统
  - 实现登录状态路由守卫
  - 配置底部导航栏（主页、收益、历史、设置）
  - 实现页面间的数据传递和状态同步
  - _需求: 9.1_

- [x] 17. 实现错误处理和用户反馈
  - 创建 src/components/ErrorBoundary.tsx 错误边界组件
  - 实现全局错误处理和用户友好提示
  - 实现网络错误重试机制
  - 实现风控拦截提示和处理
  - 实现加载状态和成功失败反馈
  - _需求: 8.1, 8.2, 8.3, 8.4, 8.5, 9.2, 9.5_

- [x] 18. 实现应用启动和初始化流程
  - 修改 App.tsx 实现应用启动逻辑
  - 实现应用启动时的配置加载和用户认证检查
  - 实现设备信息收集和上报
  - 实现风控配置获取和初始化
  - 实现离线数据同步检查
  - _需求: 2.1, 3.1, 7.1, 5.2_

- [x] 19. 实现数据持久化和缓存策略
  - 配置 AsyncStorage 存储用户配置和缓存数据
  - 实现敏感数据加密存储（使用 Keychain）
  - 实现配置数据的版本管理和更新
  - 实现离线数据的 SQLite 存储和管理
  - _需求: 1.5, 2.4, 2.5, 5.1_

- [ ] 20. 实现应用性能优化和监控
  - 实现图片缓存和懒加载优化
  - 实现长列表虚拟滚动优化
  - 添加性能监控和错误上报
  - 实现内存泄漏检测和优化
  - _需求: 8.6_

- [ ] 21. 实现开发环境Mock功能和开屏广告流程
  - 创建Mock服务模拟登录和未登录状态
  - 实现开屏广告展示逻辑，根据服务器配置决定是否显示
  - 未登录状态：直接显示微信登录页面
  - 登录状态：先展示开屏广告，完成后进入首页
  - 集成广告配置接口(/config/ad)控制开屏广告行为
  - 实现开屏广告与穿山甲SDK的完整集成
  - _需求: 1.1, 4.1, 2.2, 9.1_

- [ ] 22. 编写单元测试和集成测试
  - 为所有服务类编写单元测试
  - 为 API 集成编写集成测试
  - 为关键 UI 组件编写组件测试
  - 为广告播放流程编写端到端测试
  - _需求: 所有需求的测试覆盖_

- [ ] 23. 应用打包和部署配置
  - 配置生产环境构建参数
  - 实现代码混淆和安全加固
  - 配置应用签名和发布流程
  - 实现热更新配置（CodePush）
  - _需求: 应用部署相关_