// Mock for react-native-sound
export default class Sound {
  static MAIN_BUNDLE = 'MAIN_BUNDLE';
  static DOCUMENT = 'DOCUMENT';
  static LIBRARY = 'LIBRARY';
  static CACHES = 'CACHES';

  private _filename: string;
  private _basePath?: string;
  private _onError?: (error: any) => void;
  private _loaded: boolean = false;
  private _playing: boolean = false;
  private _paused: boolean = false;

  constructor(filename: string, basePath?: string, onError?: (error: any) => void, onEnd?: () => void) {
    this._filename = filename;
    this._basePath = basePath;
    this._onError = onError;
    
    // Simulate async loading with proper callback
    setTimeout(() => {
      this._loaded = true;
      if (onError) {
        // Simulate successful loading (no error)
        onError(null);
      }
    }, 10);
  }

  static setCategory = jest.fn();
  static setMode = jest.fn();
  static setActive = jest.fn();

  isLoaded = () => this._loaded;
  
  play = jest.fn((callback?: (success: boolean) => void) => {
    this._playing = true;
    this._paused = false;
    
    // Simulate async play with callback
    if (callback) {
      setTimeout(() => {
        callback(true); // Simulate successful play
      }, 10);
    }
    
    return this;
  });

  pause = jest.fn((callback?: () => void) => {
    this._playing = false;
    this._paused = true;
    
    if (callback) {
      setTimeout(callback, 10);
    }
    
    return this;
  });

  stop = jest.fn((callback?: () => void) => {
    this._playing = false;
    this._paused = false;
    
    if (callback) {
      setTimeout(callback, 10);
    }
    
    return this;
  });

  release = jest.fn(() => {
    this._loaded = false;
    this._playing = false;
    this._paused = false;
    return this;
  });

  getDuration = jest.fn(() => 100); // Mock duration in seconds
  getCurrentTime = jest.fn((callback: (seconds: number) => void) => {
    callback(50); // Mock current time
  });

  setCurrentTime = jest.fn();
  setVolume = jest.fn();
  getVolume = jest.fn(() => 1.0);
  setNumberOfLoops = jest.fn();
  setSpeed = jest.fn();

  isPlaying = () => this._playing;
}