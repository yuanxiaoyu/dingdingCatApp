import { configureStore } from '@reduxjs/toolkit';
import musicReducer, {
  clearError,
  togglePlaybackPanel,
  setPlaybackPanelVisible,
  updatePlayingTracks,
  loadMusicData,
  playMusic,
  pauseAllMusic,
  resumeAllMusic,
  stopAllMusic,
  setTrackVolume,
  setMasterVolume,
  selectMusicState,
  selectIsTrackPlaying,
  selectTrackVolume,
} from '../musicSlice';
import { MusicItem, PlayingTrack } from '../../../types/music';

// Mock react-native-sound
jest.mock('react-native-sound');

// Mock services
jest.mock('../../../services/MusicPlayerService');
jest.mock('../../../services/MusicDataService');

import { MusicPlayerService } from '../../../services/MusicPlayerService';
import { MusicDataService } from '../../../services/MusicDataService';

const mockMusicPlayerService = MusicPlayerService as jest.Mocked<typeof MusicPlayerService>;
const mockMusicDataService = MusicDataService as jest.Mocked<typeof MusicDataService>;

// Test data
const mockMusicItem: MusicItem = {
  id: 'test-music-1',
  title: '测试音乐',
  category: 'nature',
  audioPath: '/sounds/test.mp3',
  audioUrl: 'https://example.com/sounds/test.mp3',
  icon: '🎵',
  description: '测试音乐描述',
  isLooping: true,
};

const mockPlayingTrack: PlayingTrack = {
  music: mockMusicItem,
  volume: 1.0,
  isLooping: true,
  startTime: Date.now(),
};

const mockCategories = [
  { id: 'nature', name: '自然声音', icon: '🌿' },
  { id: 'animals', name: '动物声音', icon: '🐾' },
];

const mockMusicList = [mockMusicItem];

// Helper function to create store
const createTestStore = () => {
  return configureStore({
    reducer: {
      music: musicReducer,
    },
  });
};

