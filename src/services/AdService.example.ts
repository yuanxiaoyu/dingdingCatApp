/**
 * AdService Usage Examples
 * 
 * This file demonstrates how to use the AdService for various ad operations
 * including requesting ads, reporting events, and retrieving user data.
 */

import adService from './AdService';
import { AdType } from '../types';

/**
 * Example: Complete ad watching flow for reward video
 */
export async function exampleRewardVideoFlow(userId: number): Promise<void> {
  try {
    console.log('=== Reward Video Ad Flow Example ===');

    // Step 1: Request a reward video ad
    console.log('1. Requesting reward video ad...');
    const adResponse = await adService.requestRewardVideoAd(userId, 'pangle_001');
    console.log('Ad received:', {
      adId: adResponse.adId,
      adType: adResponse.adType,
      adTitle: adResponse.adTitle,
      expectedReward: adResponse.expectedReward,
    });

    // Step 2: Report ad show when ad starts displaying
    console.log('2. Reporting ad show...');
    await adService.reportAdShowNow(userId, adResponse.adId, adResponse.adType);
    console.log('Ad show reported successfully');

    // Step 3: Simulate ad playing for 30 seconds
    console.log('3. Simulating ad playback...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate 1 second for demo

    // Step 4: User clicks on the ad (optional)
    console.log('4. User clicked on ad, reporting click...');
    await adService.reportAdClickNow(userId, adResponse.adId, adResponse.adType, 'center');
    console.log('Ad click reported successfully');

    // Step 5: Ad completes successfully
    console.log('5. Ad completed, reporting completion...');
    const rewardAmount = await adService.reportAdCompleteNow(
      userId,
      adResponse.adId,
      adResponse.adType,
      30, // played for 30 seconds
      true, // was clicked
      35 // stayed for 35 seconds total
    );
    console.log('Ad completion reported, reward earned:', rewardAmount);

    console.log('=== Reward Video Flow Completed Successfully ===\n');
  } catch (error) {
    console.error('Error in reward video flow:', error);
  }
}

/**
 * Example: Splash ad flow
 */
export async function exampleSplashAdFlow(userId: number): Promise<void> {
  try {
    console.log('=== Splash Ad Flow Example ===');

    // Request splash ad
    const adResponse = await adService.requestSplashAd(userId);
    console.log('Splash ad received:', adResponse.adId);

    // Report show
    await adService.reportAdShowNow(userId, adResponse.adId, adResponse.adType);

    // Simulate 5 second display
    await new Promise(resolve => setTimeout(resolve, 100));

    // Report completion (splash ads are typically auto-complete)
    const reward = await adService.reportAdCompleteNow(
      userId,
      adResponse.adId,
      adResponse.adType,
      5, // 5 seconds display
      false // not clicked
    );
    console.log('Splash ad completed, reward:', reward);

    console.log('=== Splash Ad Flow Completed ===\n');
  } catch (error) {
    console.error('Error in splash ad flow:', error);
  }
}

/**
 * Example: Banner ad flow
 */
export async function exampleBannerAdFlow(userId: number): Promise<void> {
  try {
    console.log('=== Banner Ad Flow Example ===');

    // Request banner ad
    const adResponse = await adService.requestBannerAd(userId);
    console.log('Banner ad received:', adResponse.adId);

    // Report show when banner is displayed
    await adService.reportAdShowNow(userId, adResponse.adId, adResponse.adType);

    // Simulate banner being displayed for 30 seconds
    await new Promise(resolve => setTimeout(resolve, 100));

    // User might click on banner
    await adService.reportAdClickNow(userId, adResponse.adId, adResponse.adType);

    // Report close when banner is removed
    await adService.reportAdCloseNow(
      userId,
      adResponse.adId,
      adResponse.adType,
      30, // displayed for 30 seconds
      30, // stayed for 30 seconds
      'auto_close'
    );

    console.log('=== Banner Ad Flow Completed ===\n');
  } catch (error) {
    console.error('Error in banner ad flow:', error);
  }
}

/**
 * Example: Ad skip scenario
 */
export async function exampleAdSkipFlow(userId: number): Promise<void> {
  try {
    console.log('=== Ad Skip Flow Example ===');

    // Request video ad
    const adResponse = await adService.requestRewardVideoAd(userId);
    console.log('Video ad received:', adResponse.adId);

    // Report show
    await adService.reportAdShowNow(userId, adResponse.adId, adResponse.adType);

    // User skips after 10 seconds
    await adService.reportAdSkipNow(
      userId,
      adResponse.adId,
      adResponse.adType,
      10, // played for 10 seconds before skip
      'user_skip'
    );

    console.log('=== Ad Skip Flow Completed ===\n');
  } catch (error) {
    console.error('Error in ad skip flow:', error);
  }
}

/**
 * Example: Batch reporting for offline sync
 */
export async function exampleBatchReporting(userId: number): Promise<void> {
  try {
    console.log('=== Batch Reporting Example ===');

    // Simulate offline data that needs to be synced
    const offlineData = [
      {
        adType: AdType.REWARD_VIDEO,
        playDuration: 30,
        isClicked: '1',
        isSkipped: '0',
        stayDuration: 35,
      },
      {
        adType: AdType.BANNER,
        playDuration: 15,
        isClicked: '0',
        isSkipped: '1',
        stayDuration: 15,
      },
      {
        adType: AdType.INTERSTITIAL,
        playDuration: 20,
        isClicked: '1',
        isSkipped: '0',
        stayDuration: 25,
      },
    ];

    const processedCount = await adService.batchReportAds({
      userId,
      appKey: 'test_app_key',
      playDataList: offlineData,
    });

    console.log(`Batch reporting completed, processed ${processedCount} records`);
    console.log('=== Batch Reporting Completed ===\n');
  } catch (error) {
    console.error('Error in batch reporting:', error);
  }
}

/**
 * Example: Get user revenue data
 */
export async function exampleGetRevenue(userId: number): Promise<void> {
  try {
    console.log('=== Get Revenue Example ===');

    const revenueData = await adService.getUserRevenue(userId);
    
    console.log('User Revenue Data:');
    console.log(`- Total Revenue: $${revenueData.totalRevenue}`);
    console.log(`- Today Revenue: $${revenueData.todayRevenue}`);
    console.log(`- Total Watch Count: ${revenueData.totalWatchCount}`);
    console.log(`- Today Watch Count: ${revenueData.todayWatchCount}`);
    console.log(`- Remaining Watch Count: ${revenueData.remainingWatchCount}`);
    console.log(`- Average Revenue Per Watch: $${revenueData.avgRevenuePerWatch}`);
    console.log(`- Account Status: ${revenueData.accountStatus}`);
    console.log(`- Withdrawable Amount: $${revenueData.withdrawableAmount}`);

    console.log('=== Get Revenue Completed ===\n');
  } catch (error) {
    console.error('Error getting revenue:', error);
  }
}

/**
 * Example: Get ad history with filtering
 */
export async function exampleGetAdHistory(userId: number): Promise<void> {
  try {
    console.log('=== Get Ad History Example ===');

    // Get first page of video ad history
    const historyResponse = await adService.getAdHistory({
      userId,
      appKey: 'test_app_key',
      pageNum: 1,
      pageSize: 10,
      adType: AdType.REWARD_VIDEO,
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    });

    console.log(`Total history records: ${historyResponse.total}`);
    console.log(`Current page: ${historyResponse.pageNum}/${Math.ceil(historyResponse.total / historyResponse.pageSize)}`);
    
    console.log('Recent ad history:');
    historyResponse.historyList.forEach((item, index) => {
      console.log(`${index + 1}. ${item.adType} - ${item.statusDescription} - $${item.rewardAmount} (${item.playTime})`);
    });

    console.log('=== Get Ad History Completed ===\n');
  } catch (error) {
    console.error('Error getting ad history:', error);
  }
}

/**
 * Example: Error handling
 */
export async function exampleErrorHandling(userId: number): Promise<void> {
  try {
    console.log('=== Error Handling Example ===');

    // This will likely fail due to invalid parameters
    await adService.requestAd({
      userId: 0, // Invalid user ID
      appKey: '', // Invalid app key
      adType: 'invalid' as AdType, // Invalid ad type
    });

  } catch (error) {
    console.log('Caught expected error:', error);
    
    // Handle different types of errors
    if (error && typeof error === 'object' && 'code' in error) {
      const apiError = error as any;
      switch (apiError.code) {
        case 400:
          console.log('Bad request - check parameters');
          break;
        case 401:
          console.log('Unauthorized - check authentication');
          break;
        case 403:
          console.log('Forbidden - risk control or permissions issue');
          break;
        case 429:
          console.log('Too many requests - implement rate limiting');
          break;
        case 500:
          console.log('Server error - retry later');
          break;
        default:
          console.log('Unknown error code:', apiError.code);
      }
    }

    console.log('=== Error Handling Completed ===\n');
  }
}

/**
 * Example: Utility functions
 */
export function exampleUtilityFunctions(): void {
  console.log('=== Utility Functions Example ===');

  // Check supported ad types
  const supportedTypes = adService.getSupportedAdTypes();
  console.log('Supported ad types:', supportedTypes);

  // Check if specific ad type is supported
  console.log('Is "video" supported?', adService.isSupportedAdType('video'));
  console.log('Is "invalid" supported?', adService.isSupportedAdType('invalid'));

  // Create ad request with defaults
  const adRequest = adService.createAdRequest(1001, AdType.REWARD_VIDEO, {
    channelCode: 'pangle_001',
  });
  console.log('Created ad request:', adRequest);

  // Validate ad request
  try {
    adService.validateAdRequest(adRequest);
    console.log('Ad request is valid');
  } catch (error) {
    console.log('Ad request validation failed:', error);
  }

  console.log('=== Utility Functions Completed ===\n');
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  const userId = 1001;

  console.log('🚀 Starting AdService Examples...\n');

  // Run utility examples first (no API calls)
  exampleUtilityFunctions();

  // Run API examples (these would make actual API calls in a real app)
  await exampleRewardVideoFlow(userId);
  await exampleSplashAdFlow(userId);
  await exampleBannerAdFlow(userId);
  await exampleAdSkipFlow(userId);
  await exampleBatchReporting(userId);
  await exampleGetRevenue(userId);
  await exampleGetAdHistory(userId);
  await exampleErrorHandling(userId);

  console.log('✅ All AdService examples completed!');
}

// Export individual examples for selective usage
export {
  exampleRewardVideoFlow,
  exampleSplashAdFlow,
  exampleBannerAdFlow,
  exampleAdSkipFlow,
  exampleBatchReporting,
  exampleGetRevenue,
  exampleGetAdHistory,
  exampleErrorHandling,
  exampleUtilityFunctions,
};