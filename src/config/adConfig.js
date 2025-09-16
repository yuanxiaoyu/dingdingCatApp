/**
 * 穿山甲广告配置文件
 * Pangle Ad Configuration
 */

const AdConfig = {
  // 测试应用 ID (Test App ID) - 使用穿山甲官方测试ID
  appId: '5001121',
  
  // 开屏广告位 ID (Splash Ad ID) - 使用穿山甲官方测试ID
  splashAdId: '102117864',
  
  // 激励视频广告位 ID (Reward Video Ad ID) - 使用穿山甲官方测试ID
  rewardVideoAdId: '945700410',
  
  // 新插屏广告位 ID (Interstitial Ad ID) - 使用穿山甲官方测试ID
  interstitialAdId: '945493675',
  
  // Banner 广告位 ID (Banner Ad ID) - 使用穿山甲官方测试ID
  bannerAdId: '945493677',
  

  
  // 广告类型常量 (Ad Type Constants)
  adTypes: {
    SPLASH: 'splash',
    REWARD_VIDEO: 'reward_video',
    INTERSTITIAL: 'interstitial',
    BANNER: 'banner'
  },
  
  // 广告按钮配置 (Ad Button Configuration)
  adButtons: [
    {
      title: '开屏广告',
      adType: 'splash',
      adId: '102117864',
      enabled: true
    },
    {
      title: '激励视频广告',
      adType: 'reward_video',
      adId: '945700410',
      enabled: true
    },
    {
      title: '新插屏广告',
      adType: 'interstitial',
      adId: '945493675',
      enabled: true
    },
    {
      title: 'Banner 广告',
      adType: 'banner',
      adId: '945493677',
      enabled: true
    }
  ]
};

export default AdConfig;