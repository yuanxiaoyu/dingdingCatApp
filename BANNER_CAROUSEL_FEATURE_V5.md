# Banner 广告轮播功能 v5.0
# Banner Ad Carousel Feature v5.0

## 🎯 功能概述

基于之前的空白检测和自动回退机制，现在添加了完整的Banner广告轮播功能，让广告内容能够自动切换，提供更丰富的用户体验。

## 🔄 轮播机制

### 1. 自动轮播
- **默认启用**: 广告加载成功后自动开始轮播
- **轮播间隔**: 默认30秒，可自定义
- **智能切换**: 真实广告 ↔ 多样化模拟广告

### 2. 轮播内容
- **真实广告**: 尝试加载穿山甲SDK的真实广告
- **模拟广告**: 4种不同颜色和内容的模拟广告
- **轮播指示器**: 显示当前广告位置（如：广告 2/3）

### 3. 轮播样式
```
🎯 穿山甲 Banner 广告 (蓝色)
🌟 精选推荐广告 (绿色)  
🔥 热门广告内容 (橙色)
💎 优质广告展示 (紫色)
```

## 🛠️ 技术实现

### 1. 核心属性
```java
// 轮播控制
private boolean autoRefresh = true;           // 是否自动刷新
private int refreshInterval = 30000;          // 刷新间隔(毫秒)
private int currentAdIndex = 0;               // 当前广告索引
private String[] adPool = {...};              // 广告池
private Runnable refreshRunnable;             // 刷新任务
```

### 2. 关键方法
```java
// 开始自动刷新
private void startAutoRefresh()

// 停止自动刷新  
private void stopAutoRefresh()

// 加载下一个广告
private void loadNextAd()

// 显示轮播模拟广告
private void showRotatingMockAd()

// 创建不同样式的模拟广告
private View createRotatingMockAdView(int index)
```

### 3. React Native 属性
```javascript
<BannerAdView
  adId="945493677"
  autoRefresh={true}           // 是否自动轮播
  refreshInterval={30000}      // 轮播间隔(毫秒)
  onAdLoaded={...}
  onAdRefreshed={...}          // 轮播事件
/>
```

## 📊 工作流程

### 完整的轮播流程：
1. **初始加载**: 加载指定广告位的真实广告
2. **内容检测**: 检查广告内容是否有效
3. **自动回退**: 如果真实广告为空，显示模拟广告
4. **启动轮播**: 广告显示成功后启动自动轮播
5. **定时切换**: 每30秒自动切换到下一个广告
6. **循环播放**: 在真实广告和多种模拟广告间循环

### 轮播切换逻辑：
```
广告1 (真实广告) → 广告2 (模拟广告1) → 广告3 (模拟广告2) → 广告4 (模拟广告3) → 循环
```

## 🎨 视觉效果

### 1. 不同颜色主题
- **蓝色主题** (#1890FF): 🎯 穿山甲 Banner 广告
- **绿色主题** (#52C41A): 🌟 精选推荐广告  
- **橙色主题** (#FA8C16): 🔥 热门广告内容
- **紫色主题** (#722ED1): 💎 优质广告展示

### 2. 轮播指示器
- 显示当前位置：`广告 2/3`
- 半透明白色文字
- 位于广告底部

### 3. 平滑过渡
- 自动清理旧视图
- 添加新视图
- 强制布局刷新

## 📱 用户体验

### 1. 无缝轮播
- 不会出现空白间隙
- 平滑的内容切换
- 保持固定的广告区域尺寸

### 2. 智能回退
- 真实广告失败时自动显示模拟广告
- 模拟广告也参与轮播循环
- 确保始终有内容显示

### 3. 可控性
- 可以禁用自动轮播
- 可以自定义轮播间隔
- 支持手动控制

## 🔧 配置选项

### 1. 基础配置
```javascript
// 启用轮播，30秒间隔
<BannerAdView 
  autoRefresh={true} 
  refreshInterval={30000} 
/>

// 禁用轮播
<BannerAdView 
  autoRefresh={false} 
/>

// 快速轮播，10秒间隔
<BannerAdView 
  autoRefresh={true} 
  refreshInterval={10000} 
/>
```

### 2. 事件监听
```javascript
<BannerAdView
  onAdLoaded={(event) => {
    console.log('广告加载成功:', event.nativeEvent.message);
  }}
  onAdRefreshed={(event) => {
    console.log('广告轮播:', event.nativeEvent.message);
  }}
/>
```

## 📊 日志监控

### 轮播相关日志：
```
D/BannerAdView: Auto refresh started with interval: 30000ms
D/BannerAdView: Auto refresh triggered, loading next ad
D/BannerAdView: Loading next ad with index: 1, adId: 945493677
D/BannerAdView: Showing rotating mock ad, index: 1
D/BannerAdView: Rotating mock ad view created for index: 1
D/BannerAdView: Rotating mock ad displayed successfully
```

### 事件日志：
```
D/BannerAdView: Sending event: onAdRefreshed with message: Banner ad rotated to index: 1
```

## 🧪 测试步骤

### 1. 基础轮播测试
1. 启动应用，点击"Banner广告"
2. 观察初始广告显示
3. 等待30秒，观察是否自动切换
4. 继续观察多次切换，确认循环正常

### 2. 不同样式验证
- 蓝色广告 → 绿色广告 → 橙色广告 → 紫色广告 → 循环
- 每个广告都有不同的图标和文案
- 底部显示轮播指示器

### 3. 日志验证
```bash
adb logcat | grep -E "(Auto refresh|Rotating mock|onAdRefreshed)"
```

## 🎯 预期效果

### 成功场景：
1. **初始显示**: 真实广告或模拟广告
2. **自动轮播**: 30秒后自动切换到下一个广告
3. **多样化内容**: 4种不同样式的广告循环显示
4. **无缝体验**: 切换过程无空白或闪烁
5. **指示器显示**: 清楚显示当前广告位置

### 日志确认：
- `Auto refresh started` - 轮播启动
- `Auto refresh triggered` - 轮播触发
- `Rotating mock ad displayed` - 轮播广告显示
- `onAdRefreshed` - 轮播事件发送

---

**功能版本**: v5.0 (广告轮播功能版)  
**开发时间**: 2025年1月4日  
**核心特性**: 自动轮播 + 多样化内容 + 智能回退 + 可控配置  
**用户体验**: 丰富的广告内容展示，无空白，平滑切换