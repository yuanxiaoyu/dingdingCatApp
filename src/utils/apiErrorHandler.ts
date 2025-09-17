// API Error Handler Integration
import { AxiosError } from 'axios';
import { ApiError } from '../types';
import { globalErrorHandler, ErrorContext, ErrorHandlerOptions } from './errorHandler';
import { toastManager } from './toastManager';
import { logger } from './logger';

/**
 * Transform Axios error to API error
 */
export const transformAxiosError = (error: AxiosError): ApiError => {
  if (error.response?.data && typeof error.response.data === 'object') {
    const responseData = error.response.data as any;
    return {
      code: responseData.code || error.response.status,
      message: responseData.message || error.message,
      details: responseData,
    };
  }

  // Network or other errors
  return {
    code: error.response?.status || 0,
    message: error.message || 'Network error',
    details: {
      code: error.code,
      config: error.config,
    },
  };
};

/**
 * Handle API errors with appropriate user feedback
 */
export const handleApiError = (
  error: AxiosError | ApiError,
  context: ErrorContext = {},
  options: ErrorHandlerOptions = {}
): void => {
  let apiError: ApiError;

  if ('isAxiosError' in error) {
    apiError = transformAxiosError(error as AxiosError);
  } else {
    apiError = error as ApiError;
  }

  logger.error('ApiErrorHandler', 'API error occurred', {
    code: apiError.code,
    message: apiError.message,
    context,
  });

  // Use global error handler
  const recovery = globalErrorHandler.handleApiError(apiError, context, {
    showAlert: false, // We'll use toasts instead
    ...options,
  });

  // Show appropriate toast based on error type
  if (recovery.userNotification.showError) {
    switch (apiError.code) {
      case 401:
        toastManager.error('登录已过期，请重新登录', {
          actionText: '重新登录',
          onActionPress: () => {
            // TODO: Navigate to login
            logger.info('ApiErrorHandler', 'User chose to re-login from toast');
          },
        });
        break;

      case 403:
        // Check if it's a risk control error
        if (apiError.details?.riskType) {
          toastManager.riskWarning(apiError.details.riskType);
        } else {
          toastManager.warning('访问被拒绝，可能触发了安全规则');
        }
        break;

      case 429:
        toastManager.warning('请求过于频繁，请稍后再试');
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        toastManager.error('服务器暂时不可用，请稍后再试', {
          actionText: recovery.userNotification.actionButton,
        });
        break;

      default:
        if (apiError.message.includes('Network') || apiError.code === 0) {
          toastManager.networkError();
        } else {
          toastManager.error(apiError.message || '请求失败，请稍后再试');
        }
    }
  }
};

/**
 * Handle network errors specifically
 */
export const handleNetworkError = (
  error: Error,
  context: ErrorContext = {},
  onRetry?: () => void
): void => {
  logger.error('ApiErrorHandler', 'Network error occurred', {
    message: error.message,
    context,
  });

  globalErrorHandler.handleNetworkError(error, context, {
    showAlert: false,
  });

  toastManager.networkError(onRetry);
};

/**
 * Handle successful API responses with user feedback
 */
export const handleApiSuccess = (
  message: string,
  context: ErrorContext = {}
): void => {
  logger.info('ApiErrorHandler', 'API success', {
    message,
    context,
  });

  toastManager.success(message);
};

/**
 * Handle ad-related API responses
 */
export const handleAdApiResponse = (
  adType: string,
  eventType: string,
  reward?: number,
  error?: ApiError
): void => {
  if (error) {
    handleApiError(error, {
      component: 'AdService',
      action: `${adType}_${eventType}`,
    });
    return;
  }

  // Success cases
  switch (eventType) {
    case 'complete':
      toastManager.adSuccess(adType, reward);
      break;
    case 'show':
      logger.info('ApiErrorHandler', 'Ad shown successfully', { adType });
      break;
    case 'click':
      toastManager.info('广告点击已记录');
      break;
    default:
      logger.info('ApiErrorHandler', 'Ad event recorded', { adType, eventType });
  }
};

/**
 * Handle authentication-related API responses
 */
export const handleAuthApiResponse = (
  action: string,
  success: boolean,
  error?: ApiError
): void => {
  if (error) {
    handleApiError(error, {
      component: 'AuthService',
      action,
    });
    return;
  }

  if (success) {
    switch (action) {
      case 'login':
        toastManager.success('登录成功');
        break;
      case 'register':
        toastManager.success('注册成功');
        break;
      case 'logout':
        toastManager.info('已退出登录');
        break;
      default:
        toastManager.success('操作成功');
    }
  }
};

/**
 * Handle configuration-related API responses
 */
export const handleConfigApiResponse = (
  configType: string,
  success: boolean,
  error?: ApiError
): void => {
  if (error) {
    handleApiError(error, {
      component: 'ConfigService',
      action: `get_${configType}`,
    });
    return;
  }

  if (success) {
    logger.info('ApiErrorHandler', 'Configuration loaded successfully', { configType });
    // Don't show success toast for config loading as it's background operation
  }
};

/**
 * Handle sync-related API responses
 */
export const handleSyncApiResponse = (
  syncType: string,
  success: boolean,
  count?: number,
  error?: ApiError
): void => {
  if (error) {
    handleApiError(error, {
      component: 'SyncService',
      action: syncType,
    });
    return;
  }

  if (success && count && count > 0) {
    toastManager.success(`数据同步完成，已上报 ${count} 条记录`);
  }
};

export default {
  transformAxiosError,
  handleApiError,
  handleNetworkError,
  handleApiSuccess,
  handleAdApiResponse,
  handleAuthApiResponse,
  handleConfigApiResponse,
  handleSyncApiResponse,
};