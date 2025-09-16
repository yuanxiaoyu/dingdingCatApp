# 丁丁猫广告收益管理系统 - APP端接口文档

## 概述

本文档描述了丁丁猫广告收益管理系统的APP端接口，包括认证、配置下发、广告播报、用户数据等功能模块。所有接口均采用RESTful API设计，使用JSON格式进行数据交换。

## 基础信息

- **基础URL**: `http://localhost:8080/api/app`
- **请求格式**: `application/json`
- **响应格式**: `application/json`
- **字符编码**: `UTF-8`

## 通用响应格式

所有接口均使用统一的响应格式：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {},
  "timestamp": 1640995200000
}
```

### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| code | Integer | 响应状态码，200表示成功，其他表示失败 |
| message | String | 响应消息 |
| data | Object | 响应数据，具体结构根据接口而定 |
| timestamp | Long | 响应时间戳 |

### 通用错误码

| 错误码 | 说明 |
|--------|------|
| 200 | 操作成功 |
| 400 | 请求参数错误 |
| 401 | 未授权访问 |
| 403 | 访问被拒绝 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

## 1. 认证接口模块

**控制器路径**: `com.dingdingcat.controller.app.AuthController`

### 1.1 微信授权登录

**接口地址**: `POST /auth/wechat/login`  
**请求方式**: `POST`  
**控制器方法**: `@PostMapping("/wechat/login")`

**接口描述**: 通过微信授权码和APP Key进行用户登录验证

**请求参数**:

```json
{
  "appKey": "your_app_key",
  "code": "wechat_auth_code"
}
```

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| appKey | String | 是 | APP唯一标识 |
| code | String | 是 | 微信授权码 |

**响应示例**:

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
    "tokenType": "Bearer",
    "expiresIn": 1800,
    "userId": 1001,
    "userName": "wx_user123",
    "nickName": "微信用户",
    "avatar": "https://wx.qlogo.cn/...",
    "appKey": "your_app_key"
  },
  "timestamp": 1640995200000
}
```

**curl示例**:

```bash
curl -X POST http://localhost:8080/api/app/auth/wechat/login \
  -H "Content-Type: application/json" \
  -d '{
    "appKey": "test_app_key_001",
    "code": "wx_auth_code_123456"
  }'
```

### 1.2 微信用户注册

**接口地址**: `POST /auth/wechat/register`  
**请求方式**: `POST`  
**控制器方法**: `@PostMapping("/wechat/register")`

**接口描述**: 通过微信授权信息注册新用户

**请求参数**:

```json
{
  "appKey": "your_app_key",
  "code": "wechat_auth_code",
  "nickName": "自定义昵称",
  "phoneNumber": "13800138000"
}
```

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| appKey | String | 是 | APP唯一标识 |
| code | String | 是 | 微信授权码 |
| nickName | String | 否 | 自定义昵称，为空则使用微信昵称 |
| phoneNumber | String | 否 | 手机号码 |

**响应示例**:

```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "userId": 1002,
    "userName": "wx_user124",
    "nickName": "自定义昵称",
    "avatar": "https://wx.qlogo.cn/...",
    "phoneNumber": "13800138000",
    "appKey": "your_app_key",
    "wechatOpenId": "oNTmH5..."
  },
  "timestamp": 1640995200000
}
```

**curl示例**:

```bash
curl -X POST http://localhost:8080/api/app/auth/wechat/register \
  -H "Content-Type: application/json" \
  -d '{
    "appKey": "test_app_key_001",
    "code": "wx_auth_code_123456",
    "nickName": "测试用户",
    "phoneNumber": "13800138000"
  }'
```

### 1.3 刷新访问令牌

**接口地址**: `POST /auth/refresh`  
**请求方式**: `POST`  
**控制器方法**: `@PostMapping("/refresh")`

**接口描述**: 使用刷新令牌获取新的访问令牌

**请求参数**:

```json
{
  "appKey": "your_app_key",
  "refreshToken": "refresh_token_string",
  "userId": "1001"
}
```

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| appKey | String | 是 | APP唯一标识 |
| refreshToken | String | 是 | 刷新令牌 |
| userId | String | 是 | 用户ID |

**响应示例**:

