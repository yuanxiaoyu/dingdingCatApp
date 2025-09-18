/**
 * 调试应用流程
 * Debug App Flow
 */

import appFlowManager, { AppFlowState } from '../services/AppFlowManager';
import mockService from '../services/MockService';
import authService from '../services/AuthService';

/**
 * 调试应用流程决策
 */
export const debugAppFlow = async () => {
  console.log('🔍 调试应用流程决策...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // 1. 检查Mock服务状态
    console.log('\n1️⃣ Mock服务状态');
    const mockStatus = await mockService.getStatus();
    console.log('Mock状态:', mockStatus);
    
    // 2. 检查认证状态
    console.log('\n2️⃣ 认证状态');
    const isAuthenticated = await authService.isAuthenticated();
    console.log('是否已认证:', isAuthenticated);
    
    if (isAuthenticated) {
      const userInfo = await authService.getCurrentUser();
      console.log('当前用户:', userInfo);
    }
    
    // 3. 检查是否应该显示开屏广告
    console.log('\n3️⃣ 开屏广告决策');
    const shouldShowSplashAd = await mockService.shouldShowSplashAd();
    console.log('是否应该显示开屏广告:', shouldShowSplashAd);
    
    // 4. 执行应用流程决策
    console.log('\n4️⃣ 应用流程决策');
    await appFlowManager.initialize();
    const flowResult = await appFlowManager.determineAppFlow();
    console.log('流程决策结果:', flowResult);
    
    // 5. 分析结果
    console.log('\n📊 结果分析');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('应用状态:', flowResult.state);
    console.log('是否显示开屏广告:', flowResult.shouldShowSplashAd);
    console.log('是否已认证:', flowResult.isAuthenticated);
    console.log('用户ID:', flowResult.userId);
    
    if (flowResult.state === AppFlowState.SPLASH_AD) {
      console.log('✅ 应该显示开屏广告');
    } else if (flowResult.state === AppFlowState.LOGIN_REQUIRED) {
      console.log('ℹ️ 需要登录');
    } else if (flowResult.state === AppFlowState.MAIN_APP) {
      console.log('ℹ️ 直接进入主应用');
    } else {
      console.log('❌ 未知状态:', flowResult.state);
    }
    
    return flowResult;
    
  } catch (error) {
    console.error('调试应用流程失败:', error);
    return null;
  }
};

/**
 * 强制设置Mock状态并测试流程
 */
export const forceTestSplashAd = async () => {
  console.log('🚀 强制测试开屏广告流程...');
  
  try {
    // 1. 强制设置为已登录状态
    console.log('设置Mock状态为已登录...');
    await mockService.setMockState(mockService.MockUserState.LOGGED_IN);
    
    // 2. 等待一下让状态生效
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 3. 重新检查流程
    const flowResult = await debugAppFlow();
    
    if (flowResult?.state === AppFlowState.SPLASH_AD) {
      console.log('🎉 成功！应用流程现在会显示开屏广告');
      console.log('请重新启动应用或刷新页面');
    } else {
      console.log('❌ 仍然不会显示开屏广告，需要进一步调试');
    }
    
    return flowResult;
    
  } catch (error) {
    console.error('强制测试失败:', error);
    return null;
  }
};

/**
 * 检查SplashAdScreen是否被正确调用
 */
export const checkSplashAdScreen = () => {
  console.log('🎬 检查SplashAdScreen组件状态...');
  
  // 检查组件是否存在
  try {
    const SplashAdScreen = require('../components/SplashAdScreen.tsx').default;
    console.log('✅ SplashAdScreen组件存在');
    
    // 检查PangleAdService是否可用
    const PangleAdService = require('../services/PangleAdService.js').default;
    console.log('✅ PangleAdService服务存在');
    
    // 检查原生模块是否可用
    const { NativeModules } = require('react-native');
    const PangleAdModule = NativeModules.PangleAdModule;
    
    if (PangleAdModule) {
      console.log('✅ PangleAdModule原生模块可用');
      console.log('可用方法:', Object.keys(PangleAdModule));
    } else {
      console.log('❌ PangleAdModule原生模块不可用');
      console.log('这可能是开屏广告不显示的原因');
    }
    
  } catch (error) {
    console.error('检查组件时出错:', error);
  }
};

// 导出给全局使用
if (typeof global !== 'undefined') {
  (global as any).debugAppFlow = debugAppFlow;
  (global as any).forceTestSplashAd = forceTestSplashAd;
  (global as any).checkSplashAdScreen = checkSplashAdScreen;
}

// 自动运行调试（仅在开发环境）
if (__DEV__) {
  setTimeout(() => {
    console.log('🔧 应用流程调试工具已加载');
    console.log('运行以下命令进行调试:');
    console.log('- global.debugAppFlow() - 调试应用流程');
    console.log('- global.forceTestSplashAd() - 强制测试开屏广告');
    console.log('- global.checkSplashAdScreen() - 检查组件状态');
  }, 3000);
}