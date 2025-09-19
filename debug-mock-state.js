/**
 * Mock状态调试脚本
 * 在React Native应用中运行此代码来调试Mock状态问题
 */

// 将此代码复制到你的应用中的任何地方运行，比如在App.tsx的useEffect中

import AsyncStorage from '@react-native-async-storage/async-storage';

const debugMockState = async () => {
  console.log('🔍 开始调试Mock状态...\n');
  
  // 1. 检查环境变量
  console.log('📋 环境变量配置:');
  console.log('   MOCK_ENABLED:', process.env.MOCK_ENABLED);
  console.log('   MOCK_USER_STATE:', process.env.MOCK_USER_STATE);
  
  // 2. 检查AsyncStorage中的覆盖设置
  console.log('\n💾 AsyncStorage覆盖设置:');
  try {
    const mockModeOverride = await AsyncStorage.getItem('@dingdingcat/mock_mode_override');
    const mockUserStateOverride = await AsyncStorage.getItem('@dingdingcat/mock_user_state_override');
    const mockUserState = await AsyncStorage.getItem('@dingdingcat/mock_user_state');
    
    console.log('   mock_mode_override:', mockModeOverride);
    console.log('   mock_user_state_override:', mockUserStateOverride);
    console.log('   mock_user_state:', mockUserState);
    
    // 3. 如果有覆盖设置，清理它们
    if (mockModeOverride !== null || mockUserStateOverride !== null || mockUserState !== null) {
      console.log('\n🧹 发现缓存的覆盖设置，正在清理...');
      
      await AsyncStorage.multiRemove([
        '@dingdingcat/mock_mode_override',
        '@dingdingcat/mock_user_state_override',
        '@dingdingcat/mock_user_state',
        '@dingdingcat/mock_login_state'
      ]);
      
      console.log('✅ 覆盖设置已清理');
      console.log('🔄 请重启应用以使.env配置生效');
    } else {
      console.log('✅ 没有发现覆盖设置');
    }
    
  } catch (error) {
    console.error('❌ 检查AsyncStorage失败:', error);
  }
  
  // 4. 检查当前Mock服务状态
  console.log('\n🔧 当前Mock服务状态:');
  try {
    // 如果你的应用中有mockModeController
    if (global.mockModeController) {
      const debugInfo = global.mockModeController.getDebugInfo();
      console.log('   Mock控制器状态:', JSON.stringify(debugInfo, null, 2));
    }
  } catch (error) {
    console.log('   Mock控制器未初始化');
  }
};

// 导出函数供使用
export default debugMockState;

// 如果在开发环境，自动运行
if (__DEV__) {
  // 延迟执行，确保应用已初始化
  setTimeout(debugMockState, 2000);
  
  // 暴露到全局供手动调用
  global.debugMockState = debugMockState;
  global.clearMockCache = async () => {
    await AsyncStorage.multiRemove([
      '@dingdingcat/mock_mode_override',
      '@dingdingcat/mock_user_state_override',
      '@dingdingcat/mock_user_state',
      '@dingdingcat/mock_login_state'
    ]);
    console.log('✅ Mock缓存已清理，请重启应用');
  };
  
  console.log('🛠️  调试工具已加载:');
  console.log('- debugMockState() - 调试Mock状态');
  console.log('- clearMockCache() - 清理Mock缓存');
}