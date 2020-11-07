import { AbstractAnimation } from './abstract-animation';
import { Animation } from './animation';

export class NullAnimation extends AbstractAnimation implements Animation {

  public constructor() {
    super();

    setTimeout(() => {
      this.emit('complete');
    }, 0);
  }

  public stop() {}
}
