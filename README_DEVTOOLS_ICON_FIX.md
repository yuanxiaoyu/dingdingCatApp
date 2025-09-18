# DevTools 图标显示修复

## 问题描述
在HomeScreen中，DevTools按钮之前使用的是文字图标，现在改为使用实际的应用图标文件。

## 解决方案
使用小尺寸的应用图标 `icons/mipmap-mdpi_ic_launcher.png` (48x48px) 作为DevTools按钮的图标。

## 修改内容

### 1. 更新HomeScreen.tsx
- 移除了未使用的 `DevToolsIcon` 导入
- 将DevTools按钮从文字图标改为使用实际图片
- 使用 `require('../../icons/mipmap-mdpi_ic_launcher.png')` 加载图标
- 添加了错误处理，如果图片加载失败会在控制台输出日志

### 2. 样式调整
- 更新了 `devToolsButton` 样式，添加白色背景以突出图标
- 新增了 `devToolsIcon` 样式，设置图标大小为32x32px，圆角16px
- 移除了之前的文字图标相关样式

## 技术细节

### 图标文件
- 使用的图标文件：`icons/mipmap-mdpi_ic_launcher.png`
- 原始尺寸：48x48px (mdpi密度)
- 显示尺寸：32x32px (适合按钮大小)

### 样式配置
```typescript
devToolsButton: {
  position: 'absolute',
  top: 0,
  right: 0,
  width: 40,
  height: 40,
  borderRadius: 20,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#FFFFFF', // 白色背景突出图标
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 4,
  overflow: 'hidden',
},
devToolsIcon: {
  width: 32,
  height: 32,
  borderRadius: 16, // 圆形图标
},
```

## 使用说明
1. DevTools按钮只在DEBUG模式下显示
2. 点击按钮会打开开发工具面板
3. 图标会自动适应按钮大小，保持圆形外观
4. 如果图标加载失败，会在控制台输出错误信息

## 备注
- 如果需要使用其他尺寸的图标，可以选择：
  - `mipmap-hdpi_ic_launcher.png` (72x72px)
  - `mipmap-xhdpi_ic_launcher.png` (96x96px)
  - `mipmap-xxhdpi_ic_launcher.png` (144x144px)
  - `mipmap-xxxhdpi_ic_launcher.png` (192x192px)
- 当前使用mdpi版本是为了保持较小的文件大小和合适的显示效果