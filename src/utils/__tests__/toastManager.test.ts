// Toast Manager Tests
import { toastManager } from '../toastManager';

describe('ToastManager', () => {
  beforeEach(() => {
    toastManager.clearAll();
  });

  describe('basic toast functionality', () => {
    it('adds and removes toasts correctly', () => {
      expect(toastManager.getCount()).toBe(0);

      const id = toastManager.success('Test message', { duration: 0 });
      expect(toastManager.getCount()).toBe(1);

      toastManager.removeToast(id);
      expect(toastManager.getCount()).toBe(0);
    });

    it('auto-removes toasts after duration', (done) => {
      toastManager.success('Test message', { duration: 100 });
      expect(toastManager.getCount()).toBe(1);

      setTimeout(() => {
        expect(toastManager.getCount()).toBe(0);
        done();
      }, 150);
    }, 10000);

    it('does not auto-remove toasts with duration 0', (done) => {
      toastManager.success('Test message', { duration: 0 });
      expect(toastManager.getCount()).toBe(1);

      setTimeout(() => {
        expect(toastManager.getCount()).toBe(1);
        done();
      }, 100);
    }, 10000);
  });

  describe('toast types', () => {
    it('creates success toasts', () => {
      const id = toastManager.success('Success message');
      const toasts = toastManager.getToasts();
      
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('success');
      expect(toasts[0].message).toBe('Success message');
    });

    it('creates error toasts with longer duration', () => {
      const id = toastManager.error('Error message');
      const toasts = toastManager.getToasts();
      
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('error');
      expect(toasts[0].options.duration).toBe(5000);
    });

    it('creates warning toasts', () => {
      const id = toastManager.warning('Warning message');
      const toasts = toastManager.getToasts();
      
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('warning');
    });

    it('creates info toasts', () => {
      const id = toastManager.info('Info message');
      const toasts = toastManager.getToasts();
      
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('info');
    });
  });

  describe('specialized toast methods', () => {
    it('creates network error toasts', () => {
      const onRetry = jest.fn();
      toastManager.networkError(onRetry);
      
      const toasts = toastManager.getToasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('error');
      expect(toasts[0].message).toContain('网络连接失败');
      expect(toasts[0].options.actionText).toBe('重试');
      expect(toasts[0].options.onActionPress).toBe(onRetry);
    });

    it('creates API error toasts for different status codes', () => {
      const testCases = [
        { code: 401, expectedMessage: '登录已过期' },
        { code: 403, expectedMessage: '访问被拒绝' },
        { code: 429, expectedMessage: '请求过于频繁' },
        { code: 500, expectedMessage: '服务器暂时不可用' },
      ];

      testCases.forEach(({ code, expectedMessage }) => {
        toastManager.clearAll();
        toastManager.apiError(code);
        
        const toasts = toastManager.getToasts();
        expect(toasts).toHaveLength(1);
        expect(toasts[0].message).toContain(expectedMessage);
      });
    });

    it('creates ad success toasts', () => {
      toastManager.adSuccess('video', 0.05);
      
      const toasts = toastManager.getToasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('success');
      expect(toasts[0].message).toContain('视频广告');
      expect(toasts[0].message).toContain('¥0.05');
    });

    it('creates risk warning toasts', () => {
      toastManager.riskWarning('ROOT_DETECTED');
      
      const toasts = toastManager.getToasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('warning');
      expect(toasts[0].message).toContain('ROOT');
    });

    it('creates loading toasts that do not auto-hide', () => {
      toastManager.loading('Loading...');
      
      const toasts = toastManager.getToasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('info');
      expect(toasts[0].options.duration).toBe(0);
    });
  });

  describe('toast subscription', () => {
    it('notifies subscribers when toasts change', () => {
      const listener = jest.fn();
      const unsubscribe = toastManager.subscribe(listener);

      toastManager.success('Test message');
      expect(listener).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Test message',
            type: 'success',
          }),
        ])
      );

      unsubscribe();
      toastManager.success('Another message');
      expect(listener).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('handles multiple subscribers', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      toastManager.subscribe(listener1);
      toastManager.subscribe(listener2);

      toastManager.success('Test message');
      
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('toast management', () => {
    it('clears all toasts', () => {
      toastManager.success('Message 1');
      toastManager.error('Message 2');
      toastManager.warning('Message 3');
      
      expect(toastManager.getCount()).toBe(3);
      
      toastManager.clearAll();
      expect(toastManager.getCount()).toBe(0);
    });

    it('returns correct toast count', () => {
      expect(toastManager.getCount()).toBe(0);
      
      toastManager.success('Message 1');
      expect(toastManager.getCount()).toBe(1);
      
      toastManager.error('Message 2');
      expect(toastManager.getCount()).toBe(2);
    });

    it('returns copy of toasts array', () => {
      toastManager.success('Test message');
      
      const toasts1 = toastManager.getToasts();
      const toasts2 = toastManager.getToasts();
      
      expect(toasts1).not.toBe(toasts2); // Different array instances
      expect(toasts1).toEqual(toasts2); // Same content
    });
  });
});