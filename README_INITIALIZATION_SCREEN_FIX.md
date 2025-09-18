# 初始化屏幕重复文字修复

## 问题描述
在初始化屏幕中出现了重复的文字"加载应用配置..."，同一个状态消息被显示了两次。

## 问题原因
在InitializationScreen组件中，有两个地方显示状态消息：
1. `statusMessage` - 显示当前状态消息
2. `phaseText` - 显示阶段消息

这两个地方都调用了`getPhaseMessage(status.phase)`，导致相同的文字被重复显示。

## 修复方案

### 1. 移除重复的Phase Indicator
删除了重复的阶段指示器部分：
```typescript
// 删除了这部分代码
{/* Phase Indicator */}
<View style={styles.phaseContainer}>
  <Text style={styles.phaseText}>
    {getPhaseMessage(status.phase)}
  </Text>
</View>
```

### 2. 保留主要的状态消息显示
保留了主要的状态消息显示部分：
```typescript
{/* Status Message */}
<View style={styles.statusContainer}>
  {status.phase !== InitPhase.FAILED && (
    <ActivityIndicator
      size="small"
      color={getProgressColor()}
      style={styles.loadingIndicator}
    />
  )}
  <Text style={[
    styles.statusMessage,
    status.phase === InitPhase.FAILED && styles.errorMessage,
  ]}>
    {status.message || getPhaseMessage(status.phase)}
  </Text>
</View>
```

### 3. 修复其他代码问题

#### 移除未使用的变量
```typescript
// 从
const { width, height } = Dimensions.get('window');
const Icon = require('../assets/images/mipmap-mdpi_ic_launcher.png')

// 改为
const { height } = Dimensions.get('window');
```

#### 修复图片导入
```typescript
// 从
<Image style={styles.logoPic} source={Icon} />

// 改为
<Image 
  style={styles.logoPic} 
  source={require('../assets/images/mipmap-mdpi_ic_launcher.png')} 
/>
```

#### 修复错误类型处理
```typescript
// 从
error: error.message || 'Initialization failed',

// 改为
error: (error as Error).message || 'Initialization failed',
```

#### 移除不支持的CSS属性
```typescript
// 从
progressBarFill: {
  height: '100%',
  borderRadius: 3,
  transition: 'width 0.3s ease',  // React Native不支持
},

// 改为
progressBarFill: {
  height: '100%',
  borderRadius: 3,
},
```

## 修复后的效果

### 显示逻辑
现在初始化屏幕只在一个地方显示状态消息：
- **主状态消息**: 显示当前初始化阶段的描述
- **错误消息**: 如果出现错误，显示错误详情
- **进度条**: 显示初始化进度百分比

### 状态消息映射
```typescript
const messages = {
  [InitPhase.STARTING]: '正在启动应用...',
  [InitPhase.AUTH_CHECK]: '检查用户认证状态...',
  [InitPhase.CONFIG_LOADING]: '加载应用配置...',
  [InitPhase.DEVICE_INFO]: '收集设备信息...',
  [InitPhase.RISK_CONTROL]: '初始化风控系统...',
  [InitPhase.OFFLINE_SYNC]: '同步离线数据...',
  [InitPhase.COMPLETED]: '初始化完成',
  [InitPhase.FAILED]: '初始化失败',
};
```

### 视觉效果
- ✅ **无重复文字** - 每个阶段只显示一条消息
- ✅ **清晰的进度指示** - 进度条和百分比显示
- ✅ **加载动画** - 旋转的ActivityIndicator
- ✅ **错误处理** - 错误时显示红色消息和详情

## 用户体验改进

1. **信息清晰** - 不再有重复的状态消息
2. **视觉简洁** - 界面更加整洁
3. **状态明确** - 用户能清楚地知道当前的初始化阶段
4. **错误友好** - 出现问题时有明确的错误提示

现在初始化屏幕的文字显示正常，不会再出现重复的状态消息。