import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Image
} from 'react-native';
import initializationService, { InitializationStatus, InitPhase } from '../services/InitializationService';

const { height } = Dimensions.get('window');
interface InitializationScreenProps {
  onInitializationComplete: (result: any) => void;
}

/**
 * 初始化屏幕 - 显示应用启动进度
 * 
 * 显示初始化进度包括：
 * - 应用图标
 * - 进度条
 * - 状态消息
 * - 错误处理
 */
const InitializationScreen: React.FC<InitializationScreenProps> = ({
  onInitializationComplete,
}) => {
  const [status, setStatus] = useState<InitializationStatus>({
    phase: InitPhase.STARTING,
    progress: 0,
    message: '资源加载中...',
  });

  useEffect(() => {
    let mounted = true;

    const handleStatusUpdate = (newStatus: InitializationStatus) => {
      if (mounted) {
        setStatus(newStatus);
      }
    };

    const startInitialization = async () => {
      try {
        // 添加状态监听器
        initializationService.addStatusListener(handleStatusUpdate);

        // 开始初始化
        const result = await initializationService.initialize();

        if (mounted) {
          // 短暂延迟以显示完成状态
          setTimeout(() => {
            onInitializationComplete(result);
          }, 500);
        }
      } catch (error) {
        console.error('Initialization error:', error);
        if (mounted) {
          onInitializationComplete({
            success: false,
            error: (error as Error).message || 'Initialization failed',
          });
        }
      }
    };

    startInitialization();

    return () => {
      mounted = false;
      initializationService.removeStatusListener(handleStatusUpdate);
    };
  }, [onInitializationComplete]);

  const getPhaseMessage = (phase: InitPhase): string => {
    const messages = {
      [InitPhase.STARTING]: '资源加载中...',
      [InitPhase.AUTH_CHECK]: '资源加载中...',
      [InitPhase.CONFIG_LOADING]: '资源加载中...',
      [InitPhase.DEVICE_INFO]: '资源加载中...',
      [InitPhase.RISK_CONTROL]: '资源加载中...',
      [InitPhase.OFFLINE_SYNC]: '资源加载中...',
      [InitPhase.COMPLETED]: '欢迎体验自然音乐',
      [InitPhase.FAILED]: '加载失败，请重试',
    };
    return messages[phase] || '资源加载中...';
  };

  const getProgressColor = (): string => {
    if (status.phase === InitPhase.FAILED) {
      return '#FF4D4F';
    }
    if (status.phase === InitPhase.COMPLETED) {
      return '#52C41A';
    }
    return '#1890FF';
  };

  return (
    <View style={styles.container}>
      {/* 应用图标 */}
      <View style={styles.logoContainer}>
        <View style={styles.logoPlaceholder}>
          <Image
            style={styles.logoPic}
            source={require('../assets/images/mipmap-mdpi_ic_launcher.png')}
          />
        </View>
        <Text style={styles.appName}>丁丁猫</Text>
        <Text style={styles.appSubtitle}>自然音乐体验</Text>
      </View>

      {/* 进度区域 */}
      <View style={styles.progressContainer}>
        {/* 进度条 */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${status.progress}%`,
                  backgroundColor: getProgressColor(),
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{status.progress}%</Text>
        </View>

        {/* 状态消息 */}
        <View style={styles.statusContainer}>
          {status.phase !== InitPhase.FAILED && (
            <ActivityIndicator
              size="small"
              color={getProgressColor()}
              style={styles.loadingIndicator}
            />
          )}
          <Text style={[
            styles.statusMessage,
            status.phase === InitPhase.FAILED && styles.errorMessage,
          ]}>
            {status.message || getPhaseMessage(status.phase)}
          </Text>
        </View>

        {/* 错误详情 */}
        {status.error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{status.error}</Text>
          </View>
        )}
      </View>

      {/* 页脚 */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          正在为您准备自然音乐之旅...
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.1,
  },
  logoPlaceholder: {
    width: 140,
    height: 140,
    // backgroundColor: '#1890FF',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoPic: {
    width: 80,
    height: 80
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1890FF',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  progressBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingIndicator: {
    marginRight: 12,
  },
  statusMessage: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    fontWeight: '500',
  },
  errorMessage: {
    color: '#FF4D4F',
  },
  errorContainer: {
    backgroundColor: '#FFF2F0',
    borderColor: '#FFCCC7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    fontSize: 14,
    color: '#FF4D4F',
    textAlign: 'center',
  },
  phaseContainer: {
    marginTop: 10,
  },
  phaseText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    marginBottom: height * 0.05,
  },
  footerText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});

export default InitializationScreen;