// Global Error Handler Tests
import { globalErrorHandler, ErrorType } from '../errorHandler';
import { ApiError } from '../../types';

// Mock logger
jest.mock('../logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock Alert
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

describe('GlobalErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalErrorHandler.clearErrorCounts();
  });

  describe('handleError', () => {
    it('handles network errors correctly', () => {
      const networkError = new Error('Network request failed');
      const recovery = globalErrorHandler.handleError(networkError);

      expect(recovery.retryConfig.maxRetries).toBe(3);
      expect(recovery.fallbackStrategy.useCache).toBe(true);
      expect(recovery.userNotification.showError).toBe(true);
      expect(recovery.userNotification.errorMessage).toContain('网络连接失败');
    });

    it('handles API errors correctly', () => {
      const apiError: ApiError = {
        code: 500,
        message: 'Internal server error',
        details: {},
      };

      const recovery = globalErrorHandler.handleApiError(apiError);

      expect(recovery.retryConfig.maxRetries).toBe(2);
      expect(recovery.userNotification.errorMessage).toContain('服务器暂时不可用');
    });

    it('handles authentication errors (401)', () => {
      const authError: ApiError = {
        code: 401,
        message: 'Unauthorized',
        details: {},
      };

      const recovery = globalErrorHandler.handleApiError(authError);

      expect(recovery.retryConfig.maxRetries).toBe(1);
      expect(recovery.fallbackStrategy.disableFeature).toBe(true);
      expect(recovery.userNotification.errorMessage).toContain('登录已过期');
    });

    it('handles risk control errors (403)', () => {
      const riskError: ApiError = {
        code: 403,
        message: 'Forbidden',
        details: { riskType: 'ROOT_DETECTED' },
      };

      const recovery = globalErrorHandler.handleApiError(riskError);

      expect(recovery.retryConfig.maxRetries).toBe(0);
      expect(recovery.fallbackStrategy.disableFeature).toBe(true);
      expect(recovery.userNotification.errorMessage).toContain('ROOT');
    });

    it('handles rate limit errors (429)', () => {
      const rateLimitError: ApiError = {
        code: 429,
        message: 'Too many requests',
        details: {},
      };

      const recovery = globalErrorHandler.handleApiError(rateLimitError);

      expect(recovery.retryConfig.maxRetries).toBe(2);
      expect(recovery.retryConfig.initialDelay).toBe(5000);
      expect(recovery.userNotification.errorMessage).toContain('请求过于频繁');
    });
  });

  describe('error rate limiting', () => {
    it('rate limits error handling when too many errors occur', () => {
      const error = new Error('Test error');
      
      // Generate many errors quickly
      for (let i = 0; i < 15; i++) {
        globalErrorHandler.handleError(error, {}, { showAlert: false });
      }

      // Should be rate limited now
      const recovery = globalErrorHandler.handleError(error, {}, { showAlert: false });
      expect(recovery.userNotification.showError).toBe(false);
    });
  });

  describe('error statistics', () => {
    it('tracks error counts correctly', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');

      globalErrorHandler.handleError(error1, { component: 'TestComponent' }, { showAlert: false });
      globalErrorHandler.handleError(error1, { component: 'TestComponent' }, { showAlert: false });
      globalErrorHandler.handleError(error2, { component: 'TestComponent' }, { showAlert: false });

      const stats = globalErrorHandler.getErrorStats();
      expect(Object.keys(stats).length).toBeGreaterThan(0);
    });

    it('clears error counts when requested', () => {
      const error = new Error('Test error');
      globalErrorHandler.handleError(error, {}, { showAlert: false });

      expect(Object.keys(globalErrorHandler.getErrorStats()).length).toBeGreaterThan(0);

      globalErrorHandler.clearErrorCounts();
      expect(Object.keys(globalErrorHandler.getErrorStats()).length).toBe(0);
    });
  });

  describe('risk control messages', () => {
    it('provides specific messages for different risk types', () => {
      const riskTypes = [
        'ROOT_DETECTED',
        'EMULATOR_DETECTED',
        'FREQUENCY_LIMIT',
        'IP_LIMIT',
        'DAILY_LIMIT',
        'REVENUE_LIMIT',
      ];

      riskTypes.forEach(riskType => {
        const riskError: ApiError = {
          code: 403,
          message: 'Risk control triggered',
          details: { riskType },
        };

        const recovery = globalErrorHandler.handleApiError(riskError, {}, { showAlert: false });
        expect(recovery.userNotification.errorMessage).toBeTruthy();
        expect(recovery.userNotification.errorMessage.length).toBeGreaterThan(0);
      });
    });
  });
});