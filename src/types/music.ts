/**
 * 音乐相关的TypeScript接口和类型定义
 */

export interface MusicItem {
  id: string;                    // 唯一标识符
  title: string;                 // 音乐标题
  category: string;              // 音乐分类
  audioPath: string;             // 音频文件相对路径
  audioUrl: string;              // 完整音频文件URL（由baseUrl + audioPath组成）
  icon: string;                  // 音乐图标（emoji）
  description?: string;          // 描述
  isLooping: boolean;            // 是否循环播放（默认true）
}

export interface MusicCategory {
  id: string;                    // 分类ID
  name: string;                  // 分类名称
  icon: string;                  // 分类图标（emoji）
  description?: string;          // 分类描述
}

export interface MusicConfig {
  baseUrl: string;               // 音频资源基础URL
  categories: MusicCategory[];   // 音乐分类列表
  musicItems: MusicItem[];       // 所有音乐项目
}

export interface PlayingTrack {
  music: MusicItem;              // 音乐信息
  volume: number;                // 该轨道的音量 (0-1)
  isLooping: boolean;            // 是否循环播放
  startTime: number;             // 开始播放时间戳
}

export interface PlaybackState {
  isPlaying: boolean;                    // 是否有音乐在播放
  playingTracks: PlayingTrack[];         // 当前播放的音乐轨道列表
  masterVolume: number;                  // 主音量 (0-1)
}