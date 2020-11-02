export class Sound {
  private channels: HTMLAudioElement[] = [];
  private current = 0;
  private volume;

  constructor(audio: HTMLAudioElement, volume, numberChannels: number) {
    for (let i = 0; i < numberChannels; i++) {
      this.channels.push(<HTMLAudioElement>audio.cloneNode());
    }
    this.volume = volume;
  }

  get currentTime() {
    return this.channels[0].currentTime;
  }

  set currentTime(v) {
    this.channels[0].currentTime = v;
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

  addEventListener(event: string, f: () => any) {
    this.channels[0].addEventListener(event, f);
  }
}
