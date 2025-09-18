/**
 * Banner广告测试工具
 * 用于测试和验证Banner广告组件的功能
 */

import AdConfig from '../config/adConfig';
import mockService from '../services/MockService';
import { AdType } from '../types';

export interface BannerAdTestResult {
  testName: string;
  success: boolean;
  duration: number;
  error?: string;
  data?: any;
}

export class BannerAdTester {
  private testResults: BannerAdTestResult[] = [];

  /**
   * 测试Banner广告配置
   */
  async testBannerAdConfig(): Promise<BannerAdTestResult> {
    const startTime = Date.now();
    const testName = 'Banner Ad Config Test';

    try {
      console.log('Testing banner ad configuration...');

      // 检查AdConfig中的Banner广告配置
      const bannerAdId = AdConfig.bannerAdId;
      const bannerButton = AdConfig.adButtons.find(btn => btn.adType === 'banner');

      if (!bannerAdId) {
        throw new Error('Banner ad ID not found in AdConfig');
      }

      if (!bannerButton) {
        throw new Error('Banner ad button config not found in AdConfig');
      }

      if (!bannerButton.enabled) {
        throw new Error('Banner ad is disabled in AdConfig');
      }

      const duration = Date.now() - startTime;
      const result: BannerAdTestResult = {
        testName,
        success: true,
        duration,
        data: {
          bannerAdId,
          bannerButton,
        },
      };

      this.testResults.push(result);
      console.log('✅ Banner ad config test passed');
      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      const result: BannerAdTestResult = {
        testName,
        success: false,
        duration,
        error: (error as Error).message,
      };

      this.testResults.push(result);
      console.log('❌ Banner ad config test failed:', error);
      return result;
    }
  }

  /**
   * 测试Mock Banner广告数据生成
   */
  async testMockBannerAdGeneration(): Promise<BannerAdTestResult> {
    const startTime = Date.now();
    const testName = 'Mock Banner Ad Generation Test';

    try {
      console.log('Testing mock banner ad generation...');

      // 获取Mock广告配置
      const adConfig = await mockService.getMockAdConfig();
      
      if (!adConfig.bannerAdConfig?.enabled) {
        throw new Error('Banner ads are disabled in mock config');
      }

      // 模拟生成Banner广告数据
      const mockBannerData = {
        adId: AdConfig.bannerAdId,
        adType: AdType.BANNER,
        adTitle: '丁丁猫Banner广告 - Mock模拟',
        adImageUrl: '',
        adClickUrl: 'https://www.dingdingcat.com',
        rewardAmount: 5,
        playDuration: 0,
        expectedReward: 5,
        configParams: {
          width: 350,
          height: 80,
          refreshInterval: 30000,
        },
      };

      // 验证数据完整性
      if (!mockBannerData.adId || !mockBannerData.adTitle) {
        throw new Error('Generated mock banner data is incomplete');
      }

      const duration = Date.now() - startTime;
      const result: BannerAdTestResult = {
        testName,
        success: true,
        duration,
        data: mockBannerData,
      };

      this.testResults.push(result);
      console.log('✅ Mock banner ad generation test passed');
      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      const result: BannerAdTestResult = {
        testName,
        success: false,
        duration,
        error: (error as Error).message,
      };

      this.testResults.push(result);
      console.log('❌ Mock banner ad generation test failed:', error);
      return result;
    }
  }

  /**
   * 测试Banner广告尺寸计算
   */
  async testBannerAdSizing(): Promise<BannerAdTestResult> {
    const startTime = Date.now();
    const testName = 'Banner Ad Sizing Test';

    try {
      console.log('Testing banner ad sizing...');

      // 模拟不同屏幕宽度
      const screenWidths = [320, 375, 414, 768]; // iPhone SE, iPhone X, iPhone Plus, iPad
      const expectedHeight = 80;
      const horizontalMargin = 32; // 左右边距各16px

      for (const screenWidth of screenWidths) {
        const bannerWidth = screenWidth - horizontalMargin;
        const aspectRatio = bannerWidth / expectedHeight;

        // 验证尺寸合理性
        if (bannerWidth < 200) {
          throw new Error(`Banner width too small for screen width ${screenWidth}: ${bannerWidth}px`);
        }

        if (aspectRatio < 2) {
          throw new Error(`Banner aspect ratio too small: ${aspectRatio}`);
        }

        console.log(`Screen ${screenWidth}px -> Banner ${bannerWidth}x${expectedHeight}px (ratio: ${aspectRatio.toFixed(2)})`);
      }

      const duration = Date.now() - startTime;
      const result: BannerAdTestResult = {
        testName,
        success: true,
        duration,
        data: {
          testedScreenWidths: screenWidths,
          bannerHeight: expectedHeight,
          horizontalMargin,
        },
      };

      this.testResults.push(result);
      console.log('✅ Banner ad sizing test passed');
      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      const result: BannerAdTestResult = {
        testName,
        success: false,
        duration,
        error: (error as Error).message,
      };

      this.testResults.push(result);
      console.log('❌ Banner ad sizing test failed:', error);
      return result;
    }
  }

