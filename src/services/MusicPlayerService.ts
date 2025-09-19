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
    console.log('MusicPlayerService: react-native-sound loaded successfully');
  } else {
    throw new Error('Sound is not a constructor');
  }
} catch (error) {
  console.warn('MusicPlayerService: react-native-sound not available, using fallback mock:', error.message);
  isRealSoundAvailable = false;
  
  // Comprehensive fallback mock for development/testing
  Sound = class MockSound {
    private _loaded = false;
    private _playing = false;
    
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
    
    play(callback?: (success: boolean) => void) {
      console.log('MockSound: play() called');
      this._playing = true;
      if (callback) {
        setTimeout(() => {
          callback(true); // Success
        }, 50);
      }
      return this;
    }
    
    pause(callback?: () => void) {
      console.log('MockSound: pause() called');
      this._playing = false;
      if (callback) {
        setTimeout(callback, 50);
      }
      return this;
    }
    
    stop(callback?: () => void) {
      console.log('MockSound: stop() called');
      this._playing = false;
      if (callback) {
        setTimeout(callback, 50);
      }
      return this;
    }
    
    release() {
      console.log('MockSound: release() called');
      this._loaded = false;
      this._playing = false;
      return this;
    }
    
    setVolume(volume: number) {
      console.log(`MockSound: setVolume(${volume})`);
      return this;
    }
    
    setNumberOfLoops(loops: number) {
      console.log(`MockSound: setNumberOfLoops(${loops})`);
      return this;
    }
    
    isLoaded() {
      return this._loaded;
    }
    
    isPlaying() {
      return this._playing;
    }
  };
}
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MusicItem, PlayingTrack } from '../types/music';
import { AudioCacheService } from './AudioCacheService';

// Type definition for Sound instance
type SoundInstance = any;

interface PlaybackSession {
  sessionId: string;
  startTime: number;
  tracks: string[];
  masterVolume: number;
}

interface PerformanceMetrics {
  totalPlayTime: number;
  tracksPlayed: number;
  averageLoadTime: number;
  memoryUsage: number;
  backgroundPlayTime: number;
}

/**
 * 增强的音乐播放服务
 * 支持多音源同时播放、音频缓存、后台播放和性能优化
 */
export class MusicPlayerService {
  private static playingTracks: Map<string, PlayingTrack & { soundInstance: SoundInstance }> = new Map();
  private static masterVolume: number = 1.0;
  private static isInitialized: boolean = false;
  private static currentSession: PlaybackSession | null = null;
  private static appStateSubscription: any = null;
  private static isInBackground: boolean = false;
  private static performanceMetrics: PerformanceMetrics = {
    totalPlayTime: 0,
    tracksPlayed: 0,
    averageLoadTime: 0,
    memoryUsage: 0,
    backgroundPlayTime: 0,
  };
  
  // 全局播放状态
  private static globalPlayState: 'playing' | 'paused' | 'stopped' = 'stopped';
  
  // 存储键
  private static readonly VOLUME_SETTINGS_KEY = '@music_volume_settings';
  private static readonly LAST_SESSION_KEY = '@last_playback_session';
  private static readonly PERFORMANCE_METRICS_KEY = '@music_performance_metrics';

  /**
   * 初始化音频系统
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // 检查 Sound 模块是否可用
      console.log('MusicPlayerService: Checking Sound module availability');
      console.log('Sound type:', typeof Sound);
      console.log('isRealSoundAvailable:', isRealSoundAvailable);
      
      if (typeof Sound !== 'function') {
        throw new Error('Sound constructor is not available');
      }
      
      if (!isRealSoundAvailable) {
        console.warn('MusicPlayerService: Using mock Sound implementation - audio playback will be simulated');
      }

      // 启用在静音模式下播放，支持后台播放
      Sound.setCategory('Playback', true); // true enables mixing with other audio
      
      // 初始化音频缓存服务
      AudioCacheService.initialize();
      
      // 加载保存的音量设置
      await this.loadVolumeSettings();
      
      // 加载性能指标
      await this.loadPerformanceMetrics();
      
      // 设置应用状态监听
      this.setupAppStateListener();
      
      // 尝试恢复上次播放会话
      await this.restoreLastSession();
      
      this.isInitialized = true;
      console.log('MusicPlayerService initialized with enhanced features');
    } catch (error) {
      console.error('Failed to initialize MusicPlayerService:', error);
      // Don't throw error to maintain backward compatibility
      this.isInitialized = true;
    }
  }

  /**
   * 设置应用状态监听器
   */
  private static setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  /**
   * 处理应用状态变化
   */
  private static handleAppStateChange(nextAppState: AppStateStatus): void {
    console.log('App state changed to:', nextAppState);
    
    if (nextAppState === 'background') {
      this.isInBackground = true;
      this.handleAppGoingToBackground();
    } else if (nextAppState === 'active' && this.isInBackground) {
      this.isInBackground = false;
      this.handleAppComingToForeground();
    }
  }

