import { MusicPlayerService } from '../MusicPlayerService';
import { MusicItem } from '../../types/music';

// Simple mock for react-native-sound
jest.mock('react-native-sound', () => {
  const MockSound = jest.fn().mockImplementation(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    release: jest.fn(),
    setVolume: jest.fn(),
    setNumberOfLoops: jest.fn(),
  }));
  
  MockSound.setCategory = jest.fn();
  return MockSound;
});

describe('MusicPlayerService - Core Functionality', () => {
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

  beforeEach(async () => {
    await MusicPlayerService.cleanup();
  });

  describe('初始化和基本状态', () => {
    it('应该正确初始化', () => {
      expect(MusicPlayerService.getPlayingTrackCount()).toBe(0);
      expect(MusicPlayerService.isAnyTrackPlaying()).toBe(false);
      expect(MusicPlayerService.getMasterVolume()).toBe(1.0);
    });

    it('应该能够检查轨道播放状态', () => {
      expect(MusicPlayerService.isTrackPlaying('non-existent')).toBe(false);
      expect(MusicPlayerService.getTrackVolume('non-existent')).toBe(0);
      expect(MusicPlayerService.getTrackPlayTime('non-existent')).toBe(0);
    });
  });

  describe('音量控制', () => {
    it('应该能够设置和获取主音量', async () => {
      await MusicPlayerService.setMasterVolume(0.8);
      expect(MusicPlayerService.getMasterVolume()).toBe(0.8);
    });

    it('应该限制主音量范围', async () => {
      await MusicPlayerService.setMasterVolume(1.5);
      expect(MusicPlayerService.getMasterVolume()).toBe(1.0);
      
      await MusicPlayerService.setMasterVolume(-0.5);
      expect(MusicPlayerService.getMasterVolume()).toBe(0.0);
    });
  });

  describe('状态查询', () => {
    it('应该返回空的播放轨道列表', () => {
      const tracks = MusicPlayerService.getPlayingTracks();
      expect(tracks).toEqual([]);
    });

    it('应该返回空的音量设置', () => {
      const volumes = MusicPlayerService.getAllTrackVolumes();
      expect(volumes).toEqual({});
    });
  });

  describe('错误处理', () => {
    it('应该优雅处理不存在轨道的操作', async () => {
      // 这些操作不应该抛出错误
      await expect(MusicPlayerService.removeTrack('non-existent')).resolves.toBeUndefined();
      await expect(MusicPlayerService.pauseTrack('non-existent')).resolves.toBeUndefined();
      await expect(MusicPlayerService.resumeTrack('non-existent')).resolves.toBeUndefined();
      await expect(MusicPlayerService.setTrackVolume('non-existent', 0.5)).resolves.toBeUndefined();
      await expect(MusicPlayerService.fadeInTrack('non-existent', 1000)).resolves.toBeUndefined();
      await expect(MusicPlayerService.fadeOutTrack('non-existent', 1000)).resolves.toBeUndefined();
    });
  });

  describe('批量操作', () => {
    it('应该能够批量设置音量', async () => {
      const volumeSettings = {
        'track1': 0.5,
        'track2': 0.8,
      };
      
      // 应该不抛出错误，即使轨道不存在
      await expect(MusicPlayerService.setBatchTrackVolumes(volumeSettings)).resolves.toBeUndefined();
    });

    it('应该能够停止所有轨道', async () => {
      await expect(MusicPlayerService.stopAllTracks()).resolves.toBeUndefined();
      expect(MusicPlayerService.getPlayingTrackCount()).toBe(0);
    });

    it('应该能够暂停所有轨道', async () => {
      await expect(MusicPlayerService.pauseAllTracks()).resolves.toBeUndefined();
    });

    it('应该能够恢复所有轨道', async () => {
      await expect(MusicPlayerService.resumeAllTracks()).resolves.toBeUndefined();
    });
  });

  describe('资源清理', () => {
    it('应该能够清理资源', async () => {
      await MusicPlayerService.cleanup();
      expect(MusicPlayerService.getPlayingTrackCount()).toBe(0);
      expect(MusicPlayerService.getMasterVolume()).toBe(1.0);
    });
  });
});