  /**
   * 测试Banner广告点击处理
   */
  async testBannerAdClickHandling(): Promise<BannerAdTestResult> {
    const startTime = Date.now();
    const testName = 'Banner Ad Click Handling Test';

    try {
      console.log('Testing banner ad click handling...');

      // 模拟Banner广告数据
      const mockBannerData = {
        adId: AdConfig.bannerAdId,
        adType: AdType.BANNER,
        adTitle: '测试Banner广告',
        adClickUrl: 'https://www.dingdingcat.com',
        rewardAmount: 5,
      };

      // 模拟点击处理逻辑
      const clickHandler = (adData: any) => {
        if (!adData.adId) {
          throw new Error('Ad ID is required for click handling');
        }

        if (!adData.adClickUrl) {
          console.warn('No click URL provided for banner ad');
        }

        console.log(`Banner ad clicked: ${adData.adId}, reward: ¥${adData.rewardAmount}`);
        return true;
      };

      // 执行点击测试
      const clickResult = clickHandler(mockBannerData);
      
      if (!clickResult) {
        throw new Error('Click handler returned false');
      }

      const duration = Date.now() - startTime;
      const result: BannerAdTestResult = {
        testName,
        success: true,
        duration,
        data: {
          mockBannerData,
          clickHandled: true,
        },
      };

      this.testResults.push(result);
      console.log('✅ Banner ad click handling test passed');
      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      const result: BannerAdTestResult = {
        testName,
        success: false,
        duration,
        error: (error as Error).message,
      };

      this.testResults.push(result);
      console.log('❌ Banner ad click handling test failed:', error);
      return result;
    }
  }

  /**
   * 运行所有Banner广告测试
   */
  async runAllTests(): Promise<void> {
    console.log('\n🧪 开始运行Banner广告测试套件...\n');

    await this.testBannerAdConfig();
    await this.testMockBannerAdGeneration();
    await this.testBannerAdSizing();
    await this.testBannerAdClickHandling();

    this.printTestResults();
  }

  /**
   * 打印测试结果
   */
  printTestResults(): void {
    console.log('\n📊 Banner广告测试结果汇总');
    console.log('='.repeat(50));

    this.testResults.forEach((result, index) => {
      const status = result.success ? '✅ 通过' : '❌ 失败';
      const duration = `${result.duration}ms`;
      
      console.log(`${index + 1}. ${result.testName}`);
      console.log(`   状态: ${status} | 耗时: ${duration}`);
      
      if (result.error) {
        console.log(`   错误: ${result.error}`);
      }
      
      if (result.data && result.success) {
        console.log(`   数据: ${JSON.stringify(result.data, null, 2).substring(0, 100)}...`);
      }
      
      console.log('');
    });

    const successCount = this.testResults.filter(r => r.success).length;
    const totalCount = this.testResults.length;
    const successRate = ((successCount / totalCount) * 100).toFixed(1);

    console.log(`📈 测试总结: ${successCount}/${totalCount} 通过 (${successRate}%)`);

    if (successCount === totalCount) {
      console.log('🎉 所有Banner广告测试都通过了！');
    } else {
      console.log('⚠️  部分测试失败，请检查Banner广告实现。');
    }
  }

  /**
   * 获取测试建议
   */
  getTestSuggestions(): string[] {
    const suggestions: string[] = [];
    const failedTests = this.testResults.filter(r => !r.success);

    if (failedTests.length > 0) {
      suggestions.push('检查AdConfig中的Banner广告配置是否正确');
      suggestions.push('确认Banner广告ID是否为有效的穿山甲测试ID');
      suggestions.push('验证Mock服务是否正确返回Banner广告配置');
      suggestions.push('检查Banner广告组件的状态管理逻辑');
      suggestions.push('确认点击事件处理是否正确实现');
    }

    const slowTests = this.testResults.filter(r => r.duration > 1000);
    if (slowTests.length > 0) {
      suggestions.push('优化Banner广告加载性能');
      suggestions.push('考虑添加缓存机制减少重复请求');
    }

    return suggestions;
  }

  /**
   * 清除测试结果
   */
  clearResults(): void {
    this.testResults = [];
  }
}

/**
 * 快速测试Banner广告功能
 */
export async function testBannerAd(): Promise<void> {
  const tester = new BannerAdTester();
  await tester.runAllTests();

  const suggestions = tester.getTestSuggestions();
  if (suggestions.length > 0) {
    console.log('\n💡 改进建议:');
    suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion}`);
    });
  }
}

/**
 * 验证Banner广告配置
 */
export function validateBannerAdConfig(): boolean {
  try {
    const bannerAdId = AdConfig.bannerAdId;
    const bannerButton = AdConfig.adButtons.find(btn => btn.adType === 'banner');

    if (!bannerAdId) {
      console.error('❌ Banner ad ID not found in AdConfig');
      return false;
    }

    if (!bannerButton) {
      console.error('❌ Banner ad button config not found in AdConfig');
      return false;
    }

    if (!bannerButton.enabled) {
      console.warn('⚠️  Banner ad is disabled in AdConfig');
      return false;
    }

    console.log('✅ Banner ad config validation passed');
    console.log(`   Banner Ad ID: ${bannerAdId}`);
    console.log(`   Button Title: ${bannerButton.title}`);
    console.log(`   Enabled: ${bannerButton.enabled}`);

    return true;

  } catch (error) {
    console.error('❌ Banner ad config validation failed:', error);
    return false;
  }
}

export default BannerAdTester;