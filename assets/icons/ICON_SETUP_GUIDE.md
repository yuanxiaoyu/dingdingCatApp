
# 丁丁猫应用图标使用说明

## 当前状态
由于技术限制，自动PNG生成功能暂不可用。请按以下步骤手动创建图标：

## 手动创建步骤

### 1. 使用在线工具转换SVG
访问以下网站将生成的SVG文件转换为PNG：
- https://convertio.co/svg-png/
- https://cloudconvert.com/svg-to-png
- https://www.aconvert.com/image/svg-to-png/

### 2. 需要的PNG尺寸

#### Android图标 (复制到 android/app/src/main/res/)
- mipmap-mdpi/ic_launcher.png: 48x48px
- mipmap-hdpi/ic_launcher.png: 72x72px
- mipmap-xhdpi/ic_launcher.png: 96x96px
- mipmap-xxhdpi/ic_launcher.png: 144x144px
- mipmap-xxxhdpi/ic_launcher.png: 192x192px

#### Android圆形图标 (复制到 android/app/src/main/res/)
- mipmap-mdpi/ic_launcher_round.png: 48x48px
- mipmap-hdpi/ic_launcher_round.png: 72x72px
- mipmap-xhdpi/ic_launcher_round.png: 96x96px
- mipmap-xxhdpi/ic_launcher_round.png: 144x144px
- mipmap-xxxhdpi/ic_launcher_round.png: 192x192px

#### iOS图标 (复制到 ios/DingDingCat/Images.xcassets/AppIcon.appiconset/)
- Icon-20@2x.png: 40x40px
- Icon-20@3x.png: 60x60px
- Icon-29@2x.png: 58x58px
- Icon-29@3x.png: 87x87px
- Icon-40@2x.png: 80x80px
- Icon-40@3x.png: 120x120px
- Icon-60@2x.png: 120x120px
- Icon-60@3x.png: 180x180px
- Icon-1024.png: 1024x1024px

### 3. 快速批量转换命令 (如果安装了ImageMagick)

```bash
# 安装ImageMagick (macOS)
brew install imagemagick

# 批量转换Android图标
convert assets/icons/android-mipmap-mdpi-48.svg android/app/src/main/res/mipmap-mdpi/ic_launcher.png
convert assets/icons/android-mipmap-hdpi-72.svg android/app/src/main/res/mipmap-hdpi/ic_launcher.png
convert assets/icons/android-mipmap-xhdpi-96.svg android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
convert assets/icons/android-mipmap-xxhdpi-144.svg android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
convert assets/icons/android-mipmap-xxxhdpi-192.svg android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png

# 复制为圆形图标
cp android/app/src/main/res/mipmap-mdpi/ic_launcher.png android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png
cp android/app/src/main/res/mipmap-hdpi/ic_launcher.png android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png
cp android/app/src/main/res/mipmap-xhdpi/ic_launcher.png android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png
cp android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png
cp android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png

# 批量转换iOS图标
convert assets/icons/ios-Icon-20@2x.svg ios/DingDingCat/Images.xcassets/AppIcon.appiconset/Icon-20@2x.png
convert assets/icons/ios-Icon-20@3x.svg ios/DingDingCat/Images.xcassets/AppIcon.appiconset/Icon-20@3x.png
convert assets/icons/ios-Icon-29@2x.svg ios/DingDingCat/Images.xcassets/AppIcon.appiconset/Icon-29@2x.png
convert assets/icons/ios-Icon-29@3x.svg ios/DingDingCat/Images.xcassets/AppIcon.appiconset/Icon-29@3x.png
convert assets/icons/ios-Icon-40@2x.svg ios/DingDingCat/Images.xcassets/AppIcon.appiconset/Icon-40@2x.png
convert assets/icons/ios-Icon-40@3x.svg ios/DingDingCat/Images.xcassets/AppIcon.appiconset/Icon-40@3x.png
convert assets/icons/ios-Icon-60@2x.svg ios/DingDingCat/Images.xcassets/AppIcon.appiconset/Icon-60@2x.png
convert assets/icons/ios-Icon-60@3x.svg ios/DingDingCat/Images.xcassets/AppIcon.appiconset/Icon-60@3x.png
convert assets/icons/ios-Icon-1024.svg ios/DingDingCat/Images.xcassets/AppIcon.appiconset/Icon-1024.png
```

### 4. 验证图标
重新构建应用后，检查图标是否正确显示：

```bash
# 清理并重新构建
npm run clean
npm run android  # 或 npm run ios
```

## 设计说明
- 主色调：蓝色渐变 (#1890FF → #096DD9)
- 图标元素：白色猫咪头像 + "丁丁"文字
- 风格：现代、简洁、可爱
- 适配：支持圆形和方形启动器
