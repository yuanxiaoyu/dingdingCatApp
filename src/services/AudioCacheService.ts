// Import Sound with comprehensive fallback
let Sound: any;
let isRealSoundAvailable = false;

try {
  Sound = require('react-native-sound');
  
  // Handle both default and named exports
  if (Sound.default) {
    Sound = Sound.default;
  }
  
  // Verify that Sound is actually a constructor
  if (typeof Sound === 'function') {
    isRealSoundAvailable = true;
    console.log('AudioCacheService: react-native-sound loaded successfully');
  } else {
    throw new Error('Sound is not a constructor');
  }
} catch (error) {
  console.warn('AudioCacheService: react-native-sound not available, using fallback mock:', error.message);
  isRealSoundAvailable = false;
  
  // Comprehensive fallback mock for development/testing
  Sound = class MockSound {
    private _loaded = false;
    
    constructor(url: string, basePath: string, callback: (error: any) => void) {
      console.log(`MockSound: Creating sound for ${url}`);
      // Simulate async loading
      setTimeout(() => {
        this._loaded = true;
        if (callback) {
          callback(null); // No error
        }
      }, 50);
    }
    
    static setCategory(category: string, mixWithOthers?: boolean) {
      console.log(`MockSound.setCategory: ${category}, mixWithOthers: ${mixWithOthers}`);
    }
    
    release() {
      console.log('MockSound: release() called');
      this._loaded = false;
      return this;
    }
    
    isLoaded() {
      return this._loaded;
    }
  };
}
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MusicItem } from '../types/music';

// Type definition for Sound instance
type SoundInstance = any;

interface CachedAudio {
  musicId: string;
  soundInstance: SoundInstance;
  lastAccessed: number;
  preloaded: boolean;
  loadPromise?: Promise<void>;
}

interface CacheStats {
  totalCached: number;
  memoryUsage: number;
  hitRate: number;
  totalRequests: number;
  cacheHits: number;
}

/**
 * 音频缓存服务
 * 提供音频预加载、缓存管理和性能优化
 */
export class AudioCacheService {
  private static cache: Map<string, CachedAudio> = new Map();
  private static readonly MAX_CACHE_SIZE = 10; // 最大缓存音频数量
  private static readonly PRELOAD_TIMEOUT = 10000; // 预加载超时时间（毫秒）
  private static readonly CACHE_STATS_KEY = '@audio_cache_stats';
  
  // 统计数据
  private static stats: CacheStats = {
    totalCached: 0,
    memoryUsage: 0,
    hitRate: 0,
    totalRequests: 0,
    cacheHits: 0,
  };

  /**
   * 初始化音频缓存服务
   */
  static initialize(): void {
    // 启用在静音模式下播放
    Sound.setCategory('Playback');
    
    // 加载缓存统计数据
    this.loadCacheStats();
    
    console.log('AudioCacheService initialized');
  }

  /**
   * 预加载音频文件
   * @param music 音乐项目
   * @returns Promise<SoundInstance>
   */
  static async preloadAudio(music: MusicItem): Promise<SoundInstance> {
    const cached = this.cache.get(music.id);
    
    // 如果已缓存且预加载完成，直接返回
    if (cached && cached.preloaded) {
      cached.lastAccessed = Date.now();
      this.stats.cacheHits++;
      return cached.soundInstance;
    }

    // 如果正在加载，等待加载完成
    if (cached && cached.loadPromise) {
      await cached.loadPromise;
      return cached.soundInstance;
    }

    // 开始预加载
    this.stats.totalRequests++;
    
    const loadPromise = new Promise<void>((resolve, reject) => {
      try {
        // 确保 Sound 构造函数可用
        if (typeof Sound !== 'function') {
          reject(new Error('Sound constructor is not available'));
          return;
        }

        const sound = new Sound(music.audioUrl, '', (error: any) => {
          if (error) {
            console.error(`Failed to preload audio for ${music.title}:`, error);
            this.cache.delete(music.id);
            reject(new Error(`音频加载失败: ${music.title}`));
            return;
          }

        // 更新缓存项
        const cacheItem: CachedAudio = {
          musicId: music.id,
          soundInstance: sound,
          lastAccessed: Date.now(),
          preloaded: true,
        };

        this.cache.set(music.id, cacheItem);
        this.stats.totalCached = this.cache.size;
        
          console.log(`Audio preloaded successfully: ${music.title}`);
          resolve();
        });

        // 设置超时
        setTimeout(() => {
          if (!this.cache.get(music.id)?.preloaded) {
            sound.release();
            this.cache.delete(music.id);
            reject(new Error(`音频预加载超时: ${music.title}`));
          }
        }, this.PRELOAD_TIMEOUT);
      } catch (constructorError) {
        console.error(`Error creating Sound instance for ${music.title}:`, constructorError);
        this.cache.delete(music.id);
        reject(new Error(`音频构造失败: ${music.title}`));
      }
    });

    // 创建临时缓存项
    const tempCacheItem: CachedAudio = {
      musicId: music.id,
      soundInstance: null as any,
      lastAccessed: Date.now(),
      preloaded: false,
      loadPromise,
    };

    this.cache.set(music.id, tempCacheItem);

    try {
      await loadPromise;
      const finalCacheItem = this.cache.get(music.id);
      if (finalCacheItem) {
        delete finalCacheItem.loadPromise;
        return finalCacheItem.soundInstance;
      }
      throw new Error('Cache item not found after loading');
    } catch (error) {
      this.cache.delete(music.id);
      throw error;
    }
  }

