/**
 * 验证环境配置脚本
 * 检查环境变量是否正确加载
 */

const verifyEnvConfig = () => {
  console.log('🔍 验证环境配置...\n');
  
  // 1. 检查原始环境变量
  console.log('📋 原始环境变量:');
  console.log('   process.env.MOCK_ENABLED:', process.env.MOCK_ENABLED);
  console.log('   process.env.MOCK_USER_STATE:', process.env.MOCK_USER_STATE);
  console.log('   typeof process.env.MOCK_USER_STATE:', typeof process.env.MOCK_USER_STATE);
  
  // 2. 检查ENV_CONFIG
  try {
    const { ENV_CONFIG } = require('../src/config/env');
    console.log('\n⚙️  ENV_CONFIG:');
    console.log('   MOCK_ENABLED:', ENV_CONFIG.MOCK_ENABLED, '(type:', typeof ENV_CONFIG.MOCK_ENABLED, ')');
    console.log('   MOCK_USER_STATE:', ENV_CONFIG.MOCK_USER_STATE, '(type:', typeof ENV_CONFIG.MOCK_USER_STATE, ')');
  } catch (error) {
    console.log('\n❌ 无法加载ENV_CONFIG:', error.message);
  }
  
  // 3. 检查appSettings.json
  try {
    const appSettings = require('../src/config/appSettings.json');
    console.log('\n📄 appSettings.json:');
    console.log('   mockMode.enabled:', appSettings.mockMode?.enabled);
    console.log('   mockMode.userState:', appSettings.mockMode?.userState, '(type:', typeof appSettings.mockMode?.userState, ')');
  } catch (error) {
    console.log('\n❌ 无法加载appSettings.json:', error.message);
  }
  
  // 4. 检查AuthService的isAuthenticated结果
  try {
    const authService = require('../src/services/AuthService').default;
    authService.isAuthenticated().then(result => {
      console.log('\n🔐 AuthService.isAuthenticated():', result);
      console.log('   类型:', typeof result);
    }).catch(error => {
      console.log('\n❌ AuthService.isAuthenticated() 失败:', error.message);
    });
  } catch (error) {
    console.log('\n❌ 无法加载AuthService:', error.message);
  }
  
  // 5. 检查MockService状态
  try {
    const mockService = require('../src/services/MockService').default;
    console.log('\n🎭 MockService状态:');
    console.log('   isMockModeEnabled():', mockService.isMockModeEnabled());
    console.log('   shouldUserBeLoggedIn():', mockService.shouldUserBeLoggedIn());
    console.log('   getCurrentMockState():', mockService.getCurrentMockState());
    
    const envConfig = mockService.getEnvConfig();
    console.log('   getEnvConfig():', envConfig);
  } catch (error) {
    console.log('\n❌ 无法检查MockService:', error.message);
  }
};

// 在开发环境下自动运行
if (__DEV__) {
  // 延迟执行，确保所有模块都已加载
  setTimeout(verifyEnvConfig, 2000);
  
  // 暴露到全局
  global.verifyEnvConfig = verifyEnvConfig;
  
  console.log('🛠️ 环境验证工具已加载: global.verifyEnvConfig()');
}

export default verifyEnvConfig;