```json
{
  "code": 200,
  "message": "令牌刷新成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
    "tokenType": "Bearer",
    "expiresIn": 1800,
    "userId": 1001,
    "userName": "wx_user123",
    "nickName": "微信用户",
    "avatar": "https://wx.qlogo.cn/...",
    "appKey": "your_app_key"
  },
  "timestamp": 1640995200000
}
```

**curl示例**:

```bash
curl -X POST http://localhost:8080/api/app/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "appKey": "test_app_key_001",
    "refreshToken": "refresh_token_abc123",
    "userId": "1001"
  }'
```

### 1.4 用户登出

**接口地址**: `POST /auth/logout`  
**请求方式**: `POST`  
**控制器方法**: `@PostMapping("/logout")`

**接口描述**: 清除用户的访问令牌和相关缓存

**请求头**:

```
Authorization: Bearer your_access_token
```

**响应示例**:

```json
{
  "code": 200,
  "message": "登出成功",
  "data": null,
  "timestamp": 1640995200000
}
```

**curl示例**:

```bash
curl -X POST http://localhost:8080/api/app/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzUxMiJ9..."
```

### 1.5 获取用户信息

**接口地址**: `GET /auth/userInfo`  
**请求方式**: `GET`  
**控制器方法**: `@GetMapping("/userInfo")`

**接口描述**: 返回当前登录用户的详细信息

**请求头**:

```
Authorization: Bearer your_access_token
```

**响应示例**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "userId": 1001,
    "userName": "wx_user123",
    "nickName": "微信用户",
    "avatar": "https://wx.qlogo.cn/...",
    "phoneNumber": "13800138000",
    "email": "user@example.com",
    "sex": "0",
    "wechatOpenId": "oNTmH5...",
    "registerChannel": "wechat",
    "appKey": "your_app_key"
  },
  "timestamp": 1640995200000
}
```

**curl示例**:

```bash
curl -X GET http://localhost:8080/api/app/auth/userInfo \
  -H "Authorization: Bearer eyJhbGciOiJIUzUxMiJ9..."
```

## 2. 配置下发接口模块

**控制器路径**: `com.dingdingcat.controller.app.ConfigController`

### 2.1 获取APP配置信息

**接口地址**: `GET /config?appKey={appKey}`  
**请求方式**: `GET`  
**控制器方法**: `@GetMapping("")`

**接口描述**: 返回APP的基本配置信息，包括APP基本信息、微信配置、渠道和风控配置

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| appKey | String | 是 | APP唯一标识 |

**响应示例**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "appKey": "your_app_key",
    "appName": "测试APP",
    "appType": "mobile",
    "appDesc": "测试应用描述",
    "status": "0",
    "wechatAppId": "wx1234567890",
    "channelConfig": "{\"defaultChannel\":\"pangle\"}",
    "riskConfig": "{\"rootDetectionEnabled\":true}",
    "serverTime": 1640995200000,
    "configVersion": "1640995200000",
    "channels": [
      {
        "channelCode": "pangle_001",
        "channelName": "穿山甲渠道1",
        "channelType": "PANGLE",
        "status": "0"
      }
    ]
  },
  "timestamp": 1640995200000
}
```

**curl示例**:

```bash
curl -X GET "http://localhost:8080/api/app/config?appKey=test_app_key_001"
```

### 2.2 获取广告配置

**接口地址**: `GET /config/ad?appKey={appKey}`  
**请求方式**: `GET`  
**控制器方法**: `@GetMapping("/ad")`

**接口描述**: 返回APP的广告相关配置，包括广告间隔、收益限制、观看次数限制等

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| appKey | String | 是 | APP唯一标识 |

