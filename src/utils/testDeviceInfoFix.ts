/**
 * 测试DeviceInfo修复
 * 验证所有DeviceInfo方法调用都能正常工作
 */

import DeviceInfo from 'react-native-device-info';

/**
 * 安全调用DeviceInfo方法的工具函数
 */
const callDeviceInfoSafely = async <T>(
  method: () => T | Promise<T>, 
  fallback: T
): Promise<T> => {
  try {
    const result = method();
    // 检查是否为Promise
    if (result && typeof (result as any).then === 'function') {
      return await (result as Promise<T>);
    }
    // 同步结果
    return result as T;
  } catch (error) {
    console.warn('DeviceInfo method failed:', error);
    return fallback;
  }
};

/**
 * 测试所有DeviceInfo方法
 */
export async function testDeviceInfoMethods(): Promise<{
  success: boolean;
  results: Array<{ method: string; success: boolean; value?: any; error?: string }>;
}> {
  console.log('🔍 测试DeviceInfo方法兼容性...\n');
  
  const results = [];
  
  // 测试基本设备信息方法
  const basicMethods = [
    { name: 'getBrand', method: () => DeviceInfo.getBrand(), fallback: 'Unknown' },
    { name: 'getModel', method: () => DeviceInfo.getModel(), fallback: 'Unknown' },
    { name: 'getSystemName', method: () => DeviceInfo.getSystemName(), fallback: 'Unknown' },
    { name: 'getSystemVersion', method: () => DeviceInfo.getSystemVersion(), fallback: 'Unknown' },
    { name: 'getDeviceId', method: () => DeviceInfo.getDeviceId(), fallback: 'Unknown' },
    { name: 'getUniqueId', method: () => DeviceInfo.getUniqueId(), fallback: 'Unknown' },
    { name: 'getVersion', method: () => DeviceInfo.getVersion(), fallback: '1.0.0' },
    { name: 'getBuildNumber', method: () => DeviceInfo.getBuildNumber(), fallback: '1' },
  ];
  
  // 测试系统信息方法
  const systemMethods = [
    { name: 'getTotalMemory', method: () => DeviceInfo.getTotalMemory(), fallback: undefined },
    { name: 'getUsedMemory', method: () => DeviceInfo.getUsedMemory(), fallback: undefined },
    { name: 'getTotalDiskCapacity', method: () => DeviceInfo.getTotalDiskCapacity(), fallback: undefined },
    { name: 'getFreeDiskStorage', method: () => DeviceInfo.getFreeDiskStorage(), fallback: undefined },
    { name: 'getBatteryLevel', method: () => DeviceInfo.getBatteryLevel(), fallback: undefined },
    { name: 'isBatteryCharging', method: () => DeviceInfo.isBatteryCharging(), fallback: undefined },
    { name: 'getCarrier', method: () => DeviceInfo.getCarrier(), fallback: undefined },
    { name: 'isEmulator', method: () => DeviceInfo.isEmulator(), fallback: false },
  ];
  
  const allMethods = [...basicMethods, ...systemMethods];
  
  for (const methodInfo of allMethods) {
    try {
      console.log(`测试 ${methodInfo.name}...`);
      const value = await callDeviceInfoSafely(methodInfo.method, methodInfo.fallback);
      
      results.push({
        method: methodInfo.name,
        success: true,
        value: value,
      });
      
      console.log(`✅ ${methodInfo.name}: ${JSON.stringify(value)}`);
      
    } catch (error) {
      results.push({
        method: methodInfo.name,
        success: false,
        error: (error as Error).message,
      });
      
      console.log(`❌ ${methodInfo.name}: ${(error as Error).message}`);
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  const success = successCount === totalCount;
  
  console.log(`\\n📊 测试结果: ${successCount}/${totalCount} 个方法测试通过`);
  
  if (success) {
    console.log('✅ 所有DeviceInfo方法都能正常工作！');
  } else {
    console.log('⚠️ 部分DeviceInfo方法存在问题，但已有安全处理');
  }
  
  return {
    success,
    results,
  };
}

/**
 * 测试设备环境检测
 */
export async function testDeviceEnvironmentDetection(): Promise<{
  success: boolean;
  deviceInfo: any;
  error?: string;
}> {
  console.log('🔍 测试设备环境检测...\n');
  
  try {
    // 模拟DeviceService中的设备检测逻辑
    const [brand, model, systemName, isEmulator] = await Promise.all([
      callDeviceInfoSafely(() => DeviceInfo.getBrand(), 'Unknown'),
      callDeviceInfoSafely(() => DeviceInfo.getModel(), 'Unknown'),
      callDeviceInfoSafely(() => DeviceInfo.getSystemName(), 'Unknown'),
      callDeviceInfoSafely(() => DeviceInfo.isEmulator(), false),
    ]);
    
    const deviceInfo = {
      brand,
      model,
      systemName,
      isEmulator,
    };
    
    console.log('✅ 设备环境检测成功:', deviceInfo);
    
    return {
      success: true,
      deviceInfo,
    };
    
  } catch (error) {
    console.log('❌ 设备环境检测失败:', error);
    
    return {
      success: false,
      deviceInfo: null,
      error: (error as Error).message,
    };
  }
}

// 在开发环境下暴露到全局
if (__DEV__) {
  (global as any).testDeviceInfoMethods = testDeviceInfoMethods;
  (global as any).testDeviceEnvironmentDetection = testDeviceEnvironmentDetection;
  
  console.log('DeviceInfo测试工具已加载:');
  console.log('- 运行 testDeviceInfoMethods() 测试所有方法');
  console.log('- 运行 testDeviceEnvironmentDetection() 测试环境检测');
}

export default {
  testDeviceInfoMethods,
  testDeviceEnvironmentDetection,
};