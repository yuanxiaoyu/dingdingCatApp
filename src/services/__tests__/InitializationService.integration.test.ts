/**
 * Integration test for InitializationService
 * This test verifies that the initialization service can be instantiated
 * and has the correct interface without running the full initialization
 */

import { InitializationService, InitPhase } from '../InitializationService';

describe('InitializationService Integration', () => {
  it('should create an instance with correct interface', () => {
    const initService = new InitializationService();
    
    expect(initService).toBeDefined();
    expect(typeof initService.initialize).toBe('function');
    expect(typeof initService.addStatusListener).toBe('function');
    expect(typeof initService.removeStatusListener).toBe('function');
    expect(typeof initService.getCurrentStatus).toBe('function');
  });

  it('should have correct initial status', () => {
    const initService = new InitializationService();
    const status = initService.getCurrentStatus();
    
    expect(status.phase).toBe(InitPhase.STARTING);
    expect(status.progress).toBe(0);
    expect(status.message).toBe('正在启动应用...');
  });

  it('should support status listeners', () => {
    const initService = new InitializationService();
    const mockListener = jest.fn();
    
    initService.addStatusListener(mockListener);
    
    // Should call listener with current status immediately
    expect(mockListener).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: InitPhase.STARTING,
        progress: 0,
        message: '正在启动应用...',
      })
    );
    
    initService.removeStatusListener(mockListener);
  });

  it('should export all required enums and types', () => {
    expect(InitPhase.STARTING).toBe('STARTING');
    expect(InitPhase.AUTH_CHECK).toBe('AUTH_CHECK');
    expect(InitPhase.CONFIG_LOADING).toBe('CONFIG_LOADING');
    expect(InitPhase.DEVICE_INFO).toBe('DEVICE_INFO');
    expect(InitPhase.RISK_CONTROL).toBe('RISK_CONTROL');
    expect(InitPhase.OFFLINE_SYNC).toBe('OFFLINE_SYNC');
    expect(InitPhase.COMPLETED).toBe('COMPLETED');
    expect(InitPhase.FAILED).toBe('FAILED');
  });
});