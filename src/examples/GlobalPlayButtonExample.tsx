import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { GlobalPlayButton } from '../components';

/**
 * 全局播放按钮使用示例
 * 展示不同尺寸和样式的全局播放按钮
 */
const GlobalPlayButtonExample: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>全局播放按钮示例</Text>
      
      {/* 不同尺寸 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>不同尺寸</Text>
        <View style={styles.row}>
          <View style={styles.buttonContainer}>
            <GlobalPlayButton size="small" />
            <Text style={styles.label}>小号</Text>
          </View>
          <View style={styles.buttonContainer}>
            <GlobalPlayButton size="medium" />
            <Text style={styles.label}>中号</Text>
          </View>
          <View style={styles.buttonContainer}>
            <GlobalPlayButton size="large" />
            <Text style={styles.label}>大号</Text>
          </View>
        </View>
      </View>

      {/* 不同样式 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>不同样式</Text>
        <View style={styles.row}>
          <View style={styles.buttonContainer}>
            <GlobalPlayButton variant="filled" />
            <Text style={styles.label}>填充</Text>
          </View>
          <View style={styles.buttonContainer}>
            <GlobalPlayButton variant="outlined" />
            <Text style={styles.label}>边框</Text>
          </View>
          <View style={styles.buttonContainer}>
            <GlobalPlayButton variant="minimal" />
            <Text style={styles.label}>简约</Text>
          </View>
        </View>
      </View>

      {/* 组合示例 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>组合示例</Text>
        <View style={styles.row}>
          <View style={styles.buttonContainer}>
            <GlobalPlayButton 
              size="large" 
              variant="outlined"
              onPress={(isPlaying) => {
                console.log(`播放状态: ${isPlaying ? '播放中' : '已暂停'}`);
              }}
            />
            <Text style={styles.label}>大号边框</Text>
          </View>
          <View style={styles.buttonContainer}>
            <GlobalPlayButton 
              size="small" 
              variant="minimal"
              style={styles.customButton}
            />
            <Text style={styles.label}>自定义样式</Text>
          </View>
        </View>
      </View>

      <View style={styles.usage}>
        <Text style={styles.usageTitle}>使用说明</Text>
        <Text style={styles.usageText}>
          • 全局播放按钮会自动检测当前播放的音乐{'\n'}
          • 当没有音乐播放时，按钮会变为半透明状态{'\n'}
          • 播放时按钮会有脉冲动画效果{'\n'}
          • 支持三种尺寸：small、medium、large{'\n'}
          • 支持三种样式：filled、outlined、minimal{'\n'}
          • 可以通过onPress回调监听播放状态变化
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
  },
  label: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  customButton: {
    backgroundColor: '#F59E0B',
    borderColor: '#D97706',
    borderWidth: 2,
  },
  usage: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  usageText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});

export default GlobalPlayButtonExample;