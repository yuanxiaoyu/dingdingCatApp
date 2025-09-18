/**
 * Mock API接口测试工具
 * 用于验证所有Mock接口是否正常工作，确保应用逻辑正确
 */

import mockService, { MockUserState } from '../services/MockService';
import { AdType } from '../types';
import { ENV_CONFIG } from '../config/env';

export interface MockAPITestResult {
  testName: string;
  success: boolean;
  duration: number;
  error?: string;
  data?: any;
}

export class MockAPITester {
  private testResults: MockAPITestResult[] = [];

  /**
   * 测试用户认证相关接口
   */
  public async testAuthAPIs(): Promise<MockAPITestResult[]> {
    const results: MockAPITestResult[] = [];

    // 测试微信登录
    const loginTest = await this.runTest('微信登录接口', async () => {
      return await mockService.mockWechatLogin(ENV_CONFIG.APP_KEY, 'test_code_123');
    });
    results.push(loginTest);

    // 测试微信注册
    const registerTest = await this.runTest('微信注册接口', async () => {
      return await mockService.mockWechatRegister(ENV_CONFIG.APP_KEY, 'test_code_123', '测试用户', '13800138000');
    });
    results.push(registerTest);

    // 测试获取用户信息
    const userInfoTest = await this.runTest('获取用户信息接口', async () => {
      return await mockService.mockGetUserInfo();
    });
    results.push(userInfoTest);

    return results;
  }

  /**
   * 测试配置相关接口
   */
  public async testConfigAPIs(): Promise<MockAPITestResult[]> {
    const results: MockAPITestResult[] = [];

    // 测试应用配置
    const appConfigTest = await this.runTest('应用配置接口', async () => {
      return await mockService.mockGetAppConfig(ENV_CONFIG.APP_KEY);
    });
    results.push(appConfigTest);

    // 测试广告配置
    const adConfigTest = await this.runTest('广告配置接口', async () => {
      return await mockService.getMockAdConfig();
    });
    results.push(adConfigTest);

    // 测试风控配置
    const riskConfigTest = await this.runTest('风控配置接口', async () => {
      return await mockService.mockGetRiskConfig(ENV_CONFIG.APP_KEY);
    });
    results.push(riskConfigTest);

    // 测试渠道配置
    const channelConfigTest = await this.runTest('渠道配置接口', async () => {
      return await mockService.mockGetChannelConfig(ENV_CONFIG.APP_KEY);
    });
    results.push(channelConfigTest);

    return results;
  }

  /**
   * 测试广告相关接口
   */
  public async testAdAPIs(): Promise<MockAPITestResult[]> {
    const results: MockAPITestResult[] = [];
    const testUserId = 1001;

    // 测试各种类型的广告请求
    const adTypes = [AdType.SPLASH, AdType.REWARD_VIDEO, AdType.INTERSTITIAL, AdType.BANNER];
    
    for (const adType of adTypes) {
      const adRequestTest = await this.runTest(`${adType}广告请求接口`, async () => {
        return await mockService.mockAdRequest(testUserId, adType);
      });
      results.push(adRequestTest);
    }

    // 测试广告展示回调
    const adShowTest = await this.runTest('广告展示回调接口', async () => {
      await mockService.mockAdShow(testUserId, 'test_ad_123', AdType.BANNER);
      return { success: true };
    });
    results.push(adShowTest);

    // 测试广告点击回调
    const adClickTest = await this.runTest('广告点击回调接口', async () => {
      await mockService.mockAdClick(testUserId, 'test_ad_123', AdType.BANNER);
      return { success: true };
    });
    results.push(adClickTest);

    // 测试广告完播回调
    const adCompleteTest = await this.runTest('广告完播回调接口', async () => {
      const reward = await mockService.mockAdComplete(testUserId, 'test_ad_123', AdType.REWARD_VIDEO, 30, true);
      return { reward };
    });
    results.push(adCompleteTest);

    // 测试广告跳过回调
    const adSkipTest = await this.runTest('广告跳过回调接口', async () => {
      await mockService.mockAdSkip(testUserId, 'test_ad_123', AdType.REWARD_VIDEO, 10, 'user_skip');
      return { success: true };
    });
    results.push(adSkipTest);

    return results;
  }

  /**
   * 测试用户数据相关接口
   */
  public async testUserDataAPIs(): Promise<MockAPITestResult[]> {
    const results: MockAPITestResult[] = [];
    const testUserId = 1001;

    // 测试收益统计
    const revenueTest = await this.runTest('收益统计接口', async () => {
      return await mockService.mockGetRevenue(testUserId);
    });
    results.push(revenueTest);

    // 测试广告历史
    const historyTest = await this.runTest('广告历史接口', async () => {
      return await mockService.mockGetAdHistory(testUserId, 1, 10);
    });
    results.push(historyTest);

    // 测试设备信息上报
    const deviceTest = await this.runTest('设备信息上报接口', async () => {
      const deviceInfo = {
        deviceModel: 'iPhone 13',
        deviceBrand: 'Apple',
        osName: 'iOS',
        osVersion: '15.0',
        deviceId: 'test_device_123',
        isRooted: false,
        isEmulator: false,
      };
      return await mockService.mockReportDeviceInfo(testUserId, deviceInfo);
    });
    results.push(deviceTest);

    // 测试批量上报
    const batchReportTest = await this.runTest('批量上报接口', async () => {
      const playDataList = [
        { adType: 'video', playDuration: 30, isClicked: '1', isSkipped: '0' },
        { adType: 'banner', playDuration: 5, isClicked: '0', isSkipped: '1' },
      ];
      const count = await mockService.mockBatchReport(testUserId, playDataList);
      return { reportedCount: count };
    });
    results.push(batchReportTest);

    return results;
  }

