/**
 * 首页问题修复工具
 * 用于修复首页显示"用户信息加载失败"和广告位不显示的问题
 */

import mockService, { MockUserState } from '../services/MockService';
import appFlowManager from '../services/AppFlowManager';
import { ENV_CONFIG } from '../config/env';

export interface HomeScreenDiagnostic {
  timestamp: string;
  mockEnabled: boolean;
  mockUserState: MockUserState;
  envUserState: 0 | 1;
  shouldUserBeLoggedIn: boolean;
  mockUser: any;
  appFlowStatus: any;
  issues: string[];
  suggestions: string[];
}

export class HomeScreenFixer {
  /**
   * 诊断首页问题
   */
  public async diagnoseHomeScreenIssues(): Promise<HomeScreenDiagnostic> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    try {
      console.log('开始诊断首页问题...');

      // 检查Mock服务状态
      const mockEnabled = mockService.isMockModeEnabled();
      const mockUserState = mockService.getCurrentMockState();
      const envUserState = ENV_CONFIG.MOCK_USER_STATE;
      const shouldUserBeLoggedIn = mockService.shouldUserBeLoggedIn();

      console.log('Mock服务状态:', {
        mockEnabled,
        mockUserState,
        envUserState,
        shouldUserBeLoggedIn,
      });

      // 检查用户状态
      if (!shouldUserBeLoggedIn) {
        issues.push('用户未登录状态');
        suggestions.push('设置Mock用户为登录状态');
      }

      // 生成Mock用户
      let mockUser = null;
      try {
        mockUser = mockService.generateMockUser();
        console.log('Mock用户生成成功:', mockUser);
      } catch (error) {
        issues.push(`Mock用户生成失败: ${(error as Error).message}`);
        suggestions.push('检查MockService.generateMockUser()方法');
      }

      // 检查应用流程状态
      let appFlowStatus = null;
      try {
        appFlowStatus = await appFlowManager.getFlowStatus();
        console.log('应用流程状态:', appFlowStatus);
      } catch (error) {
        issues.push(`应用流程状态检查失败: ${(error as Error).message}`);
        suggestions.push('检查AppFlowManager初始化');
      }

      // 检查环境配置
      if (envUserState === 0) {
        issues.push('环境配置设置为未登录状态');
        suggestions.push('将ENV_CONFIG.MOCK_USER_STATE设置为1');
      }

      return {
        timestamp: new Date().toISOString(),
        mockEnabled,
        mockUserState,
        envUserState,
        shouldUserBeLoggedIn,
        mockUser,
        appFlowStatus,
        issues,
        suggestions,
      };

    } catch (error) {
      issues.push(`诊断过程中发生错误: ${(error as Error).message}`);
      suggestions.push('检查相关服务是否正确初始化');

      return {
        timestamp: new Date().toISOString(),
        mockEnabled: false,
        mockUserState: MockUserState.NOT_LOGGED_IN,
        envUserState: 0,
        shouldUserBeLoggedIn: false,
        mockUser: null,
        appFlowStatus: null,
        issues,
        suggestions,
      };
    }
  }

  /**
   * 修复首页问题
   */
  public async fixHomeScreenIssues(): Promise<{
    success: boolean;
    message: string;
    actions: string[];
  }> {
    const actions: string[] = [];

    try {
      console.log('开始修复首页问题...');

      // 1. 确保Mock服务已初始化
      await mockService.initialize();
      actions.push('初始化Mock服务');

      // 2. 设置用户为登录状态
      await mockService.setMockState(MockUserState.LOGGED_IN);
      actions.push('设置Mock用户为登录状态');

      // 3. 验证用户状态
      const shouldBeLoggedIn = mockService.shouldUserBeLoggedIn();
      if (!shouldBeLoggedIn) {
        throw new Error('用户状态设置失败');
      }
      actions.push('验证用户登录状态');

      // 4. 生成Mock用户数据
      const mockUser = mockService.generateMockUser();
      if (!mockUser || !mockUser.userId) {
        throw new Error('Mock用户生成失败');
      }
      actions.push(`生成Mock用户: ${mockUser.nickName} (ID: ${mockUser.userId})`);

      // 5. 初始化应用流程管理器
      await appFlowManager.initialize();
      actions.push('初始化应用流程管理器');

      console.log('首页问题修复完成');

      return {
        success: true,
        message: '首页问题修复成功！用户现在应该能正常登录并看到广告位。',
        actions,
      };

    } catch (error) {
      console.error('修复首页问题失败:', error);

      return {
        success: false,
        message: `修复失败: ${(error as Error).message}`,
        actions,
      };
    }
  }

  /**
   * 强制重置为正常状态
   */
  public async forceResetToNormalState(): Promise<void> {
    try {
      console.log('强制重置为正常状态...');

      // 1. 重新初始化Mock服务
      await mockService.initialize();

      // 2. 强制设置为登录状态
      await mockService.setMockState(MockUserState.LOGGED_IN);

      // 3. 清除可能的错误状态
      await mockService.clearMockData();

      // 4. 重新初始化应用流程
      await appFlowManager.initialize();

      console.log('强制重置完成');

    } catch (error) {
      console.error('强制重置失败:', error);
      throw error;
    }
  }

  /**
   * 测试Banner广告加载
   */
  public async testBannerAdLoading(): Promise<{
    success: boolean;
    message: string;
    adData?: any;
  }> {
    try {
      console.log('测试Banner广告加载...');

      // 检查Mock模式
      const isMockMode = mockService.isMockModeEnabled();
      if (!isMockMode) {
        return {
          success: false,
          message: 'Mock模式未启用，无法测试Banner广告',
        };
      }

      // 获取Mock广告配置
      const adConfig = await mockService.getMockAdConfig();
      if (!adConfig.bannerAdConfig?.enabled) {
        return {
          success: false,
          message: 'Banner广告在Mock配置中未启用',
        };
      }

      // 模拟Banner广告数据
      const mockBannerData = {
        adId: adConfig.bannerAdConfig.adId,
        adType: 'banner',
        adTitle: '丁丁猫Banner广告 - 测试',
        expectedReward: 5,
      };

      console.log('Banner广告测试数据:', mockBannerData);

      return {
        success: true,
        message: 'Banner广告配置正常',
        adData: mockBannerData,
      };

    } catch (error) {
      return {
        success: false,
        message: `Banner广告测试失败: ${(error as Error).message}`,
      };
    }
  }
}

