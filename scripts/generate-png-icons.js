#!/usr/bin/env node

/**
 * PNG图标生成脚本 (简化版)
 * PNG Icon Generation Script (Simplified)
 */

const fs = require('fs');
const path = require('path');

// 创建简化的图标数据 (Base64编码的PNG)
function createSimpleIcon(size) {
  // 这是一个简化的丁丁猫图标的Base64数据
  // 实际项目中应该使用专业的图标设计
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  
  // 背景渐变
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#1890FF');
  gradient.addColorStop(1, '#096DD9');
  
  // 绘制背景圆形
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 - 2, 0, 2 * Math.PI);
  ctx.fill();
  
  // 绘制猫咪头部
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(size/2, size/2 + size*0.05, size*0.28, 0, 2 * Math.PI);
  ctx.fill();
  
  // 绘制猫耳朵
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(size*0.35, size*0.32);
  ctx.lineTo(size*0.42, size*0.18);
  ctx.lineTo(size*0.48, size*0.28);
  ctx.closePath();
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(size*0.52, size*0.28);
  ctx.lineTo(size*0.58, size*0.18);
  ctx.lineTo(size*0.65, size*0.32);
  ctx.closePath();
  ctx.fill();
  
  // 绘制猫眼睛
  ctx.fillStyle = '#333333';
  ctx.beginPath();
  ctx.ellipse(size*0.42, size*0.45, size*0.04, size*0.06, 0, 0, 2 * Math.PI);
  ctx.fill();
  
  ctx.beginPath();
  ctx.ellipse(size*0.58, size*0.45, size*0.04, size*0.06, 0, 0, 2 * Math.PI);
  ctx.fill();
  
  // 绘制文字 "丁丁"
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${size*0.12}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('丁丁', size/2, size*0.8);
  
  return canvas;
}

// 由于Node.js环境限制，我们创建一个简化的图标文件复制脚本
function createIconFiles() {
  console.log('📱 创建应用图标文件...');
  
  // 创建一个简单的图标说明文件
  const iconInstructions = `
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

\`\`\`bash
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
\`\`\`

### 4. 验证图标
重新构建应用后，检查图标是否正确显示：

\`\`\`bash
# 清理并重新构建
npm run clean
npm run android  # 或 npm run ios
\`\`\`

## 设计说明
- 主色调：蓝色渐变 (#1890FF → #096DD9)
- 图标元素：白色猫咪头像 + "丁丁"文字
- 风格：现代、简洁、可爱
- 适配：支持圆形和方形启动器
`;

  fs.writeFileSync('assets/icons/ICON_SETUP_GUIDE.md', iconInstructions);
  console.log('✅ 已创建图标设置指南: assets/icons/ICON_SETUP_GUIDE.md');
}

// 创建ImageMagick批量转换脚本
function createConversionScript() {
  const scriptContent = `#!/bin/bash

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
`;

  fs.writeFileSync('scripts/convert-icons.sh', scriptContent);
  
  // 设置脚本执行权限
  try {
    fs.chmodSync('scripts/convert-icons.sh', '755');
  } catch (error) {
    console.warn('无法设置脚本执行权限，请手动执行: chmod +x scripts/convert-icons.sh');
  }
  
  console.log('✅ 已创建转换脚本: scripts/convert-icons.sh');
}

// 主函数
async function main() {
  console.log('🖼️  PNG图标生成工具');
  console.log('   PNG Icon Generation Tool\n');

  try {
    createIconFiles();
    createConversionScript();
    
    console.log('\n📋 使用方法:');
    console.log('1. 手动转换: 查看 assets/icons/ICON_SETUP_GUIDE.md');
    console.log('2. 自动转换: 运行 ./scripts/convert-icons.sh (需要ImageMagick)');
    console.log('3. 在线转换: 使用推荐的在线工具');
    
  } catch (error) {
    console.error('❌ 生成PNG图标时发生错误:', error);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createIconFiles, createConversionScript };