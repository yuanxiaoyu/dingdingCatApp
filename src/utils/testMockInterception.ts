/**
 * Mock拦截测试工具
 * 验证所有API请求都被正确拦截
 */

import mockModeController from './mockModeController';
import configService from '../services/ConfigService';
import adService from '../services/AdService';
import authService from '../services/AuthService';
import { AdType } from '../types';

// 网络请求监控
let networkRequestCount = 0;
let networkRequests: Array<{ method: string; url: string; timestamp: number }> = [];

/**
 * 拦截fetch请求来监控网络调用
 */
function interceptNetworkRequests() {
  const originalFetch = global.fetch;
  
  global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method || 'GET';
    
    // 记录网络请求
    networkRequestCount++;
    networkRequests.push({
      method: method.toUpperCase(),
      url,
      timestamp: Date.now(),
    });
    
    console.warn(`🚨 检测到网络请求 #${networkRequestCount}: ${method} ${url}`);
    
    // 调用原始fetch
    return originalFetch(input, init);
  };
}

/**
 * 重置网络请求计数
 */
function resetNetworkRequestCount() {
  networkRequestCount = 0;
  networkRequests = [];
}

/**
 * 测试所有API的Mock拦截
 */
export async function testMockInterception(): Promise<{
  success: boolean;
  message: string;
  networkRequestCount: number;
  networkRequests: Array<{ method: string; url: string; timestamp: number }>;
  testResults: Array<{ 
    category: string;
    test: string; 
    success: boolean; 
    error?: string;
    duration?: number;
  }>;
  mockStatus: any;
}> {
  console.log('🔍 开始测试Mock拦截功能...\\n');
  
  // 重置计数器
  resetNetworkRequestCount();
  
  // 开始拦截网络请求
  interceptNetworkRequests();
  
  // 初始化Mock控制器
  await mockModeController.initialize();
  
  // 确保Mock模式启用
  await mockModeController.enableMockMode();
  
  const testResults = [];
  const startTime = Date.now();
  
  try {
    // 1. 测试认证相关API
    console.log('1️⃣ 测试认证相关API...');
    
    try {
      const testStart = Date.now();
      const loginResult = await authService.wechatLogin();
      testResults.push({ 
        category: '认证',
        test: '微信登录', 
        success: true,
        duration: Date.now() - testStart
      });
    } catch (error) {
      testResults.push({ 
        category: '认证',
        test: '微信登录', 
        success: false, 
        error: (error as Error).message 
      });
    }
    
    try {
      const testStart = Date.now();
      const userInfo = await authService.getUserInfo();
      testResults.push({ 
        category: '认证',
        test: '获取用户信息', 
        success: true,
        duration: Date.now() - testStart
      });
    } catch (error) {
      testResults.push({ 
        category: '认证',
        test: '获取用户信息', 
        success: false, 
        error: (error as Error).message 
      });
    }

    // 2. 测试配置相关API
    console.log('2️⃣ 测试配置相关API...');
    
    const configTests = [
      { name: '应用配置', method: () => configService.getAppConfig(true) },
      { name: '广告配置', method: () => configService.getAdConfig(true) },
      { name: '风控配置', method: () => configService.getRiskConfig(true) },
      { name: '渠道配置', method: () => configService.getChannelConfig(true) },
    ];
    
    for (const configTest of configTests) {
      try {
        const testStart = Date.now();
        await configTest.method();
        testResults.push({ 
          category: '配置',
          test: configTest.name, 
          success: true,
          duration: Date.now() - testStart
        });
      } catch (error) {
        testResults.push({ 
          category: '配置',
          test: configTest.name, 
          success: false, 
          error: (error as Error).message 
        });
      }
    }

    // 3. 测试广告相关API
    console.log('3️⃣ 测试广告相关API...');
    
    const testUserId = 1001;
    
    const adTests = [
      { 
        name: 'Banner广告请求', 
        method: () => adService.requestBannerAd(testUserId) 
      },
      { 
        name: '视频广告请求', 
        method: () => adService.requestRewardVideoAd(testUserId) 
      },
      { 
        name: '广告展示上报', 
        method: () => adService.reportAdShowNow(testUserId, 'test_ad_123', AdType.BANNER) 
      },
      { 
        name: '广告点击上报', 
        method: () => adService.reportAdClickNow(testUserId, 'test_ad_123', AdType.BANNER) 
      },
      { 
        name: '广告完播上报', 
        method: () => adService.reportAdCompleteNow(testUserId, 'test_ad_123', AdType.REWARD_VIDEO, 30, false) 
      },
      { 
        name: '收益数据获取', 
        method: () => adService.getUserRevenue(testUserId) 
      },
      { 
        name: '广告历史获取', 
        method: () => adService.getAdHistory({
          userId: testUserId,
          pageNum: 1,
          pageSize: 10
        }) 
      },
    ];
    
    for (const adTest of adTests) {
      try {
        const testStart = Date.now();
        await adTest.method();
        testResults.push({ 
          category: '广告',
          test: adTest.name, 
          success: true,
          duration: Date.now() - testStart
        });
      } catch (error) {
        testResults.push({ 
          category: '广告',
          test: adTest.name, 
          success: false, 
          error: (error as Error).message 
        });
      }
    }

    // 4. 等待一段时间确保所有异步操作完成
    await new Promise(resolve => setTimeout(resolve, 1000));
    
  } catch (error) {
    testResults.push({ 
      category: '整体',
      test: '整体测试', 
      success: false, 
      error: (error as Error).message 
    });
  }
  
  const totalDuration = Date.now() - startTime;
  
  // 分析结果
  const success = networkRequestCount === 0;
  const successfulTests = testResults.filter(r => r.success).length;
  const totalTests = testResults.length;
  
  const message = success 
    ? `✅ Mock拦截测试成功！所有 ${totalTests} 个API调用都被Mock拦截，没有发送网络请求。`
    : `❌ Mock拦截测试失败！检测到 ${networkRequestCount} 个网络请求，${successfulTests}/${totalTests} 个测试通过。`;
  
  console.log(`\\n📊 测试结果: ${message}`);
  console.log(`⏱️ 总耗时: ${totalDuration}ms`);
  
  if (networkRequestCount > 0) {
    console.log('\\n🚨 检测到的网络请求:');
    networkRequests.forEach((req, index) => {
      console.log(`  ${index + 1}. ${req.method} ${req.url}`);
    });
  }
  
  console.log('\\n📋 测试结果汇总:');
  const categories = [...new Set(testResults.map(r => r.category))];
  categories.forEach(category => {
    const categoryTests = testResults.filter(r => r.category === category);
    const categorySuccess = categoryTests.filter(r => r.success).length;
    console.log(`\\n  📁 ${category} (${categorySuccess}/${categoryTests.length})`);
    
    categoryTests.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      const duration = result.duration ? ` (${result.duration}ms)` : '';
      console.log(`    ${status} ${result.test}${duration}`);
      if (result.error) {
        console.log(`       错误: ${result.error}`);
      }
    });
  });
  
  const mockStatus = mockModeController.getDebugInfo();
  console.log('\\n🎭 Mock状态:', mockStatus);
  
  return {
    success,
    message,
    networkRequestCount,
    networkRequests,
    testResults,
    mockStatus,
  };
}

/**
 * 快速测试Mock模式切换
 */
export async function testMockModeToggle(): Promise<void> {
  console.log('🔄 测试Mock模式切换...');
  
  // 获取初始状态
  const initialStatus = mockModeController.getMockModeStatus();
  console.log('初始状态:', initialStatus);
  
  // 切换模式
  const newEnabled = await mockModeController.toggleMockMode();
  console.log(`模式已切换为: ${newEnabled ? '启用' : '禁用'}`);
  
  // 验证状态
  const newStatus = mockModeController.getMockModeStatus();
  console.log('新状态:', newStatus);
  
  // 恢复初始状态
  if (newStatus.enabled !== initialStatus.enabled) {
    await mockModeController.toggleMockMode();
    console.log('已恢复初始状态');
  }
}

// 在开发环境下暴露到全局
if (__DEV__) {
  (global as any).testMockInterception = testMockInterception;
  (global as any).testMockModeToggle = testMockModeToggle;
  
  console.log('Mock拦截测试工具已加载:');
  console.log('- 运行 testMockInterception() 测试Mock拦截');
  console.log('- 运行 testMockModeToggle() 测试模式切换');
}

export default {
  testMockInterception,
  testMockModeToggle,
};