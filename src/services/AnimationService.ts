import { Animated, Easing } from 'react-native';

interface AnimationConfig {
  duration?: number;
  easing?: any;
  useNativeDriver?: boolean;
}

interface PulseAnimationConfig extends AnimationConfig {
  minScale?: number;
  maxScale?: number;
  repeatCount?: number;
}

interface FadeAnimationConfig extends AnimationConfig {
  fromOpacity?: number;
  toOpacity?: number;
}

interface ScaleAnimationConfig extends AnimationConfig {
  fromScale?: number;
  toScale?: number;
}

interface SlideAnimationConfig extends AnimationConfig {
  fromValue?: number;
  toValue?: number;
}

/**
 * 动画服务
 * 提供音乐播放器相关的平滑动画效果
 */
export class AnimationService {
  // 默认动画配置
  private static readonly DEFAULT_DURATION = 300;
  private static readonly DEFAULT_EASING = Easing.out(Easing.cubic);

  /**
   * 创建淡入动画
   * @param animatedValue 动画值
   * @param config 动画配置
   * @returns Animated.CompositeAnimation
   */
  static createFadeIn(
    animatedValue: Animated.Value,
    config: FadeAnimationConfig = {}
  ): Animated.CompositeAnimation {
    const {
      duration = this.DEFAULT_DURATION,
      easing = this.DEFAULT_EASING,
      useNativeDriver = true,
      fromOpacity = 0,
      toOpacity = 1,
    } = config;

    // 设置初始值
    animatedValue.setValue(fromOpacity);

    return Animated.timing(animatedValue, {
      toValue: toOpacity,
      duration,
      easing,
      useNativeDriver,
    });
  }

  /**
   * 创建淡出动画
   * @param animatedValue 动画值
   * @param config 动画配置
   * @returns Animated.CompositeAnimation
   */
  static createFadeOut(
    animatedValue: Animated.Value,
    config: FadeAnimationConfig = {}
  ): Animated.CompositeAnimation {
    const {
      duration = this.DEFAULT_DURATION,
      easing = this.DEFAULT_EASING,
      useNativeDriver = true,
      fromOpacity = 1,
      toOpacity = 0,
    } = config;

    return Animated.timing(animatedValue, {
      toValue: toOpacity,
      duration,
      easing,
      useNativeDriver,
    });
  }

  /**
   * 创建缩放动画
   * @param animatedValue 动画值
   * @param config 动画配置
   * @returns Animated.CompositeAnimation
   */
  static createScale(
    animatedValue: Animated.Value,
    config: ScaleAnimationConfig = {}
  ): Animated.CompositeAnimation {
    const {
      duration = this.DEFAULT_DURATION,
      easing = this.DEFAULT_EASING,
      useNativeDriver = true,
      fromScale = 0.8,
      toScale = 1,
    } = config;

    // 设置初始值
    animatedValue.setValue(fromScale);

    return Animated.timing(animatedValue, {
      toValue: toScale,
      duration,
      easing,
      useNativeDriver,
    });
  }

