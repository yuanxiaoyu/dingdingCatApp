/**
 * Mock数据验证工具
 * 确保Mock数据格式与真实API响应格式完全一致
 */

import mockService from '../services/MockService';
import { AdType } from '../types';
import { ENV_CONFIG } from '../config/env';

/**
 * 验证Mock数据格式是否正确
 */
export async function validateMockDataFormats(): Promise<{
  success: boolean;
  message: string;
  validations: Array<{ api: string; valid: boolean; issues: string[] }>;
}> {
  const validations = [];
  let allValid = true;

  console.log('🔍 开始验证Mock数据格式...');

  // 验证用户登录数据格式
  try {
    const loginData = await mockService.mockWechatLogin(ENV_CONFIG.APP_KEY, 'test_code');
    const loginIssues = [];
    
    if (!loginData.accessToken) loginIssues.push('缺少accessToken字段');
    if (!loginData.userId) loginIssues.push('缺少userId字段');
    if (!loginData.userName) loginIssues.push('缺少userName字段');
    if (!loginData.nickName) loginIssues.push('缺少nickName字段');
    if (loginData.expiresIn !== 1800) loginIssues.push('expiresIn应为1800秒');
    
    validations.push({
      api: '微信登录接口',
      valid: loginIssues.length === 0,
      issues: loginIssues
    });
    
    if (loginIssues.length > 0) allValid = false;
  } catch (error) {
    validations.push({
      api: '微信登录接口',
      valid: false,
      issues: [`接口调用失败: ${(error as Error).message}`]
    });
    allValid = false;
  }

  // 验证应用配置数据格式
  try {
    const appConfig = await mockService.mockGetAppConfig(ENV_CONFIG.APP_KEY);
    const configIssues = [];
    
    if (!appConfig.appKey) configIssues.push('缺少appKey字段');
    if (!appConfig.appName) configIssues.push('缺少appName字段');
    if (!appConfig.serverTime) configIssues.push('缺少serverTime字段');
    if (!appConfig.configVersion) configIssues.push('缺少configVersion字段');
    if (!Array.isArray(appConfig.channels)) configIssues.push('channels应为数组');
    
    validations.push({
      api: '应用配置接口',
      valid: configIssues.length === 0,
      issues: configIssues
    });
    
    if (configIssues.length > 0) allValid = false;
  } catch (error) {
    validations.push({
      api: '应用配置接口',
      valid: false,
      issues: [`接口调用失败: ${(error as Error).message}`]
    });
    allValid = false;
  }

  // 验证广告配置数据格式
  try {
    const adConfig = await mockService.getMockAdConfig();
    const adConfigIssues = [];
    
    if (!adConfig.splashAdConfig) adConfigIssues.push('缺少splashAdConfig配置');
    if (!adConfig.bannerAdConfig) adConfigIssues.push('缺少bannerAdConfig配置');
    if (!adConfig.rewardVideoAdConfig) adConfigIssues.push('缺少rewardVideoAdConfig配置');
    if (!adConfig.interstitialAdConfig) adConfigIssues.push('缺少interstitialAdConfig配置');
    
    // 验证开屏广告配置
    if (adConfig.splashAdConfig) {
      if (!adConfig.splashAdConfig.adId) adConfigIssues.push('splashAdConfig缺少adId');
      if (typeof adConfig.splashAdConfig.enabled !== 'boolean') adConfigIssues.push('splashAdConfig.enabled应为布尔值');
    }
    
    validations.push({
      api: '广告配置接口',
      valid: adConfigIssues.length === 0,
      issues: adConfigIssues
    });
    
    if (adConfigIssues.length > 0) allValid = false;
  } catch (error) {
    validations.push({
      api: '广告配置接口',
      valid: false,
      issues: [`接口调用失败: ${(error as Error).message}`]
    });
    allValid = false;
  }

  // 验证广告请求数据格式
  try {
    const adRequest = await mockService.mockAdRequest(1001, AdType.BANNER);
    const adRequestIssues = [];
    
    if (!adRequest.adId) adRequestIssues.push('缺少adId字段');
    if (!adRequest.adType) adRequestIssues.push('缺少adType字段');
    if (!adRequest.adTitle) adRequestIssues.push('缺少adTitle字段');
    if (typeof adRequest.expectedReward !== 'number') adRequestIssues.push('expectedReward应为数字');
    if (!adRequest.configParams) adRequestIssues.push('缺少configParams字段');
    
    validations.push({
      api: '广告请求接口',
      valid: adRequestIssues.length === 0,
      issues: adRequestIssues
    });
    
    if (adRequestIssues.length > 0) allValid = false;
  } catch (error) {
    validations.push({
      api: '广告请求接口',
      valid: false,
      issues: [`接口调用失败: ${(error as Error).message}`]
    });
    allValid = false;
  }

  // 验证收益数据格式
  try {
    const revenueData = await mockService.mockGetRevenue(1001);
    const revenueIssues = [];
    
    if (typeof revenueData.totalRevenue !== 'number') revenueIssues.push('totalRevenue应为数字');
    if (typeof revenueData.todayRevenue !== 'number') revenueIssues.push('todayRevenue应为数字');
    if (typeof revenueData.totalWatchCount !== 'number') revenueIssues.push('totalWatchCount应为数字');
    if (typeof revenueData.remainingWatchCount !== 'number') revenueIssues.push('remainingWatchCount应为数字');
    if (!revenueData.accountStatus) revenueIssues.push('缺少accountStatus字段');
    
    validations.push({
      api: '收益统计接口',
      valid: revenueIssues.length === 0,
      issues: revenueIssues
    });
    
    if (revenueIssues.length > 0) allValid = false;
  } catch (error) {
    validations.push({
      api: '收益统计接口',
      valid: false,
      issues: [`接口调用失败: ${(error as Error).message}`]
    });
    allValid = false;
  }

  return {
    success: allValid,
    message: allValid ? '所有Mock数据格式验证通过' : '部分Mock数据格式存在问题',
    validations: validations
  };
}

