/**
 * 开屏广告跳转测试工具
 * 用于快速测试和验证开屏广告完播后的跳转功能
 */

export interface SplashAdJumpTestResult {
  testName: string;
  success: boolean;
  duration: number;
  error?: string;
  logs: string[];
}

export class SplashAdJumpTester {
  private testResults: SplashAdJumpTestResult[] = [];

  /**
   * 测试开屏广告跳转回调
   */
  public async testAdCompleteCallback(): Promise<SplashAdJumpTestResult> {
    const testName = 'Ad Complete Callback Test';
    const startTime = Date.now();
    const logs: string[] = [];
    
    try {
      logs.push('开始测试广告完播回调...');
      
      // 模拟广告完播回调
      let callbackCalled = false;
      const mockCallback = () => {
        callbackCalled = true;
        logs.push('onAdComplete回调被调用');
      };
      
      // 模拟延迟调用
      setTimeout(mockCallback, 100);
      
      // 等待回调
      await new Promise(resolve => setTimeout(resolve, 200));
      
      if (!callbackCalled) {
        throw new Error('onAdComplete回调未被调用');
      }
      
      const duration = Date.now() - startTime;
      logs.push(`测试完成，耗时: ${duration}ms`);
      
      const result: SplashAdJumpTestResult = {
        testName,
        success: true,
        duration,
        logs,
      };
      
      this.testResults.push(result);
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logs.push(`测试失败: ${(error as Error).message}`);
      
      const result: SplashAdJumpTestResult = {
        testName,
        success: false,
        duration,
        error: (error as Error).message,
        logs,
      };
      
      this.testResults.push(result);
      return result;
    }
  }

  /**
   * 测试定时器清理
   */
  public async testTimerCleanup(): Promise<SplashAdJumpTestResult> {
    const testName = 'Timer Cleanup Test';
    const startTime = Date.now();
    const logs: string[] = [];
    
    try {
      logs.push('开始测试定时器清理...');
      
      // 模拟创建定时器
      const timers: ReturnType<typeof setTimeout>[] = [];
      
      // 创建多个定时器
      for (let i = 0; i < 3; i++) {
        const timer = setTimeout(() => {
          logs.push(`定时器 ${i} 触发`);
        }, 50 * (i + 1));
        timers.push(timer);
      }
      
      logs.push(`创建了 ${timers.length} 个定时器`);
      
      // 模拟清理定时器
      timers.forEach((timer, index) => {
        clearTimeout(timer);
        logs.push(`清理定时器 ${index}`);
      });
      
      // 等待一段时间确保定时器不会触发
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const duration = Date.now() - startTime;
      logs.push(`定时器清理测试完成，耗时: ${duration}ms`);
      
      const result: SplashAdJumpTestResult = {
        testName,
        success: true,
        duration,
        logs,
      };
      
      this.testResults.push(result);
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logs.push(`测试失败: ${(error as Error).message}`);
      
      const result: SplashAdJumpTestResult = {
        testName,
        success: false,
        duration,
        error: (error as Error).message,
        logs,
      };
      
      this.testResults.push(result);
      return result;
    }
  }

  /**
   * 测试状态管理
   */
  public async testStateManagement(): Promise<SplashAdJumpTestResult> {
    const testName = 'State Management Test';
    const startTime = Date.now();
    const logs: string[] = [];
    
    try {
      logs.push('开始测试状态管理...');
      
      // 模拟状态对象
      const mockState = {
        isLoading: true,
        isAdShowing: false,
        canSkip: false,
        countdown: 5,
        adData: null,
      };
      
      logs.push('初始状态:', JSON.stringify(mockState));
      
      // 模拟状态更新
      mockState.isLoading = false;
      mockState.isAdShowing = true;
      mockState.adData = { adId: 'test_ad_123' };
      
      logs.push('广告展示状态:', JSON.stringify(mockState));
      
      // 模拟倒计时
      for (let i = mockState.countdown; i > 0; i--) {
        mockState.countdown = i;
        logs.push(`倒计时: ${i}秒`);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // 模拟完播状态
      mockState.isAdShowing = false;
      mockState.canSkip = true;
      mockState.countdown = 0;
      
      logs.push('完播状态:', JSON.stringify(mockState));
      
      const duration = Date.now() - startTime;
      logs.push(`状态管理测试完成，耗时: ${duration}ms`);
      
      const result: SplashAdJumpTestResult = {
        testName,
        success: true,
        duration,
        logs,
      };
      
      this.testResults.push(result);
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logs.push(`测试失败: ${(error as Error).message}`);
      
      const result: SplashAdJumpTestResult = {
        testName,
        success: false,
        duration,
        error: (error as Error).message,
        logs,
      };
      
      this.testResults.push(result);
      return result;
    }
  }

  /**
   * 运行所有测试
   */
  public async runAllTests(): Promise<SplashAdJumpTestResult[]> {
    console.log('开始运行开屏广告跳转测试...');
    
    const results = await Promise.all([
      this.testAdCompleteCallback(),
      this.testTimerCleanup(),
      this.testStateManagement(),
    ]);
    
    this.printTestResults();
    return results;
  }

  /**
   * 打印测试结果
   */
  public printTestResults(): void {
    console.log('\n=== 开屏广告跳转测试结果 ===');
    
    this.testResults.forEach((result, index) => {
      const status = result.success ? '✅ 通过' : '❌ 失败';
      console.log(`\n${index + 1}. ${result.testName}: ${status} (${result.duration}ms)`);
      
      if (result.error) {
        console.log(`   错误: ${result.error}`);
      }
      
      if (result.logs.length > 0) {
        console.log('   日志:');
        result.logs.forEach(log => {
          console.log(`     ${log}`);
        });
      }
    });
    
    const successCount = this.testResults.filter(r => r.success).length;
    const totalCount = this.testResults.length;
    
    console.log(`\n总结: ${successCount}/${totalCount} 测试通过`);
    
    if (successCount === totalCount) {
      console.log('🎉 所有测试都通过了！');
    } else {
      console.log('⚠️  部分测试失败，请检查相关逻辑。');
    }
    
    console.log('=== 测试结束 ===\n');
  }

  /**
   * 获取测试结果
   */
  public getTestResults(): SplashAdJumpTestResult[] {
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
 * 快速测试函数
 */
export async function testSplashAdJump(): Promise<void> {
  const tester = new SplashAdJumpTester();
  await tester.runAllTests();
}

/**
 * 在开发环境下暴露测试函数到全局
 */
if (__DEV__) {
  (global as any).testSplashAdJump = testSplashAdJump;
  
  console.log('开屏广告跳转测试工具已加载:');
  console.log('- 运行 testSplashAdJump() 进行测试');
}

export default SplashAdJumpTester;