/**
 * 调试配置调用脚本
 * 用于追踪是什么在触发配置加载
 */

// 将此代码添加到你的应用中来追踪配置调用

const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// 拦截所有配置相关的日志
const configKeywords = [
  '加载应用配置',
  '拉取风控配置', 
  'Loading app config',
  'Loading risk config',
  'getAppConfig',
  'getRiskConfig',
  'getAdConfig',
  'getChannelConfig',
  'initializeConfigurations',
  'Configuration loading',
  'Config loading'
];

function interceptConsole(originalMethod, methodName) {
  return function(...args) {
    const message = args.join(' ');
    
    // 检查是否包含配置相关关键词
    const hasConfigKeyword = configKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (hasConfigKeyword) {
      // 获取调用栈
      const stack = new Error().stack;
      originalMethod(`🔍 [CONFIG CALL DETECTED] ${methodName}:`, ...args);
      originalMethod('📍 Call stack:', stack);
      originalMethod('─'.repeat(80));
    } else {
      originalMethod(...args);
    }
  };
}

// 拦截console方法
console.log = interceptConsole(originalConsoleLog, 'LOG');
console.warn = interceptConsole(originalConsoleWarn, 'WARN');
console.error = interceptConsole(originalConsoleError, 'ERROR');

// 拦截ConfigService方法
const interceptConfigService = () => {
  try {
    const configService = require('../src/services/ConfigService').default;
    
    // 保存原始方法
    const originalGetAppConfig = configService.getAppConfig;
    const originalGetRiskConfig = configService.getRiskConfig;
    const originalGetAdConfig = configService.getAdConfig;
    const originalGetChannelConfig = configService.getChannelConfig;
    
    // 拦截getAppConfig
    configService.getAppConfig = function(...args) {
      const stack = new Error().stack;
      console.log('🚨 ConfigService.getAppConfig called!');
      console.log('📍 Call stack:', stack);
      console.log('─'.repeat(80));
      return originalGetAppConfig.apply(this, args);
    };
    
    // 拦截getRiskConfig
    configService.getRiskConfig = function(...args) {
      const stack = new Error().stack;
      console.log('🚨 ConfigService.getRiskConfig called!');
      console.log('📍 Call stack:', stack);
      console.log('─'.repeat(80));
      return originalRiskConfig.apply(this, args);
    };
    
    // 拦截getAdConfig
    configService.getAdConfig = function(...args) {
      const stack = new Error().stack;
      console.log('🚨 ConfigService.getAdConfig called!');
      console.log('📍 Call stack:', stack);
      console.log('─'.repeat(80));
      return originalGetAdConfig.apply(this, args);
    };
    
    // 拦截getChannelConfig
    configService.getChannelConfig = function(...args) {
      const stack = new Error().stack;
      console.log('🚨 ConfigService.getChannelConfig called!');
      console.log('📍 Call stack:', stack);
      console.log('─'.repeat(80));
      return originalGetChannelConfig.apply(this, args);
    };
    
    console.log('✅ ConfigService methods intercepted');
    
  } catch (error) {
    console.log('❌ Failed to intercept ConfigService:', error);
  }
};

// 拦截MockService方法
const interceptMockService = () => {
  try {
    const mockService = require('../src/services/MockService').default;
    
    // 保存原始方法
    const originalGetMockAdConfig = mockService.getMockAdConfig;
    const originalGetMockAppConfig = mockService.getMockAppConfig;
    const originalGetMockRiskConfig = mockService.getMockRiskConfig;
    
    // 拦截getMockAdConfig
    mockService.getMockAdConfig = function(...args) {
      const stack = new Error().stack;
      console.log('🎭 MockService.getMockAdConfig called!');
      console.log('📍 Call stack:', stack);
      console.log('─'.repeat(80));
      return originalGetMockAdConfig.apply(this, args);
    };
    
    // 拦截getMockAppConfig
    mockService.getMockAppConfig = function(...args) {
      const stack = new Error().stack;
      console.log('🎭 MockService.getMockAppConfig called!');
      console.log('📍 Call stack:', stack);
      console.log('─'.repeat(80));
      return originalGetMockAppConfig.apply(this, args);
    };
    
    // 拦截getMockRiskConfig
    mockService.getMockRiskConfig = function(...args) {
      const stack = new Error().stack;
      console.log('🎭 MockService.getMockRiskConfig called!');
      console.log('📍 Call stack:', stack);
      console.log('─'.repeat(80));
      return originalGetMockRiskConfig.apply(this, args);
    };
    
    console.log('✅ MockService methods intercepted');
    
  } catch (error) {
    console.log('❌ Failed to intercept MockService:', error);
  }
};

// 延迟执行拦截，确保服务已加载
setTimeout(() => {
  console.log('🔧 Setting up config call debugging...');
  interceptConfigService();
  interceptMockService();
  console.log('🔍 Config call debugging is now active!');
  console.log('📝 Watch for 🚨 and 🎭 markers in the logs');
}, 1000);

// 暴露到全局供手动调用
if (__DEV__) {
  global.debugConfigCalls = {
    interceptConfigService,
    interceptMockService,
    reset: () => {
      console.log = originalConsoleLog;
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
      console.log('🔄 Console methods reset');
    }
  };
  
  console.log('🛠️ Config debugging tools loaded:');
  console.log('- global.debugConfigCalls.interceptConfigService()');
  console.log('- global.debugConfigCalls.interceptMockService()');
  console.log('- global.debugConfigCalls.reset()');
}

export default {
  interceptConfigService,
  interceptMockService
};