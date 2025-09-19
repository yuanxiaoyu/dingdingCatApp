import { MusicPlayerService } from '../MusicPlayerService';
import { MusicItem } from '../../types/music';

// Mock react-native-sound
const mockSound = jest.fn().mockImplementation((url, basePath, callback) => {
  // Simulate successful loading
  setTimeout(() => callback(null), 10);
  
  return {
    play: jest.fn((callback) => {
      setTimeout(() => callback(true), 10);
    }),
    pause: jest.fn((callback) => {
      setTimeout(() => callback(), 10);
    }),
    stop: jest.fn((callback) => {
      setTimeout(() => callback(), 10);
    }),
    release: jest.fn(),
    setVolume: jest.fn(),
    setNumberOfLoops: jest.fn(),
  };
});

// Add setCategory as a static method
mockSound.setCategory = jest.fn();

jest.mock('react-native-sound', () => mockSound);

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock AppState
jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

describe('Global Playback Control', () => {
  const mockMusic1: MusicItem = {
    id: 'test1',
    title: '测试音乐1',
    audioUrl: 'test1.mp3',
    icon: '🎵',
    category: 'nature',
    isLooping: true,
  };

  const mockMusic2: MusicItem = {
    id: 'test2',
    title: '测试音乐2',
    audioUrl: 'test2.mp3',
    icon: '🎶',
    category: 'nature',
    isLooping: true,
  };

  beforeEach(async () => {
    // Reset service state
    await MusicPlayerService.cleanup();
    await MusicPlayerService.initialize();
  });

  afterEach(async () => {
    await MusicPlayerService.cleanup();
  });

  describe('全局播放状态管理', () => {
    it('应该正确初始化全局播放状态', () => {
      expect(MusicPlayerService.getGlobalPlayState()).toBe('stopped');
    });

    it('应该在添加音乐后更新全局播放状态', async () => {
      await MusicPlayerService.addTrack(mockMusic1);
      expect(MusicPlayerService.getGlobalPlayState()).toBe('playing');
    });

    it('应该在暂停所有音乐后更新全局播放状态', async () => {
      await MusicPlayerService.addTrack(mockMusic1);
      await MusicPlayerService.pauseAllTracks();
      expect(MusicPlayerService.getGlobalPlayState()).toBe('paused');
    });

    it('应该在恢复播放后更新全局播放状态', async () => {
      await MusicPlayerService.addTrack(mockMusic1);
      await MusicPlayerService.pauseAllTracks();
      await MusicPlayerService.resumeAllTracks();
      expect(MusicPlayerService.getGlobalPlayState()).toBe('playing');
    });

    it('应该在停止所有音乐后更新全局播放状态', async () => {
      await MusicPlayerService.addTrack(mockMusic1);
      await MusicPlayerService.stopAllTracks();
      expect(MusicPlayerService.getGlobalPlayState()).toBe('stopped');
    });
  });

  describe('全局播放切换', () => {
    it('应该能够切换播放状态', async () => {
      await MusicPlayerService.addTrack(mockMusic1);
      
      // 从播放切换到暂停
      const state1 = await MusicPlayerService.toggleGlobalPlayback();
      expect(state1).toBe('paused');
      expect(MusicPlayerService.getGlobalPlayState()).toBe('paused');
      
      // 从暂停切换到播放
      const state2 = await MusicPlayerService.toggleGlobalPlayback();
      expect(state2).toBe('playing');
      expect(MusicPlayerService.getGlobalPlayState()).toBe('playing');
    });

    it('应该在没有音乐时返回暂停状态', async () => {
      const state = await MusicPlayerService.toggleGlobalPlayback();
      expect(state).toBe('paused');
    });

    it('应该能够控制多个音乐轨道', async () => {
      await MusicPlayerService.addTrack(mockMusic1);
      await MusicPlayerService.addTrack(mockMusic2);
      
      expect(MusicPlayerService.getPlayingTrackCount()).toBe(2);
      expect(MusicPlayerService.getGlobalPlayState()).toBe('playing');
      
      // 暂停所有
      await MusicPlayerService.toggleGlobalPlayback();
      expect(MusicPlayerService.getGlobalPlayState()).toBe('paused');
      
      // 恢复所有
      await MusicPlayerService.toggleGlobalPlayback();
      expect(MusicPlayerService.getGlobalPlayState()).toBe('playing');
    });
  });

  describe('状态查询', () => {
    it('应该正确报告是否有音乐在播放', async () => {
      expect(MusicPlayerService.isAnyTrackPlaying()).toBe(false);
      
      await MusicPlayerService.addTrack(mockMusic1);
      expect(MusicPlayerService.isAnyTrackPlaying()).toBe(true);
      
      await MusicPlayerService.stopAllTracks();
      expect(MusicPlayerService.isAnyTrackPlaying()).toBe(false);
    });

    it('应该正确返回播放轨道数量', async () => {
      expect(MusicPlayerService.getPlayingTrackCount()).toBe(0);
      
      await MusicPlayerService.addTrack(mockMusic1);
      expect(MusicPlayerService.getPlayingTrackCount()).toBe(1);
      
      await MusicPlayerService.addTrack(mockMusic2);
      expect(MusicPlayerService.getPlayingTrackCount()).toBe(2);
      
      await MusicPlayerService.removeTrack(mockMusic1.id);
      expect(MusicPlayerService.getPlayingTrackCount()).toBe(1);
    });
  });
});