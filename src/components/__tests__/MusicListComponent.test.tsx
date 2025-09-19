import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import MusicListComponent from '../MusicListComponent';
import musicReducer from '../../store/slices/musicSlice';
import favoritesReducer from '../../store/slices/favoritesSlice';
import { MusicItem } from '../../types/music';

// Mock the services
jest.mock('../../services/MusicPlayerService');
jest.mock('../../services/MusicDataService');
jest.mock('../../services/MusicFavoritesService');

// Create a test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      music: musicReducer,
      favorites: favoritesReducer,
    },
    preloadedState: {
      music: {
        musicList: [
          {
            id: 'test-music-1',
            title: '测试音乐1',
            category: 'nature',
            audioPath: '/test/music1.mp3',
            audioUrl: 'https://test.com/music1.mp3',
            icon: '🌊',
            description: '测试音乐描述',
            isLooping: true,
          },
          {
            id: 'test-music-2',
            title: '测试音乐2',
            category: 'animals',
            audioPath: '/test/music2.mp3',
            audioUrl: 'https://test.com/music2.mp3',
            icon: '🐦',
            description: '测试音乐描述2',
            isLooping: true,
          },
        ] as MusicItem[],
        categories: [
          { id: 'nature', name: '自然声音', icon: '🌿' },
          { id: 'animals', name: '动物声音', icon: '🐾' },
        ],
        playingTracks: [],
        masterVolume: 0.7,
        isPlaying: false,
        showPlaybackPanel: false,
        loading: false,
        error: null,
      },
      favorites: {
        favorites: [],
        loading: false,
        error: null,
        isAddingFavorite: false,
        isRemovingFavorite: false,
      },
      ...initialState,
    },
  });
};

const renderWithStore = (component: React.ReactElement, store = createTestStore()) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('MusicListComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with music list', () => {
    const { getByText, getByTestId } = renderWithStore(<MusicListComponent />);
    
    expect(getByText('自然音乐')).toBeTruthy();
    expect(getByText('选择您喜欢的自然声音')).toBeTruthy();
    expect(getByText('测试音乐1')).toBeTruthy();
    expect(getByText('测试音乐2')).toBeTruthy();
  });

  it('displays loading state correctly', () => {
    const store = createTestStore({
      music: {
        musicList: [],
        categories: [],
        playingTracks: [],
        masterVolume: 0.7,
        isPlaying: false,
        showPlaybackPanel: false,
        loading: true,
        error: null,
      },
    });

    const { getByText } = renderWithStore(<MusicListComponent />, store);
    
    expect(getByText('加载音乐资源中...')).toBeTruthy();
  });

  it('displays error state correctly', () => {
    const store = createTestStore({
      music: {
        musicList: [],
        categories: [],
        playingTracks: [],
        masterVolume: 0.7,
        isPlaying: false,
        showPlaybackPanel: false,
        loading: false,
        error: '加载失败',
      },
    });

    const { getByText } = renderWithStore(<MusicListComponent />, store);
    
    expect(getByText('加载失败')).toBeTruthy();
    expect(getByText('重试')).toBeTruthy();
  });

  it('filters music by category', async () => {
    const { getByText, queryByText } = renderWithStore(<MusicListComponent />);
    
    // Initially shows all music
    expect(getByText('测试音乐1')).toBeTruthy();
    expect(getByText('测试音乐2')).toBeTruthy();
    
    // Click on animals category
    fireEvent.press(getByText('动物声音'));
    
    await waitFor(() => {
      expect(queryByText('测试音乐1')).toBeFalsy(); // nature category music should be hidden
      expect(getByText('测试音乐2')).toBeTruthy(); // animals category music should be visible
    });
  });

  it('calls onMusicPlay callback when music card is pressed', () => {
    const mockOnMusicPlay = jest.fn();
    const { getByText } = renderWithStore(
      <MusicListComponent onMusicPlay={mockOnMusicPlay} />
    );
    
    fireEvent.press(getByText('测试音乐1'));
    
    expect(mockOnMusicPlay).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-music-1',
        title: '测试音乐1',
      })
    );
  });

  it('shows playing indicator for currently playing music', () => {
    const store = createTestStore({
      music: {
        musicList: [
          {
            id: 'test-music-1',
            title: '测试音乐1',
            category: 'nature',
            audioPath: '/test/music1.mp3',
            audioUrl: 'https://test.com/music1.mp3',
            icon: '🌊',
            description: '测试音乐描述',
            isLooping: true,
          },
        ],
        categories: [
          { id: 'nature', name: '自然声音', icon: '🌿' },
        ],
        playingTracks: [
          {
            music: {
              id: 'test-music-1',
              title: '测试音乐1',
              category: 'nature',
              audioPath: '/test/music1.mp3',
              audioUrl: 'https://test.com/music1.mp3',
              icon: '🌊',
              description: '测试音乐描述',
              isLooping: true,
            },
            volume: 1.0,
            isLooping: true,
            startTime: Date.now(),
          },
        ],
        masterVolume: 0.7,
        isPlaying: true,
        showPlaybackPanel: false,
        loading: false,
        error: null,
      },
    });

    const { getByText } = renderWithStore(<MusicListComponent />, store);
    
    expect(getByText('正在播放')).toBeTruthy();
    expect(getByText('正在播放 1 首音乐')).toBeTruthy();
  });

  it('displays empty state when no music is available', () => {
    const store = createTestStore({
      music: {
        musicList: [],
        categories: [
          { id: 'nature', name: '自然声音', icon: '🌿' },
        ],
        playingTracks: [],
        masterVolume: 0.7,
        isPlaying: false,
        showPlaybackPanel: false,
        loading: false,
        error: null,
      },
    });

    const { getByText } = renderWithStore(<MusicListComponent />, store);
    
    expect(getByText('暂无音乐')).toBeTruthy();
    expect(getByText('音乐资源加载中，请稍候...')).toBeTruthy();
  });

  it('shows category filter with all categories', () => {
    const { getByText } = renderWithStore(<MusicListComponent />);
    
    expect(getByText('全部')).toBeTruthy();
    expect(getByText('自然声音')).toBeTruthy();
    expect(getByText('动物声音')).toBeTruthy();
  });

  it('calls onFavoriteToggle callback when favorite button is pressed', () => {
    const mockOnFavoriteToggle = jest.fn();
    const { getAllByText } = renderWithStore(
      <MusicListComponent onFavoriteToggle={mockOnFavoriteToggle} />
    );
    
    // Find favorite buttons (heart icons)
    const favoriteButtons = getAllByText('🤍');
    fireEvent.press(favoriteButtons[0]);
    
    expect(mockOnFavoriteToggle).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-music-1',
        title: '测试音乐1',
      }),
      true // should be favorited after toggle
    );
  });
});