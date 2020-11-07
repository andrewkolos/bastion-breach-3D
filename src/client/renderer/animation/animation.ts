
import { EventSource } from '@akolos/event-emitter';
import { AnimationEvents } from './animation-events';

export interface Animation extends EventSource<AnimationEvents> {
  stop(): void;
}
