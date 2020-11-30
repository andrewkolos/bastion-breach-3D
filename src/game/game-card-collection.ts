import { Card } from '../card/card';

export interface GameCardCollection<T = Card> {
  onBoard: {
    p1: T[];
    p2: T[];
    neutral: T[];
  };
  inHand: {
    p1: T[];
    p2: T[];
  };
}
