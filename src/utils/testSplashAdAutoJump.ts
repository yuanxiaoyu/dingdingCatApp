/**
 * 开屏广告自动跳转测试工具
 * 用于测试和调试开屏广告完播后的自动跳转功能
 */

export interface SplashAdTestConfig {
  mockMode: boolean;
  timeout: number;
  skipDelay: number;
  autoJumpDelay: number;
  enableDebugLogs: boolean;
}

export class SplashAdAutoJumpTester {
  private config: SplashAdTestConfig;
  private testResults: Array<{
    testName: string;
    success: boolean;
    duration: number;
    error?: string;
  }> = [];

  constructor(config: SplashAdTestConfig) {
    this.config = config;
  }

  /**
   * 测试Mock模式下的自动跳转
   */
  async testMockAutoJump(): Promise<boolean> {
    const startTime = Date.now();
    const testName = 'Mock Auto Jump Test';
    
    try {
      this.log(`开始测试Mock模式自动跳转...`);
      
      // 模拟Mock广告流程
      await this.simulateDelay(this.config.timeout);
      
      const duration = Date.now() - startTime;
      this.log(`Mock模式测试完成，耗时: ${duration}ms`);
      
      this.testResults.push({
        testName,
        success: true,
        duration,
      });
      
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log(`Mock模式测试失败: ${error}`);
      
      this.testResults.push({
        testName,
        success: false,
        duration,
        error: (error as Error).message,
      });
      
      return false;
    }
  }

  /**
   * 测试真实广告模式下的自动跳转
   */
  async testRealAdAutoJump(): Promise<boolean> {
    const startTime = Date.now();
    const testName = 'Real Ad Auto Jump Test';
    
    try {
      this.log(`开始测试真实广告自动跳转...`);
      
      // 模拟真实广告流程
      await this.simulateDelay(this.config.timeout + 1000); // 额外1秒用于SDK处理
      
      const duration = Date.now() - startTime;
      this.log(`真实广告测试完成，耗时: ${duration}ms`);
      
      this.testResults.push({
        testName,
        success: true,
        duration,
      });
      
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log(`真实广告测试失败: ${error}`);
      
      this.testResults.push({
        testName,
        success: false,
        duration,
        error: (error as Error).message,
      });
      
      return false;
    }
  }

  /**
   * 测试倒计时结束后的自动跳转
   */
  async testCountdownAutoJump(): Promise<boolean> {
    const startTime = Date.now();
    const testName = 'Countdown Auto Jump Test';
    
    try {
      this.log(`开始测试倒计时自动跳转...`);
      
      // 模拟倒计时流程
      const countdownDuration = Math.ceil(this.config.skipDelay / 1000) * 1000;
      await this.simulateCountdown(countdownDuration);
      
      const duration = Date.now() - startTime;
      this.log(`倒计时测试完成，耗时: ${duration}ms`);
      
      this.testResults.push({
        testName,
        success: true,
        duration,
      });
      
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log(`倒计时测试失败: ${error}`);
      
      this.testResults.push({
        testName,
        success: false,
        duration,
        error: (error as Error).message,
      });
      
      return false;
    }
  }

  /**
   * 运行所有测试
   */
  async runAllTests(): Promise<void> {
    this.log('开始运行所有自动跳转测试...');
    
    await this.testMockAutoJump();
    await this.testRealAdAutoJump();
    await this.testCountdownAutoJump();
    
    this.printTestResults();
  }

  /**
   * 打印测试结果
   */
  printTestResults(): void {
    console.log('\n=== 开屏广告自动跳转测试结果 ===');
    
    this.testResults.forEach((result, index) => {
      const status = result.success ? '✅ 通过' : '❌ 失败';
      console.log(`${index + 1}. ${result.testName}: ${status} (${result.duration}ms)`);
      
      if (result.error) {
        console.log(`   错误: ${result.error}`);
      }
    });
    
    const successCount = this.testResults.filter(r => r.success).length;
    const totalCount = this.testResults.length;
    
    console.log(`\n总结: ${successCount}/${totalCount} 测试通过`);
    
    if (successCount === totalCount) {
      console.log('🎉 所有测试都通过了！自动跳转功能正常。');
    } else {
      console.log('⚠️  部分测试失败，请检查自动跳转逻辑。');
    }
  }

  /**
   * 获取测试建议
   */
  getTestSuggestions(): string[] {
    const suggestions: string[] = [];
    
    const failedTests = this.testResults.filter(r => !r.success);
    
    if (failedTests.length > 0) {
      suggestions.push('检查广告完播回调是否正确触发');
      suggestions.push('确认setTimeout延迟时间设置是否合理');
      suggestions.push('验证状态管理是否正确更新');
      suggestions.push('检查是否有未清理的定时器干扰');
    }
    
    const slowTests = this.testResults.filter(r => r.duration > this.config.timeout + 2000);
    if (slowTests.length > 0) {
      suggestions.push('优化广告加载和展示性能');
      suggestions.push('考虑减少不必要的延迟');
    }
    
    return suggestions;
  }

  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async simulateCountdown(totalMs: number): Promise<void> {
    const intervalMs = 1000;
    let remaining = totalMs;
    
    while (remaining > 0) {
      this.log(`倒计时剩余: ${Math.ceil(remaining / 1000)}秒`);
      await this.simulateDelay(intervalMs);
      remaining -= intervalMs;
    }
    
    this.log('倒计时结束，应该自动跳转');
  }

  private log(message: string): void {
    if (this.config.enableDebugLogs) {
      console.log(`[SplashAdAutoJumpTester] ${message}`);
    }
  }
}

/**
 * 快速测试函数
 */
export async function testSplashAdAutoJump(): Promise<void> {
  const config: SplashAdTestConfig = {
    mockMode: true,
    timeout: 5000,
    skipDelay: 3000,
    autoJumpDelay: 500,
    enableDebugLogs: true,
  };
  
  const tester = new SplashAdAutoJumpTester(config);
  await tester.runAllTests();
  
  const suggestions = tester.getTestSuggestions();
  if (suggestions.length > 0) {
    console.log('\n📋 改进建议:');
    suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion}`);
    });
  }
}

/**
 * 调试开屏广告状态
 */
export function debugSplashAdState(state: any): void {
  console.log('\n=== 开屏广告状态调试 ===');
  console.log('isLoading:', state.isLoading);
  console.log('isAdLoaded:', state.isAdLoaded);
  console.log('isAdShowing:', state.isAdShowing);
  console.log('canSkip:', state.canSkip);
  console.log('countdown:', state.countdown);
  console.log('error:', state.error);
  console.log('adData:', state.adData ? 'Present' : 'Null');
  
  if (state.adData) {
    console.log('Ad ID:', state.adData.adId);
    console.log('Ad Type:', state.adData.adType);
    console.log('Play Duration:', state.adData.playDuration);
  }
}

export default SplashAdAutoJumpTester;