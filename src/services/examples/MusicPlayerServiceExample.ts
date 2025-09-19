import { MusicPlayerService } from '../MusicPlayerService';
import { MusicDataService } from '../MusicDataService';

/**
 * MusicPlayerService 使用示例
 * 演示如何使用多音源音乐播放服务
 */
export class MusicPlayerServiceExample {
  /**
   * 基本播放示例
   */
  static async basicPlaybackExample(): Promise<void> {
    console.log('=== 基本播放示例 ===');
    
    // 初始化服务
    MusicPlayerService.initialize();
    
    // 获取一些音乐
    const musicList = MusicDataService.getMusicList();
    const rainMusic = musicList.find(m => m.category === 'rain');
    const natureMusic = musicList.find(m => m.category === 'nature');
    
    if (!rainMusic || !natureMusic) {
      console.log('未找到测试音乐');
      return;
    }
    
    try {
      // 播放雨声
      console.log(`开始播放: ${rainMusic.title}`);
      await MusicPlayerService.addTrack(rainMusic, 0.8);
      
      // 等待一会儿
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 叠加自然声音
      console.log(`叠加播放: ${natureMusic.title}`);
      await MusicPlayerService.addTrack(natureMusic, 0.6);
      
      // 检查播放状态
      console.log(`当前播放轨道数: ${MusicPlayerService.getPlayingTrackCount()}`);
      console.log(`是否有音乐在播放: ${MusicPlayerService.isAnyTrackPlaying()}`);
      
      // 等待一会儿
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 停止所有音乐
      console.log('停止所有音乐');
      await MusicPlayerService.stopAllTracks();
      
    } catch (error) {
      console.error('播放示例出错:', error);
    }
  }

  /**
   * 音量控制示例
   */
  static async volumeControlExample(): Promise<void> {
    console.log('=== 音量控制示例 ===');
    
    const musicList = MusicDataService.getMusicList();
    const testMusic = musicList[0];
    
    if (!testMusic) {
      console.log('未找到测试音乐');
      return;
    }
    
    try {
      // 播放音乐
      await MusicPlayerService.addTrack(testMusic, 1.0);
      console.log(`开始播放: ${testMusic.title} (音量: 100%)`);
      
      // 等待一会儿
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 调整轨道音量
      await MusicPlayerService.setTrackVolume(testMusic.id, 0.5);
      console.log('轨道音量调整到 50%');
      
      // 等待一会儿
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 调整主音量
      await MusicPlayerService.setMasterVolume(0.3);
      console.log('主音量调整到 30%');
      
      // 等待一会儿
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 恢复音量
      await MusicPlayerService.setMasterVolume(1.0);
      await MusicPlayerService.setTrackVolume(testMusic.id, 1.0);
      console.log('音量恢复到 100%');
      
      // 清理
      await MusicPlayerService.stopAllTracks();
      
    } catch (error) {
      console.error('音量控制示例出错:', error);
    }
  }

  /**
   * 淡入淡出示例
   */
  static async fadeEffectExample(): Promise<void> {
    console.log('=== 淡入淡出示例 ===');
    
    const musicList = MusicDataService.getMusicList();
    const testMusic = musicList[0];
    
    if (!testMusic) {
      console.log('未找到测试音乐');
      return;
    }
    
    try {
      // 播放音乐（静音开始）
      await MusicPlayerService.addTrack(testMusic, 0.0);
      console.log(`开始播放: ${testMusic.title} (静音)`);
      
      // 淡入效果
      console.log('开始淡入...');
      await MusicPlayerService.setTrackVolume(testMusic.id, 1.0); // 设置目标音量
      await MusicPlayerService.fadeInTrack(testMusic.id, 3000); // 3秒淡入
      console.log('淡入完成');
      
      // 等待一会儿
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 淡出效果
      console.log('开始淡出...');
      await MusicPlayerService.fadeOutTrack(testMusic.id, 2000); // 2秒淡出
      console.log('淡出完成');
      
      // 清理
      await MusicPlayerService.stopAllTracks();
      
    } catch (error) {
      console.error('淡入淡出示例出错:', error);
    }
  }

