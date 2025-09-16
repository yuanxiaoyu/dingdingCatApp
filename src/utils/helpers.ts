// Helper Utility Functions
import { AdType } from '../types';

/**
 * Generate random user nickname in format user_xxxx
 */
export const generateRandomNickname = (): string => {
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `user_${randomNum}`;
};

/**
 * Format timestamp to readable date string
 */
export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('zh-CN');
};

/**
 * Calculate time difference in seconds
 */
export const getTimeDifferenceInSeconds = (timestamp1: number, timestamp2: number): number => {
  return Math.abs(timestamp1 - timestamp2) / 1000;
};

/**
 * Validate ad type
 */
export const isValidAdType = (adType: string): adType is AdType => {
  return Object.values(AdType).includes(adType as AdType);
};

/**
 * Generate unique ID for offline data
 */
export const generateUniqueId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Delay function for retry mechanisms
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Calculate exponential backoff delay
 */
export const calculateBackoffDelay = (attempt: number, baseDelay: number = 1000): number => {
  return baseDelay * Math.pow(2, attempt - 1);
};

/**
 * Check if network error is retryable
 */
export const isRetryableError = (error: any): boolean => {
  if (!error.response) return true; // Network error
  const status = error.response.status;
  return status >= 500 || status === 408 || status === 429;
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Format revenue amount
 */
export const formatRevenue = (amount: number): string => {
  return `¥${amount.toFixed(2)}`;
};

/**
 * Get ad type display name
 */
export const getAdTypeDisplayName = (adType: AdType): string => {
  const displayNames = {
    [AdType.SPLASH]: '开屏广告',
    [AdType.REWARD_VIDEO]: '视频激励广告',
    [AdType.INTERSTITIAL]: '插屏广告',
    [AdType.BANNER]: 'Banner广告',
  };
  return displayNames[adType] || adType;
};