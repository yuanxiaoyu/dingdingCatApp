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
 * InitializationScreen - Shows app startup progress
 * 
 * Displays initialization progress with:
 * - App logo
 * - Progress bar
 * - Status messages
 * - Error handling
 */
const InitializationScreen: React.FC<InitializationScreenProps> = ({
  onInitializationComplete,
}) => {
  const [status, setStatus] = useState<InitializationStatus>({
    phase: InitPhase.STARTING,
    progress: 0,
    message: '正在启动应用...',
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
        // Add status listener
        initializationService.addStatusListener(handleStatusUpdate);

        // Start initialization
        const result = await initializationService.initialize();

        if (mounted) {
          // Small delay to show completion
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
      [InitPhase.STARTING]: '正在启动应用...',
      [InitPhase.AUTH_CHECK]: '检查用户认证状态...',
      [InitPhase.CONFIG_LOADING]: '加载应用配置...',
      [InitPhase.DEVICE_INFO]: '收集设备信息...',
      [InitPhase.RISK_CONTROL]: '初始化风控系统...',
      [InitPhase.OFFLINE_SYNC]: '同步离线数据...',
      [InitPhase.COMPLETED]: '初始化完成',
      [InitPhase.FAILED]: '初始化失败',
    };
    return messages[phase] || '正在处理...';
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
      {/* App Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoPlaceholder}>
          <Image
            style={styles.logoPic}
            source={require('../assets/images/mipmap-mdpi_ic_launcher.png')}
          />
        </View>
        <Text style={styles.appName}>丁丁猫</Text>
        <Text style={styles.appSubtitle}>广告收益管理</Text>
      </View>

      {/* Progress Section */}
      <View style={styles.progressContainer}>
        {/* Progress Bar */}
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

        {/* Status Message */}
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

        {/* Error Details */}
        {status.error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{status.error}</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          正在为您准备最佳体验...
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