**响应示例**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "appKey": "your_app_key",
    "serverTime": 1640995200000,
    "configVersion": "1640995200000",
    "adInterval": 30,
    "adIntervalEnabled": true,
    "singleRewardLimit": 1.00,
    "singleRewardLimitEnabled": true,
    "dailyRewardVideoLimit": 100,
    "dailyRewardAmountLimit": 50.00,
    "dailyRewardLimitEnabled": true,
    "dailyAdViewLimit": 200,
    "dailyAdViewLimitEnabled": true,
    "adTypeConfig": "reward,banner,interstitial",
    "adDisplayStrategy": "auto"
  },
  "timestamp": 1640995200000
}
```

**curl示例**:

```bash
curl -X GET "http://localhost:8080/api/app/config/ad?appKey=test_app_key_001"
```

### 2.3 获取风控配置

**接口地址**: `GET /config/risk?appKey={appKey}`  
**请求方式**: `GET`  
**控制器方法**: `@GetMapping("/risk")`

**接口描述**: 返回APP的风控相关配置，包括设备检测、频率限制、IP限制等

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| appKey | String | 是 | APP唯一标识 |

**响应示例**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "appKey": "your_app_key",
    "serverTime": 1640995200000,
    "configVersion": "1640995200000",
    "rootDetectionEnabled": true,
    "emulatorDetectionEnabled": true,
    "deviceFingerprintEnabled": true,
    "adIntervalCheckEnabled": true,
    "adIntervalSeconds": 30,
    "sameIpUserLimit": 5,
    "sameIpLimitEnabled": true,
    "ipLocationCheckEnabled": false,
    "loginFrequencyLimit": 10,
    "loginFrequencyWindow": 10,
    "loginFrequencyEnabled": true,
    "blacklistCheckEnabled": true,
    "riskLevel": 2
  },
  "timestamp": 1640995200000
}
```

**curl示例**:

```bash
curl -X GET "http://localhost:8080/api/app/config/risk?appKey=test_app_key_001"
```

### 2.4 获取渠道配置

**接口地址**: `GET /config/channel?appKey={appKey}`  
**请求方式**: `GET`  
**控制器方法**: `@GetMapping("/channel")`

**接口描述**: 返回APP关联的渠道配置信息

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| appKey | String | 是 | APP唯一标识 |

**响应示例**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "appKey": "your_app_key",
    "channelConfig": "{\"defaultChannel\":\"pangle\"}",
    "serverTime": 1640995200000,
    "configVersion": "1640995200000",
    "defaultChannelCode": "pangle_001",
    "channels": [
      {
        "channelId": 1,
        "channelCode": "pangle_001",
        "channelName": "穿山甲渠道1",
        "channelType": "PANGLE",
        "channelDesc": "穿山甲广告渠道",
        "status": "0",
        "contactPerson": "张三",
        "contactPhone": "13800138000",
        "contactEmail": "zhangsan@example.com",
        "isDefault": true
      }
    ]
  },
  "timestamp": 1640995200000
}
```

**curl示例**:

```bash
curl -X GET "http://localhost:8080/api/app/config/channel?appKey=test_app_key_001"
```

## 3. 广告播报接口模块

**控制器路径**: `com.dingdingcat.controller.app.AdController`

### 3.1 请求广告

**接口地址**: `POST /ad/request`  
**请求方式**: `POST`  
**控制器方法**: `@PostMapping("/request")`

**接口描述**: 请求广告内容，返回广告信息和配置参数

**请求参数**:

```json
{
  "userId": 1001,
  "appKey": "your_app_key",
  "adType": "video",
  "channelCode": "pangle_001",
  "deviceType": "android",
  "ipAddress": "192.168.1.100"
}
```

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | Long | 是 | 用户ID |
| appKey | String | 是 | APP唯一标识 |
| adType | String | 否 | 广告类型，默认video |
| channelCode | String | 否 | 渠道编码 |
| deviceType | String | 否 | 设备类型 |
| ipAddress | String | 否 | IP地址，为空时自动获取 |

**响应示例**:

```json
{
  "code": 200,
  "message": "获取广告成功",
  "data": {
    "adId": "AD_1234567890abcdef",
    "adType": "video",
    "adTitle": "精彩广告内容",
    "adDescription": "观看完整广告获得奖励",
    "adImageUrl": "https://example.com/ad/image.jpg",
    "adVideoUrl": "https://example.com/ad/video.mp4",
    "adClickUrl": "https://example.com/ad/click",
    "adDuration": 30,
    "expectedReward": 0.01,
    "skippable": true,
    "skipWaitTime": 5,
    "configParams": {
      "minPlayDuration": 15,
      "completeRewardMultiplier": 1.0,
      "clickRewardMultiplier": 1.2,
      "adInterval": 60,
      "dailyWatchLimit": 100
    }
  },
  "timestamp": 1640995200000
}
```

**curl示例**:

```bash
curl -X POST http://localhost:8080/api/app/ad/request \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1001,
    "appKey": "test_app_key_001",
    "adType": "video",
    "channelCode": "pangle_001",
    "deviceType": "android"
  }'
