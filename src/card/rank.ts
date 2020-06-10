export class Rank {
  public static readonly Two = new Rank('2');
  public static readonly Three = new Rank('3');
  public static readonly Four = new Rank('4');
  public static readonly Five = new Rank('5');
  public static readonly Six = new Rank('6');
  public static readonly Seven = new Rank('7');
  public static readonly Eight = new Rank('8');
  public static readonly Nine = new Rank('9');
  public static readonly Ten = new Rank('10');
  public static readonly Jack = new Rank('J', true);
  public static readonly Queen = new Rank('Q', true);
  public static readonly King = new Rank('K', true);
  public static readonly Ace = new Rank('A');

  /**
   * Returns an array containing each rank value exactly once and in standard order with
   * faces ordered and aces-high (i.e. [...numbers in order, J, Q, K, A]).
   */
  public static all(): Rank[] {
    return Object.values(Rank).filter((value) => value instanceof Rank);
  }

  public static [Symbol.iterator]() {
    return Rank.all()[Symbol.iterator];
  }

  public get name(): string {
    Object.entries(Rank).forEach(([propName, value]) => {
      if (value === this) {
        return propName;
      }
    });

    throw Error('Unable to find rank value in the list of values.');
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

  private constructor(public readonly abbreviation: string, private readonly isFace: boolean = false) {}
}
