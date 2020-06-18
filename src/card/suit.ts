export class Suit {
  public static readonly Spade = new Suit('spade', '♠');
  public static readonly Heart = new Suit('heart', '♥');
  public static readonly Diamond = new Suit('diamond', '♦');
  public static readonly Club = new Suit('club', '♣');

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

export type SuitName = 'spade' | 'heart' | 'diamond' | 'club';