```

### 3.2 广告展示回调

**接口地址**: `POST /ad/show`  
**请求方式**: `POST`  
**控制器方法**: `@PostMapping("/show")`

**接口描述**: 广告开始展示时的回调通知

**请求参数**:

```json
{
  "userId": 1001,
  "appKey": "your_app_key",
  "adId": "AD_1234567890abcdef",
  "adType": "video",
  "showTime": 1640995200000,
  "ipAddress": "192.168.1.100"
}
```

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | Long | 是 | 用户ID |
| appKey | String | 是 | APP唯一标识 |
| adId | String | 是 | 广告ID |
| adType | String | 是 | 广告类型 |
| showTime | Long | 是 | 展示时间戳 |
| ipAddress | String | 否 | IP地址 |

**响应示例**:

```json
{
  "code": 200,
  "message": "展示回调处理成功",
  "data": null,
  "timestamp": 1640995200000
}
```

**curl示例**:

```bash
curl -X POST http://localhost:8080/api/app/ad/show \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1001,
    "appKey": "test_app_key_001",
    "adId": "AD_1234567890abcdef",
    "adType": "video",
    "showTime": 1640995200000
  }'
```

### 3.3 广告点击回调

**接口地址**: `POST /ad/click`  
**请求方式**: `POST`  
**控制器方法**: `@PostMapping("/click")`

**接口描述**: 用户点击广告时的回调通知

**请求参数**:

```json
{
  "userId": 1001,
  "appKey": "your_app_key",
  "adId": "AD_1234567890abcdef",
  "adType": "video",
  "clickTime": 1640995200000,
  "clickPosition": "center",
  "ipAddress": "192.168.1.100"
}
```

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | Long | 是 | 用户ID |
| appKey | String | 是 | APP唯一标识 |
| adId | String | 是 | 广告ID |
| adType | String | 是 | 广告类型 |
| clickTime | Long | 是 | 点击时间戳 |
| clickPosition | String | 否 | 点击位置 |
| ipAddress | String | 否 | IP地址 |

**响应示例**:

```json
{
  "code": 200,
  "message": "点击回调处理成功",
  "data": null,
  "timestamp": 1640995200000
}
```

**curl示例**:

```bash
curl -X POST http://localhost:8080/api/app/ad/click \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1001,
    "appKey": "test_app_key_001",
    "adId": "AD_1234567890abcdef",
    "adType": "video",
    "clickTime": 1640995200000,
    "clickPosition": "center"
  }'
```

### 3.4 广告完播回调

**接口地址**: `POST /ad/complete`  
**请求方式**: `POST`  
**控制器方法**: `@PostMapping("/complete")`

**接口描述**: 广告播放完成时的回调通知，返回奖励金额

**请求参数**:

```json
{
  "userId": 1001,
  "appKey": "your_app_key",
  "adId": "AD_1234567890abcdef",
  "adType": "video",
  "playDuration": 30,
  "isClicked": "1",
  "stayDuration": 35,
  "completeTime": 1640995200000,
  "ipAddress": "192.168.1.100"
}
```

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | Long | 是 | 用户ID |
| appKey | String | 是 | APP唯一标识 |
| adId | String | 是 | 广告ID |
| adType | String | 是 | 广告类型 |
| playDuration | Integer | 是 | 播放时长（秒） |
| isClicked | String | 是 | 是否点击（0否1是） |
| stayDuration | Integer | 否 | 停留时长（秒） |
| completeTime | Long | 是 | 完播时间戳 |
| ipAddress | String | 否 | IP地址 |

**响应示例**:

```json
{
  "code": 200,
  "message": "完播回调处理成功",
  "data": 0.015,
  "timestamp": 1640995200000
}
```

**curl示例**:

```bash
curl -X POST http://localhost:8080/api/app/ad/complete \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1001,
    "appKey": "test_app_key_001",
    "adId": "AD_1234567890abcdef",
    "adType": "video",
    "playDuration": 30,
    "isClicked": "1",
    "stayDuration": 35,
    "completeTime": 1640995200000
  }'