  /**
   * 多音源混合示例
   */
  static async multiTrackMixingExample(): Promise<void> {
    console.log('=== 多音源混合示例 ===');
    
    const categories = ['rain', 'nature', 'noise', 'animals'];
    const tracks: any[] = [];
    
    try {
      // 从不同分类中选择音乐
      for (const category of categories) {
        const musicList = MusicDataService.getMusicList(category);
        if (musicList.length > 0) {
          const music = musicList[0];
          const volume = 0.3 + Math.random() * 0.4; // 随机音量 0.3-0.7
          
          console.log(`添加轨道: ${music.title} (${category}) - 音量: ${Math.round(volume * 100)}%`);
          await MusicPlayerService.addTrack(music, volume);
          tracks.push({ music, volume });
          
          // 短暂延迟
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      console.log(`\n当前播放 ${MusicPlayerService.getPlayingTrackCount()} 个轨道`);
      
      // 显示所有轨道信息
      const playingTracks = MusicPlayerService.getPlayingTracks();
      playingTracks.forEach((track, index) => {
        console.log(`轨道 ${index + 1}: ${track.music.title} (音量: ${Math.round(track.volume * 100)}%)`);
      });
      
      // 等待一会儿让用户听到混合效果
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 逐个调整音量
      console.log('\n开始动态调整音量...');
      for (const track of tracks) {
        const newVolume = Math.random() * 0.8;
        await MusicPlayerService.setTrackVolume(track.music.id, newVolume);
        console.log(`${track.music.title} 音量调整到 ${Math.round(newVolume * 100)}%`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // 等待一会儿
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 逐个停止轨道
      console.log('\n开始逐个停止轨道...');
      for (const track of tracks) {
        await MusicPlayerService.removeTrack(track.music.id);
        console.log(`停止: ${track.music.title}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log('所有轨道已停止');
      
    } catch (error) {
      console.error('多音源混合示例出错:', error);
      // 确保清理
      await MusicPlayerService.stopAllTracks();
    }
  }

  /**
   * 错误处理示例
   */
  static async errorHandlingExample(): Promise<void> {
    console.log('=== 错误处理示例 ===');
    
    try {
      // 尝试播放不存在的音乐
      const invalidMusic = {
        id: 'invalid-music',
        title: '不存在的音乐',
        category: 'test',
        audioPath: '/invalid/path.mp3',
        audioUrl: 'https://invalid-url.com/invalid.mp3',
        icon: '❌',
        isLooping: true
      };
      
      console.log('尝试播放无效音乐...');
      try {
        await MusicPlayerService.addTrack(invalidMusic);
      } catch (error) {
        console.log('✅ 正确捕获了加载错误:', (error as Error).message);
      }
      
      // 尝试操作不存在的轨道
      console.log('尝试操作不存在的轨道...');
      await MusicPlayerService.pauseTrack('non-existent-id');
      await MusicPlayerService.resumeTrack('non-existent-id');
      await MusicPlayerService.setTrackVolume('non-existent-id', 0.5);
      console.log('✅ 不存在轨道的操作被优雅处理');
      
      // 测试音量范围限制
      console.log('测试音量范围限制...');
      await MusicPlayerService.setMasterVolume(2.0); // 超出范围
      console.log(`主音量设置为 2.0，实际值: ${MusicPlayerService.getMasterVolume()}`);
      
      await MusicPlayerService.setMasterVolume(-0.5); // 超出范围
      console.log(`主音量设置为 -0.5，实际值: ${MusicPlayerService.getMasterVolume()}`);
      
      // 恢复正常音量
      await MusicPlayerService.setMasterVolume(1.0);
      
    } catch (error) {
      console.error('错误处理示例出错:', error);
    }
  }

  /**
   * 运行所有示例
   */
  static async runAllExamples(): Promise<void> {
    console.log('🎵 MusicPlayerService 示例演示开始\n');
    
    try {
      await this.basicPlaybackExample();
      console.log('\n' + '='.repeat(50) + '\n');
      
      await this.volumeControlExample();
      console.log('\n' + '='.repeat(50) + '\n');
      
      await this.fadeEffectExample();
      console.log('\n' + '='.repeat(50) + '\n');
      
      await this.multiTrackMixingExample();
      console.log('\n' + '='.repeat(50) + '\n');
      
      await this.errorHandlingExample();
      
    } catch (error) {
      console.error('示例运行出错:', error);
    } finally {
      // 确保清理所有资源
      await MusicPlayerService.cleanup();
      console.log('\n🎵 示例演示结束，资源已清理');
    }
  }
}

// 导出便捷函数
export const runMusicPlayerExamples = () => MusicPlayerServiceExample.runAllExamples();

// 如果在开发环境中，添加到全局对象以便调试
if (__DEV__ && typeof global !== 'undefined') {
  (global as any).MusicPlayerServiceExample = MusicPlayerServiceExample;
  (global as any).runMusicPlayerExamples = runMusicPlayerExamples;
}