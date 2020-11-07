import { InheritableEventEmitter } from '@akolos/event-emitter';
import { Tween } from '@tweenjs/tween.js';
import { Animation } from './animation';
import { AnimationEvents } from "./animation-events";

export class TweenJsAnimation extends InheritableEventEmitter<AnimationEvents> implements Animation {
  private readonly tweens: Array<Tween<any>> = [];
  private readonly incompleteTweens = new Set<Tween<any>>();

  public constructor(tween: Tween<any> | Tween<any>[]) {
    super();
    const asArray = Array.isArray(tween) ? tween : [tween];
    asArray.forEach(tween => {
      tween.onComplete(() => {
        this.incompleteTweens.delete(tween);
        this.emit('complete');
      });
      tween.onUpdate(() => this.emit('update'));

      tween.start();
      this.tweens.push(tween);
      this.incompleteTweens.add(tween);
    });
  }

  public stop() {
    this.tweens.forEach(t => {
      t.stop();
      t.stopChainedTweens();
    });
  }
}
