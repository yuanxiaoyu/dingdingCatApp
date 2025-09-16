/**
 * 可复用的广告按钮组件
 * Reusable Ad Button Component
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';

// 广告按钮属性接口
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
  /** 测试标识符 */
  testID?: string;
}

/**
 * 广告按钮组件
 * @param props 组件属性
 * @returns JSX.Element
 */
const AdButton: React.FC<AdButtonProps> = ({
  title,
  adType,
  adId,
  enabled = true,
  loading = false,
  onPress,
  buttonStyle,
  textStyle,
  disabled = false,
  testID,
}) => {
  // 处理按钮点击事件
  const handlePress = () => {
    if (!loading && !disabled && enabled) {
      onPress(adType, adId);
    }
  };

  // 确定按钮是否应该被禁用
  const isDisabled = disabled || !enabled || loading;

  // 获取按钮样式
  const getButtonStyle = (): ViewStyle[] => {
    const styles: ViewStyle[] = [defaultStyles.button];
    
    if (isDisabled) {
      styles.push(defaultStyles.buttonDisabled);
    } else {
      styles.push(defaultStyles.buttonEnabled);
    }
    
    if (loading) {
      styles.push(defaultStyles.buttonLoading);
    }
    
    if (buttonStyle) {
      styles.push(buttonStyle);
    }
    
    return styles;
  };

  // 获取文本样式
  const getTextStyle = (): TextStyle[] => {
    const styles: TextStyle[] = [defaultStyles.text];
    
    if (isDisabled) {
      styles.push(defaultStyles.textDisabled);
    } else {
      styles.push(defaultStyles.textEnabled);
    }
    
    if (textStyle) {
      styles.push(textStyle);
    }
    
    return styles;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.7}
      testID={testID || `ad-button-${adType}`}
    >
      <View style={defaultStyles.buttonContent}>
        {loading && (
          <ActivityIndicator
            size="small"
            color="#FFFFFF"
            style={defaultStyles.loadingIndicator}
          />
        )}
        <Text style={getTextStyle()}>
          {loading ? '加载中...' : title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// 默认样式
const defaultStyles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2, // Android 阴影
    shadowColor: '#000', // iOS 阴影
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  buttonEnabled: {
    backgroundColor: '#1890FF',
  },
  buttonDisabled: {
    backgroundColor: '#D9D9D9',
  },
  buttonLoading: {
    backgroundColor: '#40A9FF',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  textEnabled: {
    color: '#FFFFFF',
  },
  textDisabled: {
    color: '#8C8C8C',
  },
  loadingIndicator: {
    marginRight: 8,
  },
});

export default AdButton;

// 导出类型定义供其他组件使用
export type { AdButtonProps };