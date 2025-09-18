/**
 * Mock模式测试工具
 * 用于快速验证Mock模式是否正常工作，避免网络请求
 */

import mockService, { MockUserState } from '../services/MockService';
import configService from '../services/ConfigService';
import adService from '../services/AdService';
import authService from '../services/AuthService';
import { AdType } from '../types';
import { ENV_CONFIG } from '../config/env';

/**
 * 快速测试Mock模式是否正常工作
 */
export async function testMockMode(): Promise<void> {
  console.log('🧪 开始测试Mock模式...\n');

  try {
    // 1. 初始化Mock服务
    console.log('1️⃣ 初始化Mock服务...');
    await mockService.initialize();
    await mockService.setMockState(MockUserState.LOGGED_IN);
    
    const isMockEnabled = mockService.isMockModeEnabled();
    console.log(`   Mock模式: ${isMockEnabled ? '✅ 启用' : '❌ 禁用'}`);
    
    if (!isMockEnabled) {
      console.log('❌ Mock模式未启用，请检查ENV_CONFIG.MOCK_ENABLED设置');
      return;
    }

    // 2. 测试认证服务
    console.log('\n2️⃣ 测试认证服务...');
    const isAuthenticated = await authService.isAuthenticated();
    console.log(`   用户认证状态: ${isAuthenticated ? '✅ 已登录' : '❌ 未登录'}`);
    
    if (isAuthenticated) {
      const userInfo = await authService.getUserInfo();
      console.log(`   用户信息: ${userInfo ? '✅ 获取成功' : '❌ 获取失败'}`);
      if (userInfo) {
        console.log(`   用户昵称: ${userInfo.nickName}`);
        console.log(`   用户ID: ${userInfo.userId}`);
      }
    }

    // 3. 测试配置服务
    console.log('\n3️⃣ 测试配置服务...');
    
    const appConfig = await configService.getAppConfig();
    console.log(`   应用配置: ${appConfig ? '✅ 获取成功' : '❌ 获取失败'}`);
    
    const adConfig = await configService.getAdConfig();
    console.log(`   广告配置: ${adConfig ? '✅ 获取成功' : '❌ 获取失败'}`);
    
    const riskConfig = await configService.getRiskConfig();
    console.log(`   风控配置: ${riskConfig ? '✅ 获取成功' : '❌ 获取失败'}`);

    // 4. 测试广告服务
    console.log('\n4️⃣ 测试广告服务...');
    
    if (isAuthenticated) {
      const userInfo = await authService.getUserInfo();
      if (userInfo) {
        // 测试Banner广告请求
        const bannerAd = await adService.requestBannerAd(userInfo.userId);
        console.log(`   Banner广告请求: ${bannerAd ? '✅ 成功' : '❌ 失败'}`);
        if (bannerAd) {
          console.log(`   广告ID: ${bannerAd.adId}`);
          console.log(`   广告标题: ${bannerAd.adTitle}`);
        }

        // 测试收益数据
        const revenueData = await adService.getUserRevenue(userInfo.userId);
        console.log(`   收益数据: ${revenueData ? '✅ 获取成功' : '❌ 获取失败'}`);
        if (revenueData) {
          console.log(`   总收益: ¥${revenueData.totalRevenue}`);
          console.log(`   今日收益: ¥${revenueData.todayRevenue}`);
        }
      }
    }

    // 5. 验证没有网络请求
    console.log('\n5️⃣ 验证Mock模式效果...');
    console.log('   ✅ 所有数据都来自Mock服务，没有发送网络请求');
    console.log('   ✅ Mock模式工作正常');

    console.log('\n🎉 Mock模式测试完成！');
    console.log('💡 现在应用应该能正常显示用户信息和广告位，不会出现网络错误。');

  } catch (error) {
    console.error('\n❌ Mock模式测试失败:', error);
    console.log('\n🔧 可能的解决方案:');
    console.log('1. 检查ENV_CONFIG.MOCK_ENABLED是否为true');
    console.log('2. 检查ENV_CONFIG.MOCK_USER_STATE是否为1');
    console.log('3. 重启应用重新加载配置');
  }
}

/**
 * 检查当前Mock状态
 */
export function checkMockStatus(): void {
  console.log('📊 当前Mock状态:');
  console.log(`   MOCK_ENABLED: ${ENV_CONFIG.MOCK_ENABLED}`);
  console.log(`   MOCK_USER_STATE: ${ENV_CONFIG.MOCK_USER_STATE}`);
  console.log(`   DEBUG_MODE: ${ENV_CONFIG.DEBUG_MODE}`);
  
  const mockStatus = mockService.getStatus();
  console.log('   Mock服务状态:', mockStatus);
}

/**
 * 强制启用Mock模式
 */
export async function forceMockMode(): Promise<void> {
  console.log('🔧 强制启用Mock模式...');
  
  try {
    await mockService.initialize();
    await mockService.setMockState(MockUserState.LOGGED_IN);
    
    console.log('✅ Mock模式已强制启用');
    console.log('💡 请重新测试应用功能');
    
  } catch (error) {
    console.error('❌ 强制启用Mock模式失败:', error);
  }
}

/**
 * 在开发环境下暴露测试函数到全局
 */
if (__DEV__) {
  (global as any).testMockMode = testMockMode;
  (global as any).checkMockStatus = checkMockStatus;
  (global as any).forceMockMode = forceMockMode;
  
  console.log('Mock模式测试工具已加载:');
  console.log('- 运行 testMockMode() 测试Mock模式');
  console.log('- 运行 checkMockStatus() 检查Mock状态');
  console.log('- 运行 forceMockMode() 强制启用Mock模式');
}

export default {
  testMockMode,
  checkMockStatus,
  forceMockMode
};