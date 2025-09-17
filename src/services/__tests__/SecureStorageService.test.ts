import * as Keychain from 'react-native-keychain';
import { SecureStorageService } from '../SecureStorageService';

// Mock Keychain
jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn(),
  getInternetCredentials: jest.fn(),
  resetInternetCredentials: jest.fn(),
  getAllInternetCredentials: jest.fn(),
  getSecurityLevel: jest.fn(),
}));

describe('SecureStorageService', () => {
  let secureStorageService: SecureStorageService;

  beforeEach(() => {
    secureStorageService = SecureStorageService.getInstance();
    jest.clearAllMocks();
  });

  describe('setSecureItem', () => {
    it('should store secure data with service prefix', async () => {
      await secureStorageService.setSecureItem('test_key', 'secret_value');
      
      expect(Keychain.setInternetCredentials).toHaveBeenCalledWith(
        'com.dingdingcat.test_key',
        'default',
        'secret_value'
      );
    });

    it('should store secure data with custom username', async () => {
      await secureStorageService.setSecureItem('test_key', 'secret_value', 'user123');
      
      expect(Keychain.setInternetCredentials).toHaveBeenCalledWith(
        'com.dingdingcat.test_key',
        'user123',
        'secret_value'
      );
    });

    it('should handle storage errors', async () => {
      (Keychain.setInternetCredentials as jest.Mock).mockRejectedValue(new Error('Keychain error'));
      
      await expect(secureStorageService.setSecureItem('test_key', 'value')).rejects.toThrow('Secure storage write failed');
    });
  });

  describe('getSecureItem', () => {
    it('should retrieve secure data', async () => {
      (Keychain.getInternetCredentials as jest.Mock).mockResolvedValue({
        username: 'default',
        password: 'secret_value'
      });
      
      const result = await secureStorageService.getSecureItem('test_key');
      
      expect(Keychain.getInternetCredentials).toHaveBeenCalledWith('com.dingdingcat.test_key');
      expect(result).toBe('secret_value');
    });

    it('should return null for non-existent keys', async () => {
      (Keychain.getInternetCredentials as jest.Mock).mockResolvedValue(false);
      
      const result = await secureStorageService.getSecureItem('non_existent');
      
      expect(result).toBeNull();
    });

    it('should handle retrieval errors gracefully', async () => {
      (Keychain.getInternetCredentials as jest.Mock).mockRejectedValue(new Error('Keychain error'));
      
      const result = await secureStorageService.getSecureItem('test_key');
      
      expect(result).toBeNull();
    });
  });

  describe('removeSecureItem', () => {
    it('should remove secure item', async () => {
      await secureStorageService.removeSecureItem('test_key');
      
      expect(Keychain.resetInternetCredentials).toHaveBeenCalledWith('com.dingdingcat.test_key');
    });
  });

  describe('hasSecureItem', () => {
    it('should return true for existing items', async () => {
      (Keychain.getInternetCredentials as jest.Mock).mockResolvedValue({
        username: 'default',
        password: 'secret_value'
      });
      
      const result = await secureStorageService.hasSecureItem('test_key');
      
      expect(result).toBe(true);
    });

    it('should return false for non-existent items', async () => {
      (Keychain.getInternetCredentials as jest.Mock).mockResolvedValue(false);
      
      const result = await secureStorageService.hasSecureItem('test_key');
      
      expect(result).toBe(false);
    });
  });

  describe('token management', () => {
    it('should store and retrieve access token', async () => {
      const token = 'access_token_123';
      
      // Mock successful storage
      (Keychain.setInternetCredentials as jest.Mock).mockResolvedValue(true);
      await secureStorageService.setAccessToken(token);
      expect(Keychain.setInternetCredentials).toHaveBeenCalledWith(
        'com.dingdingcat.access_token',
        'default',
        token
      );

      (Keychain.getInternetCredentials as jest.Mock).mockResolvedValue({
        username: 'default',
        password: token
      });

      const result = await secureStorageService.getAccessToken();
      expect(result).toBe(token);
    });

    it('should store and retrieve refresh token', async () => {
      const token = 'refresh_token_123';
      
      // Mock successful storage
      (Keychain.setInternetCredentials as jest.Mock).mockResolvedValue(true);
      await secureStorageService.setRefreshToken(token);
      expect(Keychain.setInternetCredentials).toHaveBeenCalledWith(
        'com.dingdingcat.refresh_token',
        'default',
        token
      );

      (Keychain.getInternetCredentials as jest.Mock).mockResolvedValue({
        username: 'default',
        password: token
      });

      const result = await secureStorageService.getRefreshToken();
      expect(result).toBe(token);
    });
  });

  describe('clearAll', () => {
    it('should clear all app-specific secure data', async () => {
      (Keychain.getAllInternetCredentials as jest.Mock).mockResolvedValue([
        { service: 'com.dingdingcat.key1' },
        { service: 'com.dingdingcat.key2' },
        { service: 'other.app.key' }
      ]);
      
      await secureStorageService.clearAll();
      
      expect(Keychain.resetInternetCredentials).toHaveBeenCalledTimes(2);
      expect(Keychain.resetInternetCredentials).toHaveBeenCalledWith('com.dingdingcat.key1');
      expect(Keychain.resetInternetCredentials).toHaveBeenCalledWith('com.dingdingcat.key2');
    });
  });

  describe('getSecureStorageStats', () => {
    it('should return secure storage statistics', async () => {
      (Keychain.getAllInternetCredentials as jest.Mock).mockResolvedValue([
        { service: 'com.dingdingcat.key1' },
        { service: 'com.dingdingcat.key2' },
        { service: 'other.app.key' }
      ]);
      
      const stats = await secureStorageService.getSecureStorageStats();
      
      expect(stats.totalServices).toBe(2);
      expect(stats.services).toEqual(['key1', 'key2']);
    });
  });

  describe('isKeychainAvailable', () => {
    it('should return true when keychain is available', async () => {
      (Keychain.getSecurityLevel as jest.Mock).mockResolvedValue('SECURE_HARDWARE');
      
      const result = await secureStorageService.isKeychainAvailable();
      
      expect(result).toBe(true);
    });

    it('should return false when keychain is not available', async () => {
      (Keychain.getSecurityLevel as jest.Mock).mockRejectedValue(new Error('Not available'));
      
      const result = await secureStorageService.isKeychainAvailable();
      
      expect(result).toBe(false);
    });
  });
});