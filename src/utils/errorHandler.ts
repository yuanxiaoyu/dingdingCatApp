// Global Error Handler Utility
import { Alert } from 'react-native';
import { ApiError, ErrorRecovery } from '../types';
import { logger } from './logger';

export enum ErrorType {
  NETWORK = 'network',
  API = 'api',
  AUTH = 'auth',
  RISK_CONTROL = 'risk_control',
  BUSINESS = 'business',
  SYSTEM = 'system',
  UNKNOWN = 'unknown',
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: number;
  additionalInfo?: Record<string, any>;
}

export interface ErrorHandlerOptions {
  showAlert?: boolean;
  enableRetry?: boolean;
  enableReporting?: boolean;
  fallbackStrategy?: 'cache' | 'offline' | 'disable';
  customMessage?: string;
}

class GlobalErrorHandler {
  private errorCounts = new Map<string, number>();
  private maxErrorsPerMinute = 10;
  private errorTimeWindow = 60000; // 1 minute
  private errorTimestamps: number[] = [];

  /**
   * Handle different types of errors with appropriate strategies
   */
  public handleError(
    error: Error | ApiError,
    context: ErrorContext = {},
    options: ErrorHandlerOptions = {}
  ): ErrorRecovery {
    const errorType = this.classifyError(error);
    const errorKey = this.generateErrorKey(error, context);
    
    // Rate limiting for error handling
    if (this.isErrorRateLimited()) {
      logger.warn('ErrorHandler', 'Error rate limit exceeded, suppressing error handling');
      return this.createErrorRecovery(false, false, false);
    }

    // Log error with context
    this.logError(error, errorType, context);

    // Update error count
    this.updateErrorCount(errorKey);

    // Determine recovery strategy based on error type
    const recovery = this.determineRecoveryStrategy(error, errorType, context, options);

    // Show user notification if needed
    if (options.showAlert !== false && recovery.userNotification.showError) {
      this.showErrorAlert(recovery.userNotification);
    }

    return recovery;
  }

  /**
   * Handle network errors specifically
   */
  public handleNetworkError(
    error: Error,
    context: ErrorContext = {},
    options: ErrorHandlerOptions = {}
  ): ErrorRecovery {
    logger.error('ErrorHandler', 'Network error occurred', { error: error.message, context });

    const recovery: ErrorRecovery = {
      retryConfig: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 1000,
      },
      fallbackStrategy: {
        useCache: true,
        showOfflineMode: true,
        disableFeature: false,
      },
      userNotification: {
        showError: true,
        errorMessage: options.customMessage || '网络连接失败，请检查网络设置',
        actionButton: '重试',
      },
    };

    if (options.showAlert !== false) {
      this.showNetworkErrorAlert(recovery.userNotification);
    }

