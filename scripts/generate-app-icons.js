#!/usr/bin/env node

/**
 * 应用图标生成脚本
 * App Icon Generation Script
 */

const fs = require('fs');
const path = require('path');

// 图标尺寸配置
const ICON_SIZES = {
  android: [
    { folder: 'mipmap-mdpi', size: 48 },
    { folder: 'mipmap-hdpi', size: 72 },
    { folder: 'mipmap-xhdpi', size: 96 },
    { folder: 'mipmap-xxhdpi', size: 144 },
    { folder: 'mipmap-xxxhdpi', size: 192 },
  ],
  ios: [
    { name: 'Icon-20@2x.png', size: 40 },
    { name: 'Icon-20@3x.png', size: 60 },
    { name: 'Icon-29@2x.png', size: 58 },
    { name: 'Icon-29@3x.png', size: 87 },
    { name: 'Icon-40@2x.png', size: 80 },
    { name: 'Icon-40@3x.png', size: 120 },
    { name: 'Icon-60@2x.png', size: 120 },
    { name: 'Icon-60@3x.png', size: 180 },
    { name: 'Icon-1024.png', size: 1024 },
  ]
};

// SVG图标模板 - 丁丁猫图标
const ICON_SVG_TEMPLATE = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1890FF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#096DD9;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="catGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F0F0F0;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 背景圆形 -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="url(#bgGradient)" />
  
  <!-- 猫咪头部 -->
  <circle cx="${size/2}" cy="${size/2 + size*0.05}" r="${size*0.28}" fill="url(#catGradient)" stroke="#E6F7FF" stroke-width="${size*0.01}"/>
  
  <!-- 猫耳朵 -->
  <path d="M ${size*0.35} ${size*0.32} L ${size*0.42} ${size*0.18} L ${size*0.48} ${size*0.28} Z" fill="url(#catGradient)" stroke="#E6F7FF" stroke-width="${size*0.005}"/>
  <path d="M ${size*0.52} ${size*0.28} L ${size*0.58} ${size*0.18} L ${size*0.65} ${size*0.32} Z" fill="url(#catGradient)" stroke="#E6F7FF" stroke-width="${size*0.005}"/>
  
  <!-- 猫耳朵内部 -->
  <path d="M ${size*0.38} ${size*0.28} L ${size*0.43} ${size*0.22} L ${size*0.46} ${size*0.26} Z" fill="#FFB6C1"/>
  <path d="M ${size*0.54} ${size*0.26} L ${size*0.57} ${size*0.22} L ${size*0.62} ${size*0.28} Z" fill="#FFB6C1"/>
  
  <!-- 猫眼睛 -->
  <ellipse cx="${size*0.42}" cy="${size*0.45}" rx="${size*0.04}" ry="${size*0.06}" fill="#333333"/>
  <ellipse cx="${size*0.58}" cy="${size*0.45}" rx="${size*0.04}" ry="${size*0.06}" fill="#333333"/>
  
  <!-- 眼睛高光 -->
  <ellipse cx="${size*0.43}" cy="${size*0.43}" rx="${size*0.015}" ry="${size*0.02}" fill="#FFFFFF"/>
  <ellipse cx="${size*0.59}" cy="${size*0.43}" rx="${size*0.015}" ry="${size*0.02}" fill="#FFFFFF"/>
  
  <!-- 猫鼻子 -->
  <path d="M ${size*0.5} ${size*0.52} L ${size*0.48} ${size*0.55} L ${size*0.52} ${size*0.55} Z" fill="#FF69B4"/>
  
  <!-- 猫嘴巴 -->
  <path d="M ${size*0.5} ${size*0.55} Q ${size*0.46} ${size*0.58} ${size*0.44} ${size*0.56}" stroke="#333333" stroke-width="${size*0.008}" fill="none" stroke-linecap="round"/>
  <path d="M ${size*0.5} ${size*0.55} Q ${size*0.54} ${size*0.58} ${size*0.56} ${size*0.56}" stroke="#333333" stroke-width="${size*0.008}" fill="none" stroke-linecap="round"/>
  
  <!-- 猫胡须 -->
  <line x1="${size*0.32}" y1="${size*0.48}" x2="${size*0.38}" y2="${size*0.47}" stroke="#333333" stroke-width="${size*0.006}" stroke-linecap="round"/>
  <line x1="${size*0.32}" y1="${size*0.52}" x2="${size*0.38}" y2="${size*0.52}" stroke="#333333" stroke-width="${size*0.006}" stroke-linecap="round"/>
  <line x1="${size*0.62}" y1="${size*0.47}" x2="${size*0.68}" y2="${size*0.48}" stroke="#333333" stroke-width="${size*0.006}" stroke-linecap="round"/>
  <line x1="${size*0.62}" y1="${size*0.52}" x2="${size*0.68}" y2="${size*0.52}" stroke="#333333" stroke-width="${size*0.006}" stroke-linecap="round"/>
  
  <!-- 文字 "丁丁" (简化版) -->
  <text x="${size/2}" y="${size*0.8}" font-family="Arial, sans-serif" font-size="${size*0.12}" font-weight="bold" text-anchor="middle" fill="#FFFFFF">丁丁</text>