```

### 3.5 广告跳过回调

**接口地址**: `POST /ad/skip`  
**请求方式**: `POST`  
**控制器方法**: `@PostMapping("/skip")`

**接口描述**: 用户跳过广告时的回调通知

**请求参数**:

```json
{
  "userId": 1001,
  "appKey": "your_app_key",
  "adId": "AD_1234567890abcdef",
  "adType": "video",
  "playDuration": 10,
  "skipTime": 1640995200000,
  "skipReason": "user_skip",
  "ipAddress": "192.168.1.100"
}
```

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | Long | 是 | 用户ID |
| appKey | String | 是 | APP唯一标识 |
| adId | String | 是 | 广告ID |
| adType | String | 是 | 广告类型 |
| playDuration | Integer | 是 | 播放时长（秒） |
| skipTime | Long | 是 | 跳过时间戳 |
| skipReason | String | 否 | 跳过原因 |
| ipAddress | String | 否 | IP地址 |

**响应示例**:

```json
{
  "code": 200,
  "message": "跳过回调处理成功",
  "data": null,
  "timestamp": 1640995200000
}
```

**curl示例**:

```bash
curl -X POST http://localhost:8080/api/app/ad/skip \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1001,
    "appKey": "test_app_key_001",
    "adId": "AD_1234567890abcdef",
    "adType": "video",
    "playDuration": 10,
    "skipTime": 1640995200000,
    "skipReason": "user_skip"
  }'
```

### 3.6 广告关闭回调

**接口地址**: `POST /ad/close`  
**请求方式**: `POST`  
**控制器方法**: `@PostMapping("/close")`

**接口描述**: 广告关闭时的回调通知

**请求参数**:

```json
{
  "userId": 1001,
  "appKey": "your_app_key",
  "adId": "AD_1234567890abcdef",
  "adType": "video",
  "playDuration": 15,
  "stayDuration": 20,
  "closeTime": 1640995200000,
  "closeReason": "user_close",
  "ipAddress": "192.168.1.100"
}
```

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | Long | 是 | 用户ID |
| appKey | String | 是 | APP唯一标识 |
| adId | String | 是 | 广告ID |
| adType | String | 是 | 广告类型 |
| playDuration | Integer | 是 | 播放时长（秒） |
| stayDuration | Integer | 否 | 停留时长（秒） |
| closeTime | Long | 是 | 关闭时间戳 |
| closeReason | String | 否 | 关闭原因 |
| ipAddress | String | 否 | IP地址 |

**响应示例**:

```json
{
  "code": 200,
  "message": "关闭回调处理成功",
  "data": null,
  "timestamp": 1640995200000
}
```

**curl示例**:

```bash
curl -X POST http://localhost:8080/api/app/ad/close \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1001,
    "appKey": "test_app_key_001",
    "adId": "AD_1234567890abcdef",
    "adType": "video",
    "playDuration": 15,
    "stayDuration": 20,
    "closeTime": 1640995200000,
    "closeReason": "user_close"
  }'