describe('musicSlice', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = selectMusicState(store.getState());
      expect(state).toEqual({
        musicList: [],
        categories: [],
        playingTracks: [],
        masterVolume: 0.7,
        isPlaying: false,
        showPlaybackPanel: false,
        loading: false,
        error: null,
      });
    });
  });

  describe('synchronous actions', () => {
    it('should clear error', () => {
      // Set initial error
      store.dispatch({ type: 'music/loadMusicData/rejected', payload: 'Test error' });
      expect(selectMusicState(store.getState()).error).toBe('Test error');

      // Clear error
      store.dispatch(clearError());
      expect(selectMusicState(store.getState()).error).toBeNull();
    });

    it('should toggle playback panel', () => {
      expect(selectMusicState(store.getState()).showPlaybackPanel).toBe(false);
      
      store.dispatch(togglePlaybackPanel());
      expect(selectMusicState(store.getState()).showPlaybackPanel).toBe(true);
      
      store.dispatch(togglePlaybackPanel());
      expect(selectMusicState(store.getState()).showPlaybackPanel).toBe(false);
    });

    it('should set playback panel visible', () => {
      store.dispatch(setPlaybackPanelVisible(true));
      expect(selectMusicState(store.getState()).showPlaybackPanel).toBe(true);
      
      store.dispatch(setPlaybackPanelVisible(false));
      expect(selectMusicState(store.getState()).showPlaybackPanel).toBe(false);
    });

    it('should update playing tracks', () => {
      const tracks = [mockPlayingTrack];
      store.dispatch(updatePlayingTracks(tracks));
      
      const state = selectMusicState(store.getState());
      expect(state.playingTracks).toEqual(tracks);
      expect(state.isPlaying).toBe(true);
    });

    it('should set isPlaying to false when updating with empty tracks', () => {
      store.dispatch(updatePlayingTracks([]));
      
      const state = selectMusicState(store.getState());
      expect(state.playingTracks).toEqual([]);
      expect(state.isPlaying).toBe(false);
    });
  });

  describe('async actions', () => {
    describe('loadMusicData', () => {
      it('should load music data successfully', async () => {
        mockMusicDataService.getMusicCategories.mockReturnValue(mockCategories);
        mockMusicDataService.getMusicList.mockReturnValue(mockMusicList);

        await store.dispatch(loadMusicData());

        const state = selectMusicState(store.getState());
        expect(state.loading).toBe(false);
        expect(state.categories).toEqual(mockCategories);
        expect(state.musicList).toEqual(mockMusicList);
        expect(state.error).toBeNull();
      });

      it('should handle load music data error', async () => {
        const errorMessage = 'Failed to load music data';
        mockMusicDataService.getMusicCategories.mockImplementation(() => {
          throw new Error(errorMessage);
        });

        await store.dispatch(loadMusicData());

        const state = selectMusicState(store.getState());
        expect(state.loading).toBe(false);
        expect(state.error).toBe(errorMessage);
      });
    });

    describe('playMusic', () => {
      it('should start playing music when not already playing', async () => {
        mockMusicPlayerService.addTrack.mockResolvedValue();

        await store.dispatch(playMusic(mockMusicItem));

        const state = selectMusicState(store.getState());
        expect(state.loading).toBe(false);
        expect(state.playingTracks).toHaveLength(1);
        expect(state.playingTracks[0].music).toEqual(mockMusicItem);
        expect(state.isPlaying).toBe(true);
        expect(mockMusicPlayerService.addTrack).toHaveBeenCalledWith(mockMusicItem);
      });

      it('should stop playing music when already playing', async () => {
        // First add the track to playing state
        store.dispatch(updatePlayingTracks([mockPlayingTrack]));
        
        mockMusicPlayerService.removeTrack.mockResolvedValue();

        await store.dispatch(playMusic(mockMusicItem));

        const state = selectMusicState(store.getState());
        expect(state.loading).toBe(false);
        expect(state.playingTracks).toHaveLength(0);
        expect(state.isPlaying).toBe(false);
        expect(mockMusicPlayerService.removeTrack).toHaveBeenCalledWith(mockMusicItem.id);
      });

      it('should handle play music error', async () => {
        const errorMessage = 'Failed to play music';
        mockMusicPlayerService.addTrack.mockRejectedValue(new Error(errorMessage));

        await store.dispatch(playMusic(mockMusicItem));

        const state = selectMusicState(store.getState());
        expect(state.loading).toBe(false);
        expect(state.error).toBe(errorMessage);
      });
    });

    describe('pauseAllMusic', () => {
      it('should pause all music successfully', async () => {
        // Set initial playing state
        store.dispatch(updatePlayingTracks([mockPlayingTrack]));
        
        mockMusicPlayerService.pauseAllTracks.mockResolvedValue();

        await store.dispatch(pauseAllMusic());

        const state = selectMusicState(store.getState());
        expect(state.isPlaying).toBe(false);
        expect(mockMusicPlayerService.pauseAllTracks).toHaveBeenCalled();
      });

      it('should handle pause all music error', async () => {
        const errorMessage = 'Failed to pause music';
        mockMusicPlayerService.pauseAllTracks.mockRejectedValue(new Error(errorMessage));

        await store.dispatch(pauseAllMusic());

        const state = selectMusicState(store.getState());
        expect(state.error).toBe(errorMessage);
      });
    });

    describe('resumeAllMusic', () => {
      it('should resume all music successfully', async () => {
        // Set initial state with tracks but not playing
        store.dispatch(updatePlayingTracks([mockPlayingTrack]));
        store.dispatch({ type: 'music/pauseAllMusic/fulfilled' });
        
        mockMusicPlayerService.resumeAllTracks.mockResolvedValue();

        await store.dispatch(resumeAllMusic());

        const state = selectMusicState(store.getState());
        expect(state.isPlaying).toBe(true);
        expect(mockMusicPlayerService.resumeAllTracks).toHaveBeenCalled();
      });
    });

    describe('stopAllMusic', () => {
      it('should stop all music successfully', async () => {
        // Set initial playing state
        store.dispatch(updatePlayingTracks([mockPlayingTrack]));
        
        mockMusicPlayerService.stopAllTracks.mockResolvedValue();

        await store.dispatch(stopAllMusic());

        const state = selectMusicState(store.getState());
        expect(state.playingTracks).toHaveLength(0);
        expect(state.isPlaying).toBe(false);
        expect(mockMusicPlayerService.stopAllTracks).toHaveBeenCalled();
      });
    });

    describe('setTrackVolume', () => {
      it('should set track volume successfully', async () => {
        // Set initial playing state
        store.dispatch(updatePlayingTracks([mockPlayingTrack]));
        
        mockMusicPlayerService.setTrackVolume.mockResolvedValue();

        const newVolume = 0.5;
        await store.dispatch(setTrackVolume({ musicId: mockMusicItem.id, volume: newVolume }));

        const state = selectMusicState(store.getState());
        expect(state.playingTracks[0].volume).toBe(newVolume);
        expect(mockMusicPlayerService.setTrackVolume).toHaveBeenCalledWith(mockMusicItem.id, newVolume);
      });
    });

    describe('setMasterVolume', () => {
      it('should set master volume successfully', async () => {
        mockMusicPlayerService.setMasterVolume.mockResolvedValue();

        const newVolume = 0.8;
        await store.dispatch(setMasterVolume(newVolume));

        const state = selectMusicState(store.getState());
        expect(state.masterVolume).toBe(newVolume);
        expect(mockMusicPlayerService.setMasterVolume).toHaveBeenCalledWith(newVolume);
      });
    });
  });

  describe('selectors', () => {
    beforeEach(() => {
      // Set up test state
      store.dispatch(updatePlayingTracks([mockPlayingTrack]));
    });

    it('should select if track is playing', () => {
      const isPlaying = selectIsTrackPlaying(store.getState(), mockMusicItem.id);
      expect(isPlaying).toBe(true);

      const isNotPlaying = selectIsTrackPlaying(store.getState(), 'non-existent-id');
      expect(isNotPlaying).toBe(false);
    });

    it('should select track volume', () => {
      const volume = selectTrackVolume(store.getState(), mockMusicItem.id);
      expect(volume).toBe(1.0);

      const defaultVolume = selectTrackVolume(store.getState(), 'non-existent-id');
      expect(defaultVolume).toBe(1.0);
    });
  });
});