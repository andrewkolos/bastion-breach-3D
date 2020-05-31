import { Rank, isFace, isNumerical } from './rank';
import { Suit } from './suit';

export class Card {
  public constructor(public readonly suit: Suit, public readonly rank: Rank) {}

  public readonly isFaceCard = isFace(this.rank);
  public readonly isNumberCard = isNumerical(this.rank);
  
  public equals(o: Card) {
    return this.suit === o.suit && this.rank === o.rank;
  }

  public toString() {
    return Rank[this.rank] + Suit[this.suit];
  }
}