    return recovery;
  }

  /**
   * Handle API errors with specific status codes
   */
  public handleApiError(
    error: ApiError,
    context: ErrorContext = {},
    options: ErrorHandlerOptions = {}
  ): ErrorRecovery {
    logger.error('ErrorHandler', 'API error occurred', { 
      code: error.code, 
      message: error.message, 
      context 
    });

    switch (error.code) {
      case 401:
        return this.handleAuthError(error, context, options);
      case 403:
        return this.handleRiskControlError(error, context, options);
      case 429:
        return this.handleRateLimitError(error, context, options);
      case 500:
      case 502:
      case 503:
      case 504:
        return this.handleServerError(error, context, options);
      default:
        return this.handleGenericApiError(error, context, options);
    }
  }

  /**
   * Handle authentication errors (401)
   */
  private handleAuthError(
    error: ApiError,
    context: ErrorContext,
    options: ErrorHandlerOptions
  ): ErrorRecovery {
    const recovery: ErrorRecovery = {
      retryConfig: {
        maxRetries: 1,
        backoffMultiplier: 1,
        initialDelay: 0,
      },
      fallbackStrategy: {
        useCache: false,
        showOfflineMode: false,
        disableFeature: true,
      },
      userNotification: {
        showError: true,
        errorMessage: '登录已过期，请重新登录',
        actionButton: '重新登录',
      },
    };

    if (options.showAlert !== false) {
      Alert.alert(
        '登录过期',
        '您的登录已过期，请重新登录',
        [
          {
            text: '重新登录',
            onPress: () => {
              // TODO: Navigate to login screen
              logger.info('ErrorHandler', 'User chose to re-login');
            },
          },
        ]
      );
    }

    return recovery;
  }

  /**
   * Handle risk control errors (403)
   */
  private handleRiskControlError(
    error: ApiError,
    context: ErrorContext,
    options: ErrorHandlerOptions
  ): ErrorRecovery {
    const recovery: ErrorRecovery = {
      retryConfig: {
        maxRetries: 0,
        backoffMultiplier: 1,
        initialDelay: 0,
      },
      fallbackStrategy: {
        useCache: false,
        showOfflineMode: false,
        disableFeature: true,
      },
      userNotification: {
        showError: true,
        errorMessage: this.getRiskControlMessage(error),
        actionButton: '我知道了',
      },
    };

    if (options.showAlert !== false) {
      this.showRiskControlAlert(error);
    }

    return recovery;
  }

  /**
   * Handle rate limit errors (429)
   */
  private handleRateLimitError(
    error: ApiError,
    context: ErrorContext,
    options: ErrorHandlerOptions
  ): ErrorRecovery {
    const recovery: ErrorRecovery = {
      retryConfig: {
        maxRetries: 2,
        backoffMultiplier: 3,
        initialDelay: 5000, // 5 seconds
      },
      fallbackStrategy: {
        useCache: true,
        showOfflineMode: false,
        disableFeature: false,
      },
      userNotification: {
        showError: true,
        errorMessage: '请求过于频繁，请稍后再试',
        actionButton: '稍后重试',
      },
    };

    return recovery;
  }

  /**
   * Handle server errors (5xx)
   */
  private handleServerError(
    error: ApiError,
    context: ErrorContext,
    options: ErrorHandlerOptions
  ): ErrorRecovery {
    const recovery: ErrorRecovery = {
      retryConfig: {
        maxRetries: 2,
        backoffMultiplier: 2,
        initialDelay: 2000,
      },
      fallbackStrategy: {
        useCache: true,
        showOfflineMode: true,
        disableFeature: false,
      },
      userNotification: {
        showError: true,
        errorMessage: '服务器暂时不可用，请稍后再试',
        actionButton: '重试',
      },
    };

    return recovery;
  }

  /**
   * Handle generic API errors
   */
  private handleGenericApiError(
    error: ApiError,
    context: ErrorContext,
    options: ErrorHandlerOptions
  ): ErrorRecovery {
    const recovery: ErrorRecovery = {
      retryConfig: {
        maxRetries: 1,
        backoffMultiplier: 2,
        initialDelay: 1000,
      },
      fallbackStrategy: {
        useCache: false,
        showOfflineMode: false,
        disableFeature: false,
      },
      userNotification: {
        showError: true,
        errorMessage: options.customMessage || error.message || '请求失败，请稍后再试',
        actionButton: '重试',
      },
    };

    return recovery;
  }

  /**
   * Classify error type
   */
  private classifyError(error: Error | ApiError): ErrorType {
    if ('code' in error) {
      const apiError = error as ApiError;
      if (apiError.code === 401) return ErrorType.AUTH;
      if (apiError.code === 403) return ErrorType.RISK_CONTROL;
      return ErrorType.API;
    }

    if (error.message.includes('Network') || error.message.includes('timeout')) {
      return ErrorType.NETWORK;
    }

    if (error.message.includes('Permission') || error.message.includes('Unauthorized')) {
      return ErrorType.AUTH;
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * Generate unique error key for tracking
   */
  private generateErrorKey(error: Error | ApiError, context: ErrorContext): string {
    const errorCode = 'code' in error ? error.code : 0;
    const component = context.component || 'unknown';
    const action = context.action || 'unknown';
    return `${errorCode}_${component}_${action}`;
  }

  /**
   * Check if error handling is rate limited
   */
  private isErrorRateLimited(): boolean {
    const now = Date.now();
    
    // Remove old timestamps
    this.errorTimestamps = this.errorTimestamps.filter(
      timestamp => now - timestamp < this.errorTimeWindow
    );

    // Check if we've exceeded the limit
    if (this.errorTimestamps.length >= this.maxErrorsPerMinute) {
      return true;
    }

    // Add current timestamp
    this.errorTimestamps.push(now);
    return false;
  }

  /**
   * Update error count for specific error
   */
  private updateErrorCount(errorKey: string): void {
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);
  }

  /**
   * Log error with appropriate level
   */
  private logError(error: Error | ApiError, errorType: ErrorType, context: ErrorContext): void {
    const logData = {
      type: errorType,
      message: error.message,
      code: 'code' in error ? error.code : undefined,
      context,
      timestamp: new Date().toISOString(),
    };

    switch (errorType) {
      case ErrorType.NETWORK:
        logger.warn('ErrorHandler', 'Network error', logData);
        break;
      case ErrorType.AUTH:
        logger.warn('ErrorHandler', 'Authentication error', logData);
        break;
      case ErrorType.RISK_CONTROL:
        logger.warn('ErrorHandler', 'Risk control error', logData);
        break;
      case ErrorType.API:
        logger.error('ErrorHandler', 'API error', logData);
        break;
      default:
        logger.error('ErrorHandler', 'Unknown error', logData);
    }
  }

  /**
   * Determine recovery strategy based on error type and context
   */
  private determineRecoveryStrategy(
    error: Error | ApiError,
    errorType: ErrorType,
    context: ErrorContext,
    options: ErrorHandlerOptions
  ): ErrorRecovery {
    if ('code' in error) {
      return this.handleApiError(error as ApiError, context, options);
    }

    if (errorType === ErrorType.NETWORK) {
      return this.handleNetworkError(error, context, options);
    }

    // Default recovery strategy
    return this.createErrorRecovery(true, true, true, options.customMessage || error.message);
  }

  /**
   * Create error recovery configuration
   */
  private createErrorRecovery(
    showError: boolean,
    enableRetry: boolean,
    useCache: boolean,
    message?: string
  ): ErrorRecovery {
    return {
      retryConfig: {
        maxRetries: enableRetry ? 2 : 0,
        backoffMultiplier: 2,
        initialDelay: 1000,
      },
      fallbackStrategy: {
        useCache,
        showOfflineMode: false,
        disableFeature: false,
      },
      userNotification: {
        showError,
        errorMessage: message || '操作失败，请稍后再试',
        actionButton: enableRetry ? '重试' : '确定',
      },
    };
  }

  /**
   * Show generic error alert
   */
  private showErrorAlert(notification: ErrorRecovery['userNotification']): void {
    Alert.alert(
      '提示',
      notification.errorMessage,
      [
        {
          text: notification.actionButton || '确定',
          style: 'default',
        },
      ]
    );
  }

  /**
   * Show network error alert with retry option
   */
  private showNetworkErrorAlert(notification: ErrorRecovery['userNotification']): void {
    Alert.alert(
      '网络错误',
      notification.errorMessage,
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: notification.actionButton || '重试',
          onPress: () => {
            logger.info('ErrorHandler', 'User chose to retry network request');
          },
        },
      ]
    );
  }

  /**
   * Show risk control specific alert
   */
  private showRiskControlAlert(error: ApiError): void {
    const message = this.getRiskControlMessage(error);
    
    Alert.alert(
      '安全提示',
      message,
      [
        {
          text: '我知道了',
          style: 'default',
        },
      ]
    );
  }

  /**
   * Get risk control specific message
   */
  private getRiskControlMessage(error: ApiError): string {
    const details = error.details;
    
    if (details?.riskType) {
      switch (details.riskType) {
        case 'ROOT_DETECTED':
          return '检测到设备已ROOT，为了账户安全，暂时无法使用此功能';
        case 'EMULATOR_DETECTED':
          return '检测到模拟器环境，为了账户安全，暂时无法使用此功能';
        case 'FREQUENCY_LIMIT':
          return '操作过于频繁，请稍后再试';
        case 'IP_LIMIT':
          return '当前网络环境异常，请更换网络后重试';
        case 'DAILY_LIMIT':
          return '今日观看次数已达上限，请明天再来';
        case 'REVENUE_LIMIT':
          return '收益异常，请联系客服处理';
        default:
          return '触发安全规则，暂时无法使用此功能';
      }
    }

    return error.message || '触发安全规则，暂时无法使用此功能';
  }

  /**
   * Clear error counts (useful for testing or reset)
   */
  public clearErrorCounts(): void {
    this.errorCounts.clear();
    this.errorTimestamps = [];
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts);
  }
}

// Create singleton instance
export const globalErrorHandler = new GlobalErrorHandler();

// Convenience functions
export const handleError = (
  error: Error | ApiError,
  context?: ErrorContext,
  options?: ErrorHandlerOptions
) => globalErrorHandler.handleError(error, context, options);

export const handleNetworkError = (
  error: Error,
  context?: ErrorContext,
  options?: ErrorHandlerOptions
) => globalErrorHandler.handleNetworkError(error, context, options);

export const handleApiError = (
  error: ApiError,
  context?: ErrorContext,
  options?: ErrorHandlerOptions
) => globalErrorHandler.handleApiError(error, context, options);

export default globalErrorHandler;