# 底部导航菜单恢复文字标签

## 修改说明
根据用户反馈，恢复了底部导航栏的文字标签，以便用户能够清楚地理解图标含义。

## 主要修改

### 1. 恢复标签显示
```typescript
// 从
tabBarShowLabel: false,

// 改为
tabBarLabel: getTabBarLabel(route.name),
```

### 2. 添加标签样式
```typescript
tabBarLabelStyle: {
  fontSize: 10,
  fontWeight: '500',
  marginTop: 2,
  marginBottom: 2,
},
```

### 3. 调整导航栏高度
为了容纳图标和文字，调整了导航栏高度：
```typescript
tabBarStyle: {
  backgroundColor: '#FFFFFF',
  borderTopWidth: 1,
  borderTopColor: '#E8E8E8',
  paddingBottom: Platform.OS === 'ios' ? 20 : 8,
  paddingTop: 8,
  height: Platform.OS === 'ios' ? 85 : 65,  // 增加高度以容纳文字
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 8,
},
```

### 4. 使用AlignedTabIcon组件
使用了新的AlignedTabIcon组件来确保图标对齐：
```typescript
tabBarIcon: ({ focused, color, size }) => (
  <AlignedTabIcon 
    name={getTabBarIconName(route.name)}
    focused={focused}
    color={color}
    size={22}
  />
),
```

## 当前效果

### 图标和文字映射
| 页面 | 图标 | 文字 | 说明 |
|------|------|------|------|
| Home | ⌂ | 首页 | 房屋符号 + 中文标签 |
| Revenue | ¥ | 收益 | 人民币符号 + 中文标签 |
| History | ⧗ | 历史 | 沙漏符号 + 中文标签 |
| Settings | ⚙ | 设置 | 齿轮符号 + 中文标签 |

### 视觉效果
- ✅ **图标清晰可见** - 使用Unicode字符
- ✅ **文字标签显示** - 中文标签便于理解
- ✅ **选中状态明显** - 蓝色高亮和字体加粗
- ✅ **对齐效果良好** - 图标和文字垂直居中
- ✅ **动画效果** - 设置图标选中时旋转90度

### 样式特点
- **字体大小**: 10px，适合底部导航栏
- **字体粗细**: 选中时500，未选中时正常
- **颜色**: 选中时蓝色(#1890FF)，未选中时灰色(#999999)
- **间距**: 图标和文字之间有2px间距

## AlignedTabIcon组件特点

### 双层容器设计
```typescript
<View style={styles.iconContainer}>      // 外层容器 32x32
  <View style={styles.iconWrapper}>      // 内层容器 24x24
    <Text style={styles.iconText}>       // 图标文字
      {getIcon(name)}
    </Text>
  </View>
</View>
```

### 对齐优化
- **外层容器**: 32x32px，提供足够的点击区域
- **内层容器**: 24x24px，确保图标居中
- **文字对齐**: `textAlignVertical: 'center'` 和 `lineHeight: 24`
- **字体设置**: `includeFontPadding: false` 移除额外间距

## 用户体验改进

### 优点
1. **清晰易懂** - 图标配合文字，用户能立即理解功能
2. **视觉一致** - 所有图标大小和对齐保持一致
3. **交互反馈** - 选中状态有明显的视觉变化
4. **无障碍友好** - 文字标签提高了可访问性

### 适配性
- **跨平台** - iOS和Android都有良好显示效果
- **响应式** - 适应不同屏幕尺寸
- **性能优秀** - 使用轻量级的Text组件

现在底部导航栏既有清晰的图标，又有易懂的中文标签，提供了最佳的用户体验。