# DevTools 图标显示问题解决方案

## 问题描述
在HomeScreen中尝试显示PNG图片作为DevTools按钮图标时遇到显示问题。

## 尝试的解决方案

### 1. 直接使用require()加载图片
```typescript
<Image source={require('../../icons/mipmap-mdpi_ic_launcher.png')} />
```
**结果**: 图片未显示

### 2. 复制图片到assets目录
```bash
cp icons/mipmap-mdpi_ic_launcher.png src/assets/images/app_icon.png
```
```typescript
<Image source={require('../assets/images/app_icon.png')} />
```
**结果**: 图片仍未显示

### 3. 创建DevToolsIcon组件
创建了一个专门的组件来处理图片加载和错误处理，包含fallback机制。
**结果**: 复杂度增加，但图片问题依然存在

### 4. 最终解决方案：SimpleDevToolsIcon
创建了一个简单的文字图标组件，使用"丁丁猫"文字作为图标。

```typescript
const SimpleDevToolsIcon: React.FC<SimpleDevToolsIconProps> = ({ size = 32 }) => {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.icon, { fontSize: size * 0.5 }]}>
        丁丁猫
      </Text>
    </View>
  );
};
```

## 可能的原因分析

### React Native图片加载问题
1. **Metro bundler配置**: 可能需要配置Metro来正确处理icons目录中的图片
2. **路径解析**: React Native的require()可能无法正确解析相对路径
3. **图片格式**: PNG文件可能需要特定的配置或转换
4. **缓存问题**: Metro缓存可能导致图片更新不生效

### 建议的进一步调试步骤
1. 检查Metro bundler配置
2. 清除Metro缓存: `npx react-native start --reset-cache`
3. 使用绝对路径或将图片放在标准的assets目录
4. 检查图片文件是否损坏
5. 尝试使用其他格式的图片（如JPG）

## 当前实现
使用SimpleDevToolsIcon组件，显示"丁丁猫"文字作为DevTools按钮图标：
- 蓝色圆形背景 (#1890FF)
- 白色文字
- 响应式大小
- 阴影效果
- 与应用品牌一致

## 优势
1. **可靠性**: 不依赖外部图片文件
2. **品牌一致性**: 使用应用名称作为图标
3. **简洁性**: 代码简单，易于维护
4. **性能**: 无需加载额外的图片资源

## 使用方法
```typescript
{ENV_CONFIG.DEBUG_MODE && (
  <TouchableOpacity
    style={styles.devToolsButton}
    onPress={() => setShowDevTools(true)}
  >
    <SimpleDevToolsIcon size={32} />
  </TouchableOpacity>
)}
```

这个解决方案确保了DevTools按钮在所有情况下都能正常显示，同时保持了良好的视觉效果。