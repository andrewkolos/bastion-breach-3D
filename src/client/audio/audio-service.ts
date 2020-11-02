import { SoundId } from './sound-id';

const SOUND_DIR_PATH = 'sound/';
const MUSIC_PATH = SOUND_DIR_PATH + 'quadproquo.mp3';
const INIT_MUSIC_VOLUME = 0.3;

interface SoundData {
  path: string;
  volumeCoeff?: number;
}

const soundData: ReadonlyMap<SoundId, SoundData> = new Map([
  [SoundId.CardFlip, {
    path: SOUND_DIR_PATH + 'cardflip.mp3',
    volumeCoeff: 0.9,
  }],
  [SoundId.CardPlay, {
    path: SOUND_DIR_PATH + 'drawcard.mp3',
    volumeCoeff: 0.6,
  }],
  [SoundId.BackgroundMusic, {
    path: SOUND_DIR_PATH + 'quadproquo.mp3',
  }],
]);

export class AudioService {

  private _musicVolume = INIT_MUSIC_VOLUME;
  private _isMusicPlaying = false;

  private musicAudio?: HTMLAudioElement;

  public get musicVolume() {
    return this._musicVolume;
  }

  public set musicVolume(value: number) {
    this._musicVolume = value;
  }

  public get isMusicPlaying() {
    return this._isMusicPlaying;
  }

  public playSound(id: SoundId, volume: number = 1.0) {
    const data = soundData.get(id);
    if (data == null) {
      throw Error(`Could not find sound: ${data}`);
    }

    const audio = new Audio(data.path);
    audio.volume = volume * (data.volumeCoeff != null ? data.volumeCoeff : 1.0);
    audio.addEventListener('ended', () => {
      audio.remove();
    });
    audio.play();
  }

  public playMusic() {
    this.musicAudio = new Audio(MUSIC_PATH);
    this.musicAudio.loop = true;
    this.musicAudio.volume = this._musicVolume;
    this._isMusicPlaying = true;
  }

  public stopMusic() {
    if (this.musicAudio == null) return;

    this.musicAudio.pause();
    this.musicAudio.remove();
    this._isMusicPlaying = false;
  }
}