/**
 * 验证adConfig.js配置是否正确
 */
export function validateAdConfigJS(): {
  success: boolean;
  message: string;
  issues: string[];
} {
  const issues = [];

  try {
    // 动态导入adConfig
    const AdConfig = require('../config/adConfig').default;
    
    // 验证基本字段
    if (!AdConfig.appId) issues.push('缺少appId配置');
    if (!AdConfig.splashAdId) issues.push('缺少splashAdId配置');
    if (!AdConfig.bannerAdId) issues.push('缺少bannerAdId配置');
    if (!AdConfig.rewardVideoAdId) issues.push('缺少rewardVideoAdId配置');
    if (!AdConfig.interstitialAdId) issues.push('缺少interstitialAdId配置');
    
    // 验证广告按钮配置
    if (!Array.isArray(AdConfig.adButtons)) {
      issues.push('adButtons应为数组');
    } else {
      AdConfig.adButtons.forEach((button: any, index: number) => {
        if (!button.title) issues.push(`adButtons[${index}]缺少title`);
        if (!button.adType) issues.push(`adButtons[${index}]缺少adType`);
        if (!button.adId) issues.push(`adButtons[${index}]缺少adId`);
        if (typeof button.enabled !== 'boolean') issues.push(`adButtons[${index}].enabled应为布尔值`);
      });
    }
    
    // 验证广告ID格式（穿山甲测试ID通常是数字）
    const adIds = [AdConfig.splashAdId, AdConfig.bannerAdId, AdConfig.rewardVideoAdId, AdConfig.interstitialAdId];
    adIds.forEach((adId, index) => {
      const adTypes = ['splash', 'banner', 'rewardVideo', 'interstitial'];
      if (adId && !/^\d+$/.test(adId)) {
        issues.push(`${adTypes[index]}AdId格式可能不正确，穿山甲测试ID通常为纯数字`);
      }
    });
    
    console.log('✅ adConfig.js配置验证:', {
      appId: AdConfig.appId,
      splashAdId: AdConfig.splashAdId,
      bannerAdId: AdConfig.bannerAdId,
      buttonsCount: AdConfig.adButtons?.length || 0
    });
    
  } catch (error) {
    issues.push(`无法加载adConfig.js: ${(error as Error).message}`);
  }

  return {
    success: issues.length === 0,
    message: issues.length === 0 ? 'adConfig.js配置验证通过' : 'adConfig.js配置存在问题',
    issues: issues
  };
}

