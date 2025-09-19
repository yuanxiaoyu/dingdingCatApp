import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { MusicItem } from '../../types/music';
import { MusicFavoritesService } from '../../services/MusicFavoritesService';

// 收藏状态接口
interface FavoritesState {
  // 收藏数据
  favorites: MusicItem[];
  
  // 加载状态
  loading: boolean;
  error: string | null;
  
  // 操作状态
  isAddingFavorite: boolean;
  isRemovingFavorite: boolean;
}

// 初始状态
const initialState: FavoritesState = {
  favorites: [],
  loading: false,
  error: null,
  isAddingFavorite: false,
  isRemovingFavorite: false,
};

// 异步操作：加载收藏列表
export const loadFavorites = createAsyncThunk(
  'favorites/loadFavorites',
  async (_, { rejectWithValue }) => {
    try {
      const favorites = await MusicFavoritesService.getFavorites();
      return favorites;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '加载收藏列表失败');
    }
  }
);

// 异步操作：添加到收藏
export const addToFavorites = createAsyncThunk(
  'favorites/addToFavorites',
  async (music: MusicItem, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const isAlreadyFavorited = state.favorites.favorites.some(fav => fav.id === music.id);
      
      if (isAlreadyFavorited) {
        throw new Error('该音乐已在收藏列表中');
      }
      
      await MusicFavoritesService.addToFavorites(music);
      return music;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '添加收藏失败');
    }
  }
);

// 异步操作：从收藏中移除
export const removeFromFavorites = createAsyncThunk(
  'favorites/removeFromFavorites',
  async (musicId: string, { rejectWithValue }) => {
    try {
      await MusicFavoritesService.removeFromFavorites(musicId);
      return musicId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '移除收藏失败');
    }
  }
);

// 异步操作：切换收藏状态
export const toggleFavorite = createAsyncThunk(
  'favorites/toggleFavorite',
  async (music: MusicItem, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const isCurrentlyFavorited = state.favorites.favorites.some(fav => fav.id === music.id);
      
      if (isCurrentlyFavorited) {
        await dispatch(removeFromFavorites(music.id)).unwrap();
        return { action: 'remove', music };
      } else {
        await dispatch(addToFavorites(music)).unwrap();
        return { action: 'add', music };
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '切换收藏状态失败');
    }
  }
);

// 异步操作：清空所有收藏
export const clearAllFavorites = createAsyncThunk(
  'favorites/clearAllFavorites',
  async (_, { rejectWithValue }) => {
    try {
      await MusicFavoritesService.clearAllFavorites();
      return true;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '清空收藏失败');
    }
  }
);

// 异步操作：检查是否已收藏
export const checkIsFavorited = createAsyncThunk(
  'favorites/checkIsFavorited',
  async (musicId: string, { rejectWithValue }) => {
    try {
      const isFavorited = await MusicFavoritesService.isFavorited(musicId);
      return { musicId, isFavorited };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '检查收藏状态失败');
    }
  }
);

// 创建收藏slice
const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    // 清除错误
    clearError: (state) => {
      state.error = null;
    },
    
    // 重置加载状态
    resetLoadingState: (state) => {
      state.loading = false;
      state.isAddingFavorite = false;
      state.isRemovingFavorite = false;
    },
    
    // 本地添加收藏（用于乐观更新）
    addFavoriteLocally: (state, action: PayloadAction<MusicItem>) => {
      const music = action.payload;
      const exists = state.favorites.some(fav => fav.id === music.id);
      if (!exists) {
        state.favorites.push(music);
      }
    },
    
    // 本地移除收藏（用于乐观更新）
    removeFavoriteLocally: (state, action: PayloadAction<string>) => {
      const musicId = action.payload;
      state.favorites = state.favorites.filter(fav => fav.id !== musicId);
    },
  },
  extraReducers: (builder) => {
    // 加载收藏列表
    builder
      .addCase(loadFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadFavorites.fulfilled, (state, action) => {
        state.loading = false;
        state.favorites = action.payload;
      })
      .addCase(loadFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 添加到收藏
    builder
      .addCase(addToFavorites.pending, (state) => {
        state.isAddingFavorite = true;
        state.error = null;
      })
      .addCase(addToFavorites.fulfilled, (state, action) => {
        state.isAddingFavorite = false;
        const music = action.payload;
        const exists = state.favorites.some(fav => fav.id === music.id);
        if (!exists) {
          state.favorites.push(music);
        }
      })
      .addCase(addToFavorites.rejected, (state, action) => {
        state.isAddingFavorite = false;
        state.error = action.payload as string;
      });

    // 从收藏中移除
    builder
      .addCase(removeFromFavorites.pending, (state) => {
        state.isRemovingFavorite = true;
        state.error = null;
      })
      .addCase(removeFromFavorites.fulfilled, (state, action) => {
        state.isRemovingFavorite = false;
        const musicId = action.payload;
        state.favorites = state.favorites.filter(fav => fav.id !== musicId);
      })
      .addCase(removeFromFavorites.rejected, (state, action) => {
        state.isRemovingFavorite = false;
        state.error = action.payload as string;
      });

    // 切换收藏状态
    builder
      .addCase(toggleFavorite.pending, (state) => {
        state.error = null;
      })
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        // toggleFavorite 的状态更新由 addToFavorites 和 removeFromFavorites 处理
      })
      .addCase(toggleFavorite.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // 清空所有收藏
    builder
      .addCase(clearAllFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearAllFavorites.fulfilled, (state) => {
        state.loading = false;
        state.favorites = [];
      })
      .addCase(clearAllFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 检查是否已收藏
    builder
      .addCase(checkIsFavorited.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

// 导出actions
export const {
  clearError,
  resetLoadingState,
  addFavoriteLocally,
  removeFavoriteLocally,
} = favoritesSlice.actions;

// 选择器
export const selectFavoritesState = (state: RootState) => state.favorites;
export const selectFavorites = (state: RootState) => state.favorites.favorites;
export const selectFavoritesLoading = (state: RootState) => state.favorites.loading;
export const selectFavoritesError = (state: RootState) => state.favorites.error;
export const selectIsAddingFavorite = (state: RootState) => state.favorites.isAddingFavorite;
export const selectIsRemovingFavorite = (state: RootState) => state.favorites.isRemovingFavorite;

// 复合选择器
export const selectIsFavorited = (state: RootState, musicId: string) =>
  state.favorites.favorites.some(fav => fav.id === musicId);

export const selectFavoriteById = (state: RootState, musicId: string) =>
  state.favorites.favorites.find(fav => fav.id === musicId);

export const selectFavoritesByCategory = (state: RootState, categoryId: string) =>
  state.favorites.favorites.filter(fav => fav.category === categoryId);

export const selectFavoritesCount = (state: RootState) => state.favorites.favorites.length;

// 导出reducer
export default favoritesSlice.reducer;