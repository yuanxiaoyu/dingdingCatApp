#!/bin/bash

# 丁丁猫应用图标批量转换脚本
# DingDingCat App Icon Batch Conversion Script

echo "🎨 开始转换应用图标..."

# 检查ImageMagick是否安装
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick未安装，请先安装："
    echo "   macOS: brew install imagemagick"
    echo "   Ubuntu: sudo apt-get install imagemagick"
    echo "   或使用在线转换工具"
    exit 1
fi

# 创建目录
mkdir -p android/app/src/main/res/mipmap-mdpi
mkdir -p android/app/src/main/res/mipmap-hdpi
mkdir -p android/app/src/main/res/mipmap-xhdpi
mkdir -p android/app/src/main/res/mipmap-xxhdpi
mkdir -p android/app/src/main/res/mipmap-xxxhdpi
mkdir -p ios/DingDingCat/Images.xcassets/AppIcon.appiconset

echo "📱 转换Android图标..."

# 转换Android图标
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

echo "🍎 转换iOS图标..."

# 转换iOS图标
convert assets/icons/ios-Icon-20@2x.svg ios/DingDingCat/Images.xcassets/AppIcon.appiconset/Icon-20@2x.png
convert assets/icons/ios-Icon-20@3x.svg ios/DingDingCat/Images.xcassets/AppIcon.appiconset/Icon-20@3x.png
convert assets/icons/ios-Icon-29@2x.svg ios/DingDingCat/Images.xcassets/AppIcon.appiconset/Icon-29@2x.png
convert assets/icons/ios-Icon-29@3x.svg ios/DingDingCat/Images.xcassets/AppIcon.appiconset/Icon-29@3x.png
convert assets/icons/ios-Icon-40@2x.svg ios/DingDingCat/Images.xcassets/AppIcon.appiconset/Icon-40@2x.png
convert assets/icons/ios-Icon-40@3x.svg ios/DingDingCat/Images.xcassets/AppIcon.appiconset/Icon-40@3x.png
convert assets/icons/ios-Icon-60@2x.svg ios/DingDingCat/Images.xcassets/AppIcon.appiconset/Icon-60@2x.png
convert assets/icons/ios-Icon-60@3x.svg ios/DingDingCat/Images.xcassets/AppIcon.appiconset/Icon-60@3x.png
convert assets/icons/ios-Icon-1024.svg ios/DingDingCat/Images.xcassets/AppIcon.appiconset/Icon-1024.png

echo "✅ 图标转换完成！"
echo ""
echo "📋 后续步骤："
echo "1. 重新构建应用: npm run clean && npm run android"
echo "2. 检查图标是否正确显示"
echo "3. 如有问题，请检查生成的PNG文件"
