import { Rank } from './rank';
import { Suit } from './suit';

export class Card {
  public constructor(public readonly rank: Rank, public readonly suit: Suit) {}

  public static fromString(str: String) {
    for (const rank of Rank) {
      for (const suit of Suit) {
        const card = new Card(rank, suit);
        if (str === card.toString()) {
          return card;
        }
      }
    }

    throw Error(`Failed to parse card string: ${str}`);
  }

  public equals(o: Card) {
    return this.suit === o.suit && this.rank === o.rank;
  }

  public toString() {
    return this.rank.abbreviation + this.suit.unicodeSymbol;
  }
}
