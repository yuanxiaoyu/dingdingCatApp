import { MusicDataService } from '../MusicDataService';
import { MusicItem, MusicCategory } from '../../types/music';

describe('MusicDataService', () => {
  describe('getMusicCategories', () => {
    it('should return all music categories', () => {
      const categories = MusicDataService.getMusicCategories();
      
      expect(categories).toBeDefined();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      
      // Check that each category has required properties
      categories.forEach(category => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('icon');
        expect(typeof category.id).toBe('string');
        expect(typeof category.name).toBe('string');
        expect(typeof category.icon).toBe('string');
      });
    });

    it('should include expected categories', () => {
      const categories = MusicDataService.getMusicCategories();
      const categoryIds = categories.map(cat => cat.id);
      
      expect(categoryIds).toContain('animals');
      expect(categoryIds).toContain('nature');
      expect(categoryIds).toContain('rain');
      expect(categoryIds).toContain('noise');
    });
  });

  describe('getMusicList', () => {
    it('should return all music items when no category is specified', () => {
      const musicList = MusicDataService.getMusicList();
      
      expect(musicList).toBeDefined();
      expect(Array.isArray(musicList)).toBe(true);
      expect(musicList.length).toBeGreaterThan(0);
      
      // Check that each music item has required properties
      musicList.forEach(music => {
        expect(music).toHaveProperty('id');
        expect(music).toHaveProperty('title');
        expect(music).toHaveProperty('category');
        expect(music).toHaveProperty('audioPath');
        expect(music).toHaveProperty('audioUrl');
        expect(music).toHaveProperty('icon');
        expect(music).toHaveProperty('isLooping');
        expect(typeof music.audioUrl).toBe('string');
        expect(music.audioUrl).toContain('https://moodist.mvze.net');
      });
    });

    it('should filter music by category when specified', () => {
      const animalMusic = MusicDataService.getMusicList('animals');
      
      expect(animalMusic).toBeDefined();
      expect(Array.isArray(animalMusic)).toBe(true);
      
      // All returned items should be in the animals category
      animalMusic.forEach(music => {
        expect(music.category).toBe('animals');
      });
    });

    it('should return empty array for non-existent category', () => {
      const nonExistentMusic = MusicDataService.getMusicList('non-existent');
      
      expect(nonExistentMusic).toBeDefined();
      expect(Array.isArray(nonExistentMusic)).toBe(true);
      expect(nonExistentMusic.length).toBe(0);
    });
  });

  describe('getMusicById', () => {
    it('should return music item for valid ID', () => {
      const music = MusicDataService.getMusicById('birds');
      
      expect(music).toBeDefined();
      expect(music).not.toBeNull();
      expect(music?.id).toBe('birds');
      expect(music?.title).toBe('鸟鸣声');
      expect(music?.category).toBe('animals');
      expect(music?.audioUrl).toContain('https://moodist.mvze.net');
    });

    it('should return null for invalid ID', () => {
      const music = MusicDataService.getMusicById('non-existent-id');
      
      expect(music).toBeNull();
    });
  });

  describe('searchMusic', () => {
    it('should find music by title', () => {
      const results = MusicDataService.searchMusic('鸟鸣');
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(music => music.title.includes('鸟鸣'))).toBe(true);
    });

    it('should find music by category', () => {
      const results = MusicDataService.searchMusic('animals');
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(music => music.category === 'animals')).toBe(true);
    });

    it('should return empty array for no matches', () => {
      const results = MusicDataService.searchMusic('xyz123nonexistent');
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should be case insensitive', () => {
      const results = MusicDataService.searchMusic('雨声');
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('getMusicCountByCategory', () => {
    it('should return correct count for existing category', () => {
      const count = MusicDataService.getMusicCountByCategory('animals');
      
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);
    });

    it('should return 0 for non-existent category', () => {
      const count = MusicDataService.getMusicCountByCategory('non-existent');
      
      expect(count).toBe(0);
    });
  });

  describe('getCategoriesWithCount', () => {
    it('should return categories with music counts', () => {
      const categoriesWithCount = MusicDataService.getCategoriesWithCount();
      
      expect(categoriesWithCount).toBeDefined();
      expect(Array.isArray(categoriesWithCount)).toBe(true);
      expect(categoriesWithCount.length).toBeGreaterThan(0);
      
      categoriesWithCount.forEach(category => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('icon');
        expect(category).toHaveProperty('count');
        expect(typeof category.count).toBe('number');
        expect(category.count).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('isMusicIdValid', () => {
    it('should return true for valid music ID', () => {
      const isValid = MusicDataService.isMusicIdValid('birds');
      
      expect(isValid).toBe(true);
    });

    it('should return false for invalid music ID', () => {
      const isValid = MusicDataService.isMusicIdValid('non-existent-id');
      
      expect(isValid).toBe(false);
    });
  });

  describe('getBaseUrl', () => {
    it('should return the correct base URL', () => {
      const baseUrl = MusicDataService.getBaseUrl();
      
      expect(baseUrl).toBe('https://moodist.mvze.net');
    });
  });

  describe('getRandomMusic', () => {
    it('should return random music items', () => {
      const randomMusic = MusicDataService.getRandomMusic(3);
      
      expect(randomMusic).toBeDefined();
      expect(Array.isArray(randomMusic)).toBe(true);
      expect(randomMusic.length).toBeLessThanOrEqual(3);
      
      randomMusic.forEach(music => {
        expect(music).toHaveProperty('id');
        expect(music).toHaveProperty('title');
        expect(music).toHaveProperty('audioUrl');
      });
    });

    it('should return random music from specific category', () => {
      const randomMusic = MusicDataService.getRandomMusic(2, 'animals');
      
      expect(randomMusic).toBeDefined();
      expect(Array.isArray(randomMusic)).toBe(true);
      expect(randomMusic.length).toBeLessThanOrEqual(2);
      
      randomMusic.forEach(music => {
        expect(music.category).toBe('animals');
      });
    });

    it('should return single item by default', () => {
      const randomMusic = MusicDataService.getRandomMusic();
      
      expect(randomMusic).toBeDefined();
      expect(Array.isArray(randomMusic)).toBe(true);
      expect(randomMusic.length).toBeLessThanOrEqual(1);
    });
  });
});