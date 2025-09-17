// Example Component Demonstrating Error Handling Usage
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { ErrorBoundary, ErrorMessage, LoadingSpinner } from './';
import { useErrorHandler } from '../hooks';
import { toastManager, apiErrorHandler } from '../utils';
import { ApiError } from '../types';

const ErrorHandlingExample: React.FC = () => {
  const [simulateError, setSimulateError] = useState<string | null>(null);
  const [showLoading, setShowLoading] = useState(false);
  
  const { errorState, handleError, clearError, retry, setLoading } = useErrorHandler({
    component: 'ErrorHandlingExample',
    enableRetry: true,
    maxRetries: 3,
  });

  // Simulate different types of errors
  const simulateNetworkError = () => {
    const error = new Error('Network request failed');
    handleError(error, { action: 'network_test' });
  };

  const simulateApiError = (code: number) => {
    const apiError: ApiError = {
      code,
      message: `API Error ${code}`,
      details: { timestamp: Date.now() },
    };
    handleError(apiError, { action: 'api_test' });
  };

  const simulateRiskControlError = () => {
    const riskError: ApiError = {
      code: 403,
      message: 'Risk control triggered',
      details: { riskType: 'FREQUENCY_LIMIT' },
    };
    handleError(riskError, { action: 'risk_test' });
  };

  const simulateComponentError = () => {
    setSimulateError('Component error simulation');
  };

  const simulateLoadingState = () => {
    setShowLoading(true);
    setLoading(true);
    
    setTimeout(() => {
      setShowLoading(false);
      setLoading(false);
      toastManager.success('加载完成');
    }, 3000);
  };

  const testToastMessages = () => {
    toastManager.success('这是成功消息');
    setTimeout(() => toastManager.error('这是错误消息'), 1000);
    setTimeout(() => toastManager.warning('这是警告消息'), 2000);
    setTimeout(() => toastManager.info('这是信息消息'), 3000);
  };

  const testAdSuccess = () => {
    toastManager.adSuccess('video', 0.05);
  };

  const testRiskWarning = () => {
    toastManager.riskWarning('ROOT_DETECTED');
  };

  const retryOperation = async () => {
    await retry(async () => {
      // Simulate async operation that might fail
      if (Math.random() < 0.5) {
        throw new Error('Retry operation failed');
      }
      toastManager.success('重试操作成功');
    });
  };

  // Simulate component error for ErrorBoundary testing
  if (simulateError) {
    throw new Error(simulateError);
  }

  return (
    <ErrorBoundary level="component">
      <ScrollView style={styles.container}>
        <Text style={styles.title}>错误处理系统演示</Text>
        
        {/* Error State Display */}
        {errorState.error && (
          <ErrorMessage
            error={errorState.error}
            onRetry={errorState.canRetry ? retryOperation : undefined}
            onDismiss={clearError}
            style={styles.errorMessage}
          />
        )}

        {/* Error Simulation Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>错误模拟</Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={simulateNetworkError}
          >
            <Text style={styles.buttonText}>网络错误</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => simulateApiError(401)}
          >
            <Text style={styles.buttonText}>401 认证错误</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => simulateApiError(403)}
          >
            <Text style={styles.buttonText}>403 权限错误</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => simulateApiError(429)}
          >
            <Text style={styles.buttonText}>429 限流错误</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => simulateApiError(500)}
          >
            <Text style={styles.buttonText}>500 服务器错误</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={simulateRiskControlError}
          >
            <Text style={styles.buttonText}>风控错误</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={simulateComponentError}
          >
            <Text style={styles.buttonText}>组件错误 (ErrorBoundary)</Text>
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>加载状态</Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={simulateLoadingState}
          >
            <Text style={styles.buttonText}>模拟加载状态</Text>
          </TouchableOpacity>
        </View>

        {/* Toast Messages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Toast 消息</Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={testToastMessages}
          >
            <Text style={styles.buttonText}>测试所有 Toast 类型</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={testAdSuccess}
          >
            <Text style={styles.buttonText}>广告成功消息</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={testRiskWarning}
          >
            <Text style={styles.buttonText}>风控警告消息</Text>
          </TouchableOpacity>
        </View>

        {/* Error State Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>错误状态信息</Text>
          <Text style={styles.infoText}>
            错误状态: {errorState.error ? '有错误' : '无错误'}
          </Text>
          <Text style={styles.infoText}>
            加载状态: {errorState.isLoading ? '加载中' : '空闲'}
          </Text>
          <Text style={styles.infoText}>
            重试次数: {errorState.retryCount}
          </Text>
          <Text style={styles.infoText}>
            可重试: {errorState.canRetry ? '是' : '否'}
          </Text>
        </View>

        {/* Clear Error Button */}
        {errorState.error && (
          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={clearError}
          >
            <Text style={styles.buttonText}>清除错误状态</Text>
          </TouchableOpacity>
        )}

        <LoadingSpinner
          visible={showLoading}
          message="演示加载状态..."
          overlay={false}
        />
      </ScrollView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#333',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  clearButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorMessage: {
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});

export default ErrorHandlingExample;