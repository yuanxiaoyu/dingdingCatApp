/**
 * 测试开屏广告修复
 * Test Splash Ad Fix
 */

import PangleAdService from '../services/PangleAdService';
import AdConfig from '../config/adConfig.js';

/**
 * 测试SDK返回值格式
 */
export const testSDKResponse = async () => {
  console.log('🧪 测试SDK返回值格式...');
  
  try {
    // 测试加载开屏广告
    const loadResult = await PangleAdService.loadSplashAd(AdConfig.splashAdId);
    console.log('SDK loadSplashAd 返回值:', loadResult);
    console.log('返回值类型:', typeof loadResult);
    console.log('返回值属性:', Object.keys(loadResult || {}));
    
    // 检查不同的判断条件
    console.log('判断结果:');
    console.log('- loadResult 存在:', !!loadResult);
    console.log('- loadResult.success:', loadResult?.success);
    console.log('- loadResult.status:', loadResult?.status);
    console.log('- loadResult.status === "loaded":', loadResult?.status === 'loaded');
    
    // 新的判断逻辑
    const shouldProceed = loadResult && loadResult.status === 'loaded';
    console.log('- 新判断逻辑结果:', shouldProceed);
    
    if (shouldProceed) {
      console.log('✅ 修复成功！现在会调用真实的穿山甲SDK展示广告');
    } else {
      console.log('❌ 仍然有问题，需要进一步调试');
    }
    
    return {
      loadResult,
      shouldProceed,
    };
    
  } catch (error) {
    console.error('测试SDK返回值失败:', error);
    return {
      error: error.message,
    };
  }
};

/**
 * 模拟完整的开屏广告流程
 */
export const simulateSplashAdFlow = async () => {
  console.log('🎬 模拟完整的开屏广告流程...');
  
  try {
    // 1. 加载广告
    console.log('1. 加载开屏广告...');
    const loadResult = await PangleAdService.loadSplashAd(AdConfig.splashAdId);
    console.log('加载结果:', loadResult);
    
    // 2. 检查加载结果
    if (!loadResult || loadResult.status !== 'loaded') {
      console.log('❌ 广告加载失败，会使用Mock显示');
      return { success: false, reason: 'Ad load failed' };
    }
    
    console.log('✅ 广告加载成功，准备展示真实广告');
    
    // 3. 展示广告
    console.log('2. 展示开屏广告...');
    const showResult = await PangleAdService.showSplashAd();
    console.log('展示结果:', showResult);
    
    // 4. 分析展示结果
    if (showResult) {
      console.log('✅ 广告展示成功！');
      console.log('展示状态:', showResult.status);
      
      return {
        success: true,
        loadResult,
        showResult,
      };
    } else {
      console.log('❌ 广告展示失败');
      return {
        success: false,
        reason: 'Ad show failed',
        loadResult,
      };
    }
    
  } catch (error) {
    console.error('模拟开屏广告流程失败:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// 导出给全局使用
if (typeof global !== 'undefined') {
  (global as any).testSplashAdFix = {
    testSDKResponse,
    simulateFlow: simulateSplashAdFlow,
  };
}

// 自动运行测试（仅在开发环境）
if (__DEV__) {
  setTimeout(() => {
    console.log('🔧 开屏广告修复测试工具已加载');
    console.log('运行 global.testSplashAdFix.testSDKResponse() 测试修复');
  }, 4000);
}