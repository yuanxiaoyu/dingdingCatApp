import * as Keychain from 'react-native-keychain';
import { logger } from '../utils/logger';

/**
 * SecureStorageService - 处理敏感数据的安全存储
 * 使用 Keychain 存储访问令牌、密码等敏感信息
 */
export class SecureStorageService {
  private static instance: SecureStorageService;
  private readonly servicePrefix = 'com.dingdingcat.';

  private constructor() {}

  public static getInstance(): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService();
    }
    return SecureStorageService.instance;
  }

  /**
   * 生成服务名称
   */
  private getServiceName(key: string): string {
    return `${this.servicePrefix}${key}`;
  }

  /**
   * 存储敏感数据
   */
  async setSecureItem(key: string, value: string, username: string = 'default'): Promise<void> {
    try {
      await Keychain.setInternetCredentials(
        this.getServiceName(key),
        username,
        value
      );
      logger.debug('SecureStorageService', `Stored secure data for key: ${key}`);
    } catch (error) {
      logger.error('SecureStorageService', `Failed to store secure data for key: ${key}`, error);
      throw new Error(`Secure storage write failed: ${error}`);
    }
  }

  /**
   * 获取敏感数据
   */
  async getSecureItem(key: string): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(this.getServiceName(key));
      if (credentials && credentials.password) {
        return credentials.password;
      }
      return null;
    } catch (error) {
      logger.error('SecureStorageService', `Failed to get secure data for key: ${key}`, error);
      return null;
    }
  }

  /**
   * 删除敏感数据
   */
  async removeSecureItem(key: string): Promise<void> {
    try {
      await Keychain.resetInternetCredentials(this.getServiceName(key));
      logger.debug('SecureStorageService', `Removed secure data for key: ${key}`);
    } catch (error) {
      logger.error('SecureStorageService', `Failed to remove secure data for key: ${key}`, error);
      throw new Error(`Secure storage remove failed: ${error}`);
    }
  }

  /**
   * 检查敏感数据是否存在
   */
  async hasSecureItem(key: string): Promise<boolean> {
    try {
      const credentials = await Keychain.getInternetCredentials(this.getServiceName(key));
      return credentials !== false;
    } catch (error) {
      logger.error('SecureStorageService', `Failed to check secure key existence: ${key}`, error);
      return false;
    }
  }

  /**
   * 存储访问令牌
   */
  async setAccessToken(token: string): Promise<void> {
    await this.setSecureItem('access_token', token);
  }

  /**
   * 获取访问令牌
   */
  async getAccessToken(): Promise<string | null> {
    return await this.getSecureItem('access_token');
  }

  /**
   * 删除访问令牌
   */
  async removeAccessToken(): Promise<void> {
    await this.removeSecureItem('access_token');
  }

  /**
   * 存储刷新令牌
   */
  async setRefreshToken(token: string): Promise<void> {
    await this.setSecureItem('refresh_token', token);
  }

  /**
   * 获取刷新令牌
   */
  async getRefreshToken(): Promise<string | null> {
    return await this.getSecureItem('refresh_token');
  }

  /**
   * 删除刷新令牌
   */
  async removeRefreshToken(): Promise<void> {
    await this.removeSecureItem('refresh_token');
  }

  /**
   * 存储用户凭据
   */
  async setUserCredentials(userId: string, credentials: string): Promise<void> {
    await this.setSecureItem(`user_credentials_${userId}`, credentials, userId);
  }

  /**
   * 获取用户凭据
   */
  async getUserCredentials(userId: string): Promise<string | null> {
    return await this.getSecureItem(`user_credentials_${userId}`);
  }

  /**
   * 删除用户凭据
   */
  async removeUserCredentials(userId: string): Promise<void> {
    await this.removeSecureItem(`user_credentials_${userId}`);
  }

  /**
   * 存储加密密钥
   */
  async setEncryptionKey(keyName: string, key: string): Promise<void> {
    await this.setSecureItem(`encryption_key_${keyName}`, key);
  }

  /**
   * 获取加密密钥
   */
  async getEncryptionKey(keyName: string): Promise<string | null> {
    return await this.getSecureItem(`encryption_key_${keyName}`);
  }

  /**
   * 删除加密密钥
   */
  async removeEncryptionKey(keyName: string): Promise<void> {
    await this.removeSecureItem(`encryption_key_${keyName}`);
  }

  /**
   * 清除所有敏感数据
   */
  async clearAll(): Promise<void> {
    try {
      // 获取所有服务
      const services = await Keychain.getAllInternetCredentials();
      
      // 删除所有以我们的前缀开头的服务
      for (const service of services) {
        if (service.service.startsWith(this.servicePrefix)) {
          await Keychain.resetInternetCredentials(service.service);
        }
      }
      
      logger.info('SecureStorageService', 'Cleared all secure storage data');
    } catch (error) {
      logger.error('SecureStorageService', 'Failed to clear secure storage', error);
      throw new Error(`Secure storage clear failed: ${error}`);
    }
  }

  /**
   * 获取安全存储统计信息
   */
  async getSecureStorageStats(): Promise<{
    totalServices: number;
    services: string[];
  }> {
    try {
      const services = await Keychain.getAllInternetCredentials();
      const ourServices = services
        .filter(service => service.service.startsWith(this.servicePrefix))
        .map(service => service.service.replace(this.servicePrefix, ''));
      
      return {
        totalServices: ourServices.length,
        services: ourServices
      };
    } catch (error) {
      logger.error('SecureStorageService', 'Failed to get secure storage stats', error);
      return { totalServices: 0, services: [] };
    }
  }

  /**
   * 检查 Keychain 可用性
   */
  async isKeychainAvailable(): Promise<boolean> {
    try {
      const options = await Keychain.getSecurityLevel();
      return options !== null;
    } catch (error) {
      logger.error('SecureStorageService', 'Keychain not available', error);
      return false;
    }
  }
}

// 导出单例实例
export default SecureStorageService.getInstance();