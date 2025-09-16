# 需求文档

## 介绍

本项目旨在基于现有的丁丁猫 React Native 应用，集成完整的后端 API 系统，实现微信登录与自动注册、服务器配置下发、风控配置与校验、广告播放与统计上报等核心功能。应用需严格遵循 API.md 中定义的接口路径、参数和响应格式，确保功能完整性与一致性。

## 需求

### 需求 1

**用户故事：** 作为用户，我希望能够通过微信登录应用，以便快速完成身份验证和账户创建。

#### 验收标准

1. WHEN 用户点击微信登录按钮 THEN 系统 SHALL 调用微信授权获取授权码
2. WHEN 获取到微信授权码 THEN 系统 SHALL 调用 /auth/wechat/login 接口进行登录验证
3. IF 用户不存在 THEN 系统 SHALL 自动调用 /auth/wechat/register 接口注册新用户
4. WHEN 注册新用户 THEN 系统 SHALL 为用户随机生成昵称（格式：user_xxxx）
5. WHEN 登录或注册成功 THEN 系统 SHALL 返回访问令牌和用户信息并本地存储

### 需求 2

**用户故事：** 作为开发者，我希望应用能够获取并缓存服务器下发的配置，以便确保广告加载所需配置与服务端保持一致。

#### 验收标准

1. WHEN 应用启动 THEN 系统 SHALL 调用 /config 接口获取应用基础配置
2. WHEN 需要广告配置 THEN 系统 SHALL 调用 /config/ad 接口获取广告位配置
3. WHEN 需要渠道信息 THEN 系统 SHALL 调用 /config/channel 接口获取渠道配置
4. WHEN 获取配置成功 THEN 系统 SHALL 在本地缓存配置信息
5. WHEN 检查配置更新 THEN 系统 SHALL 定期检查版本号并更新本地缓存

### 需求 3

**用户故事：** 作为系统管理员，我希望应用能够执行风控配置与校验，以便防止异常行为和保护系统安全。

#### 验收标准

1. WHEN 应用启动 THEN 系统 SHALL 调用 /config/risk 获取风控配置
2. WHEN 检测设备环境 THEN 系统 SHALL 执行 ROOT/模拟器检测（rootDetection, simulatorDetection）
3. WHEN 用户请求广告 THEN 系统 SHALL 检查广告间隔时间（adIntervalCheck）
4. WHEN 计算收益 THEN 系统 SHALL 验证单次收益金额限制（singleRevenueLimit）
5. WHEN 统计观看次数 THEN 系统 SHALL 检查每日激励视频观看次数限制（dailyRewardVideoLimit）
6. WHEN 检查用户活动 THEN 系统 SHALL 验证同IP在线用户数限制（ipOnlineLimit）
7. WHEN 统计广告观看 THEN 系统 SHALL 检查每日广告观看次数限制（dailyAdViewLimit）
8. IF 违反风控规则 THEN 系统 SHALL 拒绝请求并显示相应提示

### 需求 4

**用户故事：** 作为用户，我希望应用能够正确处理广告播放流程，以便获得相应的收益奖励。

#### 验收标准

1. WHEN 用户请求观看广告 THEN 系统 SHALL 调用 /ad/request 接口请求广告内容
2. WHEN 广告开始播放 THEN 系统 SHALL 调用 /ad/show 接口上报播放开始事件
3. WHEN 用户点击广告 THEN 系统 SHALL 调用 /ad/click 接口上报点击事件
4. WHEN 广告播放完成 THEN 系统 SHALL 调用 /ad/complete 接口上报完播事件并获取奖励金额
5. WHEN 用户跳过广告 THEN 系统 SHALL 调用 /ad/skip 接口上报跳过事件
6. WHEN 广告关闭 THEN 系统 SHALL 调用 /ad/close 接口上报关闭事件

### 需求 5

**用户故事：** 作为开发者，我希望应用能够支持离线数据批量同步，以便确保数据完整性和网络异常时的数据不丢失。

#### 验收标准

1. WHEN 网络异常时 THEN 系统 SHALL 将广告播放数据存储在本地队列
2. WHEN 网络恢复 THEN 系统 SHALL 调用 /ad/batchReport 接口批量上报离线数据
3. WHEN 上报数据 THEN 系统 SHALL 确保包含完整参数（userId、appKey、adId、adType、时间戳、IP等）
4. WHEN 批量上报成功 THEN 系统 SHALL 清除本地已上报的数据
5. WHEN 批量上报失败 THEN 系统 SHALL 保留数据并在下次网络可用时重试

### 需求 6

**用户故事：** 作为用户，我希望能够查看我的收益信息和观看历史，以便了解我的广告观看收益情况。

#### 验收标准

1. WHEN 用户查看收益页面 THEN 系统 SHALL 调用 /ad/revenue 接口获取用户收益统计
2. WHEN 显示收益信息 THEN 系统 SHALL 展示总收益、今日收益、观看次数等统计数据
3. WHEN 用户查看历史记录 THEN 系统 SHALL 调用 /ad/history 接口获取观看历史
4. WHEN 显示历史记录 THEN 系统 SHALL 支持分页加载和按类型筛选
5. WHEN 数据加载失败 THEN 系统 SHALL 显示相应的错误提示

### 需求 7

**用户故事：** 作为系统，我希望能够收集和上报设备信息，以便进行风控检测和用户行为分析。

#### 验收标准

1. WHEN 应用首次启动 THEN 系统 SHALL 收集设备基本信息（型号、系统版本、设备ID等）
2. WHEN 收集设备信息 THEN 系统 SHALL 检测设备是否ROOT/越狱和是否为模拟器
3. WHEN 设备信息收集完成 THEN 系统 SHALL 调用 /user/device 接口上报设备信息
4. WHEN 设备环境发生变化 THEN 系统 SHALL 更新并重新上报设备信息
5. WHEN 上报失败 THEN 系统 SHALL 在下次启动时重试上报

### 需求 8

**用户故事：** 作为开发者，我希望应用能够处理各种异常情况，以便提供稳定可靠的用户体验。

#### 验收标准

1. WHEN 网络请求失败 THEN 系统 SHALL 显示友好的错误提示并提供重试选项
2. WHEN 令牌过期 THEN 系统 SHALL 自动使用刷新令牌获取新的访问令牌
3. WHEN 风控拦截 THEN 系统 SHALL 显示相应的风控提示信息
4. WHEN 服务器错误 THEN 系统 SHALL 记录错误日志并显示通用错误提示
5. WHEN 参数错误 THEN 系统 SHALL 检查并修正请求参数后重试
6. WHEN 应用崩溃 THEN 系统 SHALL 记录崩溃日志并在下次启动时上报

### 需求 9

**用户故事：** 作为用户，我希望应用界面简洁易用，以便快速完成广告观看和收益查看操作。

#### 验收标准

1. WHEN 用户打开应用 THEN 系统 SHALL 显示清晰的主界面包含广告观看和收益查看入口
2. WHEN 用户进行广告观看 THEN 系统 SHALL 显示加载状态和进度提示
3. WHEN 广告播放完成 THEN 系统 SHALL 显示获得的收益金额
4. WHEN 用户查看收益 THEN 系统 SHALL 以图表或列表形式展示收益数据
5. WHEN 操作完成 THEN 系统 SHALL 提供明确的成功或失败反馈