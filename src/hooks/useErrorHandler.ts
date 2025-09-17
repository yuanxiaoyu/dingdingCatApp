// Custom Hook for Error Handling and User Feedback
import { useState, useCallback, useRef } from 'react';
import { ApiError, ErrorRecovery } from '../types';
import { globalErrorHandler, ErrorContext, ErrorHandlerOptions } from '../utils/errorHandler';
import { logger } from '../utils/logger';

export interface UseErrorHandlerOptions {
  enableToast?: boolean;
  enableRetry?: boolean;
  maxRetries?: number;
  component?: string;
}

export interface ErrorState {
  error: Error | ApiError | null;
  isLoading: boolean;
  retryCount: number;
  canRetry: boolean;
}

export interface UseErrorHandlerReturn {
  errorState: ErrorState;
  handleError: (error: Error | ApiError, context?: ErrorContext, options?: ErrorHandlerOptions) => ErrorRecovery;
  clearError: () => void;
  retry: (retryFn: () => Promise<void> | void) => Promise<void>;
  setLoading: (loading: boolean) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn => {
  const {
    enableToast = true,
    enableRetry = true,
    maxRetries = 3,
    component = 'Unknown',
  } = options;

  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isLoading: false,
    retryCount: 0,
    canRetry: true,
  });

  const retryFunctionRef = useRef<(() => Promise<void> | void) | null>(null);

  const handleError = useCallback((
    error: Error | ApiError,
    context: ErrorContext = {},
    handlerOptions: ErrorHandlerOptions = {}
  ): ErrorRecovery => {
    logger.error('useErrorHandler', 'Error occurred', {
      component,
      error: error.message,
      context,
    });

    // Update error state
    setErrorState(prev => ({
      ...prev,
      error,
      isLoading: false,
      canRetry: enableRetry && prev.retryCount < maxRetries,
    }));

    // Use global error handler
    const recovery = globalErrorHandler.handleError(error, {
      component,
      ...context,
    }, {
      showAlert: !enableToast, // Don't show alert if toast is enabled
      enableRetry,
      ...handlerOptions,
    });

    return recovery;
  }, [component, enableRetry, enableToast, maxRetries]);

  const clearError = useCallback(() => {
    setErrorState(prev => ({
      ...prev,
      error: null,
      retryCount: 0,
      canRetry: true,
    }));
    retryFunctionRef.current = null;
  }, []);

  const retry = useCallback(async (retryFn: () => Promise<void> | void): Promise<void> => {
    if (!errorState.canRetry || errorState.retryCount >= maxRetries) {
      logger.warn('useErrorHandler', 'Retry not allowed', {
        component,
        retryCount: errorState.retryCount,
        maxRetries,
      });
      return;
    }

    setErrorState(prev => ({
      ...prev,
      isLoading: true,
      retryCount: prev.retryCount + 1,
      canRetry: prev.retryCount + 1 < maxRetries,
    }));

    retryFunctionRef.current = retryFn;

    try {
      logger.info('useErrorHandler', `Retrying operation (attempt ${errorState.retryCount + 1}/${maxRetries})`, {
        component,
      });

      await retryFn();

      // Success - clear error state
      setErrorState(prev => ({
        ...prev,
        error: null,
        isLoading: false,
        retryCount: 0,
        canRetry: true,
      }));

      logger.info('useErrorHandler', 'Retry successful', { component });
    } catch (retryError) {
      logger.error('useErrorHandler', 'Retry failed', {
        component,
        error: retryError,
        retryCount: errorState.retryCount + 1,
      });

      // Handle retry error
      handleError(retryError as Error, { action: 'retry' });
    }
  }, [errorState.canRetry, errorState.retryCount, maxRetries, component, handleError]);

  const setLoading = useCallback((loading: boolean) => {
    setErrorState(prev => ({
      ...prev,
      isLoading: loading,
    }));
  }, []);

  const showSuccess = useCallback((message: string) => {
    logger.info('useErrorHandler', 'Success message', { component, message });
    // TODO: Show success toast
    // This would integrate with a toast system
  }, [component]);

  const showWarning = useCallback((message: string) => {
    logger.warn('useErrorHandler', 'Warning message', { component, message });
    // TODO: Show warning toast
  }, [component]);

  const showInfo = useCallback((message: string) => {
    logger.info('useErrorHandler', 'Info message', { component, message });
    // TODO: Show info toast
  }, [component]);

  return {
    errorState,
    handleError,
    clearError,
    retry,
    setLoading,
    showSuccess,
    showWarning,
    showInfo,
  };
};

export default useErrorHandler;