/**
 * 最终Mock验证工具
 * 确保Mock模式完全生效
 */

import mockModeController from './mockModeController';
import { testMockInterception } from './testMockInterception';
import { isMockEnabled } from '../config/mockConfig';

/**
 * 执行最终的Mock验证
 */
export async function runFinalMockVerification(): Promise<void> {
  console.log('🎯 开始最终Mock验证...\n');
  
  try {
    // 1. 初始化Mock控制器
    console.log('1️⃣ 初始化Mock控制器...');
    await mockModeController.initialize();
    
    // 2. 检查Mock配置状态
    console.log('2️⃣ 检查Mock配置状态...');
    const mockStatus = mockModeController.getMockModeStatus();
    console.log('Mock状态:', mockStatus);
    
    if (!mockStatus.enabled) {
      console.log('⚠️ Mock模式未启用，正在启用...');
      await mockModeController.enableMockMode();
    }
    
    // 3. 验证配置生效
    console.log('3️⃣ 验证配置生效...');
    const configEnabled = isMockEnabled();
    console.log('配置文件Mock启用:', configEnabled);
    
    // 4. 运行完整的拦截测试
    console.log('4️⃣ 运行完整的拦截测试...');
    const testResult = await testMockInterception();
    
    // 5. 输出最终结果
    console.log('\n🎉 最终验证结果:');
    console.log('================');
    console.log(`Mock模式启用: ${testResult.mockStatus.current.enabled ? '✅' : '❌'}`);
    console.log(`网络请求拦截: ${testResult.networkRequestCount === 0 ? '✅' : '❌'}`);
    console.log(`API测试通过: ${testResult.testResults.filter(r => r.success).length}/${testResult.testResults.length}`);
    console.log(`总体状态: ${testResult.success ? '✅ 成功' : '❌ 失败'}`);
    
    if (testResult.success) {
      console.log('\n🎊 恭喜！Mock模式已完全生效，所有网络请求都被成功拦截！');
      console.log('\n📱 现在你可以：');
      console.log('- 正常使用应用的所有功能');
      console.log('- 通过 disableMock() 切换到真实API');
      console.log('- 通过 enableMock() 重新启用Mock模式');
      console.log('- 通过 setMockUser(0|1) 切换用户状态');
    } else {
      console.log('\n❌ Mock验证失败，请检查以下问题：');
      if (testResult.networkRequestCount > 0) {
        console.log(`- 仍有 ${testResult.networkRequestCount} 个网络请求未被拦截`);
        testResult.networkRequests.forEach((req, index) => {
          console.log(`  ${index + 1}. ${req.method} ${req.url}`);
        });
      }
      
      const failedTests = testResult.testResults.filter(r => !r.success);
      if (failedTests.length > 0) {
        console.log(`- 有 ${failedTests.length} 个测试失败：`);
        failedTests.forEach(test => {
          console.log(`  - ${test.category}/${test.test}: ${test.error}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ 最终验证过程中出现错误:', error);
  }
}

/**
 * 快速状态检查
 */
export function quickStatusCheck(): void {
  console.log('🔍 快速状态检查:');
  console.log('================');
  
  try {
    const mockStatus = mockModeController.getMockModeStatus();
    const configEnabled = isMockEnabled();
    
    console.log(`Mock控制器状态: ${mockStatus.enabled ? '✅ 启用' : '❌ 禁用'}`);
    console.log(`配置文件状态: ${configEnabled ? '✅ 启用' : '❌ 禁用'}`);
    console.log(`用户状态: ${mockStatus.userState === 1 ? '✅ 已登录' : '❌ 未登录'}`);
    console.log(`配置来源: ${mockStatus.source}`);
    
    if (mockStatus.enabled && configEnabled) {
      console.log('\\n✅ Mock模式正常运行');
    } else {
      console.log('\\n⚠️ Mock模式可能存在问题');
    }
    
  } catch (error) {
    console.error('❌ 状态检查失败:', error);
  }
}

// 在开发环境下暴露到全局
if (__DEV__) {
  (global as any).runFinalMockVerification = runFinalMockVerification;
  (global as any).quickStatusCheck = quickStatusCheck;
  
  console.log('最终Mock验证工具已加载:');
  console.log('- 运行 runFinalMockVerification() 进行完整验证');
  console.log('- 运行 quickStatusCheck() 进行快速状态检查');
}

export default {
  runFinalMockVerification,
  quickStatusCheck,
};