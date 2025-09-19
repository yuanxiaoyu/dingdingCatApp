import { configureStore } from '@reduxjs/toolkit';
import favoritesReducer, {
  clearError,
  resetLoadingState,
  addFavoriteLocally,
  removeFavoriteLocally,
  loadFavorites,
  addToFavorites,
  removeFromFavorites,
  toggleFavorite,
  clearAllFavorites,
  checkIsFavorited,
  selectFavoritesState,
  selectIsFavorited,
  selectFavoriteById,
  selectFavoritesCount,
} from '../favoritesSlice';
import { MusicItem } from '../../../types/music';

// Mock react-native-sound
jest.mock('react-native-sound');

// Mock services
jest.mock('../../../services/MusicFavoritesService');

import { MusicFavoritesService } from '../../../services/MusicFavoritesService';

const mockMusicFavoritesService = MusicFavoritesService as jest.Mocked<typeof MusicFavoritesService>;

// Test data
const mockMusicItem1: MusicItem = {
  id: 'test-music-1',
  title: '测试音乐1',
  category: 'nature',
  audioPath: '/sounds/test1.mp3',
  audioUrl: 'https://example.com/sounds/test1.mp3',
  icon: '🎵',
  description: '测试音乐1描述',
  isLooping: true,
};

const mockMusicItem2: MusicItem = {
  id: 'test-music-2',
  title: '测试音乐2',
  category: 'animals',
  audioPath: '/sounds/test2.mp3',
  audioUrl: 'https://example.com/sounds/test2.mp3',
  icon: '🎶',
  description: '测试音乐2描述',
  isLooping: false,
};

// Helper function to create store
const createTestStore = () => {
  return configureStore({
    reducer: {
      favorites: favoritesReducer,
    },
  });
};

