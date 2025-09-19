import AsyncStorage from '@react-native-async-storage/async-storage';
import { MusicItem } from '../types/music';
import { MusicDataService } from './MusicDataService';

/**
 * 音乐收藏服务
 * 管理音乐收藏的本地存储和同步
 */
export class MusicFavoritesService {
  private static readonly STORAGE_KEY = '@music_favorites';
  private static readonly BACKUP_STORAGE_KEY = '@music_favorites_backup';
  
  // 内存缓存，提高性能
  private static favoritesCache: Set<string> | null = null;
  private static isInitialized = false;

  /**
   * 初始化收藏服务
   * 从本地存储加载收藏数据到内存缓存
   */
  private static async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const favorites = await this.loadFavoritesFromStorage();
      this.favoritesCache = new Set(favorites.map(item => item.id));
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize MusicFavoritesService:', error);
      // 初始化失败时使用空的收藏列表
      this.favoritesCache = new Set();
      this.isInitialized = true;
    }
  }

  /**
   * 从本地存储加载收藏数据
   */
  private static async loadFavoritesFromStorage(): Promise<MusicItem[]> {
    try {
      const favoritesJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      
      if (!favoritesJson) {
        return [];
      }

      const favoriteIds: string[] = JSON.parse(favoritesJson);
      
      // 验证收藏的音乐ID是否仍然有效
      const validFavorites: MusicItem[] = [];
      
      for (const id of favoriteIds) {
        const music = MusicDataService.getMusicById(id);
        if (music) {
          validFavorites.push(music);
        }
      }

      // 如果有无效的收藏项，更新存储
      if (validFavorites.length !== favoriteIds.length) {
        await this.saveFavoritesToStorage(validFavorites.map(item => item.id));
      }

      return validFavorites;
    } catch (error) {
      console.error('Failed to load favorites from storage:', error);
      
      // 尝试从备份恢复
      try {
        const backupJson = await AsyncStorage.getItem(this.BACKUP_STORAGE_KEY);
        if (backupJson) {
          const backupIds: string[] = JSON.parse(backupJson);
          const backupFavorites: MusicItem[] = [];
          
          for (const id of backupIds) {
            const music = MusicDataService.getMusicById(id);
            if (music) {
              backupFavorites.push(music);
            }
          }
          
          // 恢复主存储
          await this.saveFavoritesToStorage(backupFavorites.map(item => item.id));
          return backupFavorites;
        }
      } catch (backupError) {
        console.error('Failed to restore from backup:', backupError);
      }
      
      return [];
    }
  }

  /**
   * 保存收藏数据到本地存储
   */
  private static async saveFavoritesToStorage(favoriteIds: string[]): Promise<void> {
    try {
      const favoritesJson = JSON.stringify(favoriteIds);
      
      // 同时保存到主存储和备份存储
      await Promise.all([
        AsyncStorage.setItem(this.STORAGE_KEY, favoritesJson),
        AsyncStorage.setItem(this.BACKUP_STORAGE_KEY, favoritesJson)
      ]);
    } catch (error) {
      console.error('Failed to save favorites to storage:', error);
      throw new Error('收藏保存失败，请检查存储空间');
    }
  }

  /**
   * 获取所有收藏的音乐
   * @returns 收藏的音乐列表
   */
  static async getFavorites(): Promise<MusicItem[]> {
    await this.initialize();
    
    try {
      return await this.loadFavoritesFromStorage();
    } catch (error) {
      console.error('Failed to get favorites:', error);
      throw new Error('获取收藏列表失败');
    }
  }

  /**
   * 添加音乐到收藏夹
   * @param music 要收藏的音乐
   */
  static async addToFavorites(music: MusicItem): Promise<void> {
    await this.initialize();

    if (!music || !music.id) {
      throw new Error('无效的音乐数据');
    }

    // 验证音乐是否存在
    const validMusic = MusicDataService.getMusicById(music.id);
    if (!validMusic) {
      throw new Error('音乐不存在或已被移除');
    }

    try {
      // 检查是否已经收藏
      if (this.favoritesCache!.has(music.id)) {
        return; // 已经收藏，无需重复添加
      }

      // 添加到内存缓存
      this.favoritesCache!.add(music.id);

      // 获取当前收藏列表并添加新项目
      const currentFavorites = await this.loadFavoritesFromStorage();
      const favoriteIds = currentFavorites.map(item => item.id);
      
      if (!favoriteIds.includes(music.id)) {
        favoriteIds.push(music.id);
        await this.saveFavoritesToStorage(favoriteIds);
      }
    } catch (error) {
      // 回滚内存缓存
      this.favoritesCache!.delete(music.id);
      console.error('Failed to add to favorites:', error);
      throw new Error('添加收藏失败，请重试');
    }
  }

  /**
   * 从收藏夹移除音乐
   * @param musicId 要移除的音乐ID
   */
  static async removeFromFavorites(musicId: string): Promise<void> {
    await this.initialize();

    if (!musicId) {
      throw new Error('无效的音乐ID');
    }

    try {
      // 检查是否已收藏
      if (!this.favoritesCache!.has(musicId)) {
        return; // 未收藏，无需移除
      }

      // 从内存缓存移除
      this.favoritesCache!.delete(musicId);

      // 获取当前收藏列表并移除指定项目
      const currentFavorites = await this.loadFavoritesFromStorage();
      const favoriteIds = currentFavorites
        .map(item => item.id)
        .filter(id => id !== musicId);
      
      await this.saveFavoritesToStorage(favoriteIds);
    } catch (error) {
      // 回滚内存缓存
      this.favoritesCache!.add(musicId);
      console.error('Failed to remove from favorites:', error);
      throw new Error('移除收藏失败，请重试');
    }
  }

  /**
   * 检查音乐是否已收藏
   * @param musicId 音乐ID
   * @returns 是否已收藏
   */
  static async isFavorited(musicId: string): Promise<boolean> {
    await this.initialize();

    if (!musicId) {
      return false;
    }

    return this.favoritesCache!.has(musicId);
  }

  /**
   * 切换音乐的收藏状态
   * @param music 音乐项目
   * @returns 切换后的收藏状态
   */
  static async toggleFavorite(music: MusicItem): Promise<boolean> {
    const isFavorited = await this.isFavorited(music.id);
    
    if (isFavorited) {
      await this.removeFromFavorites(music.id);
      return false;
    } else {
      await this.addToFavorites(music);
      return true;
    }
  }

  /**
   * 清空所有收藏
   */
  static async clearAllFavorites(): Promise<void> {
    await this.initialize();

    try {
      // 清空内存缓存
      this.favoritesCache!.clear();
      
      // 清空存储
      await this.saveFavoritesToStorage([]);
    } catch (error) {
      console.error('Failed to clear all favorites:', error);
      throw new Error('清空收藏失败，请重试');
    }
  }

  /**
   * 获取收藏数量
   * @returns 收藏的音乐数量
   */
  static async getFavoritesCount(): Promise<number> {
    await this.initialize();
    return this.favoritesCache!.size;
  }

  /**
   * 批量添加收藏
   * @param musicList 要收藏的音乐列表
   * @returns 成功添加的数量
   */
  static async addMultipleToFavorites(musicList: MusicItem[]): Promise<number> {
    await this.initialize();

    if (!musicList || musicList.length === 0) {
      return 0;
    }

    let successCount = 0;
    const errors: string[] = [];

    for (const music of musicList) {
      try {
        await this.addToFavorites(music);
        successCount++;
      } catch (error) {
        errors.push(`${music.title}: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    if (errors.length > 0) {
      console.warn('Some favorites failed to add:', errors);
    }

    return successCount;
  }

  /**
   * 批量移除收藏
   * @param musicIds 要移除的音乐ID列表
   * @returns 成功移除的数量
   */
  static async removeMultipleFromFavorites(musicIds: string[]): Promise<number> {
    await this.initialize();

    if (!musicIds || musicIds.length === 0) {
      return 0;
    }

    let successCount = 0;
    const errors: string[] = [];

    for (const musicId of musicIds) {
      try {
        // Check if it was actually favorited before trying to remove
        const wasFavorited = await this.isFavorited(musicId);
        await this.removeFromFavorites(musicId);
        
        // Only count if it was actually favorited and removed
        if (wasFavorited) {
          successCount++;
        }
      } catch (error) {
        errors.push(`${musicId}: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    if (errors.length > 0) {
      console.warn('Some favorites failed to remove:', errors);
    }

    return successCount;
  }

  /**
   * 同步收藏状态
   * 验证所有收藏的音乐是否仍然有效，移除无效项目
   * @returns 同步结果统计
   */
  static async syncFavorites(): Promise<{
    total: number;
    valid: number;
    removed: number;
  }> {
    await this.initialize();

    try {
      const currentFavorites = await this.loadFavoritesFromStorage();
      const validFavorites: MusicItem[] = [];
      
      for (const favorite of currentFavorites) {
        const music = MusicDataService.getMusicById(favorite.id);
        if (music) {
          validFavorites.push(music);
        }
      }

      const removedCount = currentFavorites.length - validFavorites.length;
      
      if (removedCount > 0) {
        // 更新存储和缓存
        const validIds = validFavorites.map(item => item.id);
        await this.saveFavoritesToStorage(validIds);
        this.favoritesCache = new Set(validIds);
      }

      return {
        total: currentFavorites.length,
        valid: validFavorites.length,
        removed: removedCount
      };
    } catch (error) {
      console.error('Failed to sync favorites:', error);
      throw new Error('收藏同步失败');
    }
  }

  /**
   * 重置收藏服务
   * 清空缓存并重新初始化
   */
  static async reset(): Promise<void> {
    this.favoritesCache = null;
    this.isInitialized = false;
    await this.initialize();
  }

  /**
   * 导出收藏数据
   * @returns 收藏数据的JSON字符串
   */
  static async exportFavorites(): Promise<string> {
    const favorites = await this.getFavorites();
    return JSON.stringify({
      version: '1.0',
      timestamp: Date.now(),
      favorites: favorites.map(item => ({
        id: item.id,
        title: item.title,
        category: item.category
      }))
    }, null, 2);
  }

  /**
   * 导入收藏数据
   * @param jsonData 收藏数据的JSON字符串
   * @returns 导入结果统计
   */
  static async importFavorites(jsonData: string): Promise<{
    total: number;
    imported: number;
    skipped: number;
  }> {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.favorites || !Array.isArray(data.favorites)) {
        throw new Error('无效的收藏数据格式');
      }

      let importedCount = 0;
      let skippedCount = 0;

      for (const favoriteData of data.favorites) {
        if (!favoriteData.id) {
          skippedCount++;
          continue;
        }

        const music = MusicDataService.getMusicById(favoriteData.id);
        if (music) {
          try {
            await this.addToFavorites(music);
            importedCount++;
          } catch (error) {
            // 可能已经收藏，跳过
            skippedCount++;
          }
        } else {
          skippedCount++;
        }
      }

      return {
        total: data.favorites.length,
        imported: importedCount,
        skipped: skippedCount
      };
    } catch (error) {
      console.error('Failed to import favorites:', error);
      
      // Check if it's a JSON parsing error or data format error
      if (error instanceof Error && error.message === '无效的收藏数据格式') {
        throw error; // Re-throw the specific error
      }
      
      throw new Error('导入收藏数据失败');
    }
  }
}