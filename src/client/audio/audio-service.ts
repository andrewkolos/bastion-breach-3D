import { SoundId } from './sound-id';

const SOUND_DIR_PATH = 'sound/';
const MUSIC_PATH = SOUND_DIR_PATH + 'quadproquo.mp3';
const INIT_MUSIC_VOLUME = 0.3;
const INIT_SOUND_VOLUME = 1.0;

interface SoundData {
  id: SoundId;
  path: string;
  volumeNormalization?: number;
}

const sounds: SoundData[] = [
  {
    id: SoundId.CardFlip,
    path: SOUND_DIR_PATH + 'cardflip.mp3',
    volumeNormalization: 0.9,
  },
  {
    id: SoundId.CardPlay,
    path: SOUND_DIR_PATH + 'drawcard.mp3',
    volumeNormalization: 0.6,
  },
  {
    id: SoundId.BackgroundMusic,
    path: SOUND_DIR_PATH + 'quadproquo.mp3',
    volumeNormalization: 0.2,
  },
];

const soundsByIdEntries: [SoundId, SoundData][] = sounds.map(s => [s.id, s]);
const soundsById: ReadonlyMap<SoundId, SoundData> = new Map(soundsByIdEntries);

export class AudioService {

  private static _musicVolume = INIT_MUSIC_VOLUME;
  private static _soundVolume = INIT_SOUND_VOLUME;
  private static _isMusicPlaying = false;

  private static musicAudio?: HTMLAudioElement;

  private constructor() { }

  public static get musicVolume() {
    return AudioService._musicVolume;
  }

  public static set musicVolume(value: number) {
    AudioService._musicVolume = value;
  }

  public static get isMusicPlaying() {
    return AudioService._isMusicPlaying;
  }

  public static get soundVolume() {
    return AudioService._soundVolume;
  }

  public static set soundVolume(value: number) {
    this._soundVolume = value;
  }

  public static playSound(id: SoundId) {
    const data = soundsById.get(id);
    if (data == null) {
      throw Error(`Could not find sound: ${data}`);
    }

    const audio = new Audio(data.path);
    audio.volume = this._soundVolume * (data.volumeNormalization ?? 1.0);
    audio.addEventListener('ended', () => {
      audio.remove();
    });
    audio.play();
  }

  public playMusic() {
    AudioService.musicAudio = new Audio(MUSIC_PATH);
    AudioService.musicAudio.loop = true;
    AudioService.musicAudio.volume = AudioService._musicVolume;
    AudioService._isMusicPlaying = true;
  }

  public stopMusic() {
    if (AudioService.musicAudio == null) return;

    AudioService.musicAudio.pause();
    AudioService.musicAudio.remove();
    AudioService._isMusicPlaying = false;
  }
}