  /**
   * 处理应用进入后台
   */
  private static async handleAppGoingToBackground(): Promise<void> {
    try {
      console.log('App going to background, maintaining audio playback');
      
      // 保存当前播放会话
      await this.saveCurrentSession();
      
      // 记录后台播放开始时间
      if (this.playingTracks.size > 0) {
        this.performanceMetrics.backgroundPlayTime = Date.now();
      }
      
      // 在后台模式下，可以选择降低音质或调整播放参数以节省电量
      // 这里保持正常播放，因为用户可能希望继续听音乐
      
    } catch (error) {
      console.error('Error handling app going to background:', error);
    }
  }

  /**
   * 处理应用回到前台
   */
  private static async handleAppComingToForeground(): Promise<void> {
    try {
      console.log('App coming to foreground');
      
      // 更新后台播放时间统计
      if (this.performanceMetrics.backgroundPlayTime > 0) {
        const backgroundDuration = Date.now() - this.performanceMetrics.backgroundPlayTime;
        console.log(`Background playback duration: ${backgroundDuration}ms`);
        this.performanceMetrics.backgroundPlayTime = 0;
      }
      
      // 验证音频状态，确保播放正常
      await this.validateAudioState();
      
    } catch (error) {
      console.error('Error handling app coming to foreground:', error);
    }
  }

  /**
   * 验证音频状态
   */
  private static async validateAudioState(): Promise<void> {
    // 检查所有播放中的音频是否仍然有效
    for (const [musicId, track] of this.playingTracks.entries()) {
      try {
        // 这里可以添加音频状态检查逻辑
        // 如果发现音频已停止，可以尝试重新播放或从播放列表中移除
      } catch (error) {
        console.warn(`Audio validation failed for ${musicId}:`, error);
        // 移除有问题的音频
        await this.removeTrack(musicId);
      }
    }
  }

  /**
   * 添加并播放音乐轨道（优化版本）
   * @param music 音乐项目
   * @param volume 初始音量 (0-1)，默认为1
   * @param useCache 是否使用缓存，默认为true
   * @returns Promise<void>
   */
  static async addTrack(music: MusicItem, volume: number = 1.0, useCache: boolean = true): Promise<void> {
    await this.initialize();

    const startTime = Date.now();

    try {
      console.log(`MusicPlayerService: Adding track ${music.title}`);
      
      // 如果使用模拟音频，提供用户友好的提示
      if (!isRealSoundAvailable) {
        console.log('MusicPlayerService: Using simulated audio playback (react-native-sound not available)');
      }
      
      // 如果已经在播放，先停止
      if (this.playingTracks.has(music.id)) {
        await this.removeTrack(music.id);
      }

      let sound: SoundInstance;

      // 尝试从缓存获取音频
      if (useCache) {
        const cachedSound = AudioCacheService.getCachedAudio(music.id);
        if (cachedSound) {
          sound = cachedSound;
          console.log(`Using cached audio for: ${music.title}`);
        } else {
          // 预加载到缓存
          console.log(`Preloading audio for: ${music.title}`);
          sound = await AudioCacheService.preloadAudio(music);
          console.log(`Preloaded and cached audio for: ${music.title}`);
        }
      } else {
        // 直接加载音频
        console.log(`Loading audio directly for: ${music.title}`);
        sound = await this.loadAudioDirect(music);
      }

      // 验证 sound 实例
      if (!sound) {
        throw new Error(`Failed to create sound instance for: ${music.title}`);
      }

      // 设置循环播放
      if (typeof sound.setNumberOfLoops === 'function') {
        sound.setNumberOfLoops(music.isLooping ? -1 : 0);
      }
      
      // 设置音量
      const finalVolume = volume * this.masterVolume;
      if (typeof sound.setVolume === 'function') {
        sound.setVolume(finalVolume);
      }

      // 创建播放轨道记录
      const playingTrack: PlayingTrack & { soundInstance: SoundInstance } = {
        music,
        soundInstance: sound,
        volume,
        isLooping: music.isLooping,
        startTime: Date.now()
      };

      this.playingTracks.set(music.id, playingTrack);

      // 开始播放
      await new Promise<void>((resolve, reject) => {
        if (typeof sound.play !== 'function') {
          reject(new Error(`Sound instance does not have play method for: ${music.title}`));
          return;
        }

        sound.play((success: any) => {
          if (!success) {
            console.error(`Failed to play sound for ${music.title}`);
            this.playingTracks.delete(music.id);
            if (!useCache && typeof sound.release === 'function') {
              sound.release();
            }
            reject(new Error(`音频播放失败: ${music.title}`));
            return;
          }

          console.log(`Started playing: ${music.title}`);
          
          // 更新性能指标
          const loadTime = Date.now() - startTime;
          this.updatePerformanceMetrics(loadTime);
          
          resolve();
        });
      });

      // 更新当前会话
      this.updateCurrentSession();
      
      // 更新全局播放状态
      this.globalPlayState = 'playing';

    } catch (error) {
      console.error(`Error adding track ${music.title}:`, error);
      throw error;
    }
  }

