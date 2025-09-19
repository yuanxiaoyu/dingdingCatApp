/**
 * API拦截器
 * 在API客户端层面统一处理Mock模式
 */

import { isMockEnabled, mockLog, mockDelay } from '../config/mockConfig';
import mockService from './MockService';
import { ApiResponse } from '../types';

/**
 * API路由到Mock方法的映射
 */
const API_MOCK_MAPPING = {
  // 认证相关
  'POST:/auth/wechat/login': 'mockWechatLogin',
  'POST:/auth/wechat/register': 'mockWechatRegister', 
  'POST:/auth/refresh': 'mockRefreshToken',
  'POST:/auth/logout': 'mockLogout',
  'GET:/auth/userInfo': 'mockGetUserInfo',
  
  // 配置相关
  'GET:/config': 'mockGetAppConfig',
  'GET:/config/ad': 'mockGetAdConfig',
  'GET:/config/risk': 'mockGetRiskConfig',
  'GET:/config/channel': 'mockGetChannelConfig',
  
  // 广告相关
  'POST:/ad/request': 'mockAdRequest',
  'POST:/ad/show': 'mockAdShow',
  'POST:/ad/click': 'mockAdClick',
  'POST:/ad/complete': 'mockAdComplete',
  'POST:/ad/skip': 'mockAdSkip',
  'POST:/ad/close': 'mockAdClose',
  'POST:/ad/batchReport': 'mockBatchReport',
  'GET:/ad/revenue': 'mockGetUserRevenue',

  
  // 设备相关
  'POST:/user/device': 'mockReportDevice',
} as const;

/**
 * 拦截API请求并返回Mock数据
 */
export async function interceptApiRequest(
  method: string,
  url: string,
  data?: any,
  params?: any
): Promise<ApiResponse<any> | null> {
  
  // 检查是否启用Mock模式
  if (!isMockEnabled()) {
    return null; // 不拦截，继续执行真实API请求
  }

  // 构建API键
  const apiKey = `${method.toUpperCase()}:${url}` as keyof typeof API_MOCK_MAPPING;
  const mockMethod = API_MOCK_MAPPING[apiKey];
  
  if (!mockMethod) {
    mockLog(`未找到Mock方法: ${apiKey}`);
    return null; // 没有对应的Mock方法，继续执行真实API请求
  }

  try {
    mockLog(`拦截API请求: ${apiKey}`, { data, params });
    
    // 模拟网络延迟
    await mockDelay();
    
    // 调用对应的Mock方法
    const mockServiceMethod = (mockService as any)[mockMethod];
    if (typeof mockServiceMethod !== 'function') {
      mockLog(`Mock方法不存在: ${mockMethod}`);
      return null;
    }
    
    // 根据不同的API调用不同的Mock方法
    let result;
    switch (apiKey) {
      case 'POST:/auth/wechat/login':
        result = await mockServiceMethod.call(mockService);
        break;
        
      case 'POST:/auth/wechat/register':
        result = await mockServiceMethod.call(mockService, data?.code, data?.userInfo);
        break;
        
      case 'POST:/auth/refresh':
        result = await mockServiceMethod.call(mockService, data?.refreshToken);
        break;
        
      case 'POST:/auth/logout':
        result = await mockServiceMethod.call(mockService);
        break;
        
      case 'GET:/auth/userInfo':
        result = await mockServiceMethod.call(mockService);
        break;
        
      case 'GET:/config':
      case 'GET:/config/ad':
      case 'GET:/config/risk':
      case 'GET:/config/channel':
        result = await mockServiceMethod.call(mockService);
        break;
        
      case 'POST:/ad/request':
        result = await mockServiceMethod.call(mockService, data?.userId, data?.adType, data?.channelId);
        break;
        
      case 'POST:/ad/show':
        result = await mockServiceMethod.call(mockService, data?.userId, data?.adId, data?.adType);
        break;
        
      case 'POST:/ad/click':
        result = await mockServiceMethod.call(mockService, data?.userId, data?.adId, data?.adType);
        break;
        
      case 'POST:/ad/complete':
        result = await mockServiceMethod.call(mockService, data?.userId, data?.adId, data?.adType, data?.playDuration, data?.isSkipped);
        break;
        
      case 'POST:/ad/skip':
        result = await mockServiceMethod.call(mockService, data?.userId, data?.adId, data?.adType, data?.playDuration, data?.skipReason);
        break;
        
      case 'POST:/ad/close':
        result = await mockServiceMethod.call(mockService, data?.userId, data?.adId, data?.adType, data?.playDuration, data?.closeReason);
        break;
        
      case 'POST:/ad/batchReport':
        result = await mockServiceMethod.call(mockService, data?.userId, data?.playDataList);
        break;
        
      case 'GET:/ad/revenue':
        result = await mockServiceMethod.call(mockService, params?.userId);
        break;
        
      case 'GET:/ad/history':
        result = await mockServiceMethod.call(mockService, params?.userId, params?.pageNum, params?.pageSize);
        break;
        
      case 'POST:/user/device':
        result = await mockServiceMethod.call(mockService, data);
        break;
        
      default:
        result = await mockServiceMethod.call(mockService, data, params);
        break;
    }
    
    // 包装成标准API响应格式
    const response: ApiResponse<any> = {
      code: 200,
      message: 'Success',
      data: result,
      timestamp: Date.now(),
    };
    
    mockLog(`Mock响应: ${apiKey}`, response);
    return response;
    
  } catch (error) {
    mockLog(`Mock方法执行失败: ${mockMethod}`, error);
    
    // 返回错误响应
    return {
      code: 500,
      message: `Mock error: ${(error as Error).message}`,
      data: null,
      timestamp: Date.now(),
    };
  }
}

/**
 * 检查API是否支持Mock
 */
export function isApiMockSupported(method: string, url: string): boolean {
  const apiKey = `${method.toUpperCase()}:${url}` as keyof typeof API_MOCK_MAPPING;
  return apiKey in API_MOCK_MAPPING;
}

export default {
  interceptApiRequest,
  isApiMockSupported,
};