/**
 * Mock模式控制器
 * 提供动态切换Mock模式的功能
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV_CONFIG } from '../config/env';

const STORAGE_KEYS = {
  MOCK_MODE_OVERRIDE: '@dingdingcat/mock_mode_override',
  MOCK_USER_STATE_OVERRIDE: '@dingdingcat/mock_user_state_override',
} as const;

export interface MockModeStatus {
  enabled: boolean;
  userState: 0 | 1;
  source: 'config' | 'override' | 'env';
  canToggle: boolean;
}

/**
 * Mock模式控制器类
 */
class MockModeController {
  private overrideEnabled: boolean | null = null;
  private overrideUserState: 0 | 1 | null = null;

  /**
   * 初始化控制器
   */
  public async initialize(): Promise<void> {
    try {
      // 读取存储的覆盖设置
      const enabledOverride = await AsyncStorage.getItem(STORAGE_KEYS.MOCK_MODE_OVERRIDE);
      const userStateOverride = await AsyncStorage.getItem(STORAGE_KEYS.MOCK_USER_STATE_OVERRIDE);

      if (enabledOverride !== null) {
        this.overrideEnabled = enabledOverride === 'true';
      }

      if (userStateOverride !== null) {
        this.overrideUserState = parseInt(userStateOverride) as 0 | 1;
      }

      console.log('MockModeController initialized:', {
        overrideEnabled: this.overrideEnabled,
        overrideUserState: this.overrideUserState,
      });
    } catch (error) {
      console.error('Failed to initialize MockModeController:', error);
    }
  }

  /**
   * 获取当前Mock模式状态
   */
  public getMockModeStatus(): MockModeStatus {
    let enabled: boolean;
    let userState: 0 | 1;
    let source: 'config' | 'override' | 'env';

    // 优先级：运行时覆盖 > 配置文件 > 环境变量
    if (this.overrideEnabled !== null) {
      enabled = this.overrideEnabled;
      source = 'override';
    } else {
      enabled = ENV_CONFIG.MOCK_ENABLED;
      source = 'config';
    }

    if (this.overrideUserState !== null) {
      userState = this.overrideUserState;
    } else {
      userState = ENV_CONFIG.MOCK_USER_STATE;
    }

    return {
      enabled,
      userState,
      source,
      canToggle: true, // 开发环境下总是可以切换
    };
  }

  /**
   * 切换Mock模式开关
   */
  public async toggleMockMode(): Promise<boolean> {
    const currentStatus = this.getMockModeStatus();
    const newEnabled = !currentStatus.enabled;

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MOCK_MODE_OVERRIDE, newEnabled.toString());
      this.overrideEnabled = newEnabled;

      console.log(`Mock模式已${newEnabled ? '启用' : '禁用'}`);
      return newEnabled;
    } catch (error) {
      console.error('Failed to toggle mock mode:', error);
      throw error;
    }
  }

  /**
   * 设置Mock用户状态
   */
  public async setMockUserState(userState: 0 | 1): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MOCK_USER_STATE_OVERRIDE, userState.toString());
      this.overrideUserState = userState;

      console.log(`Mock用户状态已设置为: ${userState === 1 ? '已登录' : '未登录'}`);
    } catch (error) {
      console.error('Failed to set mock user state:', error);
      throw error;
    }
  }

  /**
   * 启用Mock模式
   */
  public async enableMockMode(): Promise<void> {
    if (!this.getMockModeStatus().enabled) {
      await this.toggleMockMode();
    }
  }

  /**
   * 禁用Mock模式
   */
  public async disableMockMode(): Promise<void> {
    if (this.getMockModeStatus().enabled) {
      await this.toggleMockMode();
    }
  }

  /**
   * 重置所有覆盖设置
   */
  public async resetOverrides(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.MOCK_MODE_OVERRIDE),
        AsyncStorage.removeItem(STORAGE_KEYS.MOCK_USER_STATE_OVERRIDE),
      ]);

      this.overrideEnabled = null;
      this.overrideUserState = null;

      console.log('Mock模式覆盖设置已重置');
    } catch (error) {
      console.error('Failed to reset overrides:', error);
      throw error;
    }
  }

  /**
   * 获取Mock模式信息（用于调试）
   */
  public getDebugInfo(): {
    current: MockModeStatus;
    config: {
      envMockEnabled: boolean;
      envUserState: 0 | 1;
    };
    overrides: {
      enabled: boolean | null;
      userState: 0 | 1 | null;
    };
  } {
    return {
      current: this.getMockModeStatus(),
      config: {
        envMockEnabled: ENV_CONFIG.MOCK_ENABLED,
        envUserState: ENV_CONFIG.MOCK_USER_STATE,
      },
      overrides: {
        enabled: this.overrideEnabled,
        userState: this.overrideUserState,
      },
    };
  }
}

// 创建单例实例
const mockModeController = new MockModeController();

// 在开发环境下暴露到全局
if (__DEV__) {
  (global as any).mockModeController = mockModeController;
  
  // 便捷方法
  (global as any).enableMock = () => mockModeController.enableMockMode();
  (global as any).disableMock = () => mockModeController.disableMockMode();
  (global as any).toggleMock = () => mockModeController.toggleMockMode();
  (global as any).setMockUser = (state: 0 | 1) => mockModeController.setMockUserState(state);
  (global as any).getMockStatus = () => mockModeController.getMockModeStatus();
  (global as any).getMockDebug = () => mockModeController.getDebugInfo();
  
  console.log('Mock模式控制器已加载，可用命令:');
  console.log('- enableMock() - 启用Mock模式');
  console.log('- disableMock() - 禁用Mock模式');
  console.log('- toggleMock() - 切换Mock模式');
  console.log('- setMockUser(0|1) - 设置用户状态');
  console.log('- getMockStatus() - 查看当前状态');
  console.log('- getMockDebug() - 查看调试信息');
}

export default mockModeController;
export { MockModeController };