  /**
   * 直接加载音频（不使用缓存）
   */
  private static async loadAudioDirect(music: MusicItem): Promise<SoundInstance> {
    return new Promise((resolve, reject) => {
      try {
        // 确保 Sound 构造函数可用
        if (typeof Sound !== 'function') {
          reject(new Error('Sound constructor is not available'));
          return;
        }

        const sound = new Sound(music.audioUrl, '', (error: any) => {
          if (error) {
            console.error(`Failed to load sound for ${music.title}:`, error);
            reject(new Error(`音频加载失败: ${music.title}`));
            return;
          }
          resolve(sound);
        });
      } catch (constructorError) {
        console.error(`Error creating Sound instance for ${music.title}:`, constructorError);
        reject(new Error(`音频构造失败: ${music.title}`));
      }
    });
  }

  /**
   * 移除并停止音乐轨道
   * @param musicId 音乐ID
   * @returns Promise<void>
   */
  static async removeTrack(musicId: string): Promise<void> {
    const track = this.playingTracks.get(musicId);
    if (!track) {
      return;
    }

    return new Promise((resolve) => {
      track.soundInstance.stop(() => {
        track.soundInstance.release();
        this.playingTracks.delete(musicId);
        console.log(`Stopped and removed track: ${track.music.title}`);
        resolve();
      });
    });
  }

  /**
   * 暂停音乐轨道
   * @param musicId 音乐ID
   * @returns Promise<void>
   */
  static async pauseTrack(musicId: string): Promise<void> {
    const track = this.playingTracks.get(musicId);
    if (!track) {
      return;
    }

    return new Promise((resolve) => {
      track.soundInstance.pause(() => {
        console.log(`Paused track: ${track.music.title}`);
        resolve();
      });
    });
  }

  /**
   * 恢复播放音乐轨道
   * @param musicId 音乐ID
   * @returns Promise<void>
   */
  static async resumeTrack(musicId: string): Promise<void> {
    const track = this.playingTracks.get(musicId);
    if (!track) {
      return;
    }

    return new Promise((resolve) => {
      track.soundInstance.play((success: any) => {
        if (success) {
          console.log(`Resumed track: ${track.music.title}`);
        } else {
          console.error(`Failed to resume track: ${track.music.title}`);
        }
        resolve();
      });
    });
  }

  /**
   * 停止所有音乐轨道
   * @returns Promise<void>
   */
  static async stopAllTracks(): Promise<void> {
    const promises = Array.from(this.playingTracks.keys()).map(musicId => 
      this.removeTrack(musicId)
    );
    
    await Promise.all(promises);
    this.globalPlayState = 'stopped';
    console.log('Stopped all tracks');
  }

  /**
   * 暂停所有音乐轨道
   * @returns Promise<void>
   */
  static async pauseAllTracks(): Promise<void> {
    const promises = Array.from(this.playingTracks.keys()).map(musicId => 
      this.pauseTrack(musicId)
    );
    
    await Promise.all(promises);
    this.globalPlayState = 'paused';
    console.log('Paused all tracks');
  }

  /**
   * 恢复播放所有音乐轨道
   * @returns Promise<void>
   */
  static async resumeAllTracks(): Promise<void> {
    const promises = Array.from(this.playingTracks.keys()).map(musicId => 
      this.resumeTrack(musicId)
    );
    
    await Promise.all(promises);
    if (this.playingTracks.size > 0) {
      this.globalPlayState = 'playing';
    }
    console.log('Resumed all tracks');
  }