  /**
   * 获取缓存的音频实例
   * @param musicId 音乐ID
   * @returns SoundInstance | null
   */
  static getCachedAudio(musicId: string): SoundInstance | null {
    const cached = this.cache.get(musicId);
    
    if (cached && cached.preloaded) {
      cached.lastAccessed = Date.now();
      this.stats.cacheHits++;
      return cached.soundInstance;
    }
    
    return null;
  }

  /**
   * 批量预加载音频
   * @param musicList 音乐列表
   * @param maxConcurrent 最大并发加载数
   * @returns Promise<void>
   */
  static async batchPreloadAudio(
    musicList: MusicItem[], 
    maxConcurrent: number = 3
  ): Promise<void> {
    console.log(`Starting batch preload for ${musicList.length} audio files`);
    
    // 过滤掉已缓存的音频
    const uncachedMusic = musicList.filter(music => 
      !this.cache.has(music.id) || !this.cache.get(music.id)?.preloaded
    );

    if (uncachedMusic.length === 0) {
      console.log('All audio files already cached');
      return;
    }

    // 分批加载
    const batches: MusicItem[][] = [];
    for (let i = 0; i < uncachedMusic.length; i += maxConcurrent) {
      batches.push(uncachedMusic.slice(i, i + maxConcurrent));
    }

    let successCount = 0;
    let errorCount = 0;

    for (const batch of batches) {
      const promises = batch.map(async (music) => {
        try {
          await this.preloadAudio(music);
          successCount++;
        } catch (error) {
          console.warn(`Failed to preload ${music.title}:`, error);
          errorCount++;
        }
      });

      await Promise.allSettled(promises);
      
      // 检查缓存大小，必要时清理
      await this.cleanupCache();
    }

    console.log(`Batch preload completed: ${successCount} success, ${errorCount} errors`);
    this.updateCacheStats();
  }

  /**
   * 智能预加载 - 基于用户行为预测
   * @param recentlyPlayed 最近播放的音乐
   * @param favorites 收藏的音乐
   * @param currentCategory 当前分类
   * @param allMusic 所有音乐
   */
  static async smartPreload(
    recentlyPlayed: MusicItem[],
    favorites: MusicItem[],
    currentCategory: string,
    allMusic: MusicItem[]
  ): Promise<void> {
    // 优先级排序：最近播放 > 收藏 > 当前分类 > 其他
    const priorityMusic: MusicItem[] = [];
    const addedIds = new Set<string>();

    // 1. 最近播放的音乐（最高优先级）
    recentlyPlayed.slice(0, 3).forEach(music => {
      if (!addedIds.has(music.id)) {
        priorityMusic.push(music);
        addedIds.add(music.id);
      }
    });

    // 2. 收藏的音乐
    favorites.slice(0, 4).forEach(music => {
      if (!addedIds.has(music.id)) {
        priorityMusic.push(music);
        addedIds.add(music.id);
      }
    });

    // 3. 当前分类的音乐
    const categoryMusic = allMusic
      .filter(music => music.category === currentCategory)
      .slice(0, 3);
    
    categoryMusic.forEach(music => {
      if (!addedIds.has(music.id)) {
        priorityMusic.push(music);
        addedIds.add(music.id);
      }
    });

    // 限制预加载数量
    const musicToPreload = priorityMusic.slice(0, this.MAX_CACHE_SIZE);
    
    console.log(`Smart preloading ${musicToPreload.length} audio files`);
    await this.batchPreloadAudio(musicToPreload, 2);
  }

