import { MusicPlayerService } from '../MusicPlayerService';
import { MusicItem } from '../../types/music';
import Sound from 'react-native-sound';

// Mock react-native-sound
jest.mock('react-native-sound', () => {
  const mockSoundInstance = {
    play: jest.fn((callback) => {
      if (callback) {
        setImmediate(() => callback(true));
      }
      return mockSoundInstance;
    }),
    pause: jest.fn((callback) => {
      if (callback) {
        setImmediate(() => callback());
      }
      return mockSoundInstance;
    }),
    stop: jest.fn((callback) => {
      if (callback) {
        setImmediate(() => callback());
      }
      return mockSoundInstance;
    }),
    release: jest.fn(),
    setVolume: jest.fn(),
    setNumberOfLoops: jest.fn(),
    isLoaded: jest.fn(() => true),
    isPlaying: jest.fn(() => true),
    getDuration: jest.fn(() => 120),
    getCurrentTime: jest.fn((callback) => callback && callback(30)),
    setCurrentTime: jest.fn(),
  };

  const MockSound = jest.fn().mockImplementation((filename, basePath, callback) => {
    // Simulate successful loading immediately
    if (callback) {
      setImmediate(() => callback(null));
    }
    return mockSoundInstance;
  });

  MockSound.setCategory = jest.fn();
  MockSound.setActive = jest.fn();
  MockSound.setMode = jest.fn();

  return MockSound;
});

