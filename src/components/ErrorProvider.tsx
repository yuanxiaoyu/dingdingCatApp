// Error Provider Component for Global Error Handling Context
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import ErrorBoundary from './ErrorBoundary';
import FeedbackToast from './FeedbackToast';
import LoadingSpinner from './LoadingSpinner';
import { toastManager, ToastItem } from '../utils/toastManager';
import { globalErrorHandler } from '../utils/errorHandler';
import { logger } from '../utils/logger';

interface ErrorProviderContextType {
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  isLoading: boolean;
  loadingMessage: string;
}

const ErrorProviderContext = createContext<ErrorProviderContextType | undefined>(undefined);

interface ErrorProviderProps {
  children: ReactNode;
  enableErrorBoundary?: boolean;
  enableToasts?: boolean;
  enableGlobalLoading?: boolean;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({
  children,
  enableErrorBoundary = true,
  enableToasts = true,
  enableGlobalLoading = true,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('加载中...');

  useEffect(() => {
    // Subscribe to toast updates
    const unsubscribe = toastManager.subscribe(setToasts);
    
    return unsubscribe;
  }, []);

  const showLoading = (message: string = '加载中...') => {
    if (enableGlobalLoading) {
      setLoadingMessage(message);
      setIsLoading(true);
      logger.debug('ErrorProvider', 'Global loading started', { message });
    }
  };

  const hideLoading = () => {
    if (enableGlobalLoading) {
      setIsLoading(false);
      logger.debug('ErrorProvider', 'Global loading stopped');
    }
  };

  const handleToastHide = (toastId: string) => {
    toastManager.removeToast(toastId);
  };

  const contextValue: ErrorProviderContextType = {
    showLoading,
    hideLoading,
    isLoading,
    loadingMessage,
  };

  const renderToasts = () => {
    if (!enableToasts || toasts.length === 0) {
      return null;
    }

    // Show only the most recent toast to avoid overlap
    const latestToast = toasts[toasts.length - 1];

    return (
      <FeedbackToast
        key={latestToast.id}
        visible={true}
        message={latestToast.message}
        type={latestToast.type}
        duration={latestToast.options.duration}
        position={latestToast.options.position}
        actionText={latestToast.options.actionText}
        onActionPress={latestToast.options.onActionPress}
        onHide={() => handleToastHide(latestToast.id)}
      />
    );
  };

  const renderContent = () => (
    <ErrorProviderContext.Provider value={contextValue}>
      <View style={styles.container}>
        {children}
        
        {/* Global Loading Spinner */}
        {enableGlobalLoading && (
          <LoadingSpinner
            visible={isLoading}
            message={loadingMessage}
            overlay={true}
          />
        )}
        
        {/* Toast Notifications */}
        {renderToasts()}
      </View>
    </ErrorProviderContext.Provider>
  );

  if (enableErrorBoundary) {
    return (
      <ErrorBoundary
        level="screen"
        enableReporting={true}
        onError={(error, errorInfo) => {
          logger.error('ErrorProvider', 'Global error boundary triggered', {
            error: error.message,
            componentStack: errorInfo.componentStack,
          });
        }}
      >
        {renderContent()}
      </ErrorBoundary>
    );
  }

  return renderContent();
};

export const useErrorProvider = (): ErrorProviderContextType => {
  const context = useContext(ErrorProviderContext);
  if (context === undefined) {
    throw new Error('useErrorProvider must be used within an ErrorProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ErrorProvider;