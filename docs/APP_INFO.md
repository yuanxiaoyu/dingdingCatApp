# 丁丁猫应用信息

## 应用配置

### 基本信息
- **应用名称**: DingDingCat
- **显示名称**: 丁丁猫
- **包名**: com.dingdingcat.app
- **Bundle ID**: com.dingdingcat.app

### 平台配置

#### Android
- **应用名称**: 在 `android/app/src/main/res/values/strings.xml` 中配置
- **包名**: 在 `android/app/build.gradle` 中配置
- **图标**: 在 `android/app/src/main/res/mipmap-*/` 目录中

#### iOS
- **显示名称**: 在 `ios/DingDingCat/Info.plist` 中的 `CFBundleDisplayName`
- **Bundle ID**: 在 Xcode 项目设置中配置
- **图标**: 在 `ios/DingDingCat/Images.xcassets/AppIcon.appiconset/` 中

### 修改应用名称

如需修改应用名称，请编辑 `scripts/update-app-name.js` 中的 `APP_CONFIG` 对象，然后运行：

```bash
npm run app:update-name
```

### 注意事项

1. **包名修改**: 修改包名需要同时更新多个配置文件，建议谨慎操作
2. **图标更新**: 使用 `npm run icons:generate` 生成新图标
3. **重新构建**: 修改后需要清理并重新构建应用

```bash
npm run clean
npm run android  # 或 npm run ios
```

## 品牌标识

### 颜色规范
- **主色调**: #1890FF (蓝色)
- **辅助色**: #096DD9 (深蓝色)
- **背景色**: #E6F7FF (浅蓝色)
- **文字色**: #FFFFFF (白色)

### 字体规范
- **中文**: 系统默认字体
- **英文**: Arial, sans-serif
- **图标文字**: 粗体 (bold)

### 设计原则
- **简洁**: 保持设计简洁明了
- **一致**: 保持品牌视觉一致性
- **可爱**: 体现猫咪元素的可爱特性
- **专业**: 保持应用的专业性