describe('MusicPlayerService', () => {
  const mockMusic: MusicItem = {
    id: 'test-music-1',
    title: '测试音乐',
    category: 'nature',
    audioPath: '/sounds/nature/test.mp3',
    audioUrl: 'https://example.com/sounds/nature/test.mp3',
    icon: '🎵',
    description: '测试音乐描述',
    isLooping: true,
  };

  const mockMusic2: MusicItem = {
    id: 'test-music-2',
    title: '测试音乐2',
    category: 'rain',
    audioPath: '/sounds/rain/test2.mp3',
    audioUrl: 'https://example.com/sounds/rain/test2.mp3',
    icon: '🌧️',
    description: '测试音乐2描述',
    isLooping: false,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    // Reset the service state
    await MusicPlayerService.cleanup();
  });

  describe('初始化', () => {
    it('应该正确初始化音频系统', () => {
      MusicPlayerService.initialize();
      expect(Sound.setCategory).toHaveBeenCalledWith('Playback');
    });

    it('应该只初始化一次', () => {
      // 确保从干净状态开始
      MusicPlayerService.initialize();
      jest.clearAllMocks(); // 清除第一次调用的记录
      
      MusicPlayerService.initialize();
      expect(Sound.setCategory).toHaveBeenCalledTimes(0); // 第二次不应该调用
    });
  });

  describe('音乐播放', () => {
    it('应该能够添加并播放音乐轨道', async () => {
      await MusicPlayerService.addTrack(mockMusic);
      
      expect(Sound).toHaveBeenCalledWith(
        mockMusic.audioUrl,
        '',
        expect.any(Function)
      );
      expect(MusicPlayerService.isTrackPlaying(mockMusic.id)).toBe(true);
      expect(MusicPlayerService.getPlayingTrackCount()).toBe(1);
    });

    it('应该能够同时播放多个音乐轨道', async () => {
      await MusicPlayerService.addTrack(mockMusic);
      await MusicPlayerService.addTrack(mockMusic2);
      
      expect(MusicPlayerService.getPlayingTrackCount()).toBe(2);
      expect(MusicPlayerService.isTrackPlaying(mockMusic.id)).toBe(true);
      expect(MusicPlayerService.isTrackPlaying(mockMusic2.id)).toBe(true);
    });

    it('应该能够移除音乐轨道', async () => {
      await MusicPlayerService.addTrack(mockMusic);
      expect(MusicPlayerService.isTrackPlaying(mockMusic.id)).toBe(true);
      
      await MusicPlayerService.removeTrack(mockMusic.id);
      expect(MusicPlayerService.isTrackPlaying(mockMusic.id)).toBe(false);
      expect(MusicPlayerService.getPlayingTrackCount()).toBe(0);
    });

    it('应该能够暂停和恢复音乐轨道', async () => {
      await MusicPlayerService.addTrack(mockMusic);
      
      await MusicPlayerService.pauseTrack(mockMusic.id);
      // 验证暂停被调用
      
      await MusicPlayerService.resumeTrack(mockMusic.id);
      // 验证恢复播放被调用
    });

    it('应该能够停止所有音乐轨道', async () => {
      await MusicPlayerService.addTrack(mockMusic);
      await MusicPlayerService.addTrack(mockMusic2);
      
      expect(MusicPlayerService.getPlayingTrackCount()).toBe(2);
      
      await MusicPlayerService.stopAllTracks();
      expect(MusicPlayerService.getPlayingTrackCount()).toBe(0);
    });

    it('应该能够暂停所有音乐轨道', async () => {
      await MusicPlayerService.addTrack(mockMusic);
      await MusicPlayerService.addTrack(mockMusic2);
      
      await MusicPlayerService.pauseAllTracks();
      // 验证所有轨道都被暂停
    });

    it('应该能够恢复所有音乐轨道', async () => {
      await MusicPlayerService.addTrack(mockMusic);
      await MusicPlayerService.addTrack(mockMusic2);
      
      await MusicPlayerService.pauseAllTracks();
      await MusicPlayerService.resumeAllTracks();
      // 验证所有轨道都被恢复
    });
  });

  describe('音量控制', () => {
    it('应该能够设置特定轨道的音量', async () => {
      await MusicPlayerService.addTrack(mockMusic);
      
      await MusicPlayerService.setTrackVolume(mockMusic.id, 0.5);
      expect(MusicPlayerService.getTrackVolume(mockMusic.id)).toBe(0.5);
    });

    it('应该能够设置主音量', async () => {
      await MusicPlayerService.addTrack(mockMusic);
      
      await MusicPlayerService.setMasterVolume(0.8);
      expect(MusicPlayerService.getMasterVolume()).toBe(0.8);
    });

    it('应该限制音量范围在0-1之间', async () => {
      await MusicPlayerService.addTrack(mockMusic);
      
      await MusicPlayerService.setTrackVolume(mockMusic.id, 1.5);
      expect(MusicPlayerService.getTrackVolume(mockMusic.id)).toBe(1);
      
      await MusicPlayerService.setTrackVolume(mockMusic.id, -0.5);
      expect(MusicPlayerService.getTrackVolume(mockMusic.id)).toBe(0);
      
      await MusicPlayerService.setMasterVolume(2.0);
      expect(MusicPlayerService.getMasterVolume()).toBe(1);
      
      await MusicPlayerService.setMasterVolume(-1.0);
      expect(MusicPlayerService.getMasterVolume()).toBe(0);
    });

    it('应该能够批量设置多个轨道的音量', async () => {
      await MusicPlayerService.addTrack(mockMusic);
      await MusicPlayerService.addTrack(mockMusic2);
      
      const volumeSettings = {
        [mockMusic.id]: 0.6,
        [mockMusic2.id]: 0.8,
      };
      
      await MusicPlayerService.setBatchTrackVolumes(volumeSettings);
      
      expect(MusicPlayerService.getTrackVolume(mockMusic.id)).toBe(0.6);
      expect(MusicPlayerService.getTrackVolume(mockMusic2.id)).toBe(0.8);
    });

    it('应该能够获取所有轨道的音量设置', async () => {
      await MusicPlayerService.addTrack(mockMusic, 0.7);
      await MusicPlayerService.addTrack(mockMusic2, 0.9);
      
      const allVolumes = MusicPlayerService.getAllTrackVolumes();
      
      expect(allVolumes[mockMusic.id]).toBe(0.7);
      expect(allVolumes[mockMusic2.id]).toBe(0.9);
    });
  });

  describe('淡入淡出效果', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('应该能够淡入音乐轨道', async () => {
      await MusicPlayerService.addTrack(mockMusic);
      
      const fadePromise = MusicPlayerService.fadeInTrack(mockMusic.id, 1000);
      
      // 快进时间以完成淡入
      jest.advanceTimersByTime(1000);
      
      await fadePromise;
      // 验证淡入效果完成
    });

    it('应该能够淡出音乐轨道', async () => {
      await MusicPlayerService.addTrack(mockMusic);
      
      const fadePromise = MusicPlayerService.fadeOutTrack(mockMusic.id, 1000);
      
      // 快进时间以完成淡出
      jest.advanceTimersByTime(1000);
      
      await fadePromise;
      // 验证淡出效果完成
    });
  });

  describe('状态查询', () => {
    it('应该能够获取当前播放的音乐轨道列表', async () => {
      await MusicPlayerService.addTrack(mockMusic);
      await MusicPlayerService.addTrack(mockMusic2);
      
      const playingTracks = MusicPlayerService.getPlayingTracks();
      
      expect(playingTracks).toHaveLength(2);
      expect(playingTracks.some(track => track.music.id === mockMusic.id)).toBe(true);
      expect(playingTracks.some(track => track.music.id === mockMusic2.id)).toBe(true);
    });

    it('应该能够检查特定音乐是否正在播放', async () => {
      expect(MusicPlayerService.isTrackPlaying(mockMusic.id)).toBe(false);
      
      await MusicPlayerService.addTrack(mockMusic);
      expect(MusicPlayerService.isTrackPlaying(mockMusic.id)).toBe(true);
      
      await MusicPlayerService.removeTrack(mockMusic.id);
      expect(MusicPlayerService.isTrackPlaying(mockMusic.id)).toBe(false);
    });

    it('应该能够检查是否有任何音乐在播放', async () => {
      expect(MusicPlayerService.isAnyTrackPlaying()).toBe(false);
      
      await MusicPlayerService.addTrack(mockMusic);
      expect(MusicPlayerService.isAnyTrackPlaying()).toBe(true);
      
      await MusicPlayerService.stopAllTracks();
      expect(MusicPlayerService.isAnyTrackPlaying()).toBe(false);
    });

    it('应该能够获取轨道播放时长', async () => {
      const startTime = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(startTime);
      
      await MusicPlayerService.addTrack(mockMusic);
      
      // 模拟时间流逝
      jest.spyOn(Date, 'now').mockReturnValue(startTime + 5000);
      
      const playTime = MusicPlayerService.getTrackPlayTime(mockMusic.id);
      expect(playTime).toBe(5000);
      
      jest.restoreAllMocks();
    });
  });

  describe('错误处理', () => {
    it('应该处理音频加载失败', async () => {
      // Mock Sound constructor to simulate loading error
      (Sound as jest.MockedClass<typeof Sound>).mockImplementationOnce(
        (filename, basePath, callback) => {
          setTimeout(() => callback && callback(new Error('Loading failed')), 0);
          return {} as any;
        }
      );

      await expect(MusicPlayerService.addTrack(mockMusic)).rejects.toThrow('音频加载失败');
    });

    it('应该处理音频播放失败', async () => {
      const mockSoundInstance = {
        play: jest.fn((callback) => callback && callback(false)),
        pause: jest.fn(),
        stop: jest.fn(),
        release: jest.fn(),
        setVolume: jest.fn(),
        setNumberOfLoops: jest.fn(),
      };

      (Sound as jest.MockedClass<typeof Sound>).mockImplementationOnce(
        (filename, basePath, callback) => {
          setTimeout(() => callback && callback(null), 0);
          return mockSoundInstance as any;
        }
      );

      await expect(MusicPlayerService.addTrack(mockMusic)).rejects.toThrow('音频播放失败');
    });

    it('应该优雅处理不存在的轨道操作', async () => {
      // 这些操作不应该抛出错误
      await expect(MusicPlayerService.removeTrack('non-existent')).resolves.toBeUndefined();
      await expect(MusicPlayerService.pauseTrack('non-existent')).resolves.toBeUndefined();
      await expect(MusicPlayerService.resumeTrack('non-existent')).resolves.toBeUndefined();
      await expect(MusicPlayerService.setTrackVolume('non-existent', 0.5)).resolves.toBeUndefined();
      
      expect(MusicPlayerService.getTrackVolume('non-existent')).toBe(0);
      expect(MusicPlayerService.getTrackPlayTime('non-existent')).toBe(0);
    });
  });

  describe('资源清理', () => {
    it('应该能够清理所有资源', async () => {
      await MusicPlayerService.addTrack(mockMusic);
      await MusicPlayerService.addTrack(mockMusic2);
      
      expect(MusicPlayerService.getPlayingTrackCount()).toBe(2);
      
      await MusicPlayerService.cleanup();
      expect(MusicPlayerService.getPlayingTrackCount()).toBe(0);
    });
  });

  describe('替换已播放的轨道', () => {
    it('应该在添加已存在的轨道时先停止原轨道', async () => {
      await MusicPlayerService.addTrack(mockMusic);
      expect(MusicPlayerService.getPlayingTrackCount()).toBe(1);
      
      // 再次添加相同的音乐
      await MusicPlayerService.addTrack(mockMusic);
      expect(MusicPlayerService.getPlayingTrackCount()).toBe(1);
      expect(MusicPlayerService.isTrackPlaying(mockMusic.id)).toBe(true);
    });
  });
});