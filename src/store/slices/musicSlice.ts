import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { MusicItem, PlayingTrack, MusicCategory } from '../../types/music';
import { MusicPlayerService } from '../../services/MusicPlayerService';
import { MusicDataService } from '../../services/MusicDataService';

// 音乐播放状态接口
interface MusicState {
  // 音乐数据
  musicList: MusicItem[];
  categories: MusicCategory[];
  
  // 播放状态
  playingTracks: PlayingTrack[];
  masterVolume: number;
  isPlaying: boolean;
  
  // UI状态
  showPlaybackPanel: boolean;
  
  // 加载状态
  loading: boolean;
  error: string | null;
}

// 初始状态
const initialState: MusicState = {
  musicList: [],
  categories: [],
  playingTracks: [],
  masterVolume: 0.7,
  isPlaying: false,
  showPlaybackPanel: false,
  loading: false,
  error: null,
};

// 异步操作：加载音乐数据
export const loadMusicData = createAsyncThunk(
  'music/loadMusicData',
  async (_, { rejectWithValue }) => {
    try {
      const categories = MusicDataService.getMusicCategories();
      const musicList = MusicDataService.getMusicList();
      return { categories, musicList };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '加载音乐数据失败');
    }
  }
);

// 异步操作：播放音乐
export const playMusic = createAsyncThunk(
  'music/playMusic',
  async (music: MusicItem, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const isAlreadyPlaying = state.music.playingTracks.some(track => track.music.id === music.id);
      
      if (isAlreadyPlaying) {
        // 如果已在播放，则停止该音乐
        await MusicPlayerService.removeTrack(music.id);
        return { action: 'stop', musicId: music.id };
      } else {
        // 开始播放音乐
        await MusicPlayerService.addTrack(music);
        const playingTrack: PlayingTrack = {
          music,
          volume: 1.0,
          isLooping: music.isLooping,
          startTime: Date.now(),
        };
        return { action: 'play', playingTrack };
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '播放音乐失败');
    }
  }
);

// 异步操作：暂停所有音乐
export const pauseAllMusic = createAsyncThunk(
  'music/pauseAllMusic',
  async (_, { rejectWithValue }) => {
    try {
      await MusicPlayerService.pauseAllTracks();
      return true;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '暂停音乐失败');
    }
  }
);

// 异步操作：恢复所有音乐
export const resumeAllMusic = createAsyncThunk(
  'music/resumeAllMusic',
  async (_, { rejectWithValue }) => {
    try {
      await MusicPlayerService.resumeAllTracks();
      return true;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '恢复播放失败');
    }
  }
);

// 异步操作：停止所有音乐
export const stopAllMusic = createAsyncThunk(
  'music/stopAllMusic',
  async (_, { rejectWithValue }) => {
    try {
      await MusicPlayerService.stopAllTracks();
      return true;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '停止音乐失败');
    }
  }
);

// 异步操作：设置音轨音量
export const setTrackVolume = createAsyncThunk(
  'music/setTrackVolume',
  async ({ musicId, volume }: { musicId: string; volume: number }, { rejectWithValue }) => {
    try {
      await MusicPlayerService.setTrackVolume(musicId, volume);
      return { musicId, volume };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '设置音量失败');
    }
  }
);

// 异步操作：设置主音量
export const setMasterVolume = createAsyncThunk(
  'music/setMasterVolume',
  async (volume: number, { rejectWithValue }) => {
    try {
      await MusicPlayerService.setMasterVolume(volume);
      return volume;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '设置主音量失败');
    }
  }
);

// 异步操作：切换全局播放状态
export const toggleGlobalPlayback = createAsyncThunk(
  'music/toggleGlobalPlayback',
  async (_, { rejectWithValue }) => {
    try {
      const newState = await MusicPlayerService.toggleGlobalPlayback();
      return newState;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '切换播放状态失败');
    }
  }
);

