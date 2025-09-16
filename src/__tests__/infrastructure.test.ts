// Infrastructure Setup Test
import { generateRandomNickname, formatRevenue } from '@/utils/helpers';
import { isValidEmail, isValidUserId, isValidAppKey } from '@/utils/validation';
import { AdType } from '@/types';

describe('Infrastructure Setup', () => {
  test('should have proper TypeScript types', () => {
    expect(AdType.SPLASH).toBe('splash');
    expect(AdType.REWARD_VIDEO).toBe('video');
    expect(AdType.INTERSTITIAL).toBe('interstitial');
    expect(AdType.BANNER).toBe('banner');
  });

  test('should have working helper functions', () => {
    const nickname = generateRandomNickname();
    expect(nickname).toMatch(/^user_\d{4}$/);

    const revenue = formatRevenue(1.23);
    expect(revenue).toBe('¥1.23');
  });

  test('should have working validation functions', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);

    expect(isValidUserId(123)).toBe(true);
    expect(isValidUserId(-1)).toBe(false);

    expect(isValidAppKey('valid_key')).toBe(true);
    expect(isValidAppKey('')).toBe(false);
  });

  test('should have proper constants defined', () => {
    const { API_CONFIG, STORAGE_KEYS, AD_TYPES } = require('@/utils/constants');
    
    expect(API_CONFIG.TIMEOUT).toBe(10000);
    expect(STORAGE_KEYS.AUTH_TOKENS).toBe('auth_tokens');
    expect(AD_TYPES.SPLASH).toBe('splash');
  });
});