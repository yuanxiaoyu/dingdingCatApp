import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'audio' | 'ui' | 'memory' | 'network' | 'cache';
}

interface PerformanceReport {
  audioMetrics: {
    averageLoadTime: number;
    cacheHitRate: number;
    totalTracksPlayed: number;
    backgroundPlayTime: number;
  };
  uiMetrics: {
    averageRenderTime: number;
    animationFrameDrops: number;
    componentMountTime: number;
  };
  memoryMetrics: {
    currentUsage: number;
    peakUsage: number;
    cacheSize: number;
  };
  recommendations: string[];
}

interface PerformanceThresholds {
  audioLoadTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  renderTime: number;
}

/**
 * 性能监控服务
 * 监控音乐播放器的各项性能指标并提供优化建议
 */
export class PerformanceMonitorService {
  private static metrics: PerformanceMetric[] = [];
  private static isMonitoring: boolean = false;
  private static appStateSubscription: any = null;
  private static sessionStartTime: number = 0;
  private static backgroundStartTime: number = 0;
  
  // 存储键
  private static readonly METRICS_STORAGE_KEY = '@performance_metrics';
  private static readonly REPORT_STORAGE_KEY = '@performance_report';
  
  // 性能阈值
  private static readonly thresholds: PerformanceThresholds = {
    audioLoadTime: 2000, // 2秒
    cacheHitRate: 70,    // 70%
    memoryUsage: 50,     // 50MB
    renderTime: 16,      // 16ms (60fps)
  };

