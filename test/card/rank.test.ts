import { Rank } from '../../src/card/rank';

describe(nameof(Rank), () => {
  it('has ranks in order of standard values, with faces ordered, and aces high', () => {
    const allRanksInOrder = [
      Rank.Two,
      Rank.Three,
      Rank.Four,
      Rank.Five,
      Rank.Six,
      Rank.Seven,
      Rank.Eight,
      Rank.Nine,
      Rank.Ten,
      Rank.Jack,
      Rank.Queen,
      Rank.King,
      Rank.Ace,
    ];
    Rank.all().forEach((value: Rank, index: number) => {
      expect(value).toBe(allRanksInOrder[index]);
    });
  });

  it('correctly determines if a card beats one or more other cards in a game of bastion breach', () => {
    const testCases: [Rank, Rank, Rank, boolean][] = [
      [Rank.Ace, Rank.Ace, Rank.Ace, false],
      [Rank.Ace, Rank.Ace, Rank.Three, false],
      [Rank.Ace, Rank.Ace, Rank.Queen, false],
      [Rank.Ace, Rank.Two, Rank.King, false],
      [Rank.Ace, Rank.King, Rank.Ace, false],
      [Rank.Ace, Rank.Jack, Rank.Four, false],
      [Rank.Ace, Rank.Queen, Rank.Jack, true],
      [Rank.Five, Rank.Ace, Rank.Seven, false],
      [Rank.Seven, Rank.Ace, Rank.Five, true],
      [Rank.Seven, Rank.Ace, Rank.Queen, false],
      [Rank.Eight, Rank.Nine, Rank.Ten, false],
      [Rank.Ten, Rank.Nine, Rank.Five, true],
      [Rank.Nine, Rank.Ten, Rank.Four, false],
      [Rank.Four, Rank.Five, Rank.Queen, false],
      [Rank.Nine, Rank.Queen, Rank.Ten, false],
      [Rank.Five, Rank.Queen, Rank.King, false],
      [Rank.King, Rank.King, Rank.King, false],
    ];

    testCases.forEach(([p1, neutral, p2, p1Wins]) => {
      expect(p1.beats([neutral, p2])).toEqual(p1Wins);
      if (p1Wins) {
        expect(p1.beats(neutral)).toEqual(true);
        expect(p1.beats(p2)).toEqual(true);
      }
    });
  });
});
