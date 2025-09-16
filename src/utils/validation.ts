// Validation Utility Functions
import { AdType, AdRequest, DeviceInfo } from '../types';

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format (Chinese mobile)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate user ID
 */
export const isValidUserId = (userId: number): boolean => {
  return Number.isInteger(userId) && userId > 0;
};

/**
 * Validate app key format
 */
export const isValidAppKey = (appKey: string): boolean => {
  return typeof appKey === 'string' && appKey.length > 0;
};

/**
 * Validate ad request parameters
 */
export const validateAdRequest = (request: AdRequest): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!isValidUserId(request.userId)) {
    errors.push('Invalid user ID');
  }

  if (!isValidAppKey(request.appKey)) {
    errors.push('Invalid app key');
  }

  if (!Object.values(AdType).includes(request.adType)) {
    errors.push('Invalid ad type');
  }

  if (!request.deviceType || request.deviceType.trim().length === 0) {
    errors.push('Device type is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate device info
 */
export const validateDeviceInfo = (deviceInfo: DeviceInfo): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!deviceInfo.deviceId || deviceInfo.deviceId.trim().length === 0) {
    errors.push('Device ID is required');
  }

  if (!deviceInfo.deviceModel || deviceInfo.deviceModel.trim().length === 0) {
    errors.push('Device model is required');
  }

  if (!deviceInfo.systemVersion || deviceInfo.systemVersion.trim().length === 0) {
    errors.push('System version is required');
  }

  if (!deviceInfo.appVersion || deviceInfo.appVersion.trim().length === 0) {
    errors.push('App version is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate revenue amount
 */
export const isValidRevenueAmount = (amount: number, maxAmount: number = 10): boolean => {
  return typeof amount === 'number' && amount >= 0 && amount <= maxAmount;
};

/**
 * Validate play duration
 */
export const isValidPlayDuration = (duration: number, maxDuration: number = 300): boolean => {
  return typeof duration === 'number' && duration >= 0 && duration <= maxDuration;
};

/**
 * Validate timestamp
 */
export const isValidTimestamp = (timestamp: number): boolean => {
  const now = Date.now();
  const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
  const oneHourFromNow = now + (60 * 60 * 1000);
  
  return timestamp >= oneYearAgo && timestamp <= oneHourFromNow;
};

/**
 * Validate configuration version format
 */
export const isValidConfigVersion = (version: string): boolean => {
  const versionRegex = /^\d+\.\d+\.\d+$/;
  return versionRegex.test(version);
};