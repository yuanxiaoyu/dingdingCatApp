import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { MusicDataService } from '../services/MusicDataService';
import { loadMusicData, selectMusicList, selectMusicCategories, selectMusicLoading, selectMusicError } from '../store/slices/musicSlice';
import MusicDebugInfo from '../components/MusicDebugInfo';

const MusicTestScreen: React.FC = () => {
  const dispatch = useDispatch();
  const musicList = useSelector(selectMusicList);
  const categories = useSelector(selectMusicCategories);
  const loading = useSelector(selectMusicLoading);
  const error = useSelector(selectMusicError);

  useEffect(() => {
    console.log('MusicTestScreen: Component mounted');
    
    // 直接测试MusicDataService
    const directCategories = MusicDataService.getMusicCategories();
    const directMusicList = MusicDataService.getMusicList();
    
    console.log('Direct MusicDataService test:', {
      categoriesCount: directCategories.length,
      musicCount: directMusicList.length,
      firstCategory: directCategories[0],
      firstMusic: directMusicList[0],
    });

    // 通过Redux加载数据
    dispatch(loadMusicData() as any);
  }, [dispatch]);

  const handleTestDirectLoad = () => {
    console.log('Testing direct MusicDataService...');
    const categories = MusicDataService.getMusicCategories();
    const musicList = MusicDataService.getMusicList();
    
    console.log('Direct load results:', {
      categories: categories.length,
      music: musicList.length,
    });
    
    alert(`直接加载结果:\n分类: ${categories.length}\n音乐: ${musicList.length}`);
  };

  const handleTestReduxLoad = () => {
    console.log('Testing Redux load...');
    dispatch(loadMusicData() as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>音乐数据测试</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleTestDirectLoad}>
            <Text style={styles.buttonText}>测试直接加载</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={handleTestReduxLoad}>
            <Text style={styles.buttonText}>测试Redux加载</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>Redux状态</Text>
          <Text style={styles.statusText}>Loading: {loading ? '是' : '否'}</Text>
          <Text style={styles.statusText}>Error: {error || '无'}</Text>
          <Text style={styles.statusText}>Categories: {categories.length}</Text>
          <Text style={styles.statusText}>Music: {musicList.length}</Text>
        </View>

        <MusicDebugInfo />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginVertical: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
});

export default MusicTestScreen;