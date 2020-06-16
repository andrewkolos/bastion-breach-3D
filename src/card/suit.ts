export class Suit {
  public static readonly Spade = new Suit('spade', '♠');
  public static readonly Heart = new Suit('heart', '♥');
  public static readonly Diamond = new Suit('diamond', '♦');
  public static readonly Club = new Suit('club', '♣');

  public static all(): Suit[] {
    return Object.values(Suit).filter((value) => value instanceof Suit);
  }

  public static [Symbol.iterator]() {
    return Suit.all()[Symbol.iterator];
  }

  private constructor(public readonly name: SuitName, public readonly unicodeSymbol: string) {}
}

export type SuitName = 'spade' | 'heart' | 'diamond' | 'club';