  /**
   * 设置特定轨道的音量
   * @param musicId 音乐ID
   * @param volume 音量 (0-1)
   * @returns Promise<void>
   */
  static async setTrackVolume(musicId: string, volume: number): Promise<void> {
    const track = this.playingTracks.get(musicId);
    if (!track) {
      return;
    }

    // 限制音量范围
    const clampedVolume = Math.max(0, Math.min(1, volume));
    track.volume = clampedVolume;
    
    // 应用主音量
    const finalVolume = clampedVolume * this.masterVolume;
    track.soundInstance.setVolume(finalVolume);
    
    console.log(`Set volume for ${track.music.title}: ${clampedVolume} (final: ${finalVolume})`);
  }



  /**
   * 淡入音乐轨道
   * @param musicId 音乐ID
   * @param duration 淡入时长（毫秒）
   * @returns Promise<void>
   */
  static async fadeInTrack(musicId: string, duration: number = 2000): Promise<void> {
    const track = this.playingTracks.get(musicId);
    if (!track) {
      return;
    }

    const targetVolume = track.volume;
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = targetVolume / steps;

    // 从0开始淡入
    track.soundInstance.setVolume(0);

    return new Promise((resolve) => {
      let currentStep = 0;
      
      const fadeInterval = setInterval(() => {
        currentStep++;
        const currentVolume = volumeStep * currentStep;
        const finalVolume = currentVolume * this.masterVolume;
        
        track.soundInstance.setVolume(finalVolume);

        if (currentStep >= steps) {
          clearInterval(fadeInterval);
          console.log(`Fade in completed for ${track.music.title}`);
          resolve();
        }
      }, stepDuration);
    });
  }

  /**
   * 淡出音乐轨道
   * @param musicId 音乐ID
   * @param duration 淡出时长（毫秒）
   * @returns Promise<void>
   */
  static async fadeOutTrack(musicId: string, duration: number = 2000): Promise<void> {
    const track = this.playingTracks.get(musicId);
    if (!track) {
      return;
    }

    const initialVolume = track.volume;
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = initialVolume / steps;

    return new Promise((resolve) => {
      let currentStep = 0;
      
      const fadeInterval = setInterval(() => {
        currentStep++;
        const currentVolume = initialVolume - (volumeStep * currentStep);
        const finalVolume = Math.max(0, currentVolume * this.masterVolume);
        
        track.soundInstance.setVolume(finalVolume);

        if (currentStep >= steps) {
          clearInterval(fadeInterval);
          console.log(`Fade out completed for ${track.music.title}`);
          resolve();
        }
      }, stepDuration);
    });
  }

  /**
   * 获取当前播放的音乐轨道列表
   * @returns PlayingTrack[]
   */
  static getPlayingTracks(): PlayingTrack[] {
    return Array.from(this.playingTracks.values()).map(track => ({
      music: track.music,
      volume: track.volume,
      isLooping: track.isLooping,
      startTime: track.startTime
    }));
  }

  /**
   * 检查特定音乐是否正在播放
   * @param musicId 音乐ID
   * @returns boolean
   */
  static isTrackPlaying(musicId: string): boolean {
    return this.playingTracks.has(musicId);
  }

  /**
   * 获取特定轨道的音量
   * @param musicId 音乐ID
   * @returns number 音量值 (0-1)，如果轨道不存在返回0
   */
  static getTrackVolume(musicId: string): number {
    const track = this.playingTracks.get(musicId);
    return track ? track.volume : 0;
  }

  /**
   * 获取主音量
   * @returns number 主音量值 (0-1)
   */
  static getMasterVolume(): number {
    return this.masterVolume;
  }

  /**
   * 获取当前播放轨道数量
   * @returns number
   */
  static getPlayingTrackCount(): number {
    return this.playingTracks.size;
  }

  /**
   * 检查是否有任何音乐在播放
   * @returns boolean
   */
  static isAnyTrackPlaying(): boolean {
    return this.playingTracks.size > 0;
  }

  /**
   * 获取全局播放状态
   * @returns 'playing' | 'paused' | 'stopped'
   */
  static getGlobalPlayState(): 'playing' | 'paused' | 'stopped' {
    return this.globalPlayState;
  }

