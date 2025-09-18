/**
 * 直接测试穿山甲SDK
 * Test Pangle SDK Directly
 */

import PangleAdService from '../services/PangleAdService';
import AdConfig from '../config/adConfig.js';

/**
 * 直接测试穿山甲SDK，不依赖网络
 */
export const testPangleDirectly = async () => {
  console.log('🎯 直接测试穿山甲SDK（无网络依赖）...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // 1. 检查SDK状态
    console.log('\n1️⃣ 检查SDK状态');
    const isInitialized = await PangleAdService.isSDKInitialized();
    const isStarted = await PangleAdService.isSDKStarted();
    
    console.log('SDK初始化状态:', isInitialized);
    console.log('SDK启动状态:', isStarted);
    
    if (!isInitialized || !isStarted) {
      console.log('⚠️ SDK未正确初始化，尝试重新初始化...');
      await PangleAdService.initializeAndStartSDK(AdConfig.appId);
    }
    
    // 2. 加载开屏广告
    console.log('\n2️⃣ 加载开屏广告');
    console.log('使用广告位ID:', AdConfig.splashAdId);
    
    const loadResult = await PangleAdService.loadSplashAd(AdConfig.splashAdId);
    console.log('加载结果:', loadResult);
    
    if (!loadResult || loadResult.status !== 'loaded') {
      console.log('❌ 广告加载失败');
      return {
        success: false,
        step: 'load',
        result: loadResult,
      };
    }
    
    console.log('✅ 广告加载成功');
    
    // 3. 展示开屏广告
    console.log('\n3️⃣ 展示开屏广告');
    const showResult = await PangleAdService.showSplashAd();
    console.log('展示结果:', showResult);
    
    if (showResult) {
      console.log('🎉 广告展示成功！');
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
        step: 'show',
        loadResult,
        showResult,
      };
    }
    
  } catch (error) {
    console.error('直接测试穿山甲SDK失败:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 简化的开屏广告测试（跳过所有网络请求）
 */
export const testSplashAdSimple = async () => {
  console.log('🚀 简化开屏广告测试（无网络）...');
  
  try {
    // 直接调用穿山甲SDK
    const result = await testPangleDirectly();
    
    if (result.success) {
      console.log('🎉 成功！穿山甲开屏广告可以正常展示');
      console.log('这证明SDK集成是正确的，问题在于网络请求');
    } else {
      console.log('❌ 穿山甲SDK本身有问题');
      console.log('失败步骤:', result.step);
      console.log('错误信息:', result.error);
    }
    
    return result;
    
  } catch (error) {
    console.error('简化测试失败:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 检查原生模块状态
 */
export const checkNativeModule = () => {
  console.log('🔍 检查原生模块状态...');
  
  try {
    const { NativeModules } = require('react-native');
    const PangleAdModule = NativeModules.PangleAdModule;
    
    if (PangleAdModule) {
      console.log('✅ PangleAdModule 可用');
      console.log('可用方法:', Object.keys(PangleAdModule));
      
      // 检查关键方法
      const requiredMethods = [
        'initializeSDK',
        'startSDK',
        'loadSplashAd',
        'showSplashAd',
        'isSDKInitialized',
        'isSDKStarted'
      ];
      
      const missingMethods = requiredMethods.filter(method => !PangleAdModule[method]);
      
      if (missingMethods.length === 0) {
        console.log('✅ 所有必需方法都可用');
      } else {
        console.log('❌ 缺少方法:', missingMethods);
      }
      
      return {
        available: true,
        methods: Object.keys(PangleAdModule),
        missingMethods,
      };
      
    } else {
      console.log('❌ PangleAdModule 不可用');
      console.log('这可能是开屏广告不显示的根本原因');
      
      return {
        available: false,
        reason: 'PangleAdModule not found',
      };
    }
    
  } catch (error) {
    console.error('检查原生模块失败:', error);
    return {
      available: false,
      error: error.message,
    };
  }
};

// 导出给全局使用
if (typeof global !== 'undefined') {
  (global as any).testPangleDirectly = testPangleDirectly;
  (global as any).testSplashAdSimple = testSplashAdSimple;
  (global as any).checkNativeModule = checkNativeModule;
}

// 自动运行检查（仅在开发环境）
if (__DEV__) {
  setTimeout(() => {
    console.log('🔧 穿山甲直接测试工具已加载');
    console.log('运行以下命令:');
    console.log('- global.checkNativeModule() - 检查原生模块');
    console.log('- global.testPangleDirectly() - 直接测试SDK');
    console.log('- global.testSplashAdSimple() - 简化测试');
  }, 5000);
}