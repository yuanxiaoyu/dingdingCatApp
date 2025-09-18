import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Image
} from 'react-native';

const Icon = require('../assets/images/mipmap-mdpi_ic_launcher.png')

const { width, height } = Dimensions.get('window');

interface CustomSplashScreenProps {
  onFinish: () => void;
  duration?: number;
}

/**
 * CustomSplashScreen - 自定义启动屏幕
 * 
 * 显示丁丁猫品牌标识和加载动画
 */
const CustomSplashScreen: React.FC<CustomSplashScreenProps> = ({
  onFinish,
  duration = 2000,
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 启动动画序列
    const animationSequence = Animated.sequence([
      // 淡入和缩放动画
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // 旋转动画
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]);

    animationSequence.start();

    // 设置定时器结束启动屏幕
    const timer = setTimeout(() => {
      onFinish();
    }, duration);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, rotateAnim, onFinish, duration]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* 背景渐变效果 */}
      <View style={styles.backgroundGradient} />
      
      {/* 主要内容 */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* 应用图标 */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <View style={styles.icon}>
            {/* <Text style={styles.iconText}>丁丁猫</Text> */}
            <Image source={Icon}/>
          </View>
        </Animated.View>

        {/* 应用名称 */}
        <Text style={styles.appName}>丁丁猫</Text>
        <Text style={styles.appSubtitle}>广告收益管理</Text>

        {/* 加载指示器 */}
        <View style={styles.loadingContainer}>
          <View style={styles.loadingDots}>
            <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
            <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
            <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
          </View>
          <Text style={styles.loadingText}>正在启动...</Text>
        </View>
      </Animated.View>

      {/* 底部信息 */}
      <Animated.View
        style={[
          styles.footer,
          { opacity: fadeAnim },
        ]}
      >
        <Text style={styles.footerText}>为您提供最佳的广告收益体验</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1890FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1890FF',
    // 可以添加渐变效果
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 30,
  },
  icon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1890FF',
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 16,
    color: '#E6F7FF',
    marginBottom: 60,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
  },
  loadingText: {
    fontSize: 14,
    color: '#E6F7FF',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#E6F7FF',
    textAlign: 'center',
  },
});

export default CustomSplashScreen;