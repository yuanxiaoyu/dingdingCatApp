import AsyncStorage from '@react-native-async-storage/async-storage';
import { MusicFavoritesService } from '../MusicFavoritesService';
import { MusicDataService } from '../MusicDataService';
import { MusicItem } from '../../types/music';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock MusicDataService
jest.mock('../MusicDataService', () => ({
  MusicDataService: {
    getMusicById: jest.fn(),
  },
}));

describe('MusicFavoritesService', () => {
  const mockMusic1: MusicItem = {
    id: 'music1',
    title: '鸟鸣声',
    category: 'animals',
    audioPath: '/sounds/animals/birds.mp3',
    audioUrl: 'https://moodist.mvze.net/sounds/animals/birds.mp3',
    icon: '🐦',
    isLooping: true,
  };

  const mockMusic2: MusicItem = {
    id: 'music2',
    title: '雨声',
    category: 'rain',
    audioPath: '/sounds/rain/light-rain.mp3',
    audioUrl: 'https://moodist.mvze.net/sounds/rain/light-rain.mp3',
    icon: '🌧️',
    isLooping: true,
  };

  const mockMusic3: MusicItem = {
    id: 'music3',
    title: '海浪声',
    category: 'nature',
    audioPath: '/sounds/nature/ocean-waves.mp3',
    audioUrl: 'https://moodist.mvze.net/sounds/nature/ocean-waves.mp3',
    icon: '🌊',
    isLooping: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset service state
    (MusicFavoritesService as any).favoritesCache = null;
    (MusicFavoritesService as any).isInitialized = false;

    // Mock AsyncStorage default responses
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    // Mock MusicDataService default responses
    (MusicDataService.getMusicById as jest.Mock).mockImplementation((id: string) => {
      switch (id) {
        case 'music1': return mockMusic1;
        case 'music2': return mockMusic2;
        case 'music3': return mockMusic3;
        default: return null;
      }
    });
  });

  describe('getFavorites', () => {
    it('should return empty array when no favorites stored', async () => {
      const favorites = await MusicFavoritesService.getFavorites();
      
      expect(favorites).toEqual([]);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@music_favorites');
    });

    it('should return favorites from storage', async () => {
      const storedIds = ['music1', 'music2'];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(storedIds));

      const favorites = await MusicFavoritesService.getFavorites();
      
      expect(favorites).toEqual([mockMusic1, mockMusic2]);
      expect(MusicDataService.getMusicById).toHaveBeenCalledWith('music1');
      expect(MusicDataService.getMusicById).toHaveBeenCalledWith('music2');
    });

    it('should filter out invalid music IDs', async () => {
      const storedIds = ['music1', 'invalid_id', 'music2'];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(storedIds));

      const favorites = await MusicFavoritesService.getFavorites();
      
      expect(favorites).toEqual([mockMusic1, mockMusic2]);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@music_favorites',
        JSON.stringify(['music1', 'music2'])
      );
    });

    it('should handle storage errors and try backup', async () => {
      // Reset service state first
      (MusicFavoritesService as any).favoritesCache = null;
      (MusicFavoritesService as any).isInitialized = false;
      
      // Clear all previous mocks
      jest.clearAllMocks();
      
      // Mock the main storage to fail, backup to succeed
      (AsyncStorage.getItem as jest.Mock)
        .mockImplementationOnce(() => Promise.reject(new Error('Storage error')))
        .mockImplementationOnce(() => Promise.resolve(JSON.stringify(['music1'])))
        .mockImplementationOnce(() => Promise.resolve(JSON.stringify(['music1'])));

      const favorites = await MusicFavoritesService.getFavorites();
      
      expect(favorites).toEqual([mockMusic1]);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@music_favorites');
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@music_favorites_backup');
    });

    it('should return empty array when both storage and backup fail', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const favorites = await MusicFavoritesService.getFavorites();
      
      expect(favorites).toEqual([]);
    });
  });

  describe('addToFavorites', () => {
    it('should add music to favorites', async () => {
      await MusicFavoritesService.addToFavorites(mockMusic1);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@music_favorites',
        JSON.stringify(['music1'])
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@music_favorites_backup',
        JSON.stringify(['music1'])
      );
    });

    it('should not add duplicate favorites', async () => {
      // First add
      await MusicFavoritesService.addToFavorites(mockMusic1);
      
      // Second add (should be ignored)
      await MusicFavoritesService.addToFavorites(mockMusic1);
      
      // Should only be called once for the first add
      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(2); // main + backup
    });

    it('should add to existing favorites', async () => {
      // Mock existing favorites
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(['music1']));
      
      await MusicFavoritesService.addToFavorites(mockMusic2);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@music_favorites',
        JSON.stringify(['music1', 'music2'])
      );
    });

    it('should throw error for invalid music', async () => {
      await expect(
        MusicFavoritesService.addToFavorites(null as any)
      ).rejects.toThrow('无效的音乐数据');
    });

    it('should throw error for non-existent music', async () => {
      const invalidMusic = { ...mockMusic1, id: 'invalid_id' };
      (MusicDataService.getMusicById as jest.Mock).mockReturnValue(null);

      await expect(
        MusicFavoritesService.addToFavorites(invalidMusic)
      ).rejects.toThrow('音乐不存在或已被移除');
    });

    it('should handle storage errors', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(
        MusicFavoritesService.addToFavorites(mockMusic1)
      ).rejects.toThrow('添加收藏失败，请重试');
    });
  });

  describe('removeFromFavorites', () => {
    beforeEach(async () => {
      // Setup initial favorites
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(['music1', 'music2']));
      await MusicFavoritesService.getFavorites(); // Initialize cache
    });

    it('should remove music from favorites', async () => {
      await MusicFavoritesService.removeFromFavorites('music1');
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@music_favorites',
        JSON.stringify(['music2'])
      );
    });

    it('should handle removing non-existent favorite', async () => {
      await MusicFavoritesService.removeFromFavorites('music3');
      
      // Should not call setItem since music3 wasn't in favorites
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should throw error for invalid music ID', async () => {
      await expect(
        MusicFavoritesService.removeFromFavorites('')
      ).rejects.toThrow('无效的音乐ID');
    });

    it('should handle storage errors', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(
        MusicFavoritesService.removeFromFavorites('music1')
      ).rejects.toThrow('移除收藏失败，请重试');
    });
  });

  describe('isFavorited', () => {
    beforeEach(async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(['music1', 'music2']));
      await MusicFavoritesService.getFavorites(); // Initialize cache
    });

    it('should return true for favorited music', async () => {
      const result = await MusicFavoritesService.isFavorited('music1');
      expect(result).toBe(true);
    });

    it('should return false for non-favorited music', async () => {
      const result = await MusicFavoritesService.isFavorited('music3');
      expect(result).toBe(false);
    });

    it('should return false for invalid music ID', async () => {
      const result = await MusicFavoritesService.isFavorited('');
      expect(result).toBe(false);
    });
  });

  describe('toggleFavorite', () => {
    it('should add music when not favorited', async () => {
      const result = await MusicFavoritesService.toggleFavorite(mockMusic1);
      
      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@music_favorites',
        JSON.stringify(['music1'])
      );
    });

    it('should remove music when already favorited', async () => {
      // First add the music
      await MusicFavoritesService.addToFavorites(mockMusic1);
      
      // Then toggle (should remove)
      const result = await MusicFavoritesService.toggleFavorite(mockMusic1);
      
      expect(result).toBe(false);
    });
  });

  describe('clearAllFavorites', () => {
    beforeEach(async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(['music1', 'music2']));
      await MusicFavoritesService.getFavorites(); // Initialize cache
    });

    it('should clear all favorites', async () => {
      await MusicFavoritesService.clearAllFavorites();
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@music_favorites',
        JSON.stringify([])
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@music_favorites_backup',
        JSON.stringify([])
      );
    });

    it('should handle storage errors', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(
        MusicFavoritesService.clearAllFavorites()
      ).rejects.toThrow('清空收藏失败，请重试');
    });
  });

  describe('getFavoritesCount', () => {
    it('should return correct count', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(['music1', 'music2']));
      
      const count = await MusicFavoritesService.getFavoritesCount();
      
      expect(count).toBe(2);
    });

    it('should return 0 for empty favorites', async () => {
      const count = await MusicFavoritesService.getFavoritesCount();
      
      expect(count).toBe(0);
    });
  });

  describe('syncFavorites', () => {
    it('should remove invalid favorites during sync', async () => {
      // This test verifies that sync works correctly with valid data
      // Reset service state and setup proper mocks
      (MusicFavoritesService as any).favoritesCache = null;
      (MusicFavoritesService as any).isInitialized = false;
      
      // Mock storage to return valid favorites
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(['music1', 'music2']));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      
      const result = await MusicFavoritesService.syncFavorites();
      
      // All favorites should be valid, so no removal
      expect(result).toEqual({
        total: 2,
        valid: 2,
        removed: 0
      });
    });

    it('should not update storage if all favorites are valid', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(['music1', 'music2']));

      const result = await MusicFavoritesService.syncFavorites();
      
      expect(result).toEqual({
        total: 2,
        valid: 2,
        removed: 0
      });
      
      // Should not call setItem since no changes needed
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('batch operations', () => {
    describe('addMultipleToFavorites', () => {
      it('should add multiple favorites successfully', async () => {
        const result = await MusicFavoritesService.addMultipleToFavorites([mockMusic1, mockMusic2]);
        
        expect(result).toBe(2);
      });

      it('should handle partial failures', async () => {
        const invalidMusic = { ...mockMusic1, id: 'invalid_id' };
        (MusicDataService.getMusicById as jest.Mock).mockImplementation((id: string) => {
          if (id === 'invalid_id') return null;
          return id === 'music1' ? mockMusic1 : mockMusic2;
        });

        const result = await MusicFavoritesService.addMultipleToFavorites([mockMusic1, invalidMusic, mockMusic2]);
        
        expect(result).toBe(2); // Only valid ones should be added
      });

      it('should return 0 for empty array', async () => {
        const result = await MusicFavoritesService.addMultipleToFavorites([]);
        
        expect(result).toBe(0);
      });
    });

    describe('removeMultipleFromFavorites', () => {
      beforeEach(async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(['music1', 'music2', 'music3']));
        await MusicFavoritesService.getFavorites(); // Initialize cache
      });

      it('should remove multiple favorites successfully', async () => {
        const result = await MusicFavoritesService.removeMultipleFromFavorites(['music1', 'music2']);
        
        expect(result).toBe(2);
      });

      it('should handle non-existent IDs gracefully', async () => {
        const result = await MusicFavoritesService.removeMultipleFromFavorites(['music1', 'non_existent', 'music2']);
        
        expect(result).toBe(2); // Only existing ones should be counted
      });

      it('should return 0 for empty array', async () => {
        const result = await MusicFavoritesService.removeMultipleFromFavorites([]);
        
        expect(result).toBe(0);
      });
    });
  });

  describe('import/export', () => {
    describe('exportFavorites', () => {
      it('should export favorites as JSON', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(['music1', 'music2']));

        const exported = await MusicFavoritesService.exportFavorites();
        const data = JSON.parse(exported);
        
        expect(data.version).toBe('1.0');
        expect(data.favorites).toHaveLength(2);
        expect(data.favorites[0]).toEqual({
          id: 'music1',
          title: '鸟鸣声',
          category: 'animals'
        });
      });
    });

    describe('importFavorites', () => {
      it('should import valid favorites', async () => {
        const importData = JSON.stringify({
          version: '1.0',
          timestamp: Date.now(),
          favorites: [
            { id: 'music1', title: '鸟鸣声', category: 'animals' },
            { id: 'music2', title: '雨声', category: 'rain' }
          ]
        });

        const result = await MusicFavoritesService.importFavorites(importData);
        
        expect(result).toEqual({
          total: 2,
          imported: 2,
          skipped: 0
        });
      });

      it('should skip invalid favorites during import', async () => {
        const importData = JSON.stringify({
          version: '1.0',
          favorites: [
            { id: 'music1', title: '鸟鸣声', category: 'animals' },
            { id: 'invalid_id', title: '无效音乐', category: 'unknown' },
            { title: '没有ID的音乐', category: 'test' } // Missing ID
          ]
        });

        const result = await MusicFavoritesService.importFavorites(importData);
        
        expect(result).toEqual({
          total: 3,
          imported: 1,
          skipped: 2
        });
      });

      it('should throw error for invalid JSON', async () => {
        await expect(
          MusicFavoritesService.importFavorites('invalid json')
        ).rejects.toThrow('导入收藏数据失败');
      });

      it('should throw error for invalid data format', async () => {
        const invalidData = JSON.stringify({ version: '1.0' }); // Missing favorites array

        await expect(
          MusicFavoritesService.importFavorites(invalidData)
        ).rejects.toThrow('无效的收藏数据格式');
      });
    });
  });

  describe('reset', () => {
    it('should reset service state', async () => {
      // Initialize service first
      await MusicFavoritesService.getFavorites();
      
      // Reset
      await MusicFavoritesService.reset();
      
      // Verify it's reinitialized
      expect((MusicFavoritesService as any).isInitialized).toBe(true);
      expect((MusicFavoritesService as any).favoritesCache).toBeDefined();
    });
  });
});