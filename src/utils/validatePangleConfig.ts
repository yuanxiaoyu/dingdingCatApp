/**
 * 验证穿山甲广告配置
 * Validate Pangle Ad Configuration
 */

import AdConfig from '../config/adConfig.js';

/**
 * 验证穿山甲配置是否正确
 */
export const validatePangleConfig = () => {
  console.log('🔍 验证穿山甲广告配置...');
  
  const validationResults = {
    appId: false,
    splashAdId: false,
    rewardVideoAdId: false,
    interstitialAdId: false,
    bannerAdId: false,
    adButtons: false,
  };
  
  // 验证应用ID
  if (AdConfig.appId && AdConfig.appId === '5001121') {
    console.log('✅ 应用ID配置正确:', AdConfig.appId);
    validationResults.appId = true;
  } else {
    console.log('❌ 应用ID配置错误:', AdConfig.appId);
  }
  
  // 验证开屏广告位ID
  if (AdConfig.splashAdId && AdConfig.splashAdId === '102117864') {
    console.log('✅ 开屏广告位ID配置正确:', AdConfig.splashAdId);
    validationResults.splashAdId = true;
  } else {
    console.log('❌ 开屏广告位ID配置错误:', AdConfig.splashAdId);
  }
  
  // 验证激励视频广告位ID
  if (AdConfig.rewardVideoAdId && AdConfig.rewardVideoAdId === '945700410') {
    console.log('✅ 激励视频广告位ID配置正确:', AdConfig.rewardVideoAdId);
    validationResults.rewardVideoAdId = true;
  } else {
    console.log('❌ 激励视频广告位ID配置错误:', AdConfig.rewardVideoAdId);
  }
  
  // 验证插屏广告位ID
  if (AdConfig.interstitialAdId && AdConfig.interstitialAdId === '945493675') {
    console.log('✅ 插屏广告位ID配置正确:', AdConfig.interstitialAdId);
    validationResults.interstitialAdId = true;
  } else {
    console.log('❌ 插屏广告位ID配置错误:', AdConfig.interstitialAdId);
  }
  
  // 验证Banner广告位ID
  if (AdConfig.bannerAdId && AdConfig.bannerAdId === '945493677') {
    console.log('✅ Banner广告位ID配置正确:', AdConfig.bannerAdId);
    validationResults.bannerAdId = true;
  } else {
    console.log('❌ Banner广告位ID配置错误:', AdConfig.bannerAdId);
  }
  
  // 验证广告按钮配置
  if (AdConfig.adButtons && Array.isArray(AdConfig.adButtons) && AdConfig.adButtons.length === 4) {
    console.log('✅ 广告按钮配置正确，共', AdConfig.adButtons.length, '个广告类型');
    validationResults.adButtons = true;
    
    AdConfig.adButtons.forEach((button, index) => {
      console.log(`  ${index + 1}. ${button.title} (${button.adType}): ${button.adId}`);
    });
  } else {
    console.log('❌ 广告按钮配置错误');
  }
  
  // 计算总体验证结果
  const totalChecks = Object.keys(validationResults).length;
  const passedChecks = Object.values(validationResults).filter(Boolean).length;
  const successRate = (passedChecks / totalChecks) * 100;
  
  console.log('\n📊 验证结果汇总:');
  console.log(`通过检查: ${passedChecks}/${totalChecks} (${successRate.toFixed(1)}%)`);
  
  if (successRate === 100) {
    console.log('🎉 所有配置验证通过！可以正常使用穿山甲广告');
  } else if (successRate >= 80) {
    console.log('⚠️  大部分配置正确，但有少量问题需要修复');
  } else {
    console.log('🚨 配置存在较多问题，请检查并修复');
  }
  
  return {
    success: successRate === 100,
    successRate,
    results: validationResults,
    config: AdConfig,
  };
};

/**
 * 显示穿山甲配置信息
 */
export const showPangleConfigInfo = () => {
  console.log('📋 穿山甲广告配置信息:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('应用信息:');
  console.log(`  应用ID: ${AdConfig.appId}`);
  console.log('\n广告位信息:');
  console.log(`  开屏广告: ${AdConfig.splashAdId}`);
  console.log(`  激励视频: ${AdConfig.rewardVideoAdId}`);
  console.log(`  插屏广告: ${AdConfig.interstitialAdId}`);
  console.log(`  Banner广告: ${AdConfig.bannerAdId}`);
  console.log('\n广告类型:');
  Object.entries(AdConfig.adTypes).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
};

// 导出给全局使用
if (typeof global !== 'undefined') {
  (global as any).validatePangleConfig = validatePangleConfig;
  (global as any).showPangleConfigInfo = showPangleConfigInfo;
}

// 自动运行验证（仅在开发环境）
if (__DEV__) {
  setTimeout(() => {
    showPangleConfigInfo();
    validatePangleConfig();
  }, 1000);
}