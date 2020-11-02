import { Rank, RankAbbreviation, RankName } from './rank';
import { Suit, SuitName, SuitUnicodeSymbol } from './suit';
import { CardLike } from './card-like';

export class Card implements CardLike {

  public readonly rank: Rank;
  public readonly suit: Suit;

  public readonly name: CardName;
  public readonly abbreviation: CardAbbreviation;
  
  public get isNumeric(): boolean {
    return this.rank.isNumeric;
  };

  public get isFace(): boolean {
    return this.rank.isFace;
  }

  public constructor(rank: Rank, suit: Suit);
  public constructor(card: CardLike);
  public constructor(cardOrRank: CardLike | Rank, suit?: Suit) {
    if (Rank.isRank(cardOrRank)) {
      this.rank = cardOrRank;
      if (suit == null) {
        throw TypeError('No value was provided for the card suit.');
      }
      this.suit = suit;
    } else {
      this.rank = cardOrRank.rank;
      this.suit = cardOrRank.suit;
    }

    this.name = `${this.rank.name} of ${this.suit.name}s` as CardName;
    this.abbreviation = `${this.rank.abbreviation}${this.suit.unicodeSymbol}` as CardAbbreviation;
  }

  public static parse(str: CardAbbreviation | CardName) {
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

  public static makeDeckOf(): Card[] {
    const ranks = Rank.all();
    const suits = Suit.all();

    return ranks.map((r, i) => new Card(r, suits[i]));
  }

  public static allRanksOfSuit(suit: Suit): Card[] {
    return Rank.all().map((r) => new Card(r, suit));
  }

  public equals(o: Card) {
    return this.suit === o.suit && this.rank === o.rank;
  }

  public toString() {
    return this.abbreviation; // Favor shortname for conciseness/memory.
  }
}

export type CardAbbreviation = `${RankAbbreviation}${SuitUnicodeSymbol}`;
export type CardName = `${RankName} of ${SuitName}`;