// Enhanced Error Boundary Component for Global Error Handling
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { logger } from '../utils/logger';
import { ApiError } from '../types';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableReporting?: boolean;
  level?: 'screen' | 'component';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });

    // Log error for debugging
    logger.error('ErrorBoundary', 'Component error caught', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      level: this.props.level || 'component',
      retryCount: this.retryCount,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error if enabled
    if (this.props.enableReporting) {
      this.reportError(error, errorInfo);
    }
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo): Promise<void> => {
    try {
      // In a real app, you would send this to your error reporting service
      // For now, we'll just log it
      const errorReport = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: 'DingDingCat React Native',
        level: this.props.level || 'component',
        retryCount: this.retryCount,
      };

      logger.error('ErrorBoundary', 'Error report generated', errorReport);
      
      // TODO: Send to error reporting service
      // await errorReportingService.report(errorReport);
    } catch (reportError) {
      logger.error('ErrorBoundary', 'Failed to report error', reportError);
    }
  };

  handleRetry = (): void => {
    if (this.retryCount >= this.maxRetries) {
      Alert.alert(
        '重试次数过多',
        '已达到最大重试次数，请重启应用或联系客服。',
        [
          { text: '确定', style: 'default' }
        ]
      );
      return;
    }

    this.retryCount += 1;
    
    logger.info('ErrorBoundary', `Retrying component (attempt ${this.retryCount}/${this.maxRetries})`);
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  handleReportIssue = (): void => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    };

    Alert.alert(
      '报告问题',
      `错误ID: ${errorDetails.errorId}\n\n请截图此信息并联系客服。`,
      [
        { text: '复制错误ID', onPress: () => {
          // In a real app, you would copy to clipboard
          logger.info('ErrorBoundary', 'Error ID copied to clipboard', errorDetails);
        }},
        { text: '确定', style: 'default' }
      ]
    );
  };

  private getErrorMessage(): string {
    const error = this.state.error;
    
    if (!error) {
      return '未知错误';
    }

    // Handle API errors
    if (error.name === 'ApiError' || (error as any).code) {
      const apiError = error as ApiError;
      switch (apiError.code) {
        case 401:
          return '登录已过期，请重新登录';
        case 403:
          return '访问被拒绝，可能触发了风控规则';
        case 429:
          return '请求过于频繁，请稍后再试';
        case 500:
          return '服务器暂时不可用，请稍后再试';
        default:
          return apiError.message || '网络请求失败';
      }
    }

    // Handle common React Native errors
    if (error.message.includes('Network request failed')) {
      return '网络连接失败，请检查网络设置';
    }

    if (error.message.includes('JSON')) {
      return '数据格式错误，请稍后再试';
    }

    if (error.message.includes('Permission')) {
      return '权限不足，请检查应用权限设置';
    }

    return error.message || '应用遇到了意外错误';
  }

  private getErrorSuggestion(): string {
    const error = this.state.error;
    
    if (!error) {
      return '请尝试重新加载';
    }

    if (error.message.includes('Network')) {
      return '请检查网络连接后重试';
    }

    if ((error as any).code === 401) {
      return '请重新登录应用';
    }

    if ((error as any).code === 403) {
      return '请稍后再试或联系客服';
    }

    return '请尝试重新加载，如问题持续请联系客服';
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isScreenLevel = this.props.level === 'screen';

      return (
        <View style={[styles.container, isScreenLevel && styles.screenContainer]}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
            </View>
            
            <Text style={styles.title}>
              {isScreenLevel ? '页面加载失败' : '组件出现问题'}
            </Text>
            
            <Text style={styles.message}>
              {this.getErrorMessage()}
            </Text>
            
            <Text style={styles.suggestion}>
              {this.getErrorSuggestion()}
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugTitle}>调试信息:</Text>
                <ScrollView style={styles.debugScroll} nestedScrollEnabled>
                  <Text style={styles.debugText}>
                    错误ID: {this.state.errorId}{'\n'}
                    错误信息: {this.state.error.message}{'\n'}
                    重试次数: {this.retryCount}/{this.maxRetries}{'\n\n'}
                    堆栈信息:{'\n'}{this.state.error.stack}
                  </Text>
                </ScrollView>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.retryButton]} 
                onPress={this.handleRetry}
                disabled={this.retryCount >= this.maxRetries}
              >
                <Text style={styles.retryButtonText}>
                  重试 ({this.maxRetries - this.retryCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.reportButton]} 
                onPress={this.handleReportIssue}
              >
                <Text style={styles.reportButtonText}>报告问题</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  screenContainer: {
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 400,
  },
  iconContainer: {
    marginBottom: 20,
  },
  errorIcon: {
    fontSize: 48,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  suggestion: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  debugInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  debugScroll: {
    maxHeight: 120,
  },
  debugText: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    paddingHorizontal: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reportButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  reportButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;