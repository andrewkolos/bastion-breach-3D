import {isUndefined} from "typescript-collections/dist/lib/util";

export class TweenGroup {

    private tcount: number;

    onCompleteCallback: Function;

    constructor(public tweens: any[], onCompleteCallback?: Function) {
        this.tcount = tweens.length;
        for (let i = 0; i < tweens.length; i++) {
            tweens[i] = tweens[i].onComplete(() => {
                this.tcount--;
                this.test();
            });
        }
        this.onCompleteCallback = onCompleteCallback;
    }

    public start() {
        this.tweens.forEach(t=>t.start());
    }

    private test() {
        if (this.tcount === 0)
            if (this.onCompleteCallback !== undefined)
                this.onCompleteCallback();
    }
}