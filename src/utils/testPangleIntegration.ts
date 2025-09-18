/**
 * 测试穿山甲SDK集成
 * Test Pangle SDK Integration
 */

import PangleAdService from '../services/PangleAdService';
import mockService from '../services/MockService';
import appFlowManager from '../services/AppFlowManager';
import AdConfig from '../config/adConfig.js';

/**
 * 测试穿山甲SDK初始化
 */
export const testPangleSDKInit = async () => {
  console.log('🚀 测试穿山甲SDK初始化...');
  
  try {
    // 1. 检查配置
    console.log('穿山甲配置:', AdConfig);
    
    // 2. 初始化SDK
    console.log('正在初始化穿山甲SDK...');
    await PangleAdService.initializeAndStartSDK(AdConfig.appId);
    
    // 3. 检查SDK状态
    const isInitialized = await PangleAdService.isSDKInitialized();
    const isStarted = await PangleAdService.isSDKStarted();
    
    console.log('SDK状态:', {
      initialized: isInitialized,
      started: isStarted,
    });
    
    // 4. 获取SDK版本
    try {
      const version = await PangleAdService.getSDKVersion();
      console.log('SDK版本:', version);
    } catch (error) {
      console.log('无法获取SDK版本:', error.message);
    }
    
    return {
      success: isInitialized && isStarted,
      initialized: isInitialized,
      started: isStarted,
    };
    
  } catch (error) {
    console.error('穿山甲SDK初始化失败:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 测试开屏广告加载和展示
 */
export const testSplashAdFlow = async () => {
  console.log('🎬 测试开屏广告流程...');
  
  try {
    // 1. 确保SDK已初始化
    const sdkStatus = await testPangleSDKInit();
    if (!sdkStatus.success) {
      throw new Error('SDK未正确初始化');
    }
    
    // 2. 测试广告加载
    console.log('正在加载开屏广告...');
    const loadResult = await PangleAdService.loadSplashAd(AdConfig.splashAdId);
    console.log('广告加载结果:', loadResult);
    
    // 3. 检查广告是否已加载
    const isLoaded = await PangleAdService.isSplashAdLoaded();
    console.log('广告是否已加载:', isLoaded);
    
    if (!isLoaded) {
      throw new Error('广告加载失败');
    }
    
    // 4. 展示广告（注意：这会实际显示广告）
    console.log('正在展示开屏广告...');
    const showResult = await PangleAdService.showSplashAd();
    console.log('广告展示结果:', showResult);
    
    return {
      success: true,
      loadResult,
      showResult,
      isLoaded,
    };
    
  } catch (error) {
    console.error('开屏广告测试失败:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 测试应用流程管理
 */
export const testAppFlowWithAds = async () => {
  console.log('📱 测试应用流程管理...');
  
  try {
    // 1. 初始化应用流程管理器
    await appFlowManager.initialize();
    
    // 2. 设置Mock状态为已登录（这样会显示开屏广告）
    await mockService.setMockState(mockService.MockUserState.LOGGED_IN);
    
    // 3. 获取应用流程状态
    const flowResult = await appFlowManager.determineAppFlow();
    console.log('应用流程结果:', flowResult);
    
    // 4. 检查是否应该显示开屏广告
    if (flowResult.shouldShowSplashAd) {
      console.log('✅ 应用流程正确：应该显示开屏广告');
      
      // 5. 测试开屏广告流程
      const adResult = await testSplashAdFlow();
      
      return {
        success: true,
        flowResult,
        adResult,
      };
    } else {
      console.log('ℹ️ 应用流程：不需要显示开屏广告');
      
      return {
        success: true,
        flowResult,
        adResult: null,
      };
    }
    
  } catch (error) {
    console.error('应用流程测试失败:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 完整的穿山甲集成测试
 */
export const runFullPangleTest = async () => {
  console.log('🧪 开始完整的穿山甲集成测试');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const results = {
    sdkInit: null,
    splashAd: null,
    appFlow: null,
  };
  
  try {
    // 1. 测试SDK初始化
    console.log('\n1️⃣ 测试SDK初始化');
    results.sdkInit = await testPangleSDKInit();
    
    if (results.sdkInit.success) {
      console.log('✅ SDK初始化成功');
      
      // 2. 测试开屏广告
      console.log('\n2️⃣ 测试开屏广告');
      results.splashAd = await testSplashAdFlow();
      
      if (results.splashAd.success) {
        console.log('✅ 开屏广告测试成功');
      } else {
        console.log('❌ 开屏广告测试失败:', results.splashAd.error);
      }
      
      // 3. 测试应用流程
      console.log('\n3️⃣ 测试应用流程');
      results.appFlow = await testAppFlowWithAds();
      
      if (results.appFlow.success) {
        console.log('✅ 应用流程测试成功');
      } else {
        console.log('❌ 应用流程测试失败:', results.appFlow.error);
      }
      
    } else {
      console.log('❌ SDK初始化失败，跳过后续测试');
    }
    
  } catch (error) {
    console.error('测试过程中出现错误:', error);
  }
  
  // 输出测试总结
  console.log('\n📊 测试结果总结');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SDK初始化:', results.sdkInit?.success ? '✅ 成功' : '❌ 失败');
  console.log('开屏广告:', results.splashAd?.success ? '✅ 成功' : '❌ 失败');
  console.log('应用流程:', results.appFlow?.success ? '✅ 成功' : '❌ 失败');
  
  const overallSuccess = results.sdkInit?.success && 
                        results.splashAd?.success && 
                        results.appFlow?.success;
  
  if (overallSuccess) {
    console.log('\n🎉 所有测试通过！穿山甲集成成功！');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查配置和实现');
  }
  
  return {
    success: overallSuccess,
    results,
  };
};

// 导出给全局使用
if (typeof global !== 'undefined') {
  (global as any).testPangleIntegration = {
    testSDKInit: testPangleSDKInit,
    testSplashAd: testSplashAdFlow,
    testAppFlow: testAppFlowWithAds,
    runFullTest: runFullPangleTest,
  };
}

// 自动运行测试（仅在开发环境）
if (__DEV__) {
  setTimeout(() => {
    console.log('🔧 穿山甲集成测试工具已加载');
    console.log('运行 global.testPangleIntegration.runFullTest() 进行完整测试');
  }, 2000);
}