  /**
   * 切换全局播放状态（播放/暂停）
   * @returns Promise<'playing' | 'paused'>
   */
  static async toggleGlobalPlayback(): Promise<'playing' | 'paused'> {
    if (this.playingTracks.size === 0) {
      return 'paused';
    }

    if (this.globalPlayState === 'playing') {
      await this.pauseAllTracks();
      return 'paused';
    } else {
      await this.resumeAllTracks();
      return 'playing';
    }
  }



  /**
   * 获取轨道播放时长（毫秒）
   * @param musicId 音乐ID
   * @returns number 播放时长，如果轨道不存在返回0
   */
  static getTrackPlayTime(musicId: string): number {
    const track = this.playingTracks.get(musicId);
    if (!track) {
      return 0;
    }
    
    return Date.now() - track.startTime;
  }

  /**
   * 批量设置多个轨道的音量
   * @param volumeSettings 音量设置映射 { musicId: volume }
   * @returns Promise<void>
   */
  static async setBatchTrackVolumes(volumeSettings: Record<string, number>): Promise<void> {
    const promises = Object.entries(volumeSettings).map(([musicId, volume]) =>
      this.setTrackVolume(musicId, volume)
    );
    
    await Promise.all(promises);
    console.log('Batch volume update completed');
  }

  /**
   * 获取所有轨道的音量设置
   * @returns Record<string, number> 音量设置映射
   */
  static getAllTrackVolumes(): Record<string, number> {
    const volumes: Record<string, number> = {};
    
    this.playingTracks.forEach((track, musicId) => {
      volumes[musicId] = track.volume;
    });
    
    return volumes;
  }

  /**
   * 更新当前播放会话
   */
  private static updateCurrentSession(): void {
    this.currentSession = {
      sessionId: `session_${Date.now()}`,
      startTime: Date.now(),
      tracks: Array.from(this.playingTracks.keys()),
      masterVolume: this.masterVolume,
    };
  }

