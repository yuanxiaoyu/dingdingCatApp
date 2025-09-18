# 底部导航图标垂直居中对齐修复

## 问题描述
底部导航栏的图标位置被遮挡，需要调整为垂直居中对齐。

## 解决方案

### 1. 创建了新的CenteredTabIcon组件

```typescript
// src/components/CenteredTabIcon.tsx
const CenteredTabIcon: React.FC<CenteredTabIconProps> = ({ name, focused, color, size = 22 }) => {
  return (
    <View style={styles.iconContainer}>
      <Text 
        style={[
          styles.iconText, 
          {
            color,
            fontSize: size,
            fontWeight: focused ? '600' : '400',
            opacity: focused ? 1 : 0.7,
            transform: name === 'settings' && focused ? [{ rotate: '90deg' }] : [{ rotate: '0deg' }],
          }
        ]}
      >
        {getIcon(name)}
      </Text>
    </View>
  );
};
```

### 2. 关键样式修复

#### 图标容器样式：
```typescript
iconContainer: {
  width: 24,
  height: 24,
  justifyContent: 'center',
  alignItems: 'center',
  alignSelf: 'center',
},
```

#### 文字样式：
```typescript
iconText: {
  textAlign: 'center',
  includeFontPadding: false,        // 关键：移除字体内边距
  textAlignVertical: 'center',      // 关键：垂直居中
},
```

### 3. 底部导航栏样式优化

#### 导航栏整体样式：
```typescript
tabBarStyle: {
  backgroundColor: '#FFFFFF',
  borderTopWidth: 1,
  borderTopColor: '#E8E8E8',
  paddingBottom: Platform.OS === 'ios' ? 25 : 10,
  paddingTop: 10,
  height: Platform.OS === 'ios' ? 85 : 65,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 8,
},
```

#### 标签样式：
```typescript
tabBarLabelStyle: {
  fontSize: 10,
  fontWeight: '500',
  marginTop: 4,
  marginBottom: 0,
},
```

#### 导航项样式：
```typescript
tabBarItemStyle: {
  paddingTop: 8,
  paddingBottom: 4,
  justifyContent: 'space-between',  // 关键：图标和文字之间的间距
  alignItems: 'center',
  minHeight: 50,                    // 关键：确保足够的高度
},
```

## 修复的关键点

### 1. 移除字体内边距
- `includeFontPadding: false` - 移除Android上的默认字体内边距
- `textAlignVertical: 'center'` - 确保文字垂直居中

### 2. 容器对齐
- `justifyContent: 'center'` - 垂直居中
- `alignItems: 'center'` - 水平居中
- `alignSelf: 'center'` - 自身居中

### 3. 间距调整
- 增加了`paddingTop: 10` 确保图标不被遮挡
- 调整了`minHeight: 50` 确保有足够的垂直空间
- 使用`justifyContent: 'space-between'` 合理分配图标和文字的空间

### 4. 平台适配
- iOS和Android的不同内边距处理
- 不同平台的高度调整

## 视觉效果改进

### 修复前的问题：
- 图标被上方内容遮挡
- 垂直对齐不正确
- 图标和文字间距不合理

### 修复后的效果：
- ✅ 图标完全可见
- ✅ 垂直居中对齐
- ✅ 图标和文字间距合理
- ✅ 跨平台一致性

## 图标映射保持不变

| 页面 | 图标 | 效果 |
|------|------|------|
| 首页 | ⌂ | 房屋符号 |
| 收益 | ¥ | 人民币符号 |
| 历史 | ⧗ | 沙漏符号 |
| 设置 | ⚙ | 齿轮符号（选中时旋转） |

## 使用方法

在MainTabs.tsx中已经更新为使用CenteredTabIcon组件：

```typescript
tabBarIcon: ({ focused, color, size }) => (
  <CenteredTabIcon 
    name={getTabBarIconName(route.name)}
    focused={focused}
    color={color}
    size={size || 22}
  />
),
```

现在底部导航栏的图标应该完美垂直居中对齐，不会被遮挡。