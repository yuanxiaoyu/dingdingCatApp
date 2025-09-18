# Mock配置快速指南

## 概述

丁丁猫应用支持通过环境变量来控制Mock功能，让开发和测试更加便捷。

## 快速开始

### 方法一：使用配置脚本 (推荐)

```bash
# 运行交互式配置脚本
npm run mock:setup
```

### 方法二：使用快捷命令

```bash
# 设置为登录状态 (显示开屏广告流程)
npm run mock:login

# 设置为未登录状态 (显示登录页面)
npm run mock:logout

# 关闭Mock模式 (使用真实API)
npm run mock:disable
```

### 方法三：手动创建.env文件

```bash
# 创建.env文件
cp .env.example .env

# 编辑.env文件，设置所需配置
```

## 环境变量说明

### MOCK_ENABLED
控制是否启用Mock功能

- `1`: 启用Mock模式，所有API调用使用模拟数据
- `0`: 关闭Mock模式，使用真实API

### MOCK_USER_STATE
控制模拟的用户登录状态 (仅在MOCK_ENABLED=1时有效)

- `0`: 未登录状态
  - 应用启动后直接显示微信登录页面
  - 适合测试登录流程
  
- `1`: 登录状态
  - 应用启动后根据广告配置决定是否显示开屏广告
  - 适合测试开屏广告流程和主应用功能

## 配置示例

### 测试登录流程
```bash
MOCK_ENABLED=1
MOCK_USER_STATE=0
```
效果：应用启动 → 显示登录页面

### 测试开屏广告流程
```bash
MOCK_ENABLED=1
MOCK_USER_STATE=1
```
效果：应用启动 → 显示开屏广告 → 进入主页

### 使用真实API
```bash
MOCK_ENABLED=0
MOCK_USER_STATE=1  # 此值在Mock关闭时无效
```
效果：使用真实的微信登录和API接口

## 开发工具

应用内置了开发工具面板，可以：

1. 在主页右上角点击🛠️按钮
2. 查看当前环境变量配置
3. 查看Mock服务状态
4. 测试不同的应用流程

## 注意事项

### 优先级
- 环境变量配置优先级最高
- 如果设置了环境变量，应用内的手动设置将被忽略

### 生效时机
- 修改.env文件后需要重启应用
- 环境变量在应用启动时读取

### 调试信息
开发模式下，控制台会输出详细的Mock状态信息：

```javascript
// 查看当前配置
console.log('Mock enabled:', ENV_CONFIG.MOCK_ENABLED);
console.log('Mock user state:', ENV_CONFIG.MOCK_USER_STATE);

// 使用测试工具
await MockFlowTester.testEnvironmentConfig();
```

## 故障排除

### 配置不生效
1. 确认.env文件在项目根目录
2. 确认文件格式正确 (无BOM，使用=号分隔)
3. 重启应用和开发服务器

### Mock模式未启用
1. 检查MOCK_ENABLED是否设置为1
2. 查看开发工具面板中的环境变量显示
3. 检查控制台是否有相关错误信息

### 状态不符合预期
1. 确认MOCK_USER_STATE设置正确
2. 使用开发工具测试应用流程
3. 查看控制台的流程日志

## 最佳实践

### 开发阶段
```bash
# 主要测试登录流程
MOCK_ENABLED=1
MOCK_USER_STATE=0

# 主要测试应用功能
MOCK_ENABLED=1
MOCK_USER_STATE=1
```

### 集成测试
```bash
# 测试真实API集成
MOCK_ENABLED=0
```

### 演示环境
```bash
# 展示完整流程
MOCK_ENABLED=1
MOCK_USER_STATE=1
```

## 相关文件

- `.env.example`: 环境变量配置示例
- `scripts/setup-mock.js`: 交互式配置脚本
- `src/config/env.ts`: 环境变量定义
- `docs/MOCK_DEVELOPMENT_GUIDE.md`: 详细开发指南