  /**
   * 清理缓存 - 移除最久未使用的音频
   */
  static async cleanupCache(): Promise<void> {
    if (this.cache.size <= this.MAX_CACHE_SIZE) {
      return;
    }

    // 按最后访问时间排序
    const cacheEntries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    // 移除最久未使用的音频
    const toRemove = cacheEntries.slice(0, this.cache.size - this.MAX_CACHE_SIZE);
    
    for (const [musicId, cached] of toRemove) {
      try {
        if (cached.soundInstance && cached.preloaded) {
          cached.soundInstance.release();
        }
        this.cache.delete(musicId);
        console.log(`Removed cached audio: ${musicId}`);
      } catch (error) {
        console.error(`Error releasing cached audio ${musicId}:`, error);
      }
    }

    this.stats.totalCached = this.cache.size;
    console.log(`Cache cleanup completed. Current size: ${this.cache.size}`);
  }

  /**
   * 清空所有缓存
   */
  static async clearAllCache(): Promise<void> {
    console.log('Clearing all audio cache');
    
    for (const [musicId, cached] of this.cache.entries()) {
      try {
        if (cached.soundInstance && cached.preloaded) {
          cached.soundInstance.release();
        }
      } catch (error) {
        console.error(`Error releasing cached audio ${musicId}:`, error);
      }
    }

    this.cache.clear();
    this.stats.totalCached = 0;
    this.stats.memoryUsage = 0;
    
    console.log('All audio cache cleared');
  }

  /**
   * 获取缓存统计信息
   */
  static getCacheStats(): CacheStats {
    // 计算命中率
    if (this.stats.totalRequests > 0) {
      this.stats.hitRate = (this.stats.cacheHits / this.stats.totalRequests) * 100;
    }

    return { ...this.stats };
  }

  /**
   * 更新缓存统计数据
   */
  private static updateCacheStats(): void {
    this.stats.totalCached = this.cache.size;
    
    // 估算内存使用（简化计算）
    this.stats.memoryUsage = this.cache.size * 0.5; // 假设每个音频约0.5MB

    // 保存统计数据
    this.saveCacheStats();
  }

  /**
   * 保存缓存统计数据到本地存储
   */
  private static async saveCacheStats(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CACHE_STATS_KEY, JSON.stringify(this.stats));
    } catch (error) {
      console.error('Failed to save cache stats:', error);
    }
  }

  /**
   * 从本地存储加载缓存统计数据
   */
  private static async loadCacheStats(): Promise<void> {
    try {
      const statsJson = await AsyncStorage.getItem(this.CACHE_STATS_KEY);
      if (statsJson) {
        const savedStats = JSON.parse(statsJson);
        this.stats = { ...this.stats, ...savedStats };
      }
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
  }

  /**
   * 检查音频是否已缓存
   * @param musicId 音乐ID
   * @returns boolean
   */
  static isAudioCached(musicId: string): boolean {
    const cached = this.cache.get(musicId);
    return cached ? cached.preloaded : false;
  }

  /**
   * 获取缓存中的音频列表
   * @returns string[] 已缓存的音乐ID列表
   */
  static getCachedAudioIds(): string[] {
    return Array.from(this.cache.entries())
      .filter(([, cached]) => cached.preloaded)
      .map(([musicId]) => musicId);
  }

  /**
   * 预热缓存 - 应用启动时调用
   * @param popularMusic 热门音乐列表
   */
  static async warmupCache(popularMusic: MusicItem[]): Promise<void> {
    console.log('Warming up audio cache');
    
    // 预加载前几首热门音乐
    const musicToWarmup = popularMusic.slice(0, 5);
    await this.batchPreloadAudio(musicToWarmup, 2);
    
    console.log('Cache warmup completed');
  }

  /**
   * 获取缓存性能报告
   */
  static getPerformanceReport(): {
    cacheSize: number;
    hitRate: string;
    memoryUsage: string;
    recommendations: string[];
  } {
    const stats = this.getCacheStats();
    const recommendations: string[] = [];

    if (stats.hitRate < 50) {
      recommendations.push('缓存命中率较低，建议优化预加载策略');
    }

    if (stats.totalCached < 3) {
      recommendations.push('缓存音频数量较少，可以增加预加载');
    }

    if (stats.memoryUsage > 10) {
      recommendations.push('内存使用较高，建议清理部分缓存');
    }

    return {
      cacheSize: stats.totalCached,
      hitRate: `${stats.hitRate.toFixed(1)}%`,
      memoryUsage: `${stats.memoryUsage.toFixed(1)}MB`,
      recommendations,
    };
  }
}