```

### 3.7 批量上报播放数据

**接口地址**: `POST /ad/batchReport`  
**请求方式**: `POST`  
**控制器方法**: `@PostMapping("/batchReport")`

**接口描述**: 批量上报多条播放数据，用于离线数据同步

**请求参数**:

```json
{
  "userId": 1001,
  "appKey": "your_app_key",
  "ipAddress": "192.168.1.100",
  "playDataList": [
    {
      "adType": "video",
      "playDuration": 30,
      "isClicked": "1",
      "isSkipped": "0",
      "stayDuration": 35
    },
    {
      "adType": "banner",
      "playDuration": 5,
      "isClicked": "0",
      "isSkipped": "1",
      "stayDuration": 8
    }
  ]
}
```

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | Long | 是 | 用户ID |
| appKey | String | 是 | APP唯一标识 |
| ipAddress | String | 否 | IP地址 |
| playDataList | Array | 是 | 播放数据列表 |

**playDataList数组元素说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| adType | String | 是 | 广告类型 |
| playDuration | Integer | 是 | 播放时长（秒） |
| isClicked | String | 是 | 是否点击（0否1是） |
| isSkipped | String | 是 | 是否跳过（0否1是） |
| stayDuration | Integer | 否 | 停留时长（秒） |

**响应示例**:

```json
{
  "code": 200,
  "message": "批量上报处理成功",
  "data": 2,
  "timestamp": 1640995200000
}
```

**curl示例**:

```bash
curl -X POST http://localhost:8080/api/app/ad/batchReport \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1001,
    "appKey": "test_app_key_001",
    "playDataList": [
      {
        "adType": "video",
        "playDuration": 30,
        "isClicked": "1",
        "isSkipped": "0",
        "stayDuration": 35
      },
      {
        "adType": "banner",
        "playDuration": 5,
        "isClicked": "0",
        "isSkipped": "1",
        "stayDuration": 8
      }
    ]
  }'
