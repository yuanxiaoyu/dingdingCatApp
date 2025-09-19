# 全局播放控制功能

## 概述

全局播放控制功能为音乐播放器应用提供了统一的播放/暂停控制，用户可以通过全局按钮或控制面板来管理所有正在播放的音乐。

## 核心功能

### 1. 全局播放状态管理
- 统一管理所有音乐轨道的播放状态
- 支持三种状态：`playing`（播放中）、`paused`（已暂停）、`stopped`（已停止）
- 自动同步状态变化

### 2. 全局播放控制
- **播放/暂停切换**：一键控制所有音乐的播放状态
- **停止所有音乐**：立即停止所有正在播放的音乐
- **音量控制**：统一调节所有音乐的主音量

### 3. 智能状态检测
- 自动检测是否有音乐在播放
- 实时更新播放轨道数量
- 智能显示/隐藏控制界面

## 组件介绍

### GlobalPlayButton
简洁的全局播放按钮，适合集成到任何界面中。

```tsx
import { GlobalPlayButton } from '../components';

// 基本使用
<GlobalPlayButton />

// 自定义样式
<GlobalPlayButton 
  size="large"
  variant="outlined"
  onPress={(isPlaying) => {
    console.log(`播放状态: ${isPlaying ? '播放中' : '已暂停'}`);
  }}
/>
```

#### 属性说明
- `size`: 按钮尺寸 - `'small' | 'medium' | 'large'`
- `variant`: 按钮样式 - `'filled' | 'outlined' | 'minimal'`
- `style`: 自定义样式
- `onPress`: 播放状态变化回调

### GlobalPlaybackControl
完整的播放控制面板，包含播放控制和音量调节。

```tsx
import { GlobalPlaybackControl } from '../components';

// 浮动控制面板
<GlobalPlaybackControl
  position="floating"
  showVolumeControl={true}
  onPlayStateChange={(isPlaying) => {
    console.log(`全局播放状态: ${isPlaying ? '播放中' : '暂停'}`);
  }}
/>
```

#### 属性说明
- `position`: 控制面板位置 - `'bottom' | 'top' | 'floating'`
- `showVolumeControl`: 是否显示音量控制
- `style`: 自定义样式
- `onPlayStateChange`: 播放状态变化回调

## Redux 集成

### Actions
```tsx
import { useDispatch } from 'react-redux';
import { 
  toggleGlobalPlayback,
  pauseAllMusic,
  resumeAllMusic,
  stopAllMusic 
} from '../store/slices/musicSlice';

const dispatch = useDispatch();

// 切换全局播放状态
dispatch(toggleGlobalPlayback());

// 暂停所有音乐
dispatch(pauseAllMusic());

// 恢复所有音乐
dispatch(resumeAllMusic());

// 停止所有音乐
dispatch(stopAllMusic());
```

### Selectors
```tsx
import { useSelector } from 'react-redux';
import { 
  selectIsPlaying,
  selectPlayingTracks,
  selectMasterVolume 
} from '../store/slices/musicSlice';

// 获取播放状态
const isPlaying = useSelector(selectIsPlaying);

// 获取播放中的音乐列表
const playingTracks = useSelector(selectPlayingTracks);

// 获取主音量
const masterVolume = useSelector(selectMasterVolume);
```

## 服务层 API

### MusicPlayerService
```tsx
import