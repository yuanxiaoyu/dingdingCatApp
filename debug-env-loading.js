/**
 * 环境变量加载调试脚本
 * 检查.env文件是否正确加载以及AsyncStorage缓存问题
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const debugEnvLoading = async () => {
  console.log('🔍 开始调试环境变量加载...\n');
  
  // 1. 检查原始环境变量
  console.log('📋 原始环境变量:');
  console.log('   process.env.MOCK_ENABLED:', process.env.MOCK_ENABLED);
  console.log('   process.env.MOCK_USER_STATE:', process.env.MOCK_USER_STATE);
  
  // 2. 检查ENV_CONFIG
  try {
    const { ENV_CONFIG } = require('../src/config/env');
    console.log('\n⚙️  ENV_CONFIG配置:');
    console.log('   MOCK_ENABLED:', ENV_CONFIG.MOCK_ENABLED);
    console.log('   MOCK_USER_STATE:', ENV_CONFIG.MOCK_USER_STATE);
    console.log('   类型检查:', typeof ENV_CONFIG.MOCK_USER_STATE);
  } catch (error) {
    console.log('\n❌ 无法加载ENV_CONFIG:', error.message);
  }
  
  // 3. 检查AsyncStorage中的所有Mock相关键
  console.log('\n💾 AsyncStorage中的Mock相关数据:');
  const mockKeys = [
    '@dingdingcat/mock_mode',
    '@dingdingcat/mock_user_state',
    '@dingdingcat/mock_login_state',
    '@dingdingcat/mock_mode_override',
    '@dingdingcat/mock_user_state_override'
  ];
  
  for (const key of mockKeys) {
    try {
      const value = await AsyncStorage.getItem(key);
      console.log(`   ${key}: ${value}`);
    } catch (error) {
      console.log(`   ${key}: 读取失败`);
    }
  }
  
  // 4. 清理所有Mock相关缓存
  console.log('\n🧹 清理所有Mock缓存...');
  try {
    await AsyncStorage.multiRemove(mockKeys);
    console.log('✅ 所有Mock缓存已清理');
  } catch (error) {
    console.log('❌ 清理缓存失败:', error.message);
  }
  
  // 5. 检查AuthService的isAuthenticated方法
  console.log('\n🔐 测试AuthService.isAuthenticated():');
  try {
    const authService = require('../src/services/AuthService').default;
    const isAuth = await authService.isAuthenticated();
    console.log('   isAuthenticated结果:', isAuth);
  } catch (error) {
    console.log('   AuthService测试失败:', error.message);
  }
  
  // 6. 检查MockService状态
  console.log('\n🎭 检查MockService状态:');
  try {
    const mockService = require('../src/services/MockService').default;
    const shouldBeLoggedIn = mockService.shouldUserBeLoggedIn();
    const currentState = mockService.getCurrentMockState();
    console.log('   shouldUserBeLoggedIn:', shouldBeLoggedIn);
    console.log('   currentMockState:', currentState);
  } catch (error) {
    console.log('   MockService检查失败:', error.message);
  }
  
  console.log('\n🔄 请重启应用以查看效果');
};

// 导出供使用
export default debugEnvLoading;

// 在开发环境下自动运行和暴露到全局
if (__DEV__) {
  // 延迟执行，确保所有服务都已初始化
  setTimeout(debugEnvLoading, 3000);
  
  // 暴露到全局
  global.debugEnvLoading = debugEnvLoading;
  
  // 提供快速清理缓存的方法
  global.clearAllMockCache = async () => {
    const mockKeys = [
      '@dingdingcat/mock_mode',
      '@dingdingcat/mock_user_state', 
      '@dingdingcat/mock_login_state',
      '@dingdingcat/mock_mode_override',
      '@dingdingcat/mock_user_state_override'
    ];
    
    try {
      await AsyncStorage.multiRemove(mockKeys);
      console.log('✅ 所有Mock缓存已清理，请重启应用');
    } catch (error) {
      console.log('❌ 清理缓存失败:', error);
    }
  };
  
  console.log('🛠️  环境调试工具已加载:');
  console.log('- debugEnvLoading() - 调试环境变量加载');
  console.log('- clearAllMockCache() - 清理所有Mock缓存');
}