</svg>
`;

// 创建目录
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// 生成SVG文件
function generateSVGIcon(size, outputPath) {
  const svgContent = ICON_SVG_TEMPLATE(size);
  fs.writeFileSync(outputPath, svgContent);
  console.log(`Generated SVG icon: ${outputPath} (${size}x${size})`);
}

// 更新iOS AppIcon配置
function updateiOSAppIconConfig() {
  const configPath = 'ios/DingDingCat/Images.xcassets/AppIcon.appiconset/Contents.json';
  
  const config = {
    "images": [
      {
        "filename": "Icon-20@2x.png",
        "idiom": "iphone",
        "scale": "2x",
        "size": "20x20"
      },
      {
        "filename": "Icon-20@3x.png",
        "idiom": "iphone",
        "scale": "3x",
        "size": "20x20"
      },
      {
        "filename": "Icon-29@2x.png",
        "idiom": "iphone",
        "scale": "2x",
        "size": "29x29"
      },
      {
        "filename": "Icon-29@3x.png",
        "idiom": "iphone",
        "scale": "3x",
        "size": "29x29"
      },
      {
        "filename": "Icon-40@2x.png",
        "idiom": "iphone",
        "scale": "2x",
        "size": "40x40"
      },
      {
        "filename": "Icon-40@3x.png",
        "idiom": "iphone",
        "scale": "3x",
        "size": "40x40"
      },
      {
        "filename": "Icon-60@2x.png",
        "idiom": "iphone",
        "scale": "2x",
        "size": "60x60"
      },
      {
        "filename": "Icon-60@3x.png",
        "idiom": "iphone",
        "scale": "3x",
        "size": "60x60"
      },
      {
        "filename": "Icon-1024.png",
        "idiom": "ios-marketing",
        "scale": "1x",
        "size": "1024x1024"
      }
    ],
    "info": {
      "author": "xcode",
      "version": 1
    }
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('Updated iOS AppIcon configuration');
}

// 生成图标说明文档
function generateIconDocumentation() {
  const docContent = `# 丁丁猫应用图标

## 设计说明

