# Banner 广告调试指南
# Banner Ad Debug Guide

## 当前状态 (Current Status)

Banner广告依然显示"Banner 广告加载中..."的状态，我已经添加了详细的调试日志来诊断问题。

## 调试步骤 (Debug Steps)

### 1. 重新启动应用并查看日志

请按照以下步骤操作：

1. **重新启动应用**
2. **点击"Banner广告"按钮**
3. **查看控制台日志**，寻找以下关键日志：

#### React Native 层日志 (JavaScript Console)
```
🚀 Loading banner ad with ID: 945493677
🔄 Setting banner ad state - isLoading: true, isVisible: true
📱 Calling bannerAdRef.current.loadAd()
```

如果成功，应该看到：
```
🎉 Banner ad loaded successfully: [message]
🔄 Updating banner ad state - setting isLoading to false
```

如果失败，应该看到：
```
❌ Banner ad load failed: [error message]
🔄 Updating banner ad state - setting isLoading to false due to error
```

#### Android 原生层日志 (Logcat)
使用 `adb logcat | grep BannerAdView` 查看原生日志：

```bash
adb logcat | grep BannerAdView
```

应该看到类似的日志：
```
D/BannerAdView: BannerAdView created
D/BannerAdView: Ad ID set to: 945493677
D/BannerAdView: Loading banner ad with ID: 945493677
D/BannerAdView: loadAndShowBannerAd called
D/BannerAdView: Starting banner ad loading simulation
D/BannerAdView: Creating and showing mock banner ad
D/BannerAdView: Mock banner ad view added, sending onAdLoaded event
D/BannerAdView: Sending event: onAdLoaded with message: Banner ad loaded and shown successfully (mock)
D/BannerAdView: Event sent successfully: onAdLoaded
```

### 2. 可能的问题和解决方案

#### 问题 A: React Native 层没有收到原生事件
**症状**: 原生日志显示事件已发送，但React Native层没有收到
**解决方案**: 检查事件名称是否匹配

#### 问题 B: BannerAdView 组件没有被正确创建
**症状**: 没有看到 "BannerAdView created" 日志
**解决方案**: 检查组件注册和导入

#### 问题 C: loadAd 方法没有被调用
**症状**: 没有看到 "Loading banner ad with ID" 日志
**解决方案**: 检查 ref 引用和命令分发

### 3. 手动测试步骤

如果自动调试没有解决问题，请尝试以下手动测试：

#### 测试 1: 检查组件是否正确渲染
在 HomeScreen.tsx 中临时添加一个测试按钮：

```tsx
<TouchableOpacity onPress={() => {
  console.log('Test button pressed');
  console.log('bannerAdRef.current:', bannerAdRef.current);
  if (bannerAdRef.current) {
    console.log('Calling loadAd manually');
    bannerAdRef.current.loadAd();
  }
}}>
  <Text>Test Banner Ad</Text>
</TouchableOpacity>
```

#### 测试 2: 检查事件监听器
确保 BannerAdView 组件的事件监听器正确设置：

```tsx
<BannerAdView
  ref={bannerAdRef}
  adId={AdConfig.bannerAdId}
  style={styles.bannerAdView}
  onAdLoaded={(event) => {
    console.log('Raw onAdLoaded event:', event);
    handleBannerAdLoaded(event.nativeEvent.message);
  }}
  onAdLoadFailed={(event) => {
    console.log('Raw onAdLoadFailed event:', event);
    handleBannerAdLoadFailed(event.nativeEvent.message);
  }}
  // ... 其他事件
/>
```

## 当前修改 (Current Changes)

### 1. 添加了详细的调试日志
- React Native 层：添加了 🚀🔄🎉❌ 等表情符号标记的日志
- Android 原生层：添加了详细的方法调用和事件发送日志

### 2. 简化了 Banner 广告加载逻辑
- 暂时使用模拟广告视图进行测试
- 2秒后自动触发成功事件
- 确保事件能正确发送到 React Native 层

### 3. 改进了错误处理
- 更详细的错误信息
- 更好的异常捕获

## 下一步 (Next Steps)

1. **运行调试版本**：重新启动应用并查看日志输出
2. **分析日志**：根据日志输出确定问题所在
3. **逐步修复**：根据发现的问题进行针对性修复

## 预期结果 (Expected Results)

修复后，Banner广告应该：
1. 点击按钮后显示加载状态（2秒）
2. 2秒后显示蓝色的模拟广告内容
3. 控制台显示成功日志
4. "Banner 广告加载中..." 文本消失

---

**调试版本**: v1.0.2  
**创建时间**: 2025年1月4日  
**状态**: 等待用户测试反馈