```

### 3.8 获取用户收益信息

**接口地址**: `GET /ad/revenue?userId={userId}&appKey={appKey}`  
**请求方式**: `GET`  
**控制器方法**: `@GetMapping("/revenue")`

**接口描述**: 获取用户的收益统计信息

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | Long | 是 | 用户ID |
| appKey | String | 是 | APP唯一标识 |

**响应示例**:

```json
{
  "code": 200,
  "message": "获取收益信息成功",
  "data": {
    "userId": 1001,
    "userName": "用户1001",
    "totalRevenue": 15.68,
    "totalWatchCount": 156,
    "todayRevenue": 2.35,
    "yesterdayRevenue": 1.89,
    "weekRevenue": 12.45,
    "monthRevenue": 15.68,
    "todayWatchCount": 23,
    "yesterdayWatchCount": 18,
    "weekWatchCount": 124,
    "monthWatchCount": 156,
    "remainingWatchCount": 44,
    "avgRevenuePerWatch": 0.10,
    "lastWatchTime": "2024-01-01T10:30:00Z",
    "accountStatus": "normal",
    "withdrawableAmount": 15.68,
    "frozenAmount": 0.00
  },
  "timestamp": 1640995200000
}
```

**curl示例**:

```bash
curl -X GET "http://localhost:8080/api/app/ad/revenue?userId=1001&appKey=test_app_key_001"
```

### 3.9 获取广告观看历史

**接口地址**: `GET /ad/history`  
**请求方式**: `GET`  
**控制器方法**: `@GetMapping("/history")`

**接口描述**: 获取用户的广告观看历史记录

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | Long | 是 | 用户ID |
| appKey | String | 是 | APP唯一标识 |
| pageNum | Integer | 否 | 页码，默认1 |
| pageSize | Integer | 否 | 每页大小，默认20 |
| adType | String | 否 | 广告类型筛选 |
| startDate | String | 否 | 开始日期 |
| endDate | String | 否 | 结束日期 |

**响应示例**:

```json
{
  "code": 200,
  "message": "获取观看历史成功",
  "data": {
    "total": 156,
    "pageNum": 1,
    "pageSize": 20,
    "historyList": [
      {
        "statId": 1001,
        "adId": "AD_1234567890abcdef",
        "adType": "video",
        "playDuration": 30,
        "isClicked": true,
        "isSkipped": false,
        "isCompleted": true,
        "stayDuration": 35,
        "rewardAmount": 0.015,
        "playTime": "2024-01-01T10:30:00Z",
        "deviceType": "android",
        "statusDescription": "完播"
      }
    ]
  },
  "timestamp": 1640995200000
}
```

**curl示例**:

```bash
curl -X GET "http://localhost:8080/api/app/ad/history?userId=1001&appKey=test_app_key_001&pageNum=1&pageSize=20&adType=video"
```

## 4. 用户数据接口模块

**控制器路径**: `com.dingdingcat.controller.app.UserController`

### 4.1 设备信息上报

**接口地址**: `POST /user/device`  
**请求方式**: `POST`  
**控制器方法**: `@PostMapping("/device")`

**接口描述**: 上报用户设备信息，用于风控检测和会员管理展示

**请求参数**:

```json
{
  "userId": 1001,
  "appKey": "your_app_key",
  "deviceModel": "iPhone 13",
  "deviceBrand": "Apple",
  "osName": "iOS",
  "osVersion": "15.0",
  "deviceId": "device_unique_id",
  "isRooted": false,
  "isEmulator": false,
  "screenResolution": "1170x2532",
  "screenDensity": 3.0,
  "networkType": "WiFi",
  "carrier": "中国移动",
  "totalMemory": 6144,
  "availableMemory": 3072,
  "totalStorage": 128000,
  "availableStorage": 64000,
  "cpuArch": "arm64",
  "cpuCores": 6,
  "appVersion": "1.0.0",
  "appVersionCode": 100,
  "deviceLanguage": "zh-CN",
  "deviceTimezone": "Asia/Shanghai",
  "batteryLevel": 85,
  "isCharging": false,
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "extraInfo": "{\"customField\":\"customValue\"}"
}
```

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | Long | 是 | 用户ID |
| appKey | String | 是 | APP唯一标识 |
| deviceModel | String | 是 | 设备型号 |
| deviceBrand | String | 是 | 设备品牌 |
| osName | String | 是 | 操作系统名称 |
| osVersion | String | 是 | 操作系统版本 |
| deviceId | String | 是 | 设备唯一标识 |
| isRooted | Boolean | 是 | 是否ROOT/越狱 |
| isEmulator | Boolean | 是 | 是否模拟器 |
| screenResolution | String | 否 | 屏幕分辨率 |
| screenDensity | Double | 否 | 屏幕密度 |
| networkType | String | 否 | 网络类型 |
| carrier | String | 否 | 运营商 |
| totalMemory | Long | 否 | 总内存(MB) |
| availableMemory | Long | 否 | 可用内存(MB) |
| totalStorage | Long | 否 | 总存储(MB) |
| availableStorage | Long | 否 | 可用存储(MB) |
| cpuArch | String | 否 | CPU架构 |
| cpuCores | Integer | 否 | CPU核心数 |
| appVersion | String | 否 | APP版本 |
| appVersionCode | Integer | 否 | APP版本号 |
| deviceLanguage | String | 否 | 设备语言 |
| deviceTimezone | String | 否 | 设备时区 |
| batteryLevel | Integer | 否 | 电池电量 |
| isCharging | Boolean | 否 | 是否充电中 |
| ipAddress | String | 否 | IP地址 |
| userAgent | String | 否 | 用户代理 |
| extraInfo | String | 否 | 额外信息JSON |

**响应示例**:

```json
{
  "code": 200,
  "message": "设备信息上报成功",
  "data": {
    "userId": 1001,
    "appKey": "your_app_key",
    "reportTime": 1640995200000
  },
  "timestamp": 1640995200000
}
```

**curl示例**:

```bash
curl -X POST http://localhost:8080/api/app/user/device \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1001,
    "appKey": "test_app_key_001",
    "deviceModel": "iPhone 13",
    "deviceBrand": "Apple",
    "osName": "iOS",
    "osVersion": "15.0",
    "deviceId": "device_unique_id_123",
    "isRooted": false,
    "isEmulator": false,
    "screenResolution": "1170x2532",
    "networkType": "WiFi",
    "appVersion": "1.0.0"
  }'
```

## 5. 接口调用流程说明

### 5.1 用户注册登录流程

```mermaid
sequenceDiagram
    participant App as APP客户端
    participant API as API服务器
    participant WeChat as 微信服务器
    
    App->>WeChat: 1. 获取微信授权码
    WeChat-->>App: 2. 返回授权码
    App->>API: 3. 调用微信登录接口
    API->>WeChat: 4. 验证授权码获取用户信息
    WeChat-->>API: 5. 返回用户信息
    API-->>App: 6. 返回访问令牌和用户信息
    App->>API: 7. 使用令牌调用其他接口
