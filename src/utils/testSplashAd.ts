/**
 * 测试开屏广告功能
 * Test Splash Ad Functionality
 */

import mockService from '../services/MockService';
import configService from '../services/ConfigService';
import adService from '../services/AdService';
import { AdType } from '../types';
import AdConfig from '../config/adConfig.js';

/**
 * 测试开屏广告配置
 */
export const testSplashAdConfig = async () => {
  console.log('=== 测试开屏广告配置 ===');
  
  try {
    // 1. 测试穿山甲配置
    console.log('穿山甲广告配置:', AdConfig);
    console.log('应用ID:', AdConfig.appId);
    console.log('开屏广告位ID:', AdConfig.splashAdId);
    
    // 2. 测试Mock服务配置
    const mockAdConfig = await mockService.getMockAdConfig();
    console.log('Mock广告配置:', mockAdConfig);
    console.log('开屏广告配置:', mockAdConfig.splashAdConfig);
    
    // 3. 测试是否应该显示开屏广告
    const shouldShow = await mockService.shouldShowSplashAd();
    console.log('是否应该显示开屏广告:', shouldShow);
    
    // 4. 测试广告请求
    if (shouldShow) {
      console.log('正在请求开屏广告...');
      
      const adRequest = {
        userId: 12345,
        appKey: 'test_app_key',
        adType: AdType.SPLASH,
        deviceInfo: {
          deviceId: 'test_device_id',
          osVersion: '14.0',
          appVersion: '1.0.0',
          deviceModel: 'iPhone 12',
          screenWidth: 375,
          screenHeight: 812,
        },
        ipAddress: '127.0.0.1',
      };
      
      try {
        const adResponse = await adService.requestAd(adRequest);
        console.log('广告请求成功:', adResponse);
        
        // 测试广告展示上报
        if (adResponse.adId) {
          console.log('上报广告展示...');
          await adService.reportAdShow({
            userId: adRequest.userId,
            appKey: adRequest.appKey,
            adId: adResponse.adId,
            adType: AdType.SPLASH,
            showTime: Date.now(),
            ipAddress: adRequest.ipAddress,
          });
          console.log('广告展示上报成功');
        }
        
      } catch (error) {
        console.error('广告请求失败:', error);
      }
    }
    
    return {
      success: true,
      pangleConfig: AdConfig,
      mockConfig: mockAdConfig,
      shouldShow,
    };
    
  } catch (error) {
    console.error('测试开屏广告配置失败:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 测试开屏广告流程
 */
export const testSplashAdFlow = async () => {
  console.log('=== 测试开屏广告流程 ===');
  
  try {
    // 1. 检查Mock状态
    const mockStatus = await mockService.getStatus();
    console.log('Mock服务状态:', mockStatus);
    
    // 2. 如果是Mock模式，测试不同的用户状态
    if (mockStatus.isMockModeEnabled) {
      console.log('当前处于Mock模式，测试不同用户状态...');
      
      // 测试未登录状态
      await mockService.setMockState(mockService.MockUserState.NOT_LOGGED_IN);
      const shouldShowNotLoggedIn = await mockService.shouldShowSplashAd();
      console.log('未登录状态是否显示开屏广告:', shouldShowNotLoggedIn);
      
      // 测试已登录状态
      await mockService.setMockState(mockService.MockUserState.LOGGED_IN);
      const shouldShowLoggedIn = await mockService.shouldShowSplashAd();
      console.log('已登录状态是否显示开屏广告:', shouldShowLoggedIn);
      
      // 测试首次用户状态
      await mockService.setMockState(mockService.MockUserState.FIRST_TIME_USER);
      const shouldShowFirstTime = await mockService.shouldShowSplashAd();
      console.log('首次用户状态是否显示开屏广告:', shouldShowFirstTime);
    }
    
    // 3. 测试广告配置获取
    const adConfig = await configService.getAdConfig();
    console.log('服务器广告配置:', adConfig);
    
    return {
      success: true,
      mockStatus,
      adConfig,
    };
    
  } catch (error) {
    console.error('测试开屏广告流程失败:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 完整的开屏广告测试
 */
export const runFullSplashAdTest = async () => {
  console.log('🚀 开始完整的开屏广告测试');
  
  const configTest = await testSplashAdConfig();
  const flowTest = await testSplashAdFlow();
  
  const results = {
    configTest,
    flowTest,
    summary: {
      configSuccess: configTest.success,
      flowSuccess: flowTest.success,
      overallSuccess: configTest.success && flowTest.success,
    }
  };
  
  console.log('📊 测试结果汇总:', results.summary);
  
  if (results.summary.overallSuccess) {
    console.log('✅ 开屏广告测试全部通过！');
  } else {
    console.log('❌ 开屏广告测试存在问题，请检查配置');
  }
  
  return results;
};

// 导出给全局使用
if (typeof global !== 'undefined') {
  (global as any).testSplashAd = {
    testConfig: testSplashAdConfig,
    testFlow: testSplashAdFlow,
    runFullTest: runFullSplashAdTest,
  };
}