/**
 * 快速修复函数
 */
export async function quickFixHomeScreen(): Promise<void> {
  console.log('🔧 开始快速修复首页问题...');

  const fixer = new HomeScreenFixer();

  // 1. 诊断问题
  const diagnostic = await fixer.diagnoseHomeScreenIssues();
  console.log('📋 诊断结果:', diagnostic);

  if (diagnostic.issues.length > 0) {
    console.log('❌ 发现问题:');
    diagnostic.issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });

    console.log('💡 建议解决方案:');
    diagnostic.suggestions.forEach((suggestion, index) => {
      console.log(`  ${index + 1}. ${suggestion}`);
    });

    // 2. 尝试自动修复
    console.log('\n🔧 尝试自动修复...');
    const fixResult = await fixer.fixHomeScreenIssues();

    if (fixResult.success) {
      console.log('✅ 修复成功!');
      console.log(`📝 ${fixResult.message}`);
      console.log('🎯 执行的操作:');
      fixResult.actions.forEach((action, index) => {
        console.log(`  ${index + 1}. ${action}`);
      });

      // 3. 测试Banner广告
      console.log('\n📰 测试Banner广告...');
      const bannerTest = await fixer.testBannerAdLoading();
      if (bannerTest.success) {
        console.log('✅ Banner广告配置正常');
        console.log('📊 广告数据:', bannerTest.adData);
      } else {
        console.log('❌ Banner广告测试失败:', bannerTest.message);
      }

    } else {
      console.log('❌ 自动修复失败:', fixResult.message);
      console.log('🔧 请手动执行以下操作:');
      diagnostic.suggestions.forEach((suggestion, index) => {
        console.log(`  ${index + 1}. ${suggestion}`);
      });
    }

  } else {
    console.log('✅ 未发现问题，首页应该正常工作');

    // 仍然测试Banner广告
    const bannerTest = await fixer.testBannerAdLoading();
    console.log('📰 Banner广告测试:', bannerTest.message);
  }

  console.log('\n🎉 快速修复完成！');
  console.log('💡 如果问题仍然存在，请重启应用或检查控制台日志。');
}

/**
 * 在开发环境下暴露修复函数到全局
 */
if (__DEV__) {
  (global as any).quickFixHomeScreen = quickFixHomeScreen;
  (global as any).homeScreenFixer = new HomeScreenFixer();

  console.log('首页修复工具已加载:');
  console.log('- 运行 quickFixHomeScreen() 进行快速修复');
  console.log('- 使用 homeScreenFixer 进行详细诊断');
}

export default HomeScreenFixer;