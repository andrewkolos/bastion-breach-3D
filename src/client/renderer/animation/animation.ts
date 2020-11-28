
import { EventSource } from '@akolos/event-emitter';
import { Timeline } from '@akolos/ts-tween';
import { AnimationEvents } from './animation-events';

export interface Animation extends EventSource<AnimationEvents> {
  complete(): void;
  stop(): void;
  localTime: number
  length: number;
  chain(o: Animation): Animation;
  _underylingTimeline: Timeline;
}
