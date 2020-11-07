import { InheritableEventEmitter } from '@akolos/event-emitter';
import { AnimationEvents } from './animation-events';

export abstract class AbstractAnimation extends InheritableEventEmitter<AnimationEvents> {
}
