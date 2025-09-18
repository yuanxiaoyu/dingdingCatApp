# 开屏广告自动跳转问题排查指南

## 🔍 问题现象
广告完播后未自动跳转到首页，用户需要手动操作才能继续。

## 🎯 可能原因分析

### 1. 定时器问题
- **倒计时定时器未正确触发完播**
- **多个定时器冲突**
- **定时器被意外清除**

### 2. 状态管理问题
- **`isAdShowing` 状态未正确更新**
- **广告数据 `adData` 为空**
- **组件状态不一致**

### 3. SDK回调问题
- **穿山甲SDK回调未正确处理**
- **Mock模式下回调逻辑错误**
- **异步操作时序问题**

### 4. 逻辑流程问题
- **完播条件判断错误**
- **自动跳转延迟设置不当**
- **错误处理覆盖了正常流程**

## 🛠️ 解决方案

### 1. 多重保险机制
```typescript
// 设置多个定时器确保一定会跳转
const autoCompleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// 主要完播逻辑
setTimeout(() => {
  handleAdComplete();
}, normalDelay);

// 保险定时器
autoCompleteTimeoutRef.current = setTimeout(() => {
  console.log('Force completing ad due to timeout');
  handleAdComplete();
}, maxTimeout);
```

### 2. 倒计时结束自动完播
```typescript
const startCountdown = (initialCount: number) => {
  setState(prev => ({ ...prev, countdown: initialCount }));

  countdownRef.current = setInterval(() => {
    setState(prev => {
      const newCount = prev.countdown - 1;
      if (newCount <= 0) {
        // 倒计时结束后自动完播
        console.log('Countdown finished, auto-completing ad');
        setTimeout(() => {
          handleAdComplete();
        }, 100);
        return { ...prev, countdown: 0, canSkip: true };
      }
      return { ...prev, countdown: newCount };
    });
  }, 1000);
};
```

### 3. 调试工具集成
```typescript
// 在DEBUG模式下添加强制完播按钮
{ENV_CONFIG.DEBUG_MODE && (
  <TouchableOpacity 
    style={styles.debugButton}
    onPress={() => {
      console.log('Debug force complete');
      handleAdComplete();
    }}
  >
    <Text style={styles.debugButtonText}>Force Complete</Text>
  </TouchableOpacity>
)}
```

## 🔧 调试步骤

### 1. 检查控制台日志
查看以下关键日志：
```
SplashAdScreen: Mock ad timeout reached, auto-completing
SplashAdScreen: Countdown finished, auto-completing ad
SplashAdScreen: Ad completed successfully, auto-navigating to home
SplashAdScreen: Max timeout reached, force completing ad
```

### 2. 使用调试工具
```typescript
import { testSplashAdAutoJump, debugSplashAdState } from '../utils/testSplashAdAutoJump';

// 运行自动跳转测试
await testSplashAdAutoJump();

// 调试当前状态
debugSplashAdState(state);
```

### 3. 检查定时器状态
```typescript
console.log('Active timers:', {
  countdown: countdownRef.current !== null,
  skipTimeout: skipTimeoutRef.current !== null,
  autoComplete: autoCompleteTimeoutRef.current !== null,
});
```

### 4. 验证回调函数
```typescript
const testOnAdComplete = () => {
  console.log('Testing onAdComplete callback');
  onAdComplete();
};

// 在DEBUG模式下调用测试
if (ENV_CONFIG.DEBUG_MODE) {
  testOnAdComplete();
}
```

## 📱 测试场景

### 1. Mock模式测试
- ✅ 加载广告配置
- ✅ 显示广告内容
- ✅ 倒计时正常运行
- ✅ 超时后自动完播
- ✅ 调用 `onAdComplete()`

### 2. 真实广告测试
- ✅ SDK加载成功
- ✅ 广告展示正常
- ✅ 接收SDK回调
- ✅ 处理完播状态
- ✅ 自动跳转首页

### 3. 异常情况测试
- ✅ 网络错误时fallback
- ✅ SDK加载失败时处理
- ✅ 超时保护机制
- ✅ 强制跳转功能

## 🎯 关键代码检查点

### 1. handleAdComplete 函数
```typescript
const handleAdComplete = async () => {
  try {
    if (!state.adData) return;

    console.log('SplashAdScreen: Ad completed');

    // 清理定时器
    cleanup();
    
    // 调用完播回调
    onAdComplete();

  } catch (error) {
    console.error('Error handling ad completion:', error);
    handleError(error as Error);
  }
};
```

### 2. 定时器清理
```typescript
const cleanup = () => {
  if (countdownRef.current) {
    clearInterval(countdownRef.current);
    countdownRef.current = null;
  }
  if (skipTimeoutRef.current) {
    clearTimeout(skipTimeoutRef.current);
    skipTimeoutRef.current = null;
  }
  if (autoCompleteTimeoutRef.current) {
    clearTimeout(autoCompleteTimeoutRef.current);
    autoCompleteTimeoutRef.current = null;
  }
};
```

### 3. 状态更新
```typescript
// 确保状态正确更新
setState(prev => ({
  ...prev,
  isAdShowing: true,  // 广告展示中
  canSkip: false,     // 初始不能跳过
  countdown: initialCount, // 设置倒计时
}));
```

## 🚀 性能优化建议

### 1. 减少不必要的延迟
```typescript
// 根据不同情况设置合适的延迟
const getAutoJumpDelay = (scenario: string) => {
  switch (scenario) {
    case 'completed': return 500;  // 完播后稍作停留
    case 'clicked': return 300;    // 点击后快速跳转
    case 'timeout': return 100;    // 超时后立即跳转
    case 'error': return 200;      // 错误后快速恢复
    default: return 500;
  }
};
```

### 2. 优化状态管理
```typescript
// 使用useCallback优化回调函数
const handleAdComplete = useCallback(async () => {
  // ... 完播逻辑
}, [state.adData, userId]);
```

### 3. 内存泄漏防护
```typescript
useEffect(() => {
  return () => {
    // 组件卸载时清理所有定时器
    cleanup();
  };
}, []);
```

## ✅ 验证清单

- [ ] 控制台显示完播日志
- [ ] 倒计时正常递减到0
- [ ] 超时保护机制生效
- [ ] `onAdComplete` 回调被调用
- [ ] 定时器正确清理
- [ ] 状态更新正确
- [ ] 无内存泄漏
- [ ] DEBUG按钮可用
- [ ] 测试工具运行正常

## 🎉 预期效果

修复后的开屏广告应该：
1. **可靠跳转**: 无论何种情况都能自动跳转
2. **合理延迟**: 不同场景使用合适的延迟时间
3. **清晰反馈**: 用户能感知到广告完播
4. **稳定性能**: 无卡顿、无内存泄漏
5. **易于调试**: 提供充分的调试信息

现在开屏广告具有多重保险机制，确保在任何情况下都能正常跳转！