  /**
   * 保存当前播放会话
   */
  private static async saveCurrentSession(): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    try {
      await AsyncStorage.setItem(this.LAST_SESSION_KEY, JSON.stringify(this.currentSession));
    } catch (error) {
      console.error('Failed to save current session:', error);
    }
  }

  /**
   * 恢复上次播放会话
   */
  private static async restoreLastSession(): Promise<void> {
    try {
      const sessionJson = await AsyncStorage.getItem(this.LAST_SESSION_KEY);
      if (sessionJson) {
        const session: PlaybackSession = JSON.parse(sessionJson);
        console.log('Found previous session:', session);
        
        // 这里可以选择是否自动恢复播放
        // 目前只是记录，不自动恢复播放以避免意外的音频播放
      }
    } catch (error) {
      console.error('Failed to restore last session:', error);
    }
  }

  /**
   * 加载音量设置
   */
  private static async loadVolumeSettings(): Promise<void> {
    try {
      const settingsJson = await AsyncStorage.getItem(this.VOLUME_SETTINGS_KEY);
      if (settingsJson) {
        const settings = JSON.parse(settingsJson);
        this.masterVolume = settings.masterVolume || 0.7;
        console.log(`Loaded volume settings: master=${this.masterVolume}`);
      }
    } catch (error) {
      console.error('Failed to load volume settings:', error);
    }
  }

  /**
   * 保存音量设置
   */
  private static async saveVolumeSettings(): Promise<void> {
    try {
      const settings = {
        masterVolume: this.masterVolume,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(this.VOLUME_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save volume settings:', error);
    }
  }

  /**
   * 更新性能指标
   */
  private static updatePerformanceMetrics(loadTime: number): void {
    this.performanceMetrics.tracksPlayed++;
    
    // 更新平均加载时间
    const totalLoadTime = this.performanceMetrics.averageLoadTime * (this.performanceMetrics.tracksPlayed - 1) + loadTime;
    this.performanceMetrics.averageLoadTime = totalLoadTime / this.performanceMetrics.tracksPlayed;
    
    // 估算内存使用
    this.performanceMetrics.memoryUsage = this.playingTracks.size * 0.3; // 假设每个音频约0.3MB
    
    // 保存性能指标
    this.savePerformanceMetrics();
  }

  /**
   * 加载性能指标
   */
  private static async loadPerformanceMetrics(): Promise<void> {
    try {
      const metricsJson = await AsyncStorage.getItem(this.PERFORMANCE_METRICS_KEY);
      if (metricsJson) {
        const savedMetrics = JSON.parse(metricsJson);
        this.performanceMetrics = { ...this.performanceMetrics, ...savedMetrics };
      }
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
    }
  }

  /**
   * 保存性能指标
   */
  private static async savePerformanceMetrics(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.PERFORMANCE_METRICS_KEY, JSON.stringify(this.performanceMetrics));
    } catch (error) {
      console.error('Failed to save performance metrics:', error);
    }
  }

  /**
   * 获取性能指标
   */
  static getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * 获取性能报告
   */
  static getPerformanceReport(): {
    tracksPlayed: number;
    averageLoadTime: string;
    memoryUsage: string;
    cacheStats: any;
    recommendations: string[];
  } {
    const cacheStats = AudioCacheService.getCacheStats();
    const recommendations: string[] = [];

    if (this.performanceMetrics.averageLoadTime > 2000) {
      recommendations.push('音频加载时间较长，建议检查网络连接或增加缓存');
    }

    if (this.performanceMetrics.memoryUsage > 5) {
      recommendations.push('内存使用较高，建议减少同时播放的音频数量');
    }

    if (cacheStats.hitRate < 50) {
      recommendations.push('缓存命中率较低，建议优化预加载策略');
    }

    return {
      tracksPlayed: this.performanceMetrics.tracksPlayed,
      averageLoadTime: `${this.performanceMetrics.averageLoadTime.toFixed(0)}ms`,
      memoryUsage: `${this.performanceMetrics.memoryUsage.toFixed(1)}MB`,
      cacheStats,
      recommendations,
    };
  }

  /**
   * 优化内存使用
   */
  static async optimizeMemoryUsage(): Promise<void> {
    console.log('Optimizing memory usage');
    
    // 清理音频缓存
    await AudioCacheService.cleanupCache();
    
    // 如果播放的音频过多，停止一些较早的音频
    if (this.playingTracks.size > 5) {
      const tracksArray = Array.from(this.playingTracks.entries());
      const oldestTracks = tracksArray
        .sort(([, a], [, b]) => a.startTime - b.startTime)
        .slice(0, this.playingTracks.size - 5);
      
      for (const [musicId] of oldestTracks) {
        await this.removeTrack(musicId);
        console.log(`Removed old track for memory optimization: ${musicId}`);
      }
    }
    
    // 更新内存使用统计
    this.performanceMetrics.memoryUsage = this.playingTracks.size * 0.3;
    
    console.log('Memory optimization completed');
  }

  /**
   * 设置主音量（增强版本）
   */
  static async setMasterVolume(volume: number): Promise<void> {
    // 限制音量范围
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.masterVolume = clampedVolume;

    // 更新所有轨道的音量
    const promises = Array.from(this.playingTracks.values()).map(track => {
      const finalVolume = track.volume * this.masterVolume;
      track.soundInstance.setVolume(finalVolume);
      return Promise.resolve();
    });

    await Promise.all(promises);
    
    // 保存音量设置
    await this.saveVolumeSettings();
    
    console.log(`Set master volume: ${clampedVolume}`);
  }

  /**
   * 清理所有资源（增强版本）
   */
  static async cleanup(): Promise<void> {
    console.log('Starting MusicPlayerService cleanup');
    
    // 移除应用状态监听器
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    
    // 停止所有音频
    await this.stopAllTracks();
    
    // 清理音频缓存
    await AudioCacheService.clearAllCache();
    
    // 保存最终的性能指标
    await this.savePerformanceMetrics();
    
    // 重置状态
    this.masterVolume = 1.0;
    this.isInitialized = false;
    this.currentSession = null;
    this.isInBackground = false;
    
    console.log('MusicPlayerService cleanup completed');
  }

  /**
   * 检查是否支持后台播放
   */
  static isBackgroundPlaybackSupported(): boolean {
    // 在实际应用中，这里可以检查设备和权限
    return true;
  }

  /**
   * 获取当前播放会话信息
   */
  static getCurrentSession(): PlaybackSession | null {
    return this.currentSession;
  }

  /**
   * 批量预加载音频
   */
  static async preloadAudioBatch(musicList: MusicItem[]): Promise<void> {
    console.log(`Preloading ${musicList.length} audio files`);
    await AudioCacheService.batchPreloadAudio(musicList, 3);
  }

  /**
   * 智能预加载
   */
  static async smartPreload(
    recentlyPlayed: MusicItem[],
    favorites: MusicItem[],
    currentCategory: string,
    allMusic: MusicItem[]
  ): Promise<void> {
    await AudioCacheService.smartPreload(recentlyPlayed, favorites, currentCategory, allMusic);
  }
}