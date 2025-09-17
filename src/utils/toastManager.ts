// Global Toast Manager for User Feedback
import { ToastType } from '../components/FeedbackToast';

export interface ToastOptions {
  duration?: number;
  position?: 'top' | 'center' | 'bottom';
  actionText?: string;
  onActionPress?: () => void;
}

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  options: ToastOptions;
  timestamp: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners: ToastListener[] = [];
  private idCounter = 0;

  /**
   * Subscribe to toast updates
   */
  public subscribe(listener: ToastListener): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of toast updates
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  /**
   * Generate unique toast ID
   */
  private generateId(): string {
    return `toast_${++this.idCounter}_${Date.now()}`;
  }

  /**
   * Add a new toast
   */
  private addToast(message: string, type: ToastType, options: ToastOptions = {}): string {
    const id = this.generateId();
    const toast: ToastItem = {
      id,
      message,
      type,
      options,
      timestamp: Date.now(),
    };

    this.toasts.push(toast);
    this.notifyListeners();

    // Auto-remove toast after duration
    const duration = options.duration ?? 3000;
    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, duration);
    }

    return id;
  }

  /**
   * Remove a toast by ID
   */
  public removeToast(id: string): void {
    const index = this.toasts.findIndex(toast => toast.id === id);
    if (index > -1) {
      this.toasts.splice(index, 1);
      this.notifyListeners();
    }
  }

  /**
   * Clear all toasts
   */
  public clearAll(): void {
    this.toasts = [];
    this.notifyListeners();
  }

  /**
   * Show success toast
   */
  public success(message: string, options: ToastOptions = {}): string {
    return this.addToast(message, 'success', options);
  }

  /**
   * Show error toast
   */
  public error(message: string, options: ToastOptions = {}): string {
    return this.addToast(message, 'error', {
      duration: 5000, // Longer duration for errors
      ...options,
    });
  }

  /**
   * Show warning toast
   */
  public warning(message: string, options: ToastOptions = {}): string {
    return this.addToast(message, 'warning', options);
  }

  /**
   * Show info toast
   */
  public info(message: string, options: ToastOptions = {}): string {
    return this.addToast(message, 'info', options);
  }

  /**
   * Show network error toast with retry option
   */
  public networkError(onRetry?: () => void): string {
    return this.error('网络连接失败，请检查网络设置', {
      duration: 0, // Don't auto-hide
      actionText: onRetry ? '重试' : undefined,
      onActionPress: onRetry,
    });
  }

  /**
   * Show API error toast based on error code
   */
  public apiError(code: number, message?: string, onRetry?: () => void): string {
    let errorMessage = message;
    let actionText: string | undefined;
    let onActionPress: (() => void) | undefined;

    switch (code) {
      case 401:
        errorMessage = '登录已过期，请重新登录';
        actionText = '重新登录';
        break;
      case 403:
        errorMessage = '访问被拒绝，可能触发了安全规则';
        break;
      case 429:
        errorMessage = '请求过于频繁，请稍后再试';
        actionText = onRetry ? '重试' : undefined;
        onActionPress = onRetry;
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        errorMessage = '服务器暂时不可用，请稍后再试';
        actionText = onRetry ? '重试' : undefined;
        onActionPress = onRetry;
        break;
      default:
        errorMessage = message || '请求失败，请稍后再试';
        actionText = onRetry ? '重试' : undefined;
        onActionPress = onRetry;
    }

    return this.error(errorMessage, {
      actionText,
      onActionPress,
    });
  }

  /**
   * Show loading toast (returns ID for manual removal)
   */
  public loading(message: string = '加载中...'): string {
    return this.info(message, {
      duration: 0, // Don't auto-hide
    });
  }

  /**
   * Show ad-related success message
   */
  public adSuccess(adType: string, reward?: number): string {
    const typeNames = {
      splash: '开屏广告',
      video: '视频广告',
      interstitial: '插屏广告',
      banner: 'Banner广告',
    };

    const typeName = typeNames[adType as keyof typeof typeNames] || '广告';
    const message = reward 
      ? `${typeName}观看完成，获得收益 ¥${reward.toFixed(2)}`
      : `${typeName}观看完成`;

    return this.success(message);
  }

  /**
   * Show risk control warning
   */
  public riskWarning(riskType: string): string {
    const messages = {
      ROOT_DETECTED: '检测到设备已ROOT，为了账户安全，暂时无法使用此功能',
      EMULATOR_DETECTED: '检测到模拟器环境，为了账户安全，暂时无法使用此功能',
      FREQUENCY_LIMIT: '操作过于频繁，请稍后再试',
      IP_LIMIT: '当前网络环境异常，请更换网络后重试',
      DAILY_LIMIT: '今日观看次数已达上限，请明天再来',
      REVENUE_LIMIT: '收益异常，请联系客服处理',
    };

    const message = messages[riskType as keyof typeof messages] || '触发安全规则，暂时无法使用此功能';
    return this.warning(message, { duration: 5000 });
  }

  /**
   * Get current toasts
   */
  public getToasts(): ToastItem[] {
    return [...this.toasts];
  }

  /**
   * Get toast count
   */
  public getCount(): number {
    return this.toasts.length;
  }
}

// Create singleton instance
export const toastManager = new ToastManager();

// Convenience functions
export const showSuccess = (message: string, options?: ToastOptions) => 
  toastManager.success(message, options);

export const showError = (message: string, options?: ToastOptions) => 
  toastManager.error(message, options);

export const showWarning = (message: string, options?: ToastOptions) => 
  toastManager.warning(message, options);

export const showInfo = (message: string, options?: ToastOptions) => 
  toastManager.info(message, options);

export const showNetworkError = (onRetry?: () => void) => 
  toastManager.networkError(onRetry);

export const showApiError = (code: number, message?: string, onRetry?: () => void) => 
  toastManager.apiError(code, message, onRetry);

export const showLoading = (message?: string) => 
  toastManager.loading(message);

export const showAdSuccess = (adType: string, reward?: number) => 
  toastManager.adSuccess(adType, reward);

export const showRiskWarning = (riskType: string) => 
  toastManager.riskWarning(riskType);

export default toastManager;