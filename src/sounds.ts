export class Sound {

    private channels: HTMLAudioElement[] = [];
    private current = 0;

    constructor(audio: HTMLAudioElement, numberChannels: number) {
        for (let i = 0;i < numberChannels; i++) {
            this.channels.push(<HTMLAudioElement>(audio.cloneNode()));
        }
    }

    play() {
        this.channels[this.current++].play();
        if (this.current >= this.channels.length)
            this.current = 0;
    }

    setVolume(volume: number) {
        for (let channel of this.channels)
            channel.volume = volume;
    }
}