import { AbstractAnimation } from './abstract-animation';
import { Animation } from './animation';

export class CompositeAnimation extends AbstractAnimation implements Animation {

  private readonly animations: Animation[];
  private readonly incompleteAnimations: Set<Animation>;

  public constructor(animations: Animation[]) {
    super();
    this.incompleteAnimations = new Set(animations);
    animations.forEach(a => {
      a.on('complete', () => {
        this.incompleteAnimations.delete(a);
        if (this.incompleteAnimations.size === 0) {
          this.emit('complete');
        }
      });

      a.on('update', () => this.emit('update'));
    });
    this.animations = animations;
  }

  public stop() {
    this.animations.forEach(a => a.stop());
  }
}