/**
 * 完整的Mock数据验证
 */
export async function runCompleteValidation(): Promise<void> {
  console.log('🔍 开始完整的Mock数据验证...\n');

  // 1. 验证adConfig.js配置
  console.log('📋 验证adConfig.js配置...');
  const adConfigValidation = validateAdConfigJS();
  console.log(`结果: ${adConfigValidation.success ? '✅ 通过' : '❌ 失败'}`);
  console.log(`信息: ${adConfigValidation.message}`);
  if (adConfigValidation.issues.length > 0) {
    console.log('问题:');
    adConfigValidation.issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  }

  // 2. 验证Mock数据格式
  console.log('\n📊 验证Mock数据格式...');
  const mockDataValidation = await validateMockDataFormats();
  console.log(`结果: ${mockDataValidation.success ? '✅ 通过' : '❌ 失败'}`);
  console.log(`信息: ${mockDataValidation.message}`);
  
  if (!mockDataValidation.success) {
    console.log('\n详细验证结果:');
    mockDataValidation.validations.forEach((validation, index) => {
      const status = validation.valid ? '✅' : '❌';
      console.log(`  ${index + 1}. ${status} ${validation.api}`);
      if (validation.issues.length > 0) {
        validation.issues.forEach(issue => {
          console.log(`     - ${issue}`);
        });
      }
    });
  }

  // 3. 验证Mock服务状态
  console.log('\n⚙️ 验证Mock服务状态...');
  try {
    await mockService.initialize();
    const mockStatus = mockService.getStatus();
    console.log('Mock服务状态:', {
      初始化: mockStatus.isInitialized ? '✅' : '❌',
      Mock模式: mockStatus.isMockModeEnabled ? '✅ 启用' : '❌ 禁用',
      用户状态: mockStatus.currentState,
      环境状态: mockStatus.envState,
      用户登录: mockStatus.shouldUserBeLoggedIn ? '✅' : '❌'
    });
  } catch (error) {
    console.log('❌ Mock服务状态检查失败:', (error as Error).message);
  }

  // 4. 总结
  console.log('\n📈 验证总结:');
  const allSuccess = adConfigValidation.success && mockDataValidation.success;
  
  if (allSuccess) {
    console.log('🎉 所有验证都通过了！');
    console.log('💡 Mock数据配置正确，应用应该能正常显示用户信息和广告位。');
    console.log('🚀 现在可以启动应用进行测试。');
  } else {
    console.log('⚠️  验证发现问题，请根据上述信息进行修复。');
    
    const suggestions = [];
    if (!adConfigValidation.success) {
      suggestions.push('检查并修复adConfig.js配置文件');
    }
    if (!mockDataValidation.success) {
      suggestions.push('检查MockService中的数据格式');
    }
    
    console.log('\n💡 修复建议:');
    suggestions.forEach((suggestion, index) => {
      console.log(`  ${index + 1}. ${suggestion}`);
    });
  }
}

/**
 * 在开发环境下暴露验证函数到全局
 */
if (__DEV__) {
  (global as any).runCompleteValidation = runCompleteValidation;
  (global as any).validateMockDataFormats = validateMockDataFormats;
  (global as any).validateAdConfigJS = validateAdConfigJS;
  
  console.log('Mock数据验证工具已加载:');
  console.log('- 运行 runCompleteValidation() 进行完整验证');
  console.log('- 运行 validateMockDataFormats() 验证数据格式');
  console.log('- 运行 validateAdConfigJS() 验证广告配置');
}

export default {
  validateMockDataFormats,
  validateAdConfigJS,
  runCompleteValidation
};