### 设计理念
- **主色调**: 蓝色渐变 (#1890FF → #096DD9)，代表科技感和信任感
- **图标元素**: 可爱的猫咪头像，体现"丁丁猫"的品牌形象
- **文字**: "丁丁"字样，增强品牌识别度

### 设计特点
- **圆形背景**: 现代化的设计风格，适配各种系统主题
- **渐变效果**: 增加视觉层次感和现代感
- **猫咪元素**: 
  - 白色猫咪头部，简洁可爱
  - 粉色耳朵内部，增加亲和力
  - 黑色眼睛和鼻子，突出表情
  - 白色高光，增加生动感
  - 胡须细节，完善猫咪形象

### 尺寸规格

#### Android图标
- **mdpi**: 48x48px
- **hdpi**: 72x72px  
- **xhdpi**: 96x96px
- **xxhdpi**: 144x144px
- **xxxhdpi**: 192x192px

#### iOS图标
- **20pt**: 40x40px (2x), 60x60px (3x)
- **29pt**: 58x58px (2x), 87x87px (3x)
- **40pt**: 80x80px (2x), 120x120px (3x)
- **60pt**: 120x120px (2x), 180x180px (3x)
- **App Store**: 1024x1024px

## 使用方法

### 自动生成
\`\`\`bash
# 生成所有尺寸的图标
npm run icons:generate

# 仅生成SVG源文件
npm run icons:svg
\`\`\`

### 手动替换
1. 将生成的PNG文件复制到对应目录
2. Android: \`android/app/src/main/res/mipmap-*/\`
3. iOS: \`ios/DingDingCat/Images.xcassets/AppIcon.appiconset/\`

## 自定义修改

如需修改图标设计，请编辑 \`scripts/generate-app-icons.js\` 中的 \`ICON_SVG_TEMPLATE\` 函数。

### 可修改元素
- 背景颜色和渐变
- 猫咪的颜色和形状
- 文字内容和样式
- 整体布局和比例

## 注意事项

1. **iOS要求**: 图标必须是正方形，不能有透明背景
2. **Android适配**: 支持圆形、方形等不同的启动器样式
3. **品牌一致性**: 保持与应用内设计风格的一致性
4. **可读性**: 确保在小尺寸下仍然清晰可辨

## 更新记录

- **v1.0**: 初始版本，蓝色渐变背景 + 白色猫咪设计
`;

  fs.writeFileSync('docs/APP_ICON_GUIDE.md', docContent);
  console.log('Generated icon documentation');
}

// 主函数
async function main() {
  console.log('🎨 丁丁猫应用图标生成工具');
  console.log('   DingDingCat App Icon Generator\n');

  try {
    // 创建输出目录
    const outputDir = 'assets/icons';
    ensureDir(outputDir);

    // 生成不同尺寸的SVG图标
    console.log('📱 生成图标文件...');
    
    // 生成Android图标SVG
    for (const config of ICON_SIZES.android) {
      const svgPath = path.join(outputDir, `android-${config.folder}-${config.size}.svg`);
      generateSVGIcon(config.size, svgPath);
    }

    // 生成iOS图标SVG
    for (const config of ICON_SIZES.ios) {
      const svgPath = path.join(outputDir, `ios-${config.name.replace('.png', '.svg')}`);
      generateSVGIcon(config.size, svgPath);
    }

    // 生成主图标 (1024x1024)
    const masterIconPath = path.join(outputDir, 'app-icon-master.svg');
    generateSVGIcon(1024, masterIconPath);

    // 更新iOS配置
    console.log('\n⚙️  更新配置文件...');
    updateiOSAppIconConfig();

    // 生成文档
    console.log('\n📚 生成文档...');
    generateIconDocumentation();

    console.log('\n✅ 图标生成完成！');
    console.log('\n📋 后续步骤:');
    console.log('1. 使用设计工具将SVG转换为PNG格式');
    console.log('2. 将PNG文件复制到对应的平台目录');
    console.log('3. 重新构建应用以应用新图标');
    console.log('\n💡 推荐工具:');
    console.log('- 在线转换: https://convertio.co/svg-png/');
    console.log('- 本地工具: Inkscape, Adobe Illustrator');
    console.log('- 批量处理: ImageMagick');

    console.log('\n📁 生成的文件:');
    console.log(`- SVG图标: ${outputDir}/`);
    console.log('- iOS配置: ios/DingDingCat/Images.xcassets/AppIcon.appiconset/Contents.json');
    console.log('- 文档: docs/APP_ICON_GUIDE.md');

  } catch (error) {
    console.error('❌ 生成图标时发生错误:', error);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { 
  generateSVGIcon, 
  updateiOSAppIconConfig, 
  ICON_SIZES,
  ICON_SVG_TEMPLATE 
};