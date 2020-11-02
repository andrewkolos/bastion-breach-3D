// May not be needed.

import { InheritableEventEmitter } from '@akolos/event-emitter';
import { Tween } from '@tweenjs/tween.js';

export interface AnimationEvents {
  update: () => void;
  complete: () => void;
}


export type Animation = InstanceType<typeof AnimationInternal>;

class AnimationInternal extends InheritableEventEmitter<AnimationEvents> {
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
    })
  }

  public end() {
    this.tweens.forEach(t => {
      t.end();
      this.incompleteTweens.delete(t);
    });
  }

}
