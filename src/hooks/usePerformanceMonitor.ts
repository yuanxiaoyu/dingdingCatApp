import { useEffect, useRef, useCallback } from 'react';
import { PerformanceMonitorService } from '../services/PerformanceMonitorService';

interface UsePerformanceMonitorOptions {
  componentName: string;
  trackRender?: boolean;
  trackMount?: boolean;
}

/**
 * 性能监控Hook
 * 自动监控组件的渲染性能和生命周期
 */
export const usePerformanceMonitor = (options: UsePerformanceMonitorOptions) => {
  const { componentName, trackRender = true, trackMount = true } = options;
  const mountStartTime = useRef<number>(0);
  const renderStartTime = useRef<number>(0);

  // 记录组件挂载时间
  useEffect(() => {
    if (trackMount) {
      mountStartTime.current = Date.now();
      
      return () => {
        const mountDuration = Date.now() - mountStartTime.current;
        PerformanceMonitorService.recordRenderTime(`${componentName}_mount`, mountDuration);
      };
    }
  }, [componentName, trackMount]);

  // 记录渲染开始
  const startRenderTracking = useCallback(() => {
    if (trackRender) {
      renderStartTime.current = Date.now();
    }
  }, [trackRender]);

  // 记录渲染结束
  const endRenderTracking = useCallback(() => {
    if (trackRender && renderStartTime.current > 0) {
      const renderDuration = Date.now() - renderStartTime.current;
      PerformanceMonitorService.recordRenderTime(`${componentName}_render`, renderDuration);
      renderStartTime.current = 0;
    }
  }, [componentName, trackRender]);

  // 记录自定义指标
  const recordMetric = useCallback((name: string, value: number) => {
    PerformanceMonitorService.recordMetric(`${componentName}_${name}`, value, 'ui');
  }, [componentName]);

  return {
    startRenderTracking,
    endRenderTracking,
    recordMetric,
  };
};