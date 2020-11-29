export class Sound {
  private channels: HTMLAudioElement[] = [];
  private current = 0;
  private volume;

  constructor(audio: HTMLAudioElement, volume: number, numberChannels: number) {
    for (let i = 0; i < numberChannels; i++) {
      this.channels.push(<HTMLAudioElement>audio.cloneNode());
    }
    this.volume = volume;
  }

  get duration() {
    return this.channels[0].duration;
  }
  
  play() {
    this.channels[this.current++].play();
    if (this.current >= this.channels.length) {
      this.current = 0;
    }
  }

  setVolume(vol: number) {
    for (const channel of this.channels) {
      channel.volume = this.volume * vol;
    }
  }

  getCurrentTime(channel: number) {
    return this.channels[channel].currentTime;
  }

  setCurrentTime(channel: number, value: number) {
    this.channels[channel].currentTime = value;
  }

  public readonly on: HTMLAudioElement['addEventListener'] = (...args: Parameters<HTMLAudioElement['addEventListener']>) => {
    this.channels.forEach(c => c.addEventListener(...args));
  }

  public readonly off: HTMLAudioElement['removeEventListener'] = (...args: Parameters<HTMLAudioElement['removeEventListener']>) => {
    this.channels.forEach(c => c.removeEventListener(...args));
  }
}
