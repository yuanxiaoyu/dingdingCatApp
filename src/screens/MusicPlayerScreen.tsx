import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MusicListComponent, GlobalPlaybackControl } from '../components';

const MusicPlayerScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Music List */}
      <MusicListComponent
        style={styles.musicList}
        onMusicPlay={(music) => {
          console.log(`Started playing: ${music.title}`);
        }}
        onMusicPause={() => {
          console.log('Music paused');
        }}
        onFavoriteToggle={(music, isFavorited) => {
          console.log(`${music.title} ${isFavorited ? 'added to' : 'removed from'} favorites`);
        }}
      />
      
      {/* Global Playback Control - Floating */}
      <GlobalPlaybackControl
        position="floating"
        showVolumeControl={true}
        onPlayStateChange={(isPlaying) => {
          console.log(`Global playback state changed: ${isPlaying ? 'playing' : 'paused'}`);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  musicList: {
    flex: 1,
  },
});

export default MusicPlayerScreen;