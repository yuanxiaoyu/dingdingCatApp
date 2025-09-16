/**
 * 穿山甲广告集成验证脚本
 * Pangle Ad Integration Verification Script
 */

const fs = require('fs');
const path = require('path');

// 验证结果
const verificationResults = {
  configFiles: [],
  componentFiles: [],
  nativeFiles: [],
  buildFiles: [],
  errors: [],
  warnings: []
};

// 检查文件是否存在
function checkFileExists(filePath, category) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    verificationResults[category].push(`✅ ${filePath}`);
    return true;
  } else {
    verificationResults.errors.push(`❌ 缺失文件: ${filePath}`);
    return false;
  }
}

// 检查文件内容
function checkFileContent(filePath, searchText, description) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes(searchText)) {
      verificationResults.configFiles.push(`✅ ${description}`);
      return true;
    } else {
      verificationResults.warnings.push(`⚠️ ${description} - 内容可能不完整`);
      return false;
    }
  } else {
    verificationResults.errors.push(`❌ 无法检查: ${filePath}`);
    return false;
  }
}

console.log('🔍 开始验证穿山甲广告集成...\n');

// 1. 检查配置文件
console.log('📋 检查配置文件...');
checkFileExists('src/config/adConfig.js', 'configFiles');
checkFileContent('src/config/adConfig.js', '5001121', '使用官方测试App ID');
checkFileContent('src/config/adConfig.js', '102117864', '使用官方测试开屏广告ID');

// 2. 检查React Native组件
console.log('⚛️ 检查React Native组件...');
checkFileExists('src/components/HomeScreen.tsx', 'componentFiles');
checkFileExists('src/components/AdButton.tsx', 'componentFiles');
checkFileExists('src/components/BannerAdView.tsx', 'componentFiles');
checkFileExists('src/services/PangleAdService.js', 'componentFiles');
checkFileExists('App.tsx', 'componentFiles');

// 3. 检查Android原生文件
console.log('🤖 检查Android原生文件...');
checkFileExists('android/app/src/main/java/com/dingdingcat/pangle/PangleAdModule.java', 'nativeFiles');
checkFileExists('android/app/src/main/java/com/dingdingcat/pangle/PangleAdPackage.java', 'nativeFiles');
checkFileExists('android/app/src/main/java/com/dingdingcat/pangle/SplashAdManager.java', 'nativeFiles');
checkFileExists('android/app/src/main/java/com/dingdingcat/pangle/RewardVideoAdManager.java', 'nativeFiles');
checkFileExists('android/app/src/main/java/com/dingdingcat/pangle/InterstitialAdManager.java', 'nativeFiles');
checkFileExists('android/app/src/main/java/com/dingdingcat/pangle/BannerAdManager.java', 'nativeFiles');
checkFileExists('android/app/src/main/java/com/dingdingcat/pangle/FeedAdManager.java', 'nativeFiles');
checkFileExists('android/app/src/main/java/com/dingdingcat/pangle/DrawFeedAdManager.java', 'nativeFiles');
checkFileExists('android/app/src/main/java/com/dingdingcat/pangle/BannerAdView.java', 'nativeFiles');
checkFileExists('android/app/src/main/java/com/dingdingcat/pangle/BannerAdViewManager.java', 'nativeFiles');

// 4. 检查构建配置
console.log('🔧 检查构建配置...');
checkFileExists('android/app/build.gradle', 'buildFiles');
checkFileExists('android/app/src/main/AndroidManifest.xml', 'buildFiles');
checkFileContent('android/app/build.gradle', 'open_ad_sdk', 'Android build.gradle包含穿山甲SDK依赖');

// 5. 检查主应用配置
console.log('📱 检查主应用配置...');
checkFileContent('android/app/src/main/java/com/dingdingcat/MainApplication.kt', 'PangleAdPackage', 'MainApplication注册了PangleAdPackage');
checkFileContent('App.tsx', 'HomeScreen', 'App.tsx使用HomeScreen组件');

// 输出验证结果
console.log('\n📊 验证结果汇总:');
console.log('==========================================');

if (verificationResults.configFiles.length > 0) {
  console.log('\n📋 配置文件:');
  verificationResults.configFiles.forEach(result => console.log(`  ${result}`));
}

if (verificationResults.componentFiles.length > 0) {
  console.log('\n⚛️ React Native组件:');
  verificationResults.componentFiles.forEach(result => console.log(`  ${result}`));
}

if (verificationResults.nativeFiles.length > 0) {
  console.log('\n🤖 Android原生文件:');
  verificationResults.nativeFiles.forEach(result => console.log(`  ${result}`));
}

if (verificationResults.buildFiles.length > 0) {
  console.log('\n🔧 构建配置:');
  verificationResults.buildFiles.forEach(result => console.log(`  ${result}`));
}

if (verificationResults.warnings.length > 0) {
  console.log('\n⚠️ 警告:');
  verificationResults.warnings.forEach(warning => console.log(`  ${warning}`));
}

if (verificationResults.errors.length > 0) {
  console.log('\n❌ 错误:');
  verificationResults.errors.forEach(error => console.log(`  ${error}`));
}

// 总结
const totalChecks = verificationResults.configFiles.length + 
                   verificationResults.componentFiles.length + 
                   verificationResults.nativeFiles.length + 
                   verificationResults.buildFiles.length;
const totalErrors = verificationResults.errors.length;
const totalWarnings = verificationResults.warnings.length;

console.log('\n📈 验证统计:');
console.log(`  ✅ 通过检查: ${totalChecks}`);
console.log(`  ⚠️ 警告数量: ${totalWarnings}`);
console.log(`  ❌ 错误数量: ${totalErrors}`);

if (totalErrors === 0) {
  console.log('\n🎉 恭喜！穿山甲广告集成验证通过！');
  console.log('   所有必要的文件和配置都已正确设置。');
} else {
  console.log('\n🔧 需要修复一些问题才能完成集成。');
}

console.log('\n==========================================');