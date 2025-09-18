import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import mockService, { MockUserState } from '../services/MockService';
import appFlowManager from '../services/AppFlowManager';
import { ENV_CONFIG } from '../config/env';

interface DevToolsProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * DevTools - Development tools for testing mock functionality
 * Only available in debug mode
 */
const DevTools: React.FC<DevToolsProps> = ({ visible, onClose }) => {
  const [mockStatus, setMockStatus] = useState<any>(null);
  const [flowStatus, setFlowStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadStatus();
    }
  }, [visible]);

  /**
   * Load current status
   */
  const loadStatus = async () => {
    try {
      setIsLoading(true);
      
      const [mockStat, flowStat] = await Promise.all([
        mockService.getStatus(),
        appFlowManager.getFlowStatus(),
      ]);

      setMockStatus(mockStat);
      setFlowStatus(flowStat);

    } catch (error) {
      console.error('Error loading dev tools status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toggle mock state
   */
  const handleToggleMockState = async () => {
    try {
      setIsLoading(true);
      
      const newState = await mockService.toggleMockState();
      
      Alert.alert(
        '模拟状态已切换',
        `新状态: ${getStateDisplayName(newState)}`,
        [
          {
            text: '刷新应用流程',
            onPress: async () => {
              const flow = await appFlowManager.refreshAppFlow();
              console.log('App flow refreshed:', flow);
              await loadStatus();
            },
          },
          { text: '确定', onPress: () => loadStatus() },
        ]
      );

    } catch (error) {
      console.error('Error toggling mock state:', error);
      Alert.alert('错误', '切换模拟状态失败');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Set specific mock state
   */
  const handleSetMockState = async (state: MockUserState) => {
    try {
      setIsLoading(true);
      
      await mockService.setMockState(state);
      
      Alert.alert(
        '模拟状态已设置',
        `状态: ${getStateDisplayName(state)}`,
        [
          {
            text: '刷新应用流程',
            onPress: async () => {
              const flow = await appFlowManager.refreshAppFlow();
              console.log('App flow refreshed:', flow);
              await loadStatus();
            },
          },
          { text: '确定', onPress: () => loadStatus() },
        ]
      );

    } catch (error) {
      console.error('Error setting mock state:', error);
      Alert.alert('错误', '设置模拟状态失败');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reset mock service
   */
  const handleResetMock = async () => {
    Alert.alert(
      '重置模拟服务',
      '这将清除所有模拟数据并重置为初始状态',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '重置',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await mockService.reset();
              await loadStatus();
              Alert.alert('成功', '模拟服务已重置');
            } catch (error) {
              console.error('Error resetting mock service:', error);
              Alert.alert('错误', '重置模拟服务失败');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  /**
   * Test splash ad flow
   */
  const handleTestSplashAd = async () => {
    try {
      setIsLoading(true);
      
      const shouldShow = await mockService.shouldShowSplashAd();
      
      Alert.alert(
        '开屏广告测试',
        `当前状态下${shouldShow ? '会' : '不会'}显示开屏广告`,
        [{ text: '确定' }]
      );

    } catch (error) {
      console.error('Error testing splash ad:', error);
      Alert.alert('错误', '测试开屏广告失败');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get state display name
   */
  const getStateDisplayName = (state: MockUserState | null): string => {
    if (!state) return '未知';
    
    const names = {
      [MockUserState.NOT_LOGGED_IN]: '未登录',
      [MockUserState.LOGGED_IN]: '已登录',
      [MockUserState.FIRST_TIME_USER]: '首次用户',
    };
    
    return names[state] || state;
  };

  // Don't render in production
  if (!ENV_CONFIG.DEBUG_MODE) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>开发工具</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>关闭</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Environment Configuration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>环境变量配置</Text>
            
            {mockStatus?.envConfig && (
              <View style={styles.statusContainer}>
                <Text style={styles.statusItem}>
                  MOCK_ENABLED: {mockStatus.envConfig.mockEnabled ? '1 (开启)' : '0 (关闭)'}
                </Text>
                <Text style={styles.statusItem}>
                  MOCK_USER_STATE: {mockStatus.envConfig.mockUserState} ({mockStatus.envConfig.mockUserState === 0 ? '未登录' : '登录'})
                </Text>
                <Text style={styles.statusItem}>
                  DEBUG_MODE: {mockStatus.envConfig.debugMode ? '✅' : '❌'}
                </Text>
              </View>
            )}
          </View>

          {/* Mock Service Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>模拟服务状态</Text>
            
            {mockStatus && (
              <View style={styles.statusContainer}>
                <Text style={styles.statusItem}>
                  初始化: {mockStatus.isInitialized ? '✅' : '❌'}
                </Text>
                <Text style={styles.statusItem}>
                  模拟模式: {mockStatus.isMockModeEnabled ? '✅' : '❌'}
                </Text>
                <Text style={styles.statusItem}>
                  存储状态: {getStateDisplayName(mockStatus.currentState)}
                </Text>
                <Text style={styles.statusItem}>
                  环境状态: {getStateDisplayName(mockStatus.envState)}
                </Text>
                <Text style={styles.statusItem}>
                  应登录: {mockStatus.shouldUserBeLoggedIn ? '✅' : '❌'}
                </Text>
              </View>
            )}

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleToggleMockState}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>切换状态</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleResetMock}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>重置</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Mock State Controls */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>设置模拟状态</Text>
            
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.stateButton]}
                onPress={() => handleSetMockState(MockUserState.NOT_LOGGED_IN)}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>未登录</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.stateButton]}
                onPress={() => handleSetMockState(MockUserState.LOGGED_IN)}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>已登录</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.stateButton]}
                onPress={() => handleSetMockState(MockUserState.FIRST_TIME_USER)}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>首次用户</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* App Flow Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>应用流程状态</Text>
            
            {flowStatus && (
              <View style={styles.statusContainer}>
                <Text style={styles.statusItem}>
                  初始化: {flowStatus.isInitialized ? '✅' : '❌'}
                </Text>
                <Text style={styles.statusItem}>
                  模拟模式: {flowStatus.isMockMode ? '✅' : '❌'}
                </Text>
                <Text style={styles.statusItem}>
                  已认证: {flowStatus.isAuthenticated ? '✅' : '❌'}
                </Text>
                <Text style={styles.statusItem}>
                  广告配置: {flowStatus.hasAdConfig ? '✅' : '❌'}
                </Text>
                {flowStatus.mockState && (
                  <Text style={styles.statusItem}>
                    模拟状态: {getStateDisplayName(flowStatus.mockState)}
                  </Text>
                )}
              </View>
            )}

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={loadStatus}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>刷新状态</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleTestSplashAd}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>测试开屏广告</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>使用说明</Text>
            <Text style={styles.instructionText}>
              <Text style={styles.boldText}>环境变量控制 (推荐):</Text>{'\n'}
              • MOCK_ENABLED=1 开启Mock模式，=0 关闭{'\n'}
              • MOCK_USER_STATE=0 未登录状态，=1 登录状态{'\n'}
              • 环境变量优先级高于手动设置{'\n\n'}
              <Text style={styles.boldText}>手动控制:</Text>{'\n'}
              • 切换不同的模拟状态来测试应用流程{'\n'}
              • 未登录状态：显示登录页面{'\n'}
              • 已登录状态：根据配置显示开屏广告或直接进入主页{'\n'}
              • 修改状态后建议刷新应用流程以查看效果
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1890FF',
    borderRadius: 4,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  statusContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  statusItem: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#1890FF',
  },
  secondaryButton: {
    backgroundColor: '#52C41A',
  },
  stateButton: {
    backgroundColor: '#722ED1',
    flex: 1,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  instructionText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#333333',
  },
});

export default DevTools;