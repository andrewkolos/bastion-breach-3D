export class Suit {
  public static readonly Spades = new Suit('spades', '♠');
  public static readonly Hearts = new Suit('hearts', '♥');
  public static readonly Diamonds = new Suit('diamonds', '♦');
  public static readonly Clubs = new Suit('clubs', '♣');

  public static all(): Suit[] {
    return Object.values(Suit).filter((value) => value instanceof Suit);
  }

  public static [Symbol.iterator](): IterableIterator<Suit> {
    return Suit.all()[Symbol.iterator]();
  }

  public toString() {
    return capitalize(this.name);

    function capitalize(word: string) {
      return word.slice(0, 1).toUpperCase() + word.slice(1);
    }
  }
  private constructor(public readonly name: SuitName, public readonly unicodeSymbol: string) {}
}

export type SuitName = 'clubs' | 'diamonds' | 'hearts' | 'spades';
export type SuitUnicodeSymbol = '♣' | '♦' | '♥' | '♠';
