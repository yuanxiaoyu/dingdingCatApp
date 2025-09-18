# 更新日志 / Changelog

## [1.1.0] - 2024-01-XX

### 新增功能 / Added
- ✨ **环境变量控制Mock功能**: 通过 `MOCK_ENABLED` 和 `MOCK_USER_STATE` 环境变量控制Mock行为
- 🛠️ **交互式配置脚本**: 新增 `npm run mock:setup` 命令进行可视化配置
- ⚡ **快捷配置命令**: 
  - `npm run mock:login` - 快速设置登录状态
  - `npm run mock:logout` - 快速设置未登录状态  
  - `npm run mock:disable` - 关闭Mock模式
- 🧪 **配置测试工具**: `npm run mock:test` 验证环境变量配置
- 📊 **增强的开发工具**: 显示环境变量状态和优先级说明

### 改进 / Improved
- 🔧 **简化Mock配置**: 不再依赖复杂的条件判断，直接使用环境变量
- 📱 **更直观的状态控制**: 
  - `MOCK_USER_STATE=0` → 未登录状态 → 显示登录页面
  - `MOCK_USER_STATE=1` → 登录状态 → 显示开屏广告流程
- 🎯 **优先级明确**: 环境变量 > 手动设置 > 默认值
- 📝 **完善的文档**: 新增快速配置指南和最佳实践

### 技术细节 / Technical Details
- 🏗️ **环境变量集成**: 在 `src/config/env.ts` 中集成环境变量读取
- 🔄 **服务更新**: 
  - `MockService`: 支持环境变量优先级
  - `AppFlowManager`: 基于环境变量决定应用流程
  - `AuthService`: 环境变量控制的Mock登录
- 🛠️ **开发工具**: 实时显示环境变量和Mock状态
- 📋 **配置脚本**: 自动化的配置管理和验证

### 使用示例 / Usage Examples

#### 快速开始
```bash
# 测试登录流程
npm run mock:logout

# 测试开屏广告流程  
npm run mock:login

# 使用真实API
npm run mock:disable

# 交互式配置
npm run mock:setup
```

#### 手动配置
```bash
# .env 文件
MOCK_ENABLED=1          # 开启Mock模式
MOCK_USER_STATE=1       # 设置为登录状态
```

### 向后兼容 / Backward Compatibility
- ✅ 完全向后兼容现有的Mock功能
- ✅ 保留原有的开发工具界面
- ✅ 支持手动状态切换 (当未设置环境变量时)

---

## [1.0.0] - 2024-01-XX

### 初始版本 / Initial Release
- 🎉 **开屏广告流程**: 完整的开屏广告展示和控制逻辑
- 🔧 **Mock服务**: 开发环境下的数据模拟功能
- 📱 **应用流程管理**: 智能的启动流程控制
- 🛠️ **开发工具**: 可视化的Mock状态管理
- 📚 **完整文档**: 详细的开发和使用指南