// Toast Component for User Feedback
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface FeedbackToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  position?: 'top' | 'center' | 'bottom';
  onHide?: () => void;
  actionText?: string;
  onActionPress?: () => void;
}

const FeedbackToast: React.FC<FeedbackToastProps> = ({
  visible,
  message,
  type = 'info',
  duration = 3000,
  position = 'top',
  onHide,
  actionText,
  onActionPress,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (visible) {
      showToast();
    } else {
      hideToast();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible]);

  const showToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    if (duration > 0) {
      timeoutRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    }
  };

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: position === 'top' ? -100 : 100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) {
        onHide();
      }
    });
  };

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return styles.successToast;
      case 'error':
        return styles.errorToast;
      case 'warning':
        return styles.warningToast;
      default:
        return styles.infoToast;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const getPositionStyle = () => {
    switch (position) {
      case 'center':
        return styles.centerPosition;
      case 'bottom':
        return styles.bottomPosition;
      default:
        return styles.topPosition;
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        getPositionStyle(),
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.toast, getToastStyle()]}>
        <View style={styles.content}>
          <Text style={styles.icon}>{getIcon()}</Text>
          <Text style={[styles.message, styles[`${type}Text`]]}>{message}</Text>
        </View>
        {actionText && onActionPress && (
          <TouchableOpacity style={styles.actionButton} onPress={onActionPress}>
            <Text style={[styles.actionText, styles[`${type}ActionText`]]}>
              {actionText}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
  },
  topPosition: {
    top: 60,
  },
  centerPosition: {
    top: '50%',
    marginTop: -30,
  },
  bottomPosition: {
    bottom: 100,
  },
  toast: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxWidth: width - 32,
    alignSelf: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
    marginRight: 8,
  },
  message: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  actionButton: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Toast type styles
  successToast: {
    backgroundColor: '#4CAF50',
  },
  errorToast: {
    backgroundColor: '#F44336',
  },
  warningToast: {
    backgroundColor: '#FF9800',
  },
  infoToast: {
    backgroundColor: '#2196F3',
  },
  // Text color styles
  successText: {
    color: '#fff',
  },
  errorText: {
    color: '#fff',
  },
  warningText: {
    color: '#fff',
  },
  infoText: {
    color: '#fff',
  },
  // Action text color styles
  successActionText: {
    color: '#fff',
  },
  errorActionText: {
    color: '#fff',
  },
  warningActionText: {
    color: '#fff',
  },
  infoActionText: {
    color: '#fff',
  },
});

export default FeedbackToast;