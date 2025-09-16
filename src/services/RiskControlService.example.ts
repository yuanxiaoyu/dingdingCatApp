/**
 * RiskControlService Usage Examples
 * 
 * This file demonstrates how to use the RiskControlService in a real application.
 */

import riskControlService, { RiskViolationType, RiskViolationError } from './RiskControlService';

// Example 1: Initialize the service
export async function initializeRiskControl() {
  try {
    await riskControlService.initialize();
    console.log('Risk control service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize risk control service:', error);
  }
}

// Example 2: Get risk configuration
export async function getRiskConfiguration() {
  try {
    const config = await riskControlService.getRiskConfig();
    console.log('Risk configuration:', config);
    return config;
  } catch (error) {
    console.error('Failed to get risk configuration:', error);
    throw error;
  }
}

// Example 3: Detect device environment
export async function checkDeviceEnvironment() {
  try {
    const environment = await riskControlService.detectDeviceEnvironment();
    console.log('Device environment:', {
      isRooted: environment.isRooted,
      isEmulator: environment.isEmulator,
      fingerprint: environment.deviceFingerprint,
    });
    
    if (environment.isRooted) {
      console.warn('Device is rooted - this may trigger risk controls');
    }
    
    if (environment.isEmulator) {
      console.warn('Device is an emulator - this may trigger risk controls');
    }
    
    return environment;
  } catch (error) {
    console.error('Failed to detect device environment:', error);
    throw error;
  }
}

// Example 4: Check ad interval
export async function checkAdIntervalExample(adType: string) {
  try {
    const canShowAd = await riskControlService.checkAdInterval(adType);
    console.log(`Can show ${adType} ad:`, canShowAd);
    return canShowAd;
  } catch (error) {
    if (error instanceof RiskViolationError) {
      console.warn('Ad interval violation:', error.message);
      // Show user-friendly message
      const userMessage = riskControlService.getRiskViolationMessage(error);
      console.log('User message:', userMessage);
    } else {
      console.error('Unexpected error checking ad interval:', error);
    }
    return false;
  }
}

// Example 5: Validate revenue limit
export function validateRevenueExample(amount: number) {
  try {
    const isValid = riskControlService.validateRevenueLimit(amount);
    console.log(`Revenue amount ${amount} is valid:`, isValid);
    return isValid;
  } catch (error) {
    if (error instanceof RiskViolationError) {
      console.warn('Revenue limit violation:', error.message);
      const userMessage = riskControlService.getRiskViolationMessage(error);
      console.log('User message:', userMessage);
    } else {
      console.error('Unexpected error validating revenue:', error);
    }
    return false;
  }
}

// Example 6: Check daily limits
export async function checkDailyLimitsExample(userId: number, adType: string) {
  try {
    const canProceed = await riskControlService.checkDailyLimits(userId, adType);
    console.log(`User ${userId} can watch ${adType} ad:`, canProceed);
    return canProceed;
  } catch (error) {
    if (error instanceof RiskViolationError) {
      console.warn('Daily limit violation:', error.message);
      const userMessage = riskControlService.getRiskViolationMessage(error);
      console.log('User message:', userMessage);
    } else {
      console.error('Unexpected error checking daily limits:', error);
    }
    return false;
  }
}

// Example 7: Update daily statistics
export async function updateStatsExample(adType: string, revenue?: number) {
  try {
    await riskControlService.updateDailyStats(adType, revenue);
    console.log(`Updated daily stats for ${adType} ad with revenue:`, revenue);
  } catch (error) {
    console.error('Failed to update daily stats:', error);
  }
}

// Example 8: Comprehensive risk check
export async function performComprehensiveRiskCheck(params: {
  userId: number;
  adType?: string;
  expectedRevenue?: number;
  ipAddress?: string;
}) {
  try {
    const passed = await riskControlService.performRiskCheck(params);
    console.log('Risk check passed:', passed);
    return passed;
  } catch (error) {
    if (error instanceof RiskViolationError) {
      console.warn('Risk check failed:', error.message);
      const userMessage = riskControlService.getRiskViolationMessage(error);
      console.log('User message:', userMessage);
      
      // Handle different violation types
      switch (error.violationType) {
        case RiskViolationType.ROOT_DETECTED:
          // Redirect to security warning page
          break;
        case RiskViolationType.EMULATOR_DETECTED:
          // Show emulator warning
          break;
        case RiskViolationType.AD_INTERVAL_VIOLATION:
          // Show countdown timer
          break;
        case RiskViolationType.DAILY_AD_VIEW_LIMIT:
        case RiskViolationType.DAILY_REWARD_VIDEO_LIMIT:
          // Show daily limit reached message
          break;
        case RiskViolationType.SINGLE_REVENUE_LIMIT:
          // Show revenue limit message
          break;
        default:
          // Show generic error message
          break;
      }
    } else {
      console.error('Unexpected error in risk check:', error);
    }
    return false;
  }
}

// Example 9: Complete ad watching flow with risk controls
export async function watchAdWithRiskControls(params: {
  userId: number;
  adType: string;
  expectedRevenue: number;
  ipAddress?: string;
}) {
  const { userId, adType, expectedRevenue, ipAddress } = params;
  
  try {
    console.log(`Starting ad watch flow for user ${userId}, ad type: ${adType}`);
    
    // Step 1: Perform comprehensive risk check
    const riskCheckPassed = await performComprehensiveRiskCheck({
      userId,
      adType,
      expectedRevenue,
      ipAddress,
    });
    
    if (!riskCheckPassed) {
      console.log('Risk check failed, cannot show ad');
      return false;
    }
    
    // Step 2: Show the ad (this would be handled by ad SDK)
    console.log('Risk check passed, showing ad...');
    
    // Step 3: After ad completion, update statistics
    await updateStatsExample(adType, expectedRevenue);
    
    console.log('Ad watch flow completed successfully');
    return true;
    
  } catch (error) {
    console.error('Error in ad watch flow:', error);
    return false;
  }
}

// Example 10: Clear cache (for testing or reset)
export async function clearRiskControlCache() {
  try {
    await riskControlService.clearCache();
    console.log('Risk control cache cleared');
  } catch (error) {
    console.error('Failed to clear risk control cache:', error);
  }
}

// Example usage in app initialization
export async function initializeApp() {
  console.log('Initializing app with risk controls...');
  
  // Initialize risk control service
  await initializeRiskControl();
  
  // Check device environment
  await checkDeviceEnvironment();
  
  // Get risk configuration
  await getRiskConfiguration();
  
  console.log('App initialization with risk controls completed');
}

// Example usage before showing an ad
export async function beforeShowingAd(userId: number, adType: string, expectedRevenue: number) {
  console.log(`Preparing to show ${adType} ad for user ${userId}`);
  
  const success = await watchAdWithRiskControls({
    userId,
    adType,
    expectedRevenue,
    ipAddress: '192.168.1.100', // This would be detected automatically
  });
  
  if (success) {
    console.log('Ad can be shown safely');
  } else {
    console.log('Ad cannot be shown due to risk controls');
  }
  
  return success;
}