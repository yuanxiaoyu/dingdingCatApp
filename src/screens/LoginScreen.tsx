import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch, useAuth } from '../store/hooks';
import { setUser, setTokens, clearError, setLoading } from '../store/slices/authSlice';
import authService from '../services/AuthService';
import { LoginResponse } from '../types';

const { width } = Dimensions.get('window');
import Icon from '../assets/images/mipmap-mdpi_ic_launcher.png';

const LoginScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, error } = useAuth();
  const [isWeChatAvailable, setIsWeChatAvailable] = useState<boolean>(false);
  const [isCheckingWeChat, setIsCheckingWeChat] = useState<boolean>(true);

  // Check WeChat availability on component mount
  useEffect(() => {
    checkWeChatAvailability();
  }, []);

  // Navigation will be handled automatically by RootNavigator based on authentication state

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      if (error) {
        dispatch(clearError());
      }
    };
  }, [dispatch, error]);

  const checkWeChatAvailability = async () => {
    try {
      setIsCheckingWeChat(true);
      const available = await authService.isWeChatAvailable();
      setIsWeChatAvailable(available);
    } catch (error) {
      console.error('Error checking WeChat availability:', error);
      setIsWeChatAvailable(false);
    } finally {
      setIsCheckingWeChat(false);
    }
  };

  const handleWeChatLogin = async () => {
    try {
      // Clear any previous errors and set loading state
      if (error) {
        dispatch(clearError());
      }
      dispatch(setLoading(true));

      // Check WeChat availability first
      if (!isWeChatAvailable) {
        dispatch(setLoading(false));
        Alert.alert(
          '微信未安装',
          '请先安装微信客户端后再进行登录',
          [
            {
              text: '确定',
              style: 'default',
            },
          ]
        );
        return;
      }

      // Use AuthService directly for WeChat login
      const result: LoginResponse = await authService.wechatLogin();

      if (result) {
        // Update Redux state with login result
        dispatch(setUser({
          userId: result.userId,
          userName: result.userName,
          nickName: result.nickName,
          avatar: result.avatar,
          phoneNumber: result.phoneNumber,
          email: result.email,
          sex: result.sex,
          wechatOpenId: result.wechatOpenId,
          registerChannel: result.registerChannel,
          appKey: result.appKey,
          registerTime: result.registerTime,
          lastLoginTime: result.lastLoginTime,
        }));

        dispatch(setTokens({
          accessToken: result.accessToken,
          tokenType: result.tokenType,
          expiresIn: result.expiresIn,
        }));

        dispatch(setLoading(false));

        // Login successful - the useEffect will handle navigation
        console.log('Login successful:', result.userName);
      }
    } catch (error: any) {
      dispatch(setLoading(false));
      console.error('Login error:', error);

      // Show user-friendly error message
      let errorMessage = '登录失败，请重试';

      if (typeof error === 'string') {
        if (error.includes('WeChat is not installed')) {
          errorMessage = '请先安装微信客户端';
        } else if (error.includes('WeChat auth failed')) {
          errorMessage = '微信授权失败，请重试';
        } else if (error.includes('用户取消')) {
          errorMessage = '用户取消了登录';
        } else if (error.includes('网络')) {
          errorMessage = '网络连接失败，请检查网络设置';
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      Alert.alert('登录失败', errorMessage, [
        {
          text: '重试',
          onPress: handleWeChatLogin,
        },
        {
          text: '取消',
          style: 'cancel',
        },
      ]);
    }
  };

  const renderWeChatButton = () => {
    return (
      <TouchableOpacity
        style={styles.wechatButton}
        onPress={handleWeChatLogin}
        disabled={isLoading || isCheckingWeChat}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <>
            <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.wechatButtonText}>登录中...</Text>
          </>
        ) : isCheckingWeChat ? (
          <>
            <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.wechatButtonText}>微信登录</Text>
          </>
        ) : (
          <>
            <View style={styles.wechatIconPlaceholder}>
              <Text style={styles.wechatIconText}>微</Text>
            </View>
            <Text style={styles.wechatButtonText}>微信登录</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  const renderErrorMessage = () => {
    if (!error) return null;

    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => dispatch(clearError())}
        >
          <Text style={styles.retryButtonText}>关闭</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E88E5" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoPlaceholder}>
          {/* <Text style={styles.logoText}>丁</Text> */}
          <Image source={Icon} />
        </View>
        <Text style={styles.appTitle}>丁丁猫</Text>
        {/* <Text style={styles.appSubtitle}>广告收益管理</Text> */}
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>欢迎使用丁丁猫</Text>
          {/* <Text style={styles.welcomeDescription}>
            通过观看广告获得收益{'\n'}
            安全可靠的收益管理平台
          </Text> */}
        </View>

        {/* Login Section */}
        <View style={styles.loginSection}>
          {renderWeChatButton()}

          {renderErrorMessage()}

          {/* <Text style={styles.loginHint}>
            使用微信登录即表示同意{'\n'}
            <Text style={styles.linkText}>《用户协议》</Text>
            和
            <Text style={styles.linkText}>《隐私政策》</Text>
          </Text> */}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          安全登录 · 数据加密 · 隐私保护
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E88E5',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E88E5',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#E3F2FD',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#E3F2FD',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
  loginSection: {
    alignItems: 'center',
  },
  wechatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#07C160',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: width * 0.7,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#A5A5A5',
    opacity: 0.7,
  },
  wechatIconPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  wechatIconText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#07C160',
  },
  buttonIcon: {
    marginRight: 12,
  },
  wechatButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
    marginHorizontal: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    fontSize: 14,
    color: '#C62828',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F44336',
    borderRadius: 6,
  },
  retryButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  loginHint: {
    fontSize: 12,
    color: '#E3F2FD',
    textAlign: 'center',
    marginTop: 24,
    opacity: 0.8,
    lineHeight: 18,
  },
  linkText: {
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
    paddingTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#E3F2FD',
    opacity: 0.7,
  },
});

export default LoginScreen;