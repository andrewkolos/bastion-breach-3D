import { CardLike } from './card-like';

export class Rank {
  public static readonly Two = new Rank('two', '2');
  public static readonly Three = new Rank('three', '3');
  public static readonly Four = new Rank('four', '4');
  public static readonly Five = new Rank('five', '5');
  public static readonly Six = new Rank('six', '6');
  public static readonly Seven = new Rank('seven', '7');
  public static readonly Eight = new Rank('eight', '8');
  public static readonly Nine = new Rank('nine', '9');
  public static readonly Ten = new Rank('ten', '10');
  public static readonly Jack = new Rank('jack', 'J');
  public static readonly Queen = new Rank('queen', 'Q');
  public static readonly King = new Rank('king', 'K');
  public static readonly Ace = new Rank('ace','A');

  /**
   * Returns an array containing each rank value exactly once and in standard order with
   * faces ordered and aces-high (i.e. [...numbers in order, J, Q, K, A]).
   */
  public static all(): Rank[] {
    return Object.values(Rank).filter((value) => value instanceof Rank);
  }

  public static isRank(value: any): value is Rank {
    const asRank = value as Rank;
    return (asRank.abbreviation && asRank.name && asRank.beats) != null;
  }

  public static arrayFromCards(cards: CardLike[]): Rank[] {
    return cards.map(c => c.rank);
  }

  public static [Symbol.iterator]() {
    return Rank.all()[Symbol.iterator]();
  }

  private constructor(
    public readonly name: RankName,
    public readonly abbreviation: RankAbbreviation
  ) { }

  public get isNumeric(): boolean {
    return !this.isFace && this !== Rank.Ace;
  }

  public get isFace(): boolean {
    return [Rank.King, Rank.Queen, Rank.Jack].includes(this);
  }

  public beats(other: Rank | Rank[]): boolean {
    const otherAsArray = Array.isArray(other) ? other : [other];

    return otherAsArray.every((o) => {
      if (this === o) return false;

      if (this === Rank.Ace) {
        return o.isFace;
      }

      if (o === Rank.Ace) {
        return !this.isFace;
      }

      const allRanksButAce = Rank.all().filter((r) => r !== Rank.Ace);

      return allRanksButAce.indexOf(this) > allRanksButAce.indexOf(o);
    });
  }

  public toString() {
    return capitalize(this.name);

    function capitalize(word: string) {
      return word.slice(0, 1).toUpperCase() + word.slice(1);
    }
  }
}

export type RankAbbreviation = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export type RankName =
  | 'two'
  | 'three'
  | 'four'
  | 'five'
  | 'six'
  | 'seven'
  | 'eight'
  | 'nine'
  | 'ten'
  | 'jack'
  | 'queen'
  | 'king'
  | 'ace';
