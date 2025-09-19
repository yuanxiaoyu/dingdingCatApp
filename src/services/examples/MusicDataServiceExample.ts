/**
 * MusicDataService 使用示例
 * 演示如何使用音乐数据服务的各种功能
 */

import { MusicDataService } from '../MusicDataService';
import { MusicItem, MusicCategory } from '../../types/music';

/**
 * 基本用法示例
 */
export function basicUsageExample() {
  console.log('=== MusicDataService 基本用法示例 ===');
  
  // 获取所有音乐分类
  const categories = MusicDataService.getMusicCategories();
  console.log('音乐分类数量:', categories.length);
  console.log('分类列表:', categories.map(cat => `${cat.icon} ${cat.name}`));
  
  // 获取所有音乐
  const allMusic = MusicDataService.getMusicList();
  console.log('音乐总数:', allMusic.length);
  
  // 获取特定分类的音乐
  const animalMusic = MusicDataService.getMusicList('animals');
  console.log('动物声音分类音乐数量:', animalMusic.length);
  
  // 根据ID获取音乐
  const birdsMusic = MusicDataService.getMusicById('birds');
  if (birdsMusic) {
    console.log('鸟鸣声音乐:', birdsMusic.title, birdsMusic.audioUrl);
  }
}

/**
 * 搜索功能示例
 */
export function searchExample() {
  console.log('\n=== 搜索功能示例 ===');
  
  // 按标题搜索
  const rainMusic = MusicDataService.searchMusic('雨');
  console.log('包含"雨"的音乐:', rainMusic.map(m => m.title));
  
  // 按分类搜索
  const natureMusic = MusicDataService.searchMusic('nature');
  console.log('自然声音分类音乐:', natureMusic.map(m => m.title));
  
  // 搜索描述
  const relaxingMusic = MusicDataService.searchMusic('放松');
  console.log('包含"放松"描述的音乐:', relaxingMusic.map(m => m.title));
}

/**
 * 统计功能示例
 */
export function statisticsExample() {
  console.log('\n=== 统计功能示例 ===');
  
  // 获取各分类的音乐数量
  const categoriesWithCount = MusicDataService.getCategoriesWithCount();
  console.log('各分类音乐数量:');
  categoriesWithCount.forEach(cat => {
    console.log(`  ${cat.icon} ${cat.name}: ${cat.count}首`);
  });
  
  // 获取特定分类的音乐数量
  const rainCount = MusicDataService.getMusicCountByCategory('rain');
  console.log('雨声分类音乐数量:', rainCount);
}

/**
 * 随机音乐示例
 */
export function randomMusicExample() {
  console.log('\n=== 随机音乐示例 ===');
  
  // 获取3首随机音乐
  const randomMusic = MusicDataService.getRandomMusic(3);
  console.log('随机音乐:');
  randomMusic.forEach(music => {
    console.log(`  ${music.icon} ${music.title} (${music.category})`);
  });
  
  // 获取特定分类的随机音乐
  const randomNatureMusic = MusicDataService.getRandomMusic(2, 'nature');
  console.log('随机自然声音:');
  randomNatureMusic.forEach(music => {
    console.log(`  ${music.icon} ${music.title}`);
  });
}

/**
 * 验证功能示例
 */
export function validationExample() {
  console.log('\n=== 验证功能示例 ===');
  
  // 验证音乐ID是否存在
  console.log('birds ID是否有效:', MusicDataService.isMusicIdValid('birds'));
  console.log('invalid-id ID是否有效:', MusicDataService.isMusicIdValid('invalid-id'));
  
  // 获取基础URL
  console.log('音频资源基础URL:', MusicDataService.getBaseUrl());
}

/**
 * 完整的使用示例
 */
export function completeExample() {
  console.log('=== MusicDataService 完整使用示例 ===\n');
  
  basicUsageExample();
  searchExample();
  statisticsExample();
  randomMusicExample();
  validationExample();
  
  console.log('\n=== 示例结束 ===');
}

/**
 * 实际应用场景示例：构建音乐播放器界面数据
 */
export function buildMusicPlayerData() {
  console.log('\n=== 音乐播放器界面数据构建示例 ===');
  
  // 构建分类选项卡数据
  const categoryTabs = MusicDataService.getCategoriesWithCount().map(cat => ({
    id: cat.id,
    label: `${cat.icon} ${cat.name}`,
    count: cat.count,
    isActive: false
  }));
  
  console.log('分类选项卡数据:', categoryTabs);
  
  // 构建默认显示的音乐列表（显示所有音乐）
  const musicListData = MusicDataService.getMusicList().map(music => ({
    id: music.id,
    title: music.title,
    category: music.category,
    icon: music.icon,
    audioUrl: music.audioUrl,
    isPlaying: false,
    isFavorited: false, // 这个需要从收藏服务获取
    isLooping: music.isLooping
  }));
  
  console.log('音乐列表数据示例（前3项）:', musicListData.slice(0, 3));
  
  // 构建推荐音乐数据（随机选择）
  const recommendedMusic = MusicDataService.getRandomMusic(5).map(music => ({
    id: music.id,
    title: music.title,
    icon: music.icon,
    category: music.category,
    description: music.description
  }));
  
  console.log('推荐音乐数据:', recommendedMusic);
  
  return {
    categoryTabs,
    musicListData,
    recommendedMusic
  };
}

// 如果直接运行此文件，执行完整示例
if (require.main === module) {
  completeExample();
  buildMusicPlayerData();
}