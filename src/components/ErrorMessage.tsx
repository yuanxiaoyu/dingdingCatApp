// Error Message Component for Inline Error Display
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { ApiError } from '../types';

interface ErrorMessageProps {
  error: Error | ApiError | string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  style?: ViewStyle;
  showIcon?: boolean;
  retryText?: string;
  dismissText?: string;
  variant?: 'inline' | 'card' | 'banner';
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  onDismiss,
  style,
  showIcon = true,
  retryText = '重试',
  dismissText = '关闭',
  variant = 'card',
}) => {
  if (!error) {
    return null;
  }

  const getErrorMessage = (): string => {
    if (typeof error === 'string') {
      return error;
    }

    if ('code' in error) {
      const apiError = error as ApiError;
      switch (apiError.code) {
        case 401:
          return '登录已过期，请重新登录';
        case 403:
          return '访问被拒绝，可能触发了安全规则';
        case 404:
          return '请求的资源不存在';
        case 429:
          return '请求过于频繁，请稍后再试';
        case 500:
          return '服务器内部错误，请稍后再试';
        case 502:
        case 503:
        case 504:
          return '服务暂时不可用，请稍后再试';
        default:
          return apiError.message || '请求失败，请稍后再试';
      }
    }

    if (error.message.includes('Network')) {
      return '网络连接失败，请检查网络设置';
    }

    if (error.message.includes('timeout')) {
      return '请求超时，请稍后再试';
    }

    return error.message || '发生未知错误';
  };

  const getErrorIcon = (): string => {
    if (typeof error === 'string') {
      return '⚠️';
    }

    if ('code' in error) {
      const apiError = error as ApiError;
      if (apiError.code === 401) return '🔒';
      if (apiError.code === 403) return '🚫';
      if (apiError.code === 404) return '🔍';
      if (apiError.code === 429) return '⏱️';
      if (apiError.code >= 500) return '🔧';
    }

    if (error.message.includes('Network')) {
      return '📶';
    }

    return '❌';
  };

  const getContainerStyle = () => {
    switch (variant) {
      case 'inline':
        return styles.inlineContainer;
      case 'banner':
        return styles.bannerContainer;
      default:
        return styles.cardContainer;
    }
  };

  return (
    <View style={[getContainerStyle(), style]}>
      <View style={styles.content}>
        {showIcon && (
          <Text style={styles.icon}>{getErrorIcon()}</Text>
        )}
        <Text style={styles.message}>{getErrorMessage()}</Text>
      </View>
      
      {(onRetry || onDismiss) && (
        <View style={styles.actions}>
          {onDismiss && (
            <TouchableOpacity
              style={[styles.button, styles.dismissButton]}
              onPress={onDismiss}
            >
              <Text style={styles.dismissButtonText}>{dismissText}</Text>
            </TouchableOpacity>
          )}
          {onRetry && (
            <TouchableOpacity
              style={[styles.button, styles.retryButton]}
              onPress={onRetry}
            >
              <Text style={styles.retryButtonText}>{retryText}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inlineContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  bannerContainer: {
    backgroundColor: '#F44336',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  message: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  dismissButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  retryButton: {
    backgroundColor: '#007AFF',
  },
  dismissButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ErrorMessage;