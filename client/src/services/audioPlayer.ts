/**
 * PaperPod Universal Audio Player Engine
 * Supports native iOS/Android via Expo AV and browser environments via HTML5 Audio.
 */
import { Platform } from 'react-native';
import { Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';

export interface PlaybackState {
  isPlaying: boolean;
  isBuffering: boolean;
  positionMillis: number;
  durationMillis: number;
  rate: number;
  didJustFinish: boolean;
}

type PlaybackCallback = (state: PlaybackState) => void;

class AudioPlayerEngine {
  private sound: Audio.Sound | null = null;
  private webAudio: HTMLAudioElement | null = null;
  private webInterval: any = null;
  private currentUri: string | null = null;
  private listeners: Set<PlaybackCallback> = new Set();
  private lastState: PlaybackState = {
    isPlaying: false,
    isBuffering: false,
    positionMillis: 0,
    durationMillis: 0,
    rate: 1.0,
    didJustFinish: false,
  };

  constructor() {
    if (Platform.OS !== 'web') {
      this.setupAudioMode();
    }
  }

  private async setupAudioMode() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (e) {
      console.warn('[AudioPlayer] AudioMode config warning:', e);
    }
  }

  public subscribe(callback: PlaybackCallback): () => void {
    this.listeners.add(callback);
    callback(this.lastState);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(state: PlaybackState) {
    this.lastState = state;
    this.listeners.forEach((cb) => cb(state));
  }

  private onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error(`[AudioPlayer] Playback error: ${status.error}`);
      }
      return;
    }

    const s = status as AVPlaybackStatusSuccess;
    const newState: PlaybackState = {
      isPlaying: s.isPlaying,
      isBuffering: s.isBuffering,
      positionMillis: s.positionMillis,
      durationMillis: s.durationMillis || this.lastState.durationMillis,
      rate: s.rate,
      didJustFinish: s.didJustFinish,
    };

    this.notifyListeners(newState);
  };

  public async loadAudio(uri: string, autoPlay: boolean = true): Promise<void> {
    if (this.currentUri === uri && (this.sound || this.webAudio)) {
      if (autoPlay) await this.play();
      return;
    }

    await this.unload();
    this.currentUri = uri;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const audio = new window.Audio(uri);
        audio.preload = 'auto';
        this.webAudio = audio;

        audio.onloadedmetadata = () => {
          this.notifyListeners({
            ...this.lastState,
            durationMillis: Math.floor(audio.duration * 1000) || this.lastState.durationMillis,
          });
        };

        audio.onended = () => {
          this.notifyListeners({
            ...this.lastState,
            isPlaying: false,
            didJustFinish: true,
          });
        };

        if (this.webInterval) clearInterval(this.webInterval);
        this.webInterval = setInterval(() => {
          if (this.webAudio && !this.webAudio.paused) {
            this.notifyListeners({
              ...this.lastState,
              isPlaying: true,
              positionMillis: Math.floor(this.webAudio.currentTime * 1000),
              durationMillis: Math.floor(this.webAudio.duration * 1000) || this.lastState.durationMillis,
            });
          }
        }, 100);

        if (autoPlay) {
          audio.play().catch((e) => console.log('[AudioPlayer] Web Autoplay policy notice (tap play button to start):', e));
        }
      } catch (e) {
        console.error('[AudioPlayer] Error loading web audio:', e);
      }
    } else {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: autoPlay, rate: this.lastState.rate, shouldCorrectPitch: true },
          this.onPlaybackStatusUpdate
        );
        this.sound = sound;
      } catch (e) {
        console.error('[AudioPlayer] Error loading native audio:', e);
      }
    }
  }

  public async play(): Promise<void> {
    if (Platform.OS === 'web' && this.webAudio) {
      try {
        await this.webAudio.play();
        this.notifyListeners({ ...this.lastState, isPlaying: true });
      } catch (e) {
        console.warn('[AudioPlayer] Web play error:', e);
      }
      return;
    }
    if (this.sound) {
      await this.sound.playAsync();
    }
  }

  public async pause(): Promise<void> {
    if (Platform.OS === 'web' && this.webAudio) {
      this.webAudio.pause();
      this.notifyListeners({ ...this.lastState, isPlaying: false });
      return;
    }
    if (this.sound) {
      await this.sound.pauseAsync();
    }
  }

  public async togglePlayPause(): Promise<void> {
    if (this.lastState.isPlaying) {
      await this.pause();
    } else {
      await this.play();
    }
  }

  public async seekTo(positionMillis: number): Promise<void> {
    const targetMs = Math.max(0, positionMillis);
    if (Platform.OS === 'web' && this.webAudio) {
      this.webAudio.currentTime = targetMs / 1000;
      this.notifyListeners({ ...this.lastState, positionMillis: targetMs });
      return;
    }
    if (this.sound) {
      await this.sound.setPositionAsync(targetMs);
    }
  }

  public async skip(deltaMillis: number): Promise<void> {
    const target = this.lastState.positionMillis + deltaMillis;
    await this.seekTo(target);
  }

  public async setPlaybackSpeed(rate: number): Promise<void> {
    this.lastState.rate = rate;
    if (Platform.OS === 'web' && this.webAudio) {
      this.webAudio.playbackRate = rate;
      this.notifyListeners({ ...this.lastState, rate });
      return;
    }
    if (this.sound) {
      await this.sound.setRateAsync(rate, true);
    }
  }

  public async unload(): Promise<void> {
    if (this.webInterval) {
      clearInterval(this.webInterval);
      this.webInterval = null;
    }
    if (this.webAudio) {
      this.webAudio.pause();
      this.webAudio.src = '';
      this.webAudio = null;
    }
    if (this.sound) {
      try {
        await this.sound.unloadAsync();
      } catch (e) {
        // ignore
      }
      this.sound = null;
    }
  }

  public getState(): PlaybackState {
    return this.lastState;
  }
}

export const audioPlayer = new AudioPlayerEngine();
