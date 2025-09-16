# Banner 广告官方规范修复 v6.0
# Banner Ad Official Guidelines Fix v6.0

## 🔍 问题分析

根据用户反馈"广告只展示了一条，几秒后就白屏了"，这是因为之前的轮播实现不符合穿山甲官方SDK规范，导致广告生命周期管理出现问题。

### 问题根源：
1. **不正确的轮播方式**: 之前尝试在同一个广告实例上切换不同内容
2. **生命周期管理错误**: 没有正确销毁和重新创建广告实例
3. **违反官方规范**: 穿山甲SDK要求每次刷新都要重新加载广告

## 🔧 修复方案

参考穿山甲官方文档 (https://www.csjdeveloper.com/en/supportcenter/26233)，重新实现了符合官方规范的Banner广告刷新机制。

### 1. 移除不规范的轮播逻辑
```java
// 移除了复杂的多广告位轮播
// 移除了模拟广告轮播切换
// 简化为标准的广告刷新机制
```

### 2. 实现标准的广告刷新
```java
private void refreshBannerAd() {
    // 1. 先销毁当前广告（重要：避免内存泄漏）
    if (bannerAdManager != null) {
        bannerAdManager.destroyBannerAd();
    }
    
    // 2. 清理视图
    removeAllViews();
    isLoaded = false;
    
    // 3. 重新创建BannerAdManager
    bannerAdManager = new BannerAdManager(activity);
    
    // 4. 重新加载广告
    loadRealBannerAd();
}
```

### 3. 正确的生命周期管理
```java
// 自动刷新逻辑
private void startAutoRefresh() {
    refreshRunnable = new Runnable() {
        @Override
        public void run() {
            if (autoRefresh && isLoaded && !isLoading) {
                // 按照穿山甲官方建议：销毁当前广告，重新加载
                refreshBannerAd();
            }
        }
    };
    
    postDelayed(refreshRunnable, refreshInterval);
}
```

## 📊 新的工作流程

### 标准的Banner广告刷新流程：
1. **初始加载**: 加载第一个Banner广告
2. **正常显示**: 显示30秒
3. **销毁当前**: 完全销毁当前广告实例
4. **重新创建**: 创建新的BannerAdManager
5. **重新加载**: 加载新的Banner广告
6. **循环刷新**: 重复步骤3-5

### 关键改进点：
- ✅ **完全销毁**: 每次刷新前完全销毁旧广告
- ✅ **重新创建**: 重新创建BannerAdManager实例
- ✅ **标准加载**: 使用标准的SDK加载流程
- ✅ **生命周期**: 正确管理广告生命周期

## 🛠️ 技术细节

### 1. 移除的功能
- ❌ 多广告位轮播
- ❌ 模拟广告轮播
- ❌ 复杂的广告池管理
- ❌ 轮播指示器

### 2. 保留的功能
- ✅ 自动刷新控制 (`autoRefresh`)
- ✅ 刷新间隔设置 (`refreshInterval`)
- ✅ 空白检测和回退机制
- ✅ 详细的调试日志

### 3. 新增的功能
- ✅ 标准的广告销毁和重建
- ✅ 符合官方规范的刷新机制
- ✅ 更好的内存管理

## 📱 用户体验

### 预期效果：
1. **稳定显示**: 不再出现几秒后白屏的问题
2. **正常刷新**: 每30秒刷新一次新的Banner广告
3. **无内存泄漏**: 正确的生命周期管理
4. **智能回退**: 真实广告失败时显示模拟广告

### 刷新过程：
- 用户看到第一个Banner广告
- 30秒后，广告区域短暂显示加载状态
- 新的Banner广告加载并显示
- 循环继续

## 🔧 配置选项

### React Native 属性（保持不变）：
```javascript
<BannerAdView
  adId="945493677"
  autoRefresh={true}           // 是否自动刷新
  refreshInterval={30000}      // 刷新间隔(毫秒)
  onAdLoaded={...}
  onAdRefreshed={...}          // 刷新成功事件
/>
```

### 控制选项：
- `autoRefresh={false}`: 禁用自动刷新
- `refreshInterval={60000}`: 设置60秒刷新间隔
- `refreshInterval={10000}`: 设置10秒快速刷新

## 📊 日志监控

### 关键日志：
```
D/BannerAdView: Auto refresh triggered, reloading banner ad
D/BannerAdView: Refreshing banner ad
D/BannerAdManager: Destroying banner ad
D/BannerAdView: Creating new BannerAdManager
D/BannerAdView: Calling bannerAdManager.loadBannerAd with ID: 945493677
D/BannerAdManager: Banner ad load success
D/BannerAdView: Real banner ad view added successfully
D/BannerAdView: Banner ad content verified successfully
D/BannerAdView: Sending event: onAdRefreshed
```

### 错误处理日志：
```
E/BannerAdView: Exception during banner ad refresh
D/BannerAdView: Showing mock banner ad as fallback: Refresh failed
```

## 🧪 测试步骤

### 1. 基础功能测试
1. 启动应用，点击"Banner广告"
2. 观察初始广告显示
3. 等待30秒，观察是否正常刷新
4. 继续观察多次刷新，确认不会白屏

### 2. 长时间稳定性测试
- 让应用运行5-10分钟
- 观察是否持续正常刷新
- 确认没有内存泄漏或崩溃

### 3. 日志验证
```bash
adb logcat | grep -E "(Refreshing banner ad|onAdRefreshed|Auto refresh triggered)"
```

## 🎯 预期结果

### 修复后的效果：
- ✅ **不再白屏**: 解决几秒后白屏的问题
- ✅ **稳定刷新**: 每30秒正常刷新新广告
- ✅ **内存安全**: 正确的生命周期管理
- ✅ **符合规范**: 按照穿山甲官方建议实现

### 可能的显示内容：
- **真实广告**: 穿山甲SDK返回的真实Banner广告
- **模拟广告**: 网络问题时的备选模拟广告
- **加载状态**: 刷新过程中的短暂加载提示

---

**修复版本**: v6.0 (官方规范修复版)  
**修复时间**: 2025年1月4日  
**参考文档**: https://www.csjdeveloper.com/en/supportcenter/26233  
**关键改进**: 标准广告刷新 + 正确生命周期管理 + 内存安全  
**预期结果**: 稳定的Banner广告显示，不再出现白屏问题