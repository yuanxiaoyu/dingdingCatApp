/**
 * 开屏广告流程调试工具
 * 用于调试开屏广告完播后未跳转的问题
 */

import mockService from '../services/MockService';
import appFlowManager from '../services/AppFlowManager';

export interface SplashAdFlowDebugInfo {
  timestamp: string;
  mockMode: boolean;
  mockState: any;
  appFlowState: any;
  adConfig: any;
  shouldShowSplashAd: boolean;
  userId?: number;
  error?: string;
}

export class SplashAdFlowDebugger {
  private debugLogs: SplashAdFlowDebugInfo[] = [];

  /**
   * 记录调试信息
   */
  public async logCurrentState(context: string): Promise<SplashAdFlowDebugInfo> {
    try {
      const debugInfo: SplashAdFlowDebugInfo = {
        timestamp: new Date().toISOString(),
        mockMode: mockService.isMockModeEnabled(),
        mockState: mockService.isMockModeEnabled() ? mockService.getCurrentMockState() : null,
        appFlowState: await appFlowManager.getFlowStatus(),
        adConfig: mockService.isMockModeEnabled() ? await mockService.getMockAdConfig() : null,
        shouldShowSplashAd: await mockService.shouldShowSplashAd(),
      };

      this.debugLogs.push(debugInfo);
      
      console.log(`[SplashAdFlowDebugger] ${context}:`, debugInfo);
      
      return debugInfo;
    } catch (error) {
      const errorInfo: SplashAdFlowDebugInfo = {
        timestamp: new Date().toISOString(),
        mockMode: false,
        mockState: null,
        appFlowState: null,
        adConfig: null,
        shouldShowSplashAd: false,
        error: (error as Error).message,
      };
      
      this.debugLogs.push(errorInfo);
      console.error(`[SplashAdFlowDebugger] Error in ${context}:`, error);
      
      return errorInfo;
    }
  }

  /**
   * 获取所有调试日志
   */
  public getDebugLogs(): SplashAdFlowDebugInfo[] {
    return [...this.debugLogs];
  }

  /**
   * 清除调试日志
   */
  public clearDebugLogs(): void {
    this.debugLogs = [];
  }

  /**
   * 打印调试报告
   */
  public printDebugReport(): void {
    console.log('\n=== 开屏广告流程调试报告 ===');
    
    if (this.debugLogs.length === 0) {
      console.log('没有调试日志');
      return;
    }

    this.debugLogs.forEach((log, index) => {
      console.log(`\n${index + 1}. ${log.timestamp}`);
      console.log(`   Mock模式: ${log.mockMode ? '是' : '否'}`);
      console.log(`   应该显示开屏广告: ${log.shouldShowSplashAd ? '是' : '否'}`);
      
      if (log.mockState) {
        console.log(`   Mock状态: ${JSON.stringify(log.mockState)}`);
      }
      
      if (log.appFlowState) {
        console.log(`   应用流程状态: ${JSON.stringify(log.appFlowState)}`);
      }
      
      if (log.adConfig?.splashAdConfig) {
        console.log(`   开屏广告配置: ${JSON.stringify(log.adConfig.splashAdConfig)}`);
      }
      
      if (log.error) {
        console.log(`   错误: ${log.error}`);
      }
    });
    
    console.log('\n=== 调试报告结束 ===\n');
  }

  /**
   * 检查开屏广告流程是否正常
   */
  public async checkSplashAdFlow(): Promise<{
    isNormal: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    try {
      // 检查Mock模式配置
      const isMockMode = mockService.isMockModeEnabled();
      if (isMockMode) {
        const adConfig = await mockService.getMockAdConfig();
        if (!adConfig.splashAdConfig?.enabled) {
          issues.push('Mock模式下开屏广告未启用');
          suggestions.push('检查MockService中的splashAdConfig.enabled设置');
        }
      }

      // 检查应用流程状态
      const flowStatus = await appFlowManager.getFlowStatus();
      if (!flowStatus.isInitialized) {
        issues.push('AppFlowManager未初始化');
        suggestions.push('确保AppFlowManager.initialize()被正确调用');
      }

      // 检查是否应该显示开屏广告
      const shouldShow = await mockService.shouldShowSplashAd();
      if (!shouldShow) {
        issues.push('当前配置不应显示开屏广告');
        suggestions.push('检查用户登录状态和广告配置');
      }

      return {
        isNormal: issues.length === 0,
        issues,
        suggestions,
      };

    } catch (error) {
      issues.push(`检查过程中发生错误: ${(error as Error).message}`);
      suggestions.push('检查相关服务是否正确初始化');

      return {
        isNormal: false,
        issues,
        suggestions,
      };
    }
  }

  /**
   * 模拟开屏广告完播流程
   */
  public async simulateSplashAdComplete(): Promise<void> {
    console.log('\n=== 模拟开屏广告完播流程 ===');
    
    await this.logCurrentState('开始模拟');
    
    try {
      // 模拟广告完播
      console.log('1. 模拟广告完播...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await this.logCurrentState('广告完播后');
      
      // 模拟应用流程处理
      console.log('2. 处理应用流程...');
      const flow = await appFlowManager.handleSplashAdComplete();
      console.log('应用流程结果:', flow);
      
      await this.logCurrentState('流程处理后');
      
      console.log('3. 模拟完成');
      
    } catch (error) {
      console.error('模拟过程中发生错误:', error);
      await this.logCurrentState('模拟错误');
    }
    
    console.log('=== 模拟结束 ===\n');
  }
}

// 创建全局调试器实例
export const splashAdFlowDebugger = new SplashAdFlowDebugger();

/**
 * 快速调试函数
 */
export async function debugSplashAdFlow(): Promise<void> {
  console.log('开始调试开屏广告流程...');
  
  // 记录当前状态
  await splashAdFlowDebugger.logCurrentState('调试开始');
  
  // 检查流程
  const checkResult = await splashAdFlowDebugger.checkSplashAdFlow();
  console.log('流程检查结果:', checkResult);
  
  // 模拟完播流程
  await splashAdFlowDebugger.simulateSplashAdComplete();
  
  // 打印调试报告
  splashAdFlowDebugger.printDebugReport();
  
  // 提供建议
  if (!checkResult.isNormal) {
    console.log('\n🔧 发现问题，建议:');
    checkResult.suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion}`);
    });
  } else {
    console.log('\n✅ 开屏广告流程配置正常');
  }
}

/**
 * 在开发环境下暴露调试函数到全局
 */
if (__DEV__) {
  (global as any).debugSplashAdFlow = debugSplashAdFlow;
  (global as any).splashAdFlowDebugger = splashAdFlowDebugger;
  
  console.log('开屏广告调试工具已加载:');
  console.log('- 运行 debugSplashAdFlow() 进行完整调试');
  console.log('- 使用 splashAdFlowDebugger 进行详细调试');
}

export default SplashAdFlowDebugger;