// 创建音乐slice
const musicSlice = createSlice({
  name: 'music',
  initialState,
  reducers: {
    // 清除错误
    clearError: (state) => {
      state.error = null;
    },
    
    // 显示/隐藏播放控制面板
    togglePlaybackPanel: (state) => {
      state.showPlaybackPanel = !state.showPlaybackPanel;
    },
    
    // 设置播放控制面板显示状态
    setPlaybackPanelVisible: (state, action: PayloadAction<boolean>) => {
      state.showPlaybackPanel = action.payload;
    },
    
    // 更新播放状态（用于同步外部状态变化）
    updatePlayingTracks: (state, action: PayloadAction<PlayingTrack[]>) => {
      state.playingTracks = action.payload;
      state.isPlaying = action.payload.length > 0;
    },
  },
  extraReducers: (builder) => {
    // 加载音乐数据
    builder
      .addCase(loadMusicData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadMusicData.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload.categories;
        state.musicList = action.payload.musicList;
      })
      .addCase(loadMusicData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 播放音乐
    builder
      .addCase(playMusic.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(playMusic.fulfilled, (state, action) => {
        state.loading = false;
        const { action: actionType, musicId, playingTrack } = action.payload;
        
        if (actionType === 'play' && playingTrack) {
          // 添加到播放列表
          state.playingTracks.push(playingTrack);
          state.isPlaying = true;
        } else if (actionType === 'stop' && musicId) {
          // 从播放列表中移除
          state.playingTracks = state.playingTracks.filter(track => track.music.id !== musicId);
          state.isPlaying = state.playingTracks.length > 0;
        }
      })
      .addCase(playMusic.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 暂停所有音乐
    builder
      .addCase(pauseAllMusic.fulfilled, (state) => {
        state.isPlaying = false;
      })
      .addCase(pauseAllMusic.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // 恢复所有音乐
    builder
      .addCase(resumeAllMusic.fulfilled, (state) => {
        state.isPlaying = state.playingTracks.length > 0;
      })
      .addCase(resumeAllMusic.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // 停止所有音乐
    builder
      .addCase(stopAllMusic.fulfilled, (state) => {
        state.playingTracks = [];
        state.isPlaying = false;
      })
      .addCase(stopAllMusic.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // 设置音轨音量
    builder
      .addCase(setTrackVolume.fulfilled, (state, action) => {
        const { musicId, volume } = action.payload;
        const track = state.playingTracks.find(track => track.music.id === musicId);
        if (track) {
          track.volume = volume;
        }
      })
      .addCase(setTrackVolume.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // 设置主音量
    builder
      .addCase(setMasterVolume.fulfilled, (state, action) => {
        state.masterVolume = action.payload;
      })
      .addCase(setMasterVolume.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // 切换全局播放状态
    builder
      .addCase(toggleGlobalPlayback.fulfilled, (state, action) => {
        state.isPlaying = action.payload === 'playing';
      })
      .addCase(toggleGlobalPlayback.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

// 导出actions
export const {
  clearError,
  togglePlaybackPanel,
  setPlaybackPanelVisible,
  updatePlayingTracks,
} = musicSlice.actions;

// 选择器
export const selectMusicState = (state: RootState) => state.music;
export const selectMusicList = (state: RootState) => state.music.musicList;
export const selectMusicCategories = (state: RootState) => state.music.categories;
export const selectPlayingTracks = (state: RootState) => state.music.playingTracks;
export const selectIsPlaying = (state: RootState) => state.music.isPlaying;
export const selectMasterVolume = (state: RootState) => state.music.masterVolume;
export const selectShowPlaybackPanel = (state: RootState) => state.music.showPlaybackPanel;
export const selectMusicLoading = (state: RootState) => state.music.loading;
export const selectMusicError = (state: RootState) => state.music.error;

// 复合选择器
export const selectIsTrackPlaying = (state: RootState, musicId: string) => 
  state.music.playingTracks.some(track => track.music.id === musicId);

export const selectTrackVolume = (state: RootState, musicId: string) => {
  const track = state.music.playingTracks.find(track => track.music.id === musicId);
  return track?.volume ?? 1.0;
};

export const selectMusicByCategory = (state: RootState, categoryId: string) =>
  state.music.musicList.filter(music => music.category === categoryId);

// 导出reducer
export default musicSlice.reducer;