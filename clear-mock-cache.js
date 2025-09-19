#!/usr/bin/env node

/**
 * 清理Mock模式缓存脚本
 * 用于解决.env文件修改后Mock状态不生效的问题
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 开始清理Mock模式缓存...\n');

// 1. 检查.env文件配置
console.log('📋 当前.env配置:');
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const mockEnabled = envContent.match(/MOCK_ENABLED=(\d+)/)?.[1];
    const mockUserState = envContent.match(/MOCK_USER_STATE=(\d+)/)?.[1];
    
    console.log(`   MOCK_ENABLED=${mockEnabled} (${mockEnabled === '1' ? '开启' : '关闭'})`);
    console.log(`   MOCK_USER_STATE=${mockUserState} (${mockUserState === '0' ? '未登录' : '登录'})`);
  } else {
    console.log('   ❌ .env文件不存在');
  }
} catch (error) {
  console.log('   ❌ 读取.env文件失败:', error.message);
}

console.log('\n🗑️  清理缓存数据...');

// 2. 清理React Native缓存
const commands = [
  // 清理Metro缓存
  'npx react-native start --reset-cache',
  // 清理npm/yarn缓存
  'npm start -- --reset-cache',
  // 如果使用yarn
  'yarn start --reset-cache'
];

// 3. 清理模拟器/设备上的应用数据
console.log('📱 清理应用数据...');

try {
  // iOS模拟器
  console.log('   清理iOS模拟器数据...');
  execSync('xcrun simctl erase all', { stdio: 'pipe' });
  console.log('   ✅ iOS模拟器数据已清理');
} catch (error) {
  console.log('   ⚠️  iOS模拟器清理失败 (可能未安装Xcode)');
}

try {
  // Android模拟器
  console.log('   清理Android应用数据...');
  execSync('adb shell pm clear com.dingdingcat', { stdio: 'pipe' });
  console.log('   ✅ Android应用数据已清理');
} catch (error) {
  console.log('   ⚠️  Android应用清理失败 (可能设备未连接)');
}

// 4. 提供手动清理指南
console.log('\n📖 手动清理指南:');
console.log('如果问题仍然存在，请手动执行以下步骤:');
console.log('');
console.log('🔧 开发者工具清理:');
console.log('1. 在应用中打开开发者工具 (DevTools)');
console.log('2. 找到 "Mock状态管理" 部分');
console.log('3. 点击 "重置覆盖设置" 按钮');
console.log('4. 重启应用');
console.log('');
console.log('📱 设备清理:');
console.log('iOS:');
console.log('- 长按应用图标 → 删除应用 → 重新安装');
console.log('- 或在设置 → 通用 → iPhone存储空间 → 应用 → 卸载应用');
console.log('');
console.log('Android:');
console.log('- 设置 → 应用 → 丁丁猫 → 存储 → 清除数据');
console.log('- 或直接卸载重装应用');
console.log('');
console.log('🚀 重启开发服务器:');
console.log('1. 停止当前的Metro服务器 (Ctrl+C)');
console.log('2. 运行: npx react-native start --reset-cache');
console.log('3. 重新构建应用: npx react-native run-ios 或 npx react-native run-android');

console.log('\n✨ 清理完成！请重启应用查看效果。');