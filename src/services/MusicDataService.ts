import { MusicItem, MusicCategory } from '../types/music';
import { MUSIC_CONFIG } from '../config/musicConfig';

/**
 * 音乐数据服务
 * 提供硬编码的音乐资源数据
 */
export class MusicDataService {
  /**
   * 获取所有音乐分类
   * @returns 音乐分类列表
   */
  static getMusicCategories(): MusicCategory[] {
    return MUSIC_CONFIG.categories;
  }

  /**
   * 获取音乐列表
   * @param category 可选的分类筛选
   * @returns 音乐项目列表
   */
  static getMusicList(category?: string): MusicItem[] {
    const musicItems = MUSIC_CONFIG.musicItems.map(item => ({
      ...item,
      audioUrl: `${MUSIC_CONFIG.baseUrl}${item.audioPath}`
    }));

    if (category) {
      return musicItems.filter(item => item.category === category);
    }

    return musicItems;
  }

  /**
   * 根据ID获取音乐项目
   * @param id 音乐ID
   * @returns 音乐项目或null
   */
  static getMusicById(id: string): MusicItem | null {
    const musicItem = MUSIC_CONFIG.musicItems.find(item => item.id === id);
    
    if (!musicItem) {
      return null;
    }

    return {
      ...musicItem,
      audioUrl: `${MUSIC_CONFIG.baseUrl}${musicItem.audioPath}`
    };
  }

  /**
   * 搜索音乐
   * @param query 搜索关键词
   * @returns 匹配的音乐项目列表
   */
  static searchMusic(query: string): MusicItem[] {
    const lowercaseQuery = query.toLowerCase();
    const musicItems = MUSIC_CONFIG.musicItems.map(item => ({
      ...item,
      audioUrl: `${MUSIC_CONFIG.baseUrl}${item.audioPath}`
    }));

    return musicItems.filter(item => 
      item.title.toLowerCase().includes(lowercaseQuery) ||
      item.category.toLowerCase().includes(lowercaseQuery) ||
      (item.description && item.description.toLowerCase().includes(lowercaseQuery))
    );
  }

  /**
   * 根据分类获取音乐数量
   * @param category 分类ID
   * @returns 该分类下的音乐数量
   */
  static getMusicCountByCategory(category: string): number {
    return MUSIC_CONFIG.musicItems.filter(item => item.category === category).length;
  }

  /**
   * 获取所有分类及其音乐数量
   * @returns 分类及其音乐数量的映射
   */
  static getCategoriesWithCount(): Array<MusicCategory & { count: number }> {
    return MUSIC_CONFIG.categories.map(category => ({
      ...category,
      count: this.getMusicCountByCategory(category.id)
    }));
  }

  /**
   * 验证音乐ID是否存在
   * @param id 音乐ID
   * @returns 是否存在
   */
  static isMusicIdValid(id: string): boolean {
    return MUSIC_CONFIG.musicItems.some(item => item.id === id);
  }

  /**
   * 获取基础URL
   * @returns 音频资源基础URL
   */
  static getBaseUrl(): string {
    return MUSIC_CONFIG.baseUrl;
  }

  /**
   * 获取随机音乐
   * @param count 返回的音乐数量，默认为1
   * @param category 可选的分类筛选
   * @returns 随机音乐列表
   */
  static getRandomMusic(count: number = 1, category?: string): MusicItem[] {
    let musicItems = this.getMusicList(category);
    
    // 随机打乱数组
    for (let i = musicItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [musicItems[i], musicItems[j]] = [musicItems[j], musicItems[i]];
    }

    return musicItems.slice(0, count);
  }
}