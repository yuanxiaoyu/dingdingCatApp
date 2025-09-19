declare module 'react-native-sound' {
  export interface SoundCallback {
    (error: any, sound?: Sound): void;
  }

  export interface PlayCallback {
    (success: boolean): void;
  }

  export default class Sound {
    constructor(filename: string, basePath: string, onError?: SoundCallback);
    
    static setCategory(category: string, mixWithOthers?: boolean): void;
    static setActive(active: boolean): void;
    static setMode(mode: string): void;
    static setSpeakerphoneOn(speaker: boolean): void;
    
    play(onEnd?: PlayCallback): Sound;
    pause(callback?: () => void): Sound;
    stop(callback?: () => void): Sound;
    reset(): Sound;
    release(): Sound;
    
    setVolume(volume: number): Sound;
    getVolume(callback: (volume: number) => void): Sound;
    
    setNumberOfLoops(loops: number): Sound;
    getNumberOfLoops(callback: (loops: number) => void): Sound;
    
    getCurrentTime(callback: (seconds: number) => void): Sound;
    setCurrentTime(seconds: number): Sound;
    
    getDuration(): number;
    
    isLoaded(): boolean;
    isPlaying(): boolean;
  }
}