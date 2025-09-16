# AdButton 组件文档

## 概述

`AdButton` 是一个可复用的广告按钮组件，专为穿山甲广告 SDK 集成而设计。该组件支持不同广告类型的配置、加载状态显示和点击处理。

## 功能特性

- ✅ 支持多种广告类型配置
- ✅ 加载状态显示（带加载指示器）
- ✅ 禁用状态支持
- ✅ 自定义样式支持
- ✅ TypeScript 类型安全
- ✅ 测试覆盖
- ✅ 无障碍访问支持（testID）

## 属性接口

```typescript
interface AdButtonProps {
  /** 按钮显示文本 */
  title: string;
  /** 广告类型标识 */
  adType: string;
  /** 广告位 ID */
  adId: string;
  /** 按钮是否可用 */
  enabled?: boolean;
  /** 是否正在加载 */
  loading?: boolean;
  /** 点击回调函数 */
  onPress: (adType: string, adId: string) => void;
  /** 自定义按钮样式 */
  buttonStyle?: ViewStyle;
  /** 自定义文本样式 */
  textStyle?: TextStyle;
  /** 是否禁用按钮 */
  disabled?: boolean;
}
```

## 基本用法

```tsx
import AdButton from '../components/AdButton';

const MyComponent = () => {
  const handleAdPress = (adType: string, adId: string) => {
    console.log(`Loading ${adType} ad with ID: ${adId}`);
    // 处理广告加载逻辑
  };

  return (
    <AdButton
      title="开屏广告"
      adType="splash"
      adId="892641054"
      onPress={handleAdPress}
    />
  );
};
```

## 高级用法

### 带加载状态

```tsx
const [loading, setLoading] = useState(false);

<AdButton
  title="激励视频广告"
  adType="reward_video"
  adId="945700410"
  loading={loading}
  onPress={handleAdPress}
/>
```

### 自定义样式

```tsx
<AdButton
  title="自定义广告"
  adType="custom"
  adId="123456"
  onPress={handleAdPress}
  buttonStyle={{
    backgroundColor: '#FF6B35',
    borderRadius: 12,
  }}
  textStyle={{
    fontSize: 18,
    fontWeight: 'bold',
  }}
/>
```

### 禁用状态

```tsx
<AdButton
  title="禁用的广告"
  adType="disabled"
  adId="123456"
  disabled={true}
  onPress={handleAdPress}
/>
```

### 配合广告配置使用

```tsx
import AdConfig from '../config/adConfig';

const AdButtonList = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const handleAdPress = async (adType: string, adId: string) => {
    setLoadingStates(prev => ({ ...prev, [adType]: true }));
    
    try {
      // 调用相应的广告服务方法
      await PangleAdService.loadAndShowSplashAd(adId);
    } catch (error) {
      console.error('Ad loading failed:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [adType]: false }));
    }
  };

  return (
    <View>
      {AdConfig.adButtons.map((buttonConfig) => (
        <AdButton
          key={buttonConfig.adType}
          title={buttonConfig.title}
          adType={buttonConfig.adType}
          adId={buttonConfig.adId}
          enabled={buttonConfig.enabled}
          loading={loadingStates[buttonConfig.adType] || false}
          onPress={handleAdPress}
        />
      ))}
    </View>
  );
};
```

## 样式定制

组件提供了默认样式，但可以通过 `buttonStyle` 和 `textStyle` 属性进行定制：

### 默认样式特性

- 圆角边框（8px）
- 阴影效果（Android elevation + iOS shadow）
- 最小高度 48px
- 响应式颜色（启用/禁用/加载状态）
- 加载指示器动画

### 状态样式

- **启用状态**: 蓝色背景 (#1890FF)
- **禁用状态**: 灰色背景 (#D9D9D9)
- **加载状态**: 浅蓝色背景 (#40A9FF) + 加载指示器

## 测试

组件包含完整的测试覆盖：

```bash
npm test -- --testPathPattern=AdButton.test.tsx
```

测试用例包括：
- 基本渲染测试
- 加载状态测试
- 禁用状态测试
- 启用/禁用属性测试

## 无障碍访问

组件自动为每个按钮设置 `testID`，格式为 `ad-button-${adType}`，便于自动化测试和无障碍访问。

## 注意事项

1. **点击处理**: 组件会自动阻止在加载、禁用或未启用状态下的点击事件
2. **样式优先级**: 自定义样式会覆盖默认样式
3. **类型安全**: 使用 TypeScript 确保属性类型正确
4. **性能优化**: 使用 `activeOpacity` 提供视觉反馈

## 与其他组件的集成

该组件设计为与以下组件配合使用：
- `HomeScreen`: 主页面组件
- `PangleAdService`: 广告服务
- `AdConfig`: 广告配置

## 版本兼容性

- React Native: 0.81.1+
- TypeScript: 5.8.3+
- React: 19.1.0+