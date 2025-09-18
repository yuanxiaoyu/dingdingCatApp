#!/usr/bin/env node

/**
 * 应用名称和显示名称更新脚本
 * App Name and Display Name Update Script
 */

const fs = require('fs');
const path = require('path');

// 应用信息配置
const APP_CONFIG = {
  displayName: '丁丁猫',
  packageName: 'com.dingdingcat.app',
  bundleId: 'com.dingdingcat.app',
  appName: 'DingDingCat',
};

// 更新Android应用名称
function updateAndroidAppName() {
  console.log('📱 更新Android应用名称...');
  
  // 更新strings.xml
  const stringsPath = 'android/app/src/main/res/values/strings.xml';
  
  if (fs.existsSync(stringsPath)) {
    let stringsContent = fs.readFileSync(stringsPath, 'utf8');
    
    // 更新app_name
    stringsContent = stringsContent.replace(
      /<string name="app_name">.*<\/string>/,
      `<string name="app_name">${APP_CONFIG.displayName}</string>`
    );
    
    fs.writeFileSync(stringsPath, stringsContent);
    console.log('✅ 已更新Android应用名称');
  } else {
    console.warn('⚠️  未找到Android strings.xml文件');
  }

  // 更新AndroidManifest.xml中的label
  const manifestPath = 'android/app/src/main/AndroidManifest.xml';
  
  if (fs.existsSync(manifestPath)) {
    let manifestContent = fs.readFileSync(manifestPath, 'utf8');
    
    // 确保使用strings.xml中的app_name
    if (!manifestContent.includes('android:label="@string/app_name"')) {
      manifestContent = manifestContent.replace(
        /android:label="[^"]*"/,
        'android:label="@string/app_name"'
      );
      
      fs.writeFileSync(manifestPath, manifestContent);
      console.log('✅ 已更新AndroidManifest.xml');
    }
  }
}

// 更新iOS应用名称
function updateiOSAppName() {
  console.log('🍎 更新iOS应用名称...');
  
  // 更新Info.plist
  const infoPlistPath = 'ios/DingDingCat/Info.plist';
  
  if (fs.existsSync(infoPlistPath)) {
    let plistContent = fs.readFileSync(infoPlistPath, 'utf8');
    
    // 更新CFBundleDisplayName
    if (plistContent.includes('<key>CFBundleDisplayName</key>')) {
      plistContent = plistContent.replace(
        /(<key>CFBundleDisplayName<\/key>\s*<string>)[^<]*(<\/string>)/,
        `$1${APP_CONFIG.displayName}$2`
      );
    } else {
      // 如果不存在，添加CFBundleDisplayName
      plistContent = plistContent.replace(
        /(<key>CFBundleName<\/key>\s*<string>[^<]*<\/string>)/,
        `$1\n\t<key>CFBundleDisplayName</key>\n\t<string>${APP_CONFIG.displayName}</string>`
      );
    }
    
    fs.writeFileSync(infoPlistPath, plistContent);
    console.log('✅ 已更新iOS应用名称');
  } else {
    console.warn('⚠️  未找到iOS Info.plist文件');
  }
}

// 更新package.json中的应用名称
function updatePackageJson() {
  console.log('📦 更新package.json...');
  
  const packagePath = 'package.json';
  
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    packageJson.name = APP_CONFIG.appName;
    packageJson.displayName = APP_CONFIG.displayName;
    
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('✅ 已更新package.json');
  }
}

// 更新app.json (如果存在)
function updateAppJson() {
  const appJsonPath = 'app.json';
  
  if (fs.existsSync(appJsonPath)) {
    console.log('📱 更新app.json...');
    
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    appJson.name = APP_CONFIG.appName;
    appJson.displayName = APP_CONFIG.displayName;
    
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
    console.log('✅ 已更新app.json');
  }
}

// 创建应用信息文档
function createAppInfoDoc() {
  const docContent = `# 丁丁猫应用信息

## 应用配置

### 基本信息
- **应用名称**: ${APP_CONFIG.appName}
- **显示名称**: ${APP_CONFIG.displayName}
- **包名**: ${APP_CONFIG.packageName}
- **Bundle ID**: ${APP_CONFIG.bundleId}

### 平台配置

#### Android
- **应用名称**: 在 \`android/app/src/main/res/values/strings.xml\` 中配置
- **包名**: 在 \`android/app/build.gradle\` 中配置
- **图标**: 在 \`android/app/src/main/res/mipmap-*/\` 目录中

#### iOS
- **显示名称**: 在 \`ios/DingDingCat/Info.plist\` 中的 \`CFBundleDisplayName\`
- **Bundle ID**: 在 Xcode 项目设置中配置
- **图标**: 在 \`ios/DingDingCat/Images.xcassets/AppIcon.appiconset/\` 中

### 修改应用名称

如需修改应用名称，请编辑 \`scripts/update-app-name.js\` 中的 \`APP_CONFIG\` 对象，然后运行：

\`\`\`bash
npm run app:update-name
\`\`\`

### 注意事项

1. **包名修改**: 修改包名需要同时更新多个配置文件，建议谨慎操作
2. **图标更新**: 使用 \`npm run icons:generate\` 生成新图标
3. **重新构建**: 修改后需要清理并重新构建应用

\`\`\`bash
npm run clean
npm run android  # 或 npm run ios
\`\`\`

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
`;

  fs.writeFileSync('docs/APP_INFO.md', docContent);
  console.log('✅ 已创建应用信息文档');
}

// 主函数
async function main() {
  console.log('🏷️  丁丁猫应用名称更新工具');
  console.log('   DingDingCat App Name Update Tool\n');

  try {
    updatePackageJson();
    updateAppJson();
    updateAndroidAppName();
    updateiOSAppName();
    createAppInfoDoc();
    
    console.log('\n✅ 应用名称更新完成！');
    console.log('\n📋 后续步骤:');
    console.log('1. 清理并重新构建应用');
    console.log('2. 检查应用名称是否正确显示');
    console.log('3. 如需修改包名，请手动编辑相关配置文件');
    
    console.log('\n🔧 重新构建命令:');
    console.log('npm run clean');
    console.log('npm run android  # 或 npm run ios');
    
  } catch (error) {
    console.error('❌ 更新应用名称时发生错误:', error);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { 
  updateAndroidAppName, 
  updateiOSAppName, 
  updatePackageJson,
  APP_CONFIG 
};