```

### 5.2 广告播放流程

```mermaid
sequenceDiagram
    participant App as APP客户端
    participant API as API服务器
    participant AdServer as 广告服务器
    
    App->>API: 1. 请求广告
    API-->>App: 2. 返回广告信息
    App->>API: 3. 广告展示回调
    App->>AdServer: 4. 播放广告内容
    App->>API: 5. 广告点击回调(可选)
    App->>API: 6. 广告完播/跳过/关闭回调
    API-->>App: 7. 返回奖励金额(完播时)
```

### 5.3 配置同步流程

```mermaid
sequenceDiagram
    participant App as APP客户端
    participant API as API服务器
    participant Cache as 缓存系统
    
    App->>API: 1. 获取APP配置
    API->>Cache: 2. 检查配置缓存
    Cache-->>API: 3. 返回缓存配置
    API-->>App: 4. 返回配置信息
    App->>App: 5. 本地缓存配置
    App->>API: 6. 定期检查配置版本
    API-->>App: 7. 返回最新版本号
```

## 6. 安全机制说明

### 6.1 接口限流

所有接口都实现了基于不同维度的限流机制：

- **IP级限流**: 防止单个IP过度请求
- **用户级限流**: 防止单个用户异常行为
- **广告接口特殊限流**: 对广告相关接口进行更严格的限流

### 6.2 风控检测

系统实现了多层风控检测机制：

- **设备检测**: ROOT/越狱检测、模拟器检测
- **行为检测**: 广告间隔检测、频率异常检测
- **IP风控**: 同IP多账号检测、地理位置检测
- **黑名单检测**: 用户黑名单、设备黑名单

### 6.3 数据安全

- **敏感信息保护**: 微信AppSecret等敏感信息不在接口中返回
- **参数验证**: 所有接口参数都进行严格验证
- **SQL注入防护**: 使用参数化查询防止SQL注入
- **XSS防护**: 对用户输入进行转义处理

## 7. 错误处理

### 7.1 常见错误场景

| 场景 | 错误码 | 错误信息 | 处理建议 |
|------|--------|----------|----------|
| APP Key无效 | 400 | APP不存在或已停用 | 检查APP Key是否正确 |
| 用户未登录 | 401 | 用户未登录 | 重新登录获取令牌 |
| 令牌过期 | 401 | 令牌已过期 | 使用刷新令牌获取新令牌 |
| 请求过于频繁 | 429 | 请求过于频繁，请稍后再试 | 降低请求频率 |
| 风控拦截 | 403 | 请求被风控系统拦截 | 检查设备和行为是否异常 |
| 参数错误 | 400 | 请求参数错误 | 检查参数格式和必填项 |

### 7.2 错误重试策略

建议客户端实现以下重试策略：

- **网络错误**: 指数退避重试，最多重试3次
- **服务器错误(5xx)**: 延迟重试，最多重试2次
- **限流错误(429)**: 等待指定时间后重试
- **业务错误(4xx)**: 不建议重试，需要修正请求参数

## 8. 性能优化建议

### 8.1 客户端优化

- **配置缓存**: 本地缓存配置信息，定期检查版本更新
- **批量上报**: 使用批量接口减少网络请求次数
- **请求合并**: 合并相关的接口调用
- **异步处理**: 非关键接口使用异步调用

### 8.2 网络优化

- **GZIP压缩**: 启用请求和响应压缩
- **Keep-Alive**: 使用HTTP Keep-Alive减少连接开销
- **CDN加速**: 对静态资源使用CDN加速
- **域名预解析**: 提前解析API域名

## 9. 测试环境

### 9.1 测试服务器信息

- **测试环境URL**: `http://test-api.dingdingcat.com/api/app`
- **测试APP Key**: `test_app_key_001`
- **测试用户ID**: `1001`

### 9.2 测试数据

系统提供了完整的测试数据，包括：

- 测试APP配置
- 测试用户账号
- 测试渠道信息
- 模拟广告数据

## 10. 版本更新记录

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.0.0 | 2024-01-01 | 初始版本，包含基础认证、配置、广告、用户接口 |

## 11. 联系方式

如有接口使用问题，请联系：

- **技术支持邮箱**: tech-support@dingdingcat.com
- **API文档更新**: 请关注项目仓库更新
- **问题反馈**: 请在项目Issues中提交问题

---

**注意**: 本文档基于当前系统实现编写，如有接口变更请以最新版本为准。