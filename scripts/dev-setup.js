#!/usr/bin/env node

/**
 * Development Setup Script
 * 
 * This script helps set up the development environment
 * and provides guidance for common issues.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 DingDingCat Development Setup');
console.log('================================\n');

// Check for common issues
function checkEnvironment() {
  console.log('📋 Checking development environment...\n');

  // Check if iOS SDK is available (for macOS)
  if (process.platform === 'darwin') {
    try {
      const { execSync } = require('child_process');
      execSync('xcodebuild -version', { stdio: 'ignore' });
      console.log('✅ Xcode is installed');
    } catch (error) {
      console.log('⚠️  Xcode not found or not properly configured');
      console.log('   Please install Xcode from the App Store');
    }
  }

  // Check if Watchman is installed
  try {
    const { execSync } = require('child_process');
    execSync('watchman --version', { stdio: 'ignore' });
    console.log('✅ Watchman is installed');
  } catch (error) {
    console.log('⚠️  Watchman not found');
    console.log('   Install with: brew install watchman');
  }

  // Check WeChat configuration
  const envPath = path.join(__dirname, '../src/config/env.ts');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('wx_dev_app_id')) {
      console.log('⚠️  Using placeholder WeChat App ID');
      console.log('   This is OK for development, but you\'ll need a real WeChat App ID for production');
    } else {
      console.log('✅ WeChat App ID configured');
    }
  }

  console.log('\n');
}

// Provide development tips
function showDevelopmentTips() {
  console.log('💡 Development Tips');
  console.log('==================\n');
  
  console.log('1. For WeChat integration issues:');
  console.log('   - The app uses mock WeChat login in development mode');
  console.log('   - Real WeChat integration requires a valid WeChat App ID');
  console.log('   - Update WECHAT_APP_ID in src/config/env.ts for production\n');
  
  console.log('2. For iOS development:');
  console.log('   - Make sure Xcode is installed and configured');
  console.log('   - Run: cd ios && pod install');
  console.log('   - Use: npm run ios\n');
  
  console.log('3. For Android development:');
  console.log('   - Make sure Android Studio is installed');
  console.log('   - Configure Android SDK path');
  console.log('   - Use: npm run android\n');
  
  console.log('4. Common commands:');
  console.log('   - npm start          # Start Metro bundler');
  console.log('   - npm run start:reset # Start with cache reset');
  console.log('   - npm run clean      # Clean build cache');
  console.log('   - npm test           # Run tests\n');
}

// Main execution
checkEnvironment();
showDevelopmentTips();

console.log('🚀 Ready to start development!');
console.log('Run: npm start');