  /**
   * 运行单个测试
   */
  private async runTest(testName: string, testFunction: () => Promise<any>): Promise<MockAPITestResult> {
    const startTime = Date.now();
    
    try {
      const data = await testFunction();
      const duration = Date.now() - startTime;
      
      const result: MockAPITestResult = {
        testName,
        success: true,
        duration,
        data,
      };
      
      this.testResults.push(result);
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      const result: MockAPITestResult = {
        testName,
        success: false,
        duration,
        error: (error as Error).message,
      };
      
      this.testResults.push(result);
      return result;
    }
  }

  /**
   * 运行所有API测试
   */
  public async runAllTests(): Promise<void> {
    console.log('🧪 开始运行Mock API测试套件...\n');

    // 初始化Mock服务
    await mockService.initialize();
    await mockService.setMockState(MockUserState.LOGGED_IN);

    // 运行各类测试
    console.log('📝 测试用户认证相关接口...');
    const authResults = await this.testAuthAPIs();
    
    console.log('⚙️ 测试配置相关接口...');
    const configResults = await this.testConfigAPIs();
    
    console.log('📺 测试广告相关接口...');
    const adResults = await this.testAdAPIs();
    
    console.log('👤 测试用户数据相关接口...');
    const userDataResults = await this.testUserDataAPIs();

    // 打印测试结果
    this.printTestResults();
  }

  /**
   * 打印测试结果
   */
  public printTestResults(): void {
    console.log('\n📊 Mock API测试结果汇总');
    console.log('='.repeat(60));

    const categories = [
      { name: '用户认证接口', tests: this.testResults.filter(r => r.testName.includes('登录') || r.testName.includes('注册') || r.testName.includes('用户信息')) },
      { name: '配置相关接口', tests: this.testResults.filter(r => r.testName.includes('配置')) },
      { name: '广告相关接口', tests: this.testResults.filter(r => r.testName.includes('广告') && !r.testName.includes('配置')) },
      { name: '用户数据接口', tests: this.testResults.filter(r => r.testName.includes('收益') || r.testName.includes('历史') || r.testName.includes('设备') || r.testName.includes('批量')) },
    ];

    categories.forEach(category => {
      if (category.tests.length > 0) {
        console.log(`\n📂 ${category.name}:`);
        category.tests.forEach((result, index) => {
          const status = result.success ? '✅ 通过' : '❌ 失败';
          const duration = `${result.duration}ms`;
          
          console.log(`  ${index + 1}. ${result.testName}: ${status} (${duration})`);
          
          if (result.error) {
            console.log(`     错误: ${result.error}`);
          }
          
          if (result.data && result.success) {
            const dataPreview = JSON.stringify(result.data).substring(0, 100);
            console.log(`     数据: ${dataPreview}${JSON.stringify(result.data).length > 100 ? '...' : ''}`);
          }
        });
      }
    });

    const successCount = this.testResults.filter(r => r.success).length;
    const totalCount = this.testResults.length;
    const successRate = ((successCount / totalCount) * 100).toFixed(1);
    const avgDuration = (this.testResults.reduce((sum, r) => sum + r.duration, 0) / totalCount).toFixed(0);

    console.log(`\n📈 测试总结:`);
    console.log(`  通过率: ${successCount}/${totalCount} (${successRate}%)`);
    console.log(`  平均耗时: ${avgDuration}ms`);

    if (successCount === totalCount) {
      console.log('🎉 所有Mock API测试都通过了！应用逻辑验证成功。');
    } else {
      console.log('⚠️  部分测试失败，请检查Mock服务实现。');
    }
  }

  /**
   * 验证应用完整启动流程
   */
  public async validateCompleteAppFlow(): Promise<void> {
    console.log('\n🚀 验证应用完整启动流程...');
    
    const flowResult = await mockService.validateAppStartupFlow();
    
    console.log(`\n📋 启动流程验证结果: ${flowResult.success ? '✅ 成功' : '❌ 失败'}`);
    console.log(`📝 ${flowResult.message}\n`);
    
    flowResult.steps.forEach((step, index) => {
      const status = step.success ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${step.step}: ${step.message}`);
      
      if (step.data) {
        const dataStr = JSON.stringify(step.data, null, 2);
        console.log(`   数据: ${dataStr}`);
      }
    });

    if (flowResult.success) {
      console.log('\n🎊 应用启动流程验证完成！所有Mock接口都能正常返回数据。');
      console.log('💡 现在可以启动应用，验证用户界面是否正常显示。');
    } else {
      console.log('\n❌ 应用启动流程验证失败，请检查Mock服务配置。');
    }
  }

  /**
   * 获取测试结果
   */
  public getTestResults(): MockAPITestResult[] {
    return [...this.testResults];
  }

  /**
   * 清除测试结果
   */
  public clearTestResults(): void {
    this.testResults = [];
  }
}

/**
 * 快速测试所有Mock API
 */
export async function testAllMockAPIs(): Promise<void> {
  const tester = new MockAPITester();
  await tester.runAllTests();
  await tester.validateCompleteAppFlow();
}

/**
 * 在开发环境下暴露测试函数到全局
 */
if (__DEV__) {
  (global as any).testAllMockAPIs = testAllMockAPIs;
  (global as any).mockAPITester = new MockAPITester();
  
  console.log('Mock API测试工具已加载:');
  console.log('- 运行 testAllMockAPIs() 进行完整测试');
  console.log('- 使用 mockAPITester 进行详细测试');
}

export default MockAPITester;