  /**
   * 开始性能监控
   */
  static async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      return;
    }

    console.log('Starting performance monitoring');
    
    this.isMonitoring = true;
    this.sessionStartTime = Date.now();
    
    // 加载历史指标
    await this.loadMetrics();
    
    // 设置应用状态监听
    this.setupAppStateListener();
    
    // 记录会话开始
    this.recordMetric('session_start', 1, 'ui');
  }

  /**
   * 停止性能监控
   */
  static async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    console.log('Stopping performance monitoring');
    
    // 记录会话结束
    const sessionDuration = Date.now() - this.sessionStartTime;
    this.recordMetric('session_duration', sessionDuration, 'ui');
    
    // 保存指标
    await this.saveMetrics();
    
    // 移除应用状态监听
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    
    this.isMonitoring = false;
  }

  /**
   * 记录性能指标
   * @param name 指标名称
   * @param value 指标值
   * @param category 指标分类
   */
  static recordMetric(name: string, value: number, category: PerformanceMetric['category']): void {
    if (!this.isMonitoring) {
      return;
    }

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      category,
    };

    this.metrics.push(metric);
    
    // 限制指标数量，避免内存过度使用
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-800); // 保留最近800条
    }

    // 实时检查关键指标
    this.checkCriticalMetrics(metric);
  }

  /**
   * 记录音频加载时间
   * @param musicId 音乐ID
   * @param loadTime 加载时间（毫秒）
   */
  static recordAudioLoadTime(musicId: string, loadTime: number): void {
    this.recordMetric(`audio_load_${musicId}`, loadTime, 'audio');
    this.recordMetric('audio_load_average', loadTime, 'audio');
  }

  /**
   * 记录缓存命中
   * @param musicId 音乐ID
   * @param isHit 是否命中缓存
   */
  static recordCacheHit(musicId: string, isHit: boolean): void {
    this.recordMetric(`cache_${isHit ? 'hit' : 'miss'}_${musicId}`, 1, 'cache');
    this.recordMetric('cache_operation', isHit ? 1 : 0, 'cache');
  }

  /**
   * 记录内存使用
   * @param usage 内存使用量（MB）
   */
  static recordMemoryUsage(usage: number): void {
    this.recordMetric('memory_usage', usage, 'memory');
  }

  /**
   * 记录UI渲染时间
   * @param componentName 组件名称
   * @param renderTime 渲染时间（毫秒）
   */
  static recordRenderTime(componentName: string, renderTime: number): void {
    this.recordMetric(`render_${componentName}`, renderTime, 'ui');
  }

  /**
   * 记录动画性能
   * @param animationName 动画名称
   * @param frameDrops 掉帧数
   */
  static recordAnimationPerformance(animationName: string, frameDrops: number): void {
    this.recordMetric(`animation_${animationName}_drops`, frameDrops, 'ui');
  }

  /**
   * 记录网络请求性能
   * @param url 请求URL
   * @param responseTime 响应时间（毫秒）
   * @param success 是否成功
   */
  static recordNetworkRequest(url: string, responseTime: number, success: boolean): void {
    this.recordMetric(`network_${success ? 'success' : 'error'}`, responseTime, 'network');
  }

  /**
   * 生成性能报告
   */
  static generateReport(): PerformanceReport {
    const audioMetrics = this.calculateAudioMetrics();
    const uiMetrics = this.calculateUIMetrics();
    const memoryMetrics = this.calculateMemoryMetrics();
    const recommendations = this.generateRecommendations(audioMetrics, uiMetrics, memoryMetrics);

    const report: PerformanceReport = {
      audioMetrics,
      uiMetrics,
      memoryMetrics,
      recommendations,
    };

    // 保存报告
    this.saveReport(report);

    return report;
  }

  /**
   * 计算音频相关指标
   */
  private static calculateAudioMetrics() {
    const audioLoadMetrics = this.metrics.filter(m => m.name.startsWith('audio_load_'));
    const cacheMetrics = this.metrics.filter(m => m.name === 'cache_operation');
    
    const averageLoadTime = audioLoadMetrics.length > 0
      ? audioLoadMetrics.reduce((sum, m) => sum + m.value, 0) / audioLoadMetrics.length
      : 0;

    const cacheHitRate = cacheMetrics.length > 0
      ? (cacheMetrics.filter(m => m.value === 1).length / cacheMetrics.length) * 100
      : 0;

    const totalTracksPlayed = this.metrics.filter(m => m.name.startsWith('audio_load_')).length;
    
    const backgroundPlayTime = this.backgroundStartTime > 0 
      ? Date.now() - this.backgroundStartTime 
      : 0;

    return {
      averageLoadTime,
      cacheHitRate,
      totalTracksPlayed,
      backgroundPlayTime,
    };
  }

  /**
   * 计算UI相关指标
   */
  private static calculateUIMetrics() {
    const renderMetrics = this.metrics.filter(m => m.name.startsWith('render_'));
    const animationMetrics = this.metrics.filter(m => m.name.includes('_drops'));
    
    const averageRenderTime = renderMetrics.length > 0
      ? renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length
      : 0;

    const animationFrameDrops = animationMetrics.length > 0
      ? animationMetrics.reduce((sum, m) => sum + m.value, 0)
      : 0;

    const componentMountTime = this.metrics
      .filter(m => m.name === 'component_mount')
      .reduce((sum, m) => sum + m.value, 0);

    return {
      averageRenderTime,
      animationFrameDrops,
      componentMountTime,
    };
  }

  /**
   * 计算内存相关指标
   */
  private static calculateMemoryMetrics() {
    const memoryMetrics = this.metrics.filter(m => m.name === 'memory_usage');
    
    const currentUsage = memoryMetrics.length > 0 
      ? memoryMetrics[memoryMetrics.length - 1].value 
      : 0;

    const peakUsage = memoryMetrics.length > 0
      ? Math.max(...memoryMetrics.map(m => m.value))
      : 0;

    const cacheSize = this.metrics
      .filter(m => m.name === 'cache_size')
      .reduce((sum, m) => sum + m.value, 0);

    return {
      currentUsage,
      peakUsage,
      cacheSize,
    };
  }

  /**
   * 生成优化建议
   */
  private static generateRecommendations(
    audioMetrics: any,
    uiMetrics: any,
    memoryMetrics: any
  ): string[] {
    const recommendations: string[] = [];

    // 音频性能建议
    if (audioMetrics.averageLoadTime > this.thresholds.audioLoadTime) {
      recommendations.push('音频加载时间过长，建议增加预加载或检查网络连接');
    }

    if (audioMetrics.cacheHitRate < this.thresholds.cacheHitRate) {
      recommendations.push('缓存命中率较低，建议优化缓存策略');
    }

    // UI性能建议
    if (uiMetrics.averageRenderTime > this.thresholds.renderTime) {
      recommendations.push('UI渲染时间过长，建议优化组件渲染逻辑');
    }

    if (uiMetrics.animationFrameDrops > 10) {
      recommendations.push('动画掉帧较多，建议简化动画效果或使用原生驱动');
    }

    // 内存使用建议
    if (memoryMetrics.currentUsage > this.thresholds.memoryUsage) {
      recommendations.push('内存使用过高，建议清理缓存或减少同时播放的音频数量');
    }

    if (memoryMetrics.peakUsage > this.thresholds.memoryUsage * 1.5) {
      recommendations.push('内存峰值过高，存在内存泄漏风险');
    }

    // 通用建议
    if (recommendations.length === 0) {
      recommendations.push('性能表现良好，继续保持');
    }

    return recommendations;
  }

  /**
   * 检查关键指标
   */
  private static checkCriticalMetrics(metric: PerformanceMetric): void {
    // 检查音频加载时间
    if (metric.name.startsWith('audio_load_') && metric.value > this.thresholds.audioLoadTime * 2) {
      console.warn(`Critical: Audio load time too high: ${metric.value}ms`);
    }

    // 检查内存使用
    if (metric.name === 'memory_usage' && metric.value > this.thresholds.memoryUsage * 1.5) {
      console.warn(`Critical: Memory usage too high: ${metric.value}MB`);
    }

    // 检查渲染时间
    if (metric.name.startsWith('render_') && metric.value > this.thresholds.renderTime * 3) {
      console.warn(`Critical: Render time too high: ${metric.value}ms`);
    }
  }

  /**
   * 设置应用状态监听
   */
  private static setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        this.backgroundStartTime = Date.now();
        this.recordMetric('app_background', 1, 'ui');
      } else if (nextAppState === 'active' && this.backgroundStartTime > 0) {
        const backgroundDuration = Date.now() - this.backgroundStartTime;
        this.recordMetric('background_duration', backgroundDuration, 'ui');
        this.backgroundStartTime = 0;
      }
    });
  }

  /**
   * 保存指标到本地存储
   */
  private static async saveMetrics(): Promise<void> {
    try {
      // 只保存最近的指标
      const recentMetrics = this.metrics.slice(-500);
      await AsyncStorage.setItem(this.METRICS_STORAGE_KEY, JSON.stringify(recentMetrics));
    } catch (error) {
      console.error('Failed to save performance metrics:', error);
    }
  }

  /**
   * 从本地存储加载指标
   */
  private static async loadMetrics(): Promise<void> {
    try {
      const metricsJson = await AsyncStorage.getItem(this.METRICS_STORAGE_KEY);
      if (metricsJson) {
        const savedMetrics: PerformanceMetric[] = JSON.parse(metricsJson);
        this.metrics = savedMetrics;
      }
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
    }
  }

  /**
   * 保存性能报告
   */
  private static async saveReport(report: PerformanceReport): Promise<void> {
    try {
      const reportWithTimestamp = {
        ...report,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(this.REPORT_STORAGE_KEY, JSON.stringify(reportWithTimestamp));
    } catch (error) {
      console.error('Failed to save performance report:', error);
    }
  }

  /**
   * 获取最新的性能报告
   */
  static async getLatestReport(): Promise<PerformanceReport | null> {
    try {
      const reportJson = await AsyncStorage.getItem(this.REPORT_STORAGE_KEY);
      if (reportJson) {
        return JSON.parse(reportJson);
      }
    } catch (error) {
      console.error('Failed to load performance report:', error);
    }
    return null;
  }

  /**
   * 清理旧指标
   */
  static async cleanupOldMetrics(): Promise<void> {
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7天前
    this.metrics = this.metrics.filter(metric => metric.timestamp > cutoffTime);
    await this.saveMetrics();
  }

  /**
   * 获取实时性能统计
   */
  static getRealTimeStats(): {
    metricsCount: number;
    sessionDuration: number;
    isMonitoring: boolean;
    lastMetricTime: number;
  } {
    return {
      metricsCount: this.metrics.length,
      sessionDuration: this.sessionStartTime > 0 ? Date.now() - this.sessionStartTime : 0,
      isMonitoring: this.isMonitoring,
      lastMetricTime: this.metrics.length > 0 ? this.metrics[this.metrics.length - 1].timestamp : 0,
    };
  }

  /**
   * 重置所有指标
   */
  static async resetMetrics(): Promise<void> {
    this.metrics = [];
    await AsyncStorage.removeItem(this.METRICS_STORAGE_KEY);
    await AsyncStorage.removeItem(this.REPORT_STORAGE_KEY);
    console.log('Performance metrics reset');
  }
}