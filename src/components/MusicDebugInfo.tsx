import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { selectMusicList, selectMusicCategories, selectMusicLoading, selectMusicError } from '../store/slices/musicSlice';

/**
 * 音乐调试信息组件
 * 用于调试音乐数据加载问题
 */
const MusicDebugInfo: React.FC = () => {
  const musicList = useSelector(selectMusicList);
  const categories = useSelector(selectMusicCategories);
  const loading = useSelector(selectMusicLoading);
  const error = useSelector(selectMusicError);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>音乐数据调试信息</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>加载状态</Text>
        <Text style={styles.text}>Loading: {loading ? '是' : '否'}</Text>
        <Text style={styles.text}>Error: {error || '无'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>分类数据 ({categories.length})</Text>
        {categories.map((category, index) => (
          <Text key={category.id} style={styles.text}>
            {index + 1}. {category.icon} {category.name} ({category.id})
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>音乐数据 ({musicList.length})</Text>
        {musicList.slice(0, 10).map((music, index) => (
          <Text key={music.id} style={styles.text}>
            {index + 1}. {music.icon} {music.title} ({music.category})
          </Text>
        ))}
        {musicList.length > 10 && (
          <Text style={styles.text}>... 还有 {musicList.length - 10} 首音乐</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>按分类统计</Text>
        {categories.map(category => {
          const count = musicList.filter(music => music.category === category.id).length;
          return (
            <Text key={category.id} style={styles.text}>
              {category.name}: {count} 首
            </Text>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 20,
  },
});

export default MusicDebugInfo;