  /**
   * 创建脉冲动画（适用于播放状态指示器）
   * @param animatedValue 动画值
   * @param config 动画配置
   * @returns Animated.CompositeAnimation
   */
  static createPulse(
    animatedValue: Animated.Value,
    config: PulseAnimationConfig = {}
  ): Animated.CompositeAnimation {
    const {
      duration = 1000,
      easing = Easing.inOut(Easing.ease),
      useNativeDriver = true,
      minScale = 0.95,
      maxScale = 1.05,
      repeatCount = -1, // 无限循环
    } = config;

    // 设置初始值
    animatedValue.setValue(minScale);

    const animation = Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: maxScale,
        duration: duration / 2,
        easing,
        useNativeDriver,
      }),
      Animated.timing(animatedValue, {
        toValue: minScale,
        duration: duration / 2,
        easing,
        useNativeDriver,
      }),
    ]);

    return Animated.loop(animation, { iterations: repeatCount });
  }

  /**
   * 创建弹跳动画
   * @param animatedValue 动画值
   * @param config 动画配置
   * @returns Animated.CompositeAnimation
   */
  static createBounce(
    animatedValue: Animated.Value,
    config: ScaleAnimationConfig = {}
  ): Animated.CompositeAnimation {
    const {
      duration = 600,
      useNativeDriver = true,
      fromScale = 0.3,
      toScale = 1,
    } = config;

    // 设置初始值
    animatedValue.setValue(fromScale);

    return Animated.spring(animatedValue, {
      toValue: toScale,
      friction: 4,
      tension: 100,
      useNativeDriver,
    });
  }

  /**
   * 创建滑入动画
   * @param animatedValue 动画值
   * @param config 动画配置
   * @returns Animated.CompositeAnimation
   */
  static createSlideIn(
    animatedValue: Animated.Value,
    config: SlideAnimationConfig = {}
  ): Animated.CompositeAnimation {
    const {
      duration = this.DEFAULT_DURATION,
      easing = this.DEFAULT_EASING,
      useNativeDriver = true,
      fromValue = 100,
      toValue = 0,
    } = config;

    // 设置初始值
    animatedValue.setValue(fromValue);

    return Animated.timing(animatedValue, {
      toValue,
      duration,
      easing,
      useNativeDriver,
    });
  }

  /**
   * 创建滑出动画
   * @param animatedValue 动画值
   * @param config 动画配置
   * @returns Animated.CompositeAnimation
   */
  static createSlideOut(
    animatedValue: Animated.Value,
    config: SlideAnimationConfig = {}
  ): Animated.CompositeAnimation {
    const {
      duration = this.DEFAULT_DURATION,
      easing = this.DEFAULT_EASING,
      useNativeDriver = true,
      fromValue = 0,
      toValue = -100,
    } = config;

    return Animated.timing(animatedValue, {
      toValue,
      duration,
      easing,
      useNativeDriver,
    });
  }

  /**
   * 创建旋转动画
   * @param animatedValue 动画值
   * @param config 动画配置
   * @returns Animated.CompositeAnimation
   */
  static createRotation(
    animatedValue: Animated.Value,
    config: AnimationConfig & { rotations?: number } = {}
  ): Animated.CompositeAnimation {
    const {
      duration = 2000,
      easing = Easing.linear,
      useNativeDriver = true,
      rotations = 1,
    } = config;

    // 设置初始值
    animatedValue.setValue(0);

    const animation = Animated.timing(animatedValue, {
      toValue: rotations,
      duration,
      easing,
      useNativeDriver,
    });

    return Animated.loop(animation, { iterations: -1 });
  }

  /**
   * 创建波浪动画（适用于音频可视化）
   * @param animatedValues 动画值数组
   * @param config 动画配置
   * @returns Animated.CompositeAnimation
   */
  static createWave(
    animatedValues: Animated.Value[],
    config: AnimationConfig & { stagger?: number; amplitude?: number } = {}
  ): Animated.CompositeAnimation {
    const {
      duration = 1000,
      easing = Easing.inOut(Easing.sin),
      useNativeDriver = true,
      stagger = 100,
      amplitude = 1,
    } = config;

    const animations = animatedValues.map((value, index) => {
      // 设置初始值
      value.setValue(0);

      const animation = Animated.sequence([
        Animated.timing(value, {
          toValue: amplitude,
          duration: duration / 2,
          easing,
          useNativeDriver,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration: duration / 2,
          easing,
          useNativeDriver,
        }),
      ]);

      return Animated.loop(animation, { iterations: -1 });
    });

    return Animated.stagger(stagger, animations);
  }

  /**
   * 创建心跳动画（适用于收藏按钮）
   * @param animatedValue 动画值
   * @param config 动画配置
   * @returns Animated.CompositeAnimation
   */
  static createHeartbeat(
    animatedValue: Animated.Value,
    config: PulseAnimationConfig = {}
  ): Animated.CompositeAnimation {
    const {
      duration = 800,
      useNativeDriver = true,
      minScale = 1,
      maxScale = 1.2,
    } = config;

    // 设置初始值
    animatedValue.setValue(minScale);

    return Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: maxScale,
        duration: duration * 0.3,
        easing: Easing.out(Easing.quad),
        useNativeDriver,
      }),
      Animated.timing(animatedValue, {
        toValue: minScale,
        duration: duration * 0.2,
        easing: Easing.in(Easing.quad),
        useNativeDriver,
      }),
      Animated.timing(animatedValue, {
        toValue: maxScale * 0.9,
        duration: duration * 0.2,
        easing: Easing.out(Easing.quad),
        useNativeDriver,
      }),
      Animated.timing(animatedValue, {
        toValue: minScale,
        duration: duration * 0.3,
        easing: Easing.in(Easing.quad),
        useNativeDriver,
      }),
    ]);
  }

  /**
   * 创建组合动画：淡入 + 缩放
   * @param fadeValue 透明度动画值
   * @param scaleValue 缩放动画值
   * @param config 动画配置
   * @returns Animated.CompositeAnimation
   */
  static createFadeInScale(
    fadeValue: Animated.Value,
    scaleValue: Animated.Value,
    config: AnimationConfig = {}
  ): Animated.CompositeAnimation {
    const {
      duration = this.DEFAULT_DURATION,
      easing = this.DEFAULT_EASING,
      useNativeDriver = true,
    } = config;

    // 设置初始值
    fadeValue.setValue(0);
    scaleValue.setValue(0.8);

    return Animated.parallel([
      Animated.timing(fadeValue, {
        toValue: 1,
        duration,
        easing,
        useNativeDriver,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration,
        easing,
        useNativeDriver,
      }),
    ]);
  }

  /**
   * 创建组合动画：淡出 + 缩放
   * @param fadeValue 透明度动画值
   * @param scaleValue 缩放动画值
   * @param config 动画配置
   * @returns Animated.CompositeAnimation
   */
  static createFadeOutScale(
    fadeValue: Animated.Value,
    scaleValue: Animated.Value,
    config: AnimationConfig = {}
  ): Animated.CompositeAnimation {
    const {
      duration = this.DEFAULT_DURATION,
      easing = this.DEFAULT_EASING,
      useNativeDriver = true,
    } = config;

    return Animated.parallel([
      Animated.timing(fadeValue, {
        toValue: 0,
        duration,
        easing,
        useNativeDriver,
      }),
      Animated.timing(scaleValue, {
        toValue: 0.8,
        duration,
        easing,
        useNativeDriver,
      }),
    ]);
  }

  /**
   * 创建加载动画（旋转 + 脉冲）
   * @param rotateValue 旋转动画值
   * @param scaleValue 缩放动画值
   * @param config 动画配置
   * @returns Animated.CompositeAnimation
   */
  static createLoadingAnimation(
    rotateValue: Animated.Value,
    scaleValue: Animated.Value,
    config: AnimationConfig = {}
  ): Animated.CompositeAnimation {
    const {
      duration = 1500,
      useNativeDriver = true,
    } = config;

    // 设置初始值
    rotateValue.setValue(0);
    scaleValue.setValue(0.8);

    const rotateAnimation = Animated.loop(
      Animated.timing(rotateValue, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver,
      }),
      { iterations: -1 }
    );

    const scaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.2,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver,
        }),
        Animated.timing(scaleValue, {
          toValue: 0.8,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver,
        }),
      ]),
      { iterations: -1 }
    );

    return Animated.parallel([rotateAnimation, scaleAnimation]);
  }

  /**
   * 停止动画并重置值
   * @param animatedValue 动画值
   * @param resetValue 重置值
   */
  static stopAndReset(animatedValue: Animated.Value, resetValue: number = 0): void {
    animatedValue.stopAnimation();
    animatedValue.setValue(resetValue);
  }

  /**
   * 停止多个动画并重置值
   * @param animatedValues 动画值数组
   * @param resetValue 重置值
   */
  static stopAndResetMultiple(animatedValues: Animated.Value[], resetValue: number = 0): void {
    animatedValues.forEach(value => {
      this.stopAndReset(value, resetValue);
    });
  }

  /**
   * 创建交错动画
   * @param animations 动画数组
   * @param staggerTime 交错时间
   * @returns Animated.CompositeAnimation
   */
  static createStaggered(
    animations: Animated.CompositeAnimation[],
    staggerTime: number = 100
  ): Animated.CompositeAnimation {
    return Animated.stagger(staggerTime, animations);
  }

  /**
   * 创建序列动画
   * @param animations 动画数组
   * @returns Animated.CompositeAnimation
   */
  static createSequence(animations: Animated.CompositeAnimation[]): Animated.CompositeAnimation {
    return Animated.sequence(animations);
  }

  /**
   * 创建并行动画
   * @param animations 动画数组
   * @returns Animated.CompositeAnimation
   */
  static createParallel(animations: Animated.CompositeAnimation[]): Animated.CompositeAnimation {
    return Animated.parallel(animations);
  }
}