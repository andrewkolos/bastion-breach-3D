import { Rank } from './rank';
import { Suit } from './suit';

export interface CardLike {
  readonly rank: Rank;
  readonly suit: Suit;
}
