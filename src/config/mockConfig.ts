/**
 * Mock配置管理
 * 统一管理Mock模式的开关和配置
 */

import { ENV_CONFIG } from './env';

export interface MockConfig {
  // 是否启用Mock模式
  enabled: boolean;
  // Mock用户状态 (0: 未登录, 1: 已登录)
  userState: 0 | 1;
  // 是否在控制台显示Mock日志
  showLogs: boolean;
  // Mock延迟时间（毫秒）
  delay: number;
}

/**
 * 默认Mock配置
 */
const DEFAULT_MOCK_CONFIG: MockConfig = {
  enabled: true,  // 默认启用Mock模式
  userState: 1,   // 默认已登录状态
  showLogs: true, // 显示Mock日志
  delay: 100,     // 100ms延迟模拟网络请求
};

// 动态导入控制器（避免循环依赖）
let mockModeController: any = null;
try {
  mockModeController = require('../utils/mockModeController').default;
} catch (error) {
  // 控制器未初始化时使用默认配置
}

/**
 * 获取当前Mock配置
 */
export function getMockConfig(): MockConfig {
  // 如果控制器可用，使用控制器的状态
  if (mockModeController) {
    try {
      const status = mockModeController.getMockModeStatus();
      return {
        enabled: status.enabled,
        userState: status.userState,
        showLogs: ENV_CONFIG.DEBUG_MODE ?? DEFAULT_MOCK_CONFIG.showLogs,
        delay: DEFAULT_MOCK_CONFIG.delay,
      };
    } catch (error) {
      // 控制器出错时回退到环境配置
    }
  }

  // 回退到环境配置
  return {
    enabled: ENV_CONFIG.MOCK_ENABLED ?? DEFAULT_MOCK_CONFIG.enabled,
    userState: ENV_CONFIG.MOCK_USER_STATE ?? DEFAULT_MOCK_CONFIG.userState,
    showLogs: ENV_CONFIG.DEBUG_MODE ?? DEFAULT_MOCK_CONFIG.showLogs,
    delay: DEFAULT_MOCK_CONFIG.delay,
  };
}

/**
 * 检查是否启用Mock模式
 */
export function isMockEnabled(): boolean {
  return getMockConfig().enabled;
}

/**
 * 获取Mock用户状态
 */
export function getMockUserState(): 0 | 1 {
  return getMockConfig().userState;
}

/**
 * Mock日志输出
 */
export function mockLog(message: string, data?: any): void {
  const config = getMockConfig();
  if (config.showLogs) {
    console.log(`🎭 [Mock] ${message}`, data || '');
  }
}

/**
 * Mock延迟
 */
export function mockDelay(): Promise<void> {
  const config = getMockConfig();
  return new Promise(resolve => setTimeout(resolve, config.delay));
}

export default {
  getMockConfig,
  isMockEnabled,
  getMockUserState,
  mockLog,
  mockDelay,
};