describe('favoritesSlice', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = selectFavoritesState(store.getState());
      expect(state).toEqual({
        favorites: [],
        loading: false,
        error: null,
        isAddingFavorite: false,
        isRemovingFavorite: false,
      });
    });
  });

  describe('synchronous actions', () => {
    it('should clear error', () => {
      // Set initial error
      store.dispatch({ type: 'favorites/loadFavorites/rejected', payload: 'Test error' });
      expect(selectFavoritesState(store.getState()).error).toBe('Test error');

      // Clear error
      store.dispatch(clearError());
      expect(selectFavoritesState(store.getState()).error).toBeNull();
    });

    it('should reset loading state', () => {
      // Set loading states
      store.dispatch({ type: 'favorites/loadFavorites/pending' });
      store.dispatch({ type: 'favorites/addToFavorites/pending' });
      
      let state = selectFavoritesState(store.getState());
      expect(state.loading).toBe(true);
      expect(state.isAddingFavorite).toBe(true);

      // Reset loading state
      store.dispatch(resetLoadingState());
      state = selectFavoritesState(store.getState());
      expect(state.loading).toBe(false);
      expect(state.isAddingFavorite).toBe(false);
      expect(state.isRemovingFavorite).toBe(false);
    });

    it('should add favorite locally', () => {
      store.dispatch(addFavoriteLocally(mockMusicItem1));
      
      const state = selectFavoritesState(store.getState());
      expect(state.favorites).toHaveLength(1);
      expect(state.favorites[0]).toEqual(mockMusicItem1);
    });

    it('should not add duplicate favorite locally', () => {
      store.dispatch(addFavoriteLocally(mockMusicItem1));
      store.dispatch(addFavoriteLocally(mockMusicItem1));
      
      const state = selectFavoritesState(store.getState());
      expect(state.favorites).toHaveLength(1);
    });

    it('should remove favorite locally', () => {
      // Add favorites first
      store.dispatch(addFavoriteLocally(mockMusicItem1));
      store.dispatch(addFavoriteLocally(mockMusicItem2));
      
      expect(selectFavoritesState(store.getState()).favorites).toHaveLength(2);

      // Remove one favorite
      store.dispatch(removeFavoriteLocally(mockMusicItem1.id));
      
      const state = selectFavoritesState(store.getState());
      expect(state.favorites).toHaveLength(1);
      expect(state.favorites[0]).toEqual(mockMusicItem2);
    });
  });

  describe('async actions', () => {
    describe('loadFavorites', () => {
      it('should load favorites successfully', async () => {
        const mockFavorites = [mockMusicItem1, mockMusicItem2];
        mockMusicFavoritesService.getFavorites.mockResolvedValue(mockFavorites);

        await store.dispatch(loadFavorites());

        const state = selectFavoritesState(store.getState());
        expect(state.loading).toBe(false);
        expect(state.favorites).toEqual(mockFavorites);
        expect(state.error).toBeNull();
        expect(mockMusicFavoritesService.getFavorites).toHaveBeenCalled();
      });

      it('should handle load favorites error', async () => {
        const errorMessage = 'Failed to load favorites';
        mockMusicFavoritesService.getFavorites.mockRejectedValue(new Error(errorMessage));

        await store.dispatch(loadFavorites());

        const state = selectFavoritesState(store.getState());
        expect(state.loading).toBe(false);
        expect(state.error).toBe(errorMessage);
        expect(state.favorites).toEqual([]);
      });
    });

    describe('addToFavorites', () => {
      it('should add to favorites successfully', async () => {
        mockMusicFavoritesService.addToFavorites.mockResolvedValue();

        await store.dispatch(addToFavorites(mockMusicItem1));

        const state = selectFavoritesState(store.getState());
        expect(state.isAddingFavorite).toBe(false);
        expect(state.favorites).toContain(mockMusicItem1);
        expect(state.error).toBeNull();
        expect(mockMusicFavoritesService.addToFavorites).toHaveBeenCalledWith(mockMusicItem1);
      });

      it('should handle add to favorites error when already favorited', async () => {
        // Add favorite first
        store.dispatch(addFavoriteLocally(mockMusicItem1));

        await store.dispatch(addToFavorites(mockMusicItem1));

        const state = selectFavoritesState(store.getState());
        expect(state.isAddingFavorite).toBe(false);
        expect(state.error).toBe('该音乐已在收藏列表中');
      });

      it('should handle add to favorites service error', async () => {
        const errorMessage = 'Failed to add favorite';
        mockMusicFavoritesService.addToFavorites.mockRejectedValue(new Error(errorMessage));

        await store.dispatch(addToFavorites(mockMusicItem1));

        const state = selectFavoritesState(store.getState());
        expect(state.isAddingFavorite).toBe(false);
        expect(state.error).toBe(errorMessage);
      });
    });

    describe('removeFromFavorites', () => {
      it('should remove from favorites successfully', async () => {
        // Add favorite first
        store.dispatch(addFavoriteLocally(mockMusicItem1));
        
        mockMusicFavoritesService.removeFromFavorites.mockResolvedValue();

        await store.dispatch(removeFromFavorites(mockMusicItem1.id));

        const state = selectFavoritesState(store.getState());
        expect(state.isRemovingFavorite).toBe(false);
        expect(state.favorites).not.toContain(mockMusicItem1);
        expect(state.error).toBeNull();
        expect(mockMusicFavoritesService.removeFromFavorites).toHaveBeenCalledWith(mockMusicItem1.id);
      });

      it('should handle remove from favorites error', async () => {
        const errorMessage = 'Failed to remove favorite';
        mockMusicFavoritesService.removeFromFavorites.mockRejectedValue(new Error(errorMessage));

        await store.dispatch(removeFromFavorites(mockMusicItem1.id));

        const state = selectFavoritesState(store.getState());
        expect(state.isRemovingFavorite).toBe(false);
        expect(state.error).toBe(errorMessage);
      });
    });

    describe('toggleFavorite', () => {
      it('should add favorite when not currently favorited', async () => {
        mockMusicFavoritesService.addToFavorites.mockResolvedValue();

        await store.dispatch(toggleFavorite(mockMusicItem1));

        const state = selectFavoritesState(store.getState());
        expect(state.favorites).toContain(mockMusicItem1);
      });

      it('should remove favorite when currently favorited', async () => {
        // Add favorite first
        store.dispatch(addFavoriteLocally(mockMusicItem1));
        mockMusicFavoritesService.removeFromFavorites.mockResolvedValue();

        await store.dispatch(toggleFavorite(mockMusicItem1));

        const state = selectFavoritesState(store.getState());
        expect(state.favorites).not.toContain(mockMusicItem1);
      });
    });

    describe('clearAllFavorites', () => {
      it('should clear all favorites successfully', async () => {
        // Add favorites first
        store.dispatch(addFavoriteLocally(mockMusicItem1));
        store.dispatch(addFavoriteLocally(mockMusicItem2));
        
        mockMusicFavoritesService.clearAllFavorites.mockResolvedValue();

        await store.dispatch(clearAllFavorites());

        const state = selectFavoritesState(store.getState());
        expect(state.loading).toBe(false);
        expect(state.favorites).toEqual([]);
        expect(state.error).toBeNull();
        expect(mockMusicFavoritesService.clearAllFavorites).toHaveBeenCalled();
      });

      it('should handle clear all favorites error', async () => {
        const errorMessage = 'Failed to clear favorites';
        mockMusicFavoritesService.clearAllFavorites.mockRejectedValue(new Error(errorMessage));

        await store.dispatch(clearAllFavorites());

        const state = selectFavoritesState(store.getState());
        expect(state.loading).toBe(false);
        expect(state.error).toBe(errorMessage);
      });
    });

    describe('checkIsFavorited', () => {
      it('should check if favorited successfully', async () => {
        mockMusicFavoritesService.isFavorited.mockResolvedValue(true);

        await store.dispatch(checkIsFavorited(mockMusicItem1.id));

        expect(mockMusicFavoritesService.isFavorited).toHaveBeenCalledWith(mockMusicItem1.id);
      });

      it('should handle check is favorited error', async () => {
        const errorMessage = 'Failed to check favorite status';
        mockMusicFavoritesService.isFavorited.mockRejectedValue(new Error(errorMessage));

        await store.dispatch(checkIsFavorited(mockMusicItem1.id));

        const state = selectFavoritesState(store.getState());
        expect(state.error).toBe(errorMessage);
      });
    });
  });

  describe('selectors', () => {
    beforeEach(() => {
      // Set up test state
      store.dispatch(addFavoriteLocally(mockMusicItem1));
      store.dispatch(addFavoriteLocally(mockMusicItem2));
    });

    it('should select if music is favorited', () => {
      const isFavorited = selectIsFavorited(store.getState(), mockMusicItem1.id);
      expect(isFavorited).toBe(true);

      const isNotFavorited = selectIsFavorited(store.getState(), 'non-existent-id');
      expect(isNotFavorited).toBe(false);
    });

    it('should select favorite by id', () => {
      const favorite = selectFavoriteById(store.getState(), mockMusicItem1.id);
      expect(favorite).toEqual(mockMusicItem1);

      const notFound = selectFavoriteById(store.getState(), 'non-existent-id');
      expect(notFound).toBeUndefined();
    });

    it('should select favorites count', () => {
      const count = selectFavoritesCount(store.getState());
      expect(count).toBe(2);
    });
  });
});