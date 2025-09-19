import { MusicConfig, MusicCategory, MusicItem } from '../types/music';

/**
 * 音乐分类配置
 */
const MUSIC_CATEGORIES: MusicCategory[] = [
  { id: 'animals', name: '动物声音', icon: '🐾', description: '各种动物的自然声音' },
  { id: 'binaural', name: '双耳节拍', icon: '🧠', description: '有助于专注和放松的双耳节拍' },
  { id: 'nature', name: '自然声音', icon: '🌿', description: '大自然的纯净声音' },
  { id: 'noise', name: '白噪音', icon: '📻', description: '有助于睡眠和专注的白噪音' },
  { id: 'places', name: '场所环境', icon: '🏢', description: '各种场所的环境音' },
  { id: 'rain', name: '雨声', icon: '🌧️', description: '各种雨声和雷声' },
  { id: 'things', name: '物品声音', icon: '⚙️', description: '日常物品产生的声音' },
  { id: 'transport', name: '交通工具', icon: '🚗', description: '各种交通工具的声音' },
  { id: 'urban', name: '城市声音', icon: '🏙️', description: '城市环境的声音' }
];

/**
 * 音乐项目配置
 */
const MUSIC_ITEMS: MusicItem[] = [
  // animals 分类
  { 
    id: 'birds', 
    title: '鸟鸣声', 
    category: 'animals', 
    audioPath: '/sounds/animals/birds.mp3', 
    audioUrl: '', // 将由MusicDataService动态生成
    icon: '🐦', 
    description: '清晨鸟儿的美妙歌声',
    isLooping: true 
  },
  { 
    id: 'seagulls', 
    title: '海鸥声', 
    category: 'animals', 
    audioPath: '/sounds/animals/seagulls.mp3', 
    audioUrl: '', 
    icon: '🕊️', 
    description: '海边海鸥的叫声',
    isLooping: true 
  },
  { 
    id: 'crickets', 
    title: '蟋蟀声', 
    category: 'animals', 
    audioPath: '/sounds/animals/crickets.mp3', 
    audioUrl: '', 
    icon: '🦗', 
    description: '夜晚蟋蟀的鸣叫',
    isLooping: true 
  },
  { 
    id: 'frogs', 
    title: '青蛙声', 
    category: 'animals', 
    audioPath: '/sounds/animals/frogs.mp3', 
    audioUrl: '', 
    icon: '🐸', 
    description: '池塘边青蛙的叫声',
    isLooping: true 
  },

  // binaural 分类
  { 
    id: 'alpha-waves', 
    title: 'Alpha波', 
    category: 'binaural', 
    audioPath: '/sounds/binaural/alpha-waves.mp3', 
    audioUrl: '', 
    icon: '🧘', 
    description: '促进放松和创造力的Alpha波',
    isLooping: true 
  },
  { 
    id: 'theta-waves', 
    title: 'Theta波', 
    category: 'binaural', 
    audioPath: '/sounds/binaural/theta-waves.mp3', 
    audioUrl: '', 
    icon: '💤', 
    description: '深度放松和冥想的Theta波',
    isLooping: true 
  },
  { 
    id: 'delta-waves', 
    title: 'Delta波', 
    category: 'binaural', 
    audioPath: '/sounds/binaural/delta-waves.mp3', 
    audioUrl: '', 
    icon: '😴', 
    description: '深度睡眠的Delta波',
    isLooping: true 
  },

  // nature 分类
  { 
    id: 'forest', 
    title: '森林声音', 
    category: 'nature', 
    audioPath: '/sounds/nature/forest.mp3', 
    audioUrl: '', 
    icon: '🌲', 
    description: '森林中的自然声音',
    isLooping: true 
  },
  { 
    id: 'ocean-waves', 
    title: '海浪声', 
    category: 'nature', 
    audioPath: '/sounds/nature/ocean-waves.mp3', 
    audioUrl: '', 
    icon: '🌊', 
    description: '海浪拍打海岸的声音',
    isLooping: true 
  },
  { 
    id: 'wind', 
    title: '风声', 
    category: 'nature', 
    audioPath: '/sounds/nature/wind.mp3', 
    audioUrl: '', 
    icon: '💨', 
    description: '轻柔的风声',
    isLooping: true 
  },
  { 
    id: 'river', 
    title: '溪流声', 
    category: 'nature', 
    audioPath: '/sounds/nature/river.mp3', 
    audioUrl: '', 
    icon: '🏞️', 
    description: '山间溪流的声音',
    isLooping: true 
  },

  // noise 分类
  { 
    id: 'white-noise', 
    title: '白噪音', 
    category: 'noise', 
    audioPath: '/sounds/noise/white-noise.mp3', 
    audioUrl: '', 
    icon: '⚪', 
    description: '经典的白噪音',
    isLooping: true 
  },
  { 
    id: 'pink-noise', 
    title: '粉红噪音', 
    category: 'noise', 
    audioPath: '/sounds/noise/pink-noise.mp3', 
    audioUrl: '', 
    icon: '🌸', 
    description: '更柔和的粉红噪音',
    isLooping: true 
  },
  { 
    id: 'brown-noise', 
    title: '棕色噪音', 
    category: 'noise', 
    audioPath: '/sounds/noise/brown-noise.mp3', 
    audioUrl: '', 
    icon: '🤎', 
    description: '深沉的棕色噪音',
    isLooping: true 
  },

  // places 分类
  { 
    id: 'library', 
    title: '图书馆', 
    category: 'places', 
    audioPath: '/sounds/places/library.mp3', 
    audioUrl: '', 
    icon: '📚', 
    description: '安静的图书馆环境音',
    isLooping: true 
  },
  { 
    id: 'cafe', 
    title: '咖啡厅', 
    category: 'places', 
    audioPath: '/sounds/places/cafe.mp3', 
    audioUrl: '', 
    icon: '☕', 
    description: '温馨的咖啡厅氛围',
    isLooping: true 
  },
  { 
    id: 'fireplace', 
    title: '壁炉', 
    category: 'places', 
    audioPath: '/sounds/places/fireplace.mp3', 
    audioUrl: '', 
    icon: '🔥', 
    description: '温暖的壁炉声',
    isLooping: true 
  },

  // rain 分类
  { 
    id: 'light-rain', 
    title: '小雨', 
    category: 'rain', 
    audioPath: '/sounds/rain/light-rain.mp3', 
    audioUrl: '', 
    icon: '🌦️', 
    description: '轻柔的小雨声',
    isLooping: true 
  },
  { 
    id: 'heavy-rain', 
    title: '大雨', 
    category: 'rain', 
    audioPath: '/sounds/rain/heavy-rain.mp3', 
    audioUrl: '', 
    icon: '⛈️', 
    description: '磅礴的大雨声',
    isLooping: true 
  },
  { 
    id: 'rain-on-roof', 
    title: '屋顶雨声', 
    category: 'rain', 
    audioPath: '/sounds/rain/rain-on-roof.mp3', 
    audioUrl: '', 
    icon: '🏠', 
    description: '雨滴敲打屋顶的声音',
    isLooping: true 
  },
  { 
    id: 'thunder', 
    title: '雷声', 
    category: 'rain', 
    audioPath: '/sounds/rain/thunder.mp3', 
    audioUrl: '', 
    icon: '⚡', 
    description: '远处的雷声',
    isLooping: true 
  },

  // things 分类
  { 
    id: 'clock-ticking', 
    title: '时钟滴答声', 
    category: 'things', 
    audioPath: '/sounds/things/clock-ticking.mp3', 
    audioUrl: '', 
    icon: '🕐', 
    description: '规律的时钟滴答声',
    isLooping: true 
  },
  { 
    id: 'fan', 
    title: '电扇声', 
    category: 'things', 
    audioPath: '/sounds/things/fan.mp3', 
    audioUrl: '', 
    icon: '🌀', 
    description: '电扇转动的声音',
    isLooping: true 
  },
  { 
    id: 'washing-machine', 
    title: '洗衣机', 
    category: 'things', 
    audioPath: '/sounds/things/washing-machine.mp3', 
    audioUrl: '', 
    icon: '🧺', 
    description: '洗衣机运转的声音',
    isLooping: true 
  },

  // transport 分类
  { 
    id: 'train', 
    title: '火车声', 
    category: 'transport', 
    audioPath: '/sounds/transport/train.mp3', 
    audioUrl: '', 
    icon: '🚂', 
    description: '火车行驶的声音',
    isLooping: true 
  },
  { 
    id: 'airplane', 
    title: '飞机声', 
    category: 'transport', 
    audioPath: '/sounds/transport/airplane.mp3', 
    audioUrl: '', 
    icon: '✈️', 
    description: '飞机引擎的声音',
    isLooping: true 
  },
  { 
    id: 'car-driving', 
    title: '汽车行驶', 
    category: 'transport', 
    audioPath: '/sounds/transport/car-driving.mp3', 
    audioUrl: '', 
    icon: '🚗', 
    description: '汽车在路上行驶的声音',
    isLooping: true 
  },

  // urban 分类
  { 
    id: 'city-traffic', 
    title: '城市交通', 
    category: 'urban', 
    audioPath: '/sounds/urban/city-traffic.mp3', 
    audioUrl: '', 
    icon: '🚦', 
    description: '城市交通的声音',
    isLooping: true 
  },
  { 
    id: 'construction', 
    title: '建筑工地', 
    category: 'urban', 
    audioPath: '/sounds/urban/construction.mp3', 
    audioUrl: '', 
    icon: '🏗️', 
    description: '建筑工地的声音',
    isLooping: true 
  },
  { 
    id: 'street-ambience', 
    title: '街道环境音', 
    category: 'urban', 
    audioPath: '/sounds/urban/street-ambience.mp3', 
    audioUrl: '', 
    icon: '🛣️', 
    description: '街道的环境声音',
    isLooping: true 
  }
];

/**
 * 完整的音乐配置
 */
export const MUSIC_CONFIG: MusicConfig = {
  baseUrl: 'https://moodist.mvze.net',
  categories: MUSIC_CATEGORIES,
  musicItems: MUSIC_ITEMS
};

export { MUSIC_CATEGORIES, MUSIC_ITEMS };