# 需求文档

## 介绍

本项目旨在使用 React Native 创建一个名为"丁丁猫"的应用，并在 Android 平台集成穿山甲聚合广告 SDK。该应用将严格参考穿山甲官方文档进行 SDK 集成，并创建一个首页提供各类广告的展示入口按钮。

## 需求

### 需求 1

**用户故事：** 作为开发者，我希望创建一个名为"丁丁猫"的 React Native 应用，以便为穿山甲广告 SDK 集成提供基础平台。

#### 验收标准

1. WHEN 执行项目初始化命令 THEN 系统 SHALL 创建一个名为"丁丁猫"的 React Native 项目
2. WHEN 项目创建完成 THEN 系统 SHALL 包含标准的 React Native 项目结构
3. WHEN 运行应用 THEN 系统 SHALL 能够在 Android 平台上正常启动
4. WHEN 检查项目配置 THEN 系统 SHALL 包含必要的依赖和配置文件

### 需求 2

**用户故事：** 作为开发者，我希望在 Android 平台中集成穿山甲聚合广告 SDK，以便应用能够展示广告内容。

#### 验收标准

1. WHEN 按照官方文档配置 SDK THEN 系统 SHALL 正确添加穿山甲 SDK 依赖到 Android 项目
2. WHEN 配置 Android 原生代码 THEN 系统 SHALL 正确设置 Android 项目的 gradle 配置和权限
3. WHEN 借鉴官方 Demo 实现 THEN 系统 SHALL 参考工作区中 Demo 目录下的代码进行集成
4. WHEN 初始化 SDK THEN 系统 SHALL 使用测试应用 ID: 5738209 成功初始化穿山甲广告 SDK

### 需求 3

**用户故事：** 作为开发者，我希望为应用创建一个首页，以便提供展示穿山甲各类广告的入口按钮。

#### 验收标准

1. WHEN 打开应用首页 THEN 系统 SHALL 显示一个包含所有广告类型按钮的界面
2. WHEN 界面加载 THEN 系统 SHALL 显示开屏广告、激励视频广告、新插屏广告、Banner 广告、信息流广告、Draw 信息流广告的触发按钮
3. WHEN 用户点击任意广告按钮 THEN 系统 SHALL 能够触发对应类型的广告展示功能

### 需求 4

**用户故事：** 作为用户，我希望能够触发开屏广告展示，以便查看开屏广告效果。

#### 验收标准

1. WHEN 点击开屏广告按钮 THEN 系统 SHALL 使用广告 ID: 892641054 加载并显示开屏广告
2. WHEN 开屏广告显示 THEN 系统 SHALL 正确展示广告内容
3. WHEN 广告加载失败 THEN 系统 SHALL 显示相应的错误提示

### 需求 5

**用户故事：** 作为用户，我希望能够触发激励视频广告展示，以便查看激励视频广告效果。

#### 验收标准

1. WHEN 点击激励视频广告按钮 THEN 系统 SHALL 加载并播放激励视频广告
2. WHEN 视频播放 THEN 系统 SHALL 正确展示广告内容
3. WHEN 广告加载失败 THEN 系统 SHALL 显示相应的错误提示

### 需求 6

**用户故事：** 作为用户，我希望能够触发新插屏广告展示，以便查看新插屏广告效果。

#### 验收标准

1. WHEN 点击新插屏广告按钮 THEN 系统 SHALL 加载并显示新插屏广告
2. WHEN 插屏广告显示 THEN 系统 SHALL 正确展示广告内容
3. WHEN 广告加载失败 THEN 系统 SHALL 显示相应的错误提示

### 需求 7

**用户故事：** 作为用户，我希望能够触发 Banner 广告展示，以便查看 Banner 广告效果。

#### 验收标准

1. WHEN 点击 Banner 广告按钮 THEN 系统 SHALL 加载并显示 Banner 广告
2. WHEN Banner 广告显示 THEN 系统 SHALL 正确展示广告内容
3. WHEN 广告加载失败 THEN 系统 SHALL 显示相应的错误提示

### 需求 8

**用户故事：** 作为用户，我希望能够触发信息流广告展示，以便查看信息流广告效果。

#### 验收标准

1. WHEN 点击信息流广告按钮 THEN 系统 SHALL 加载并显示信息流广告
2. WHEN 信息流广告显示 THEN 系统 SHALL 正确展示广告内容
3. WHEN 广告加载失败 THEN 系统 SHALL 显示相应的错误提示

### 需求 9

**用户故事：** 作为用户，我希望能够触发 Draw 信息流广告展示，以便查看 Draw 信息流广告效果。

#### 验收标准

1. WHEN 点击 Draw 信息流广告按钮 THEN 系统 SHALL 加载并显示 Draw 信息流广告
2. WHEN Draw 广告显示 THEN 系统 SHALL 正确展示广告内容
3. WHEN 广告加载失败 THEN 系统 SHALL 显示相应的错误提示