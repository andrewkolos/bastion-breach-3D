import { Game, MatchupWinner } from '../src/game';
import { Rank } from '../src/card/rank';
import { randomNaturalUpToInc } from '../src/random';

describe(nameof(Game), () => {
  it('correctly decides the winner when the game advances', () => {
    const testCases = generateRandomMatchups(30);

    testCases.forEach((c) => {
      const [p1Card, neutralCard, p2Card, expectedWinner] = c;

      const game = new Game({
        neutralBoard: completeBoard([neutralCard]),
      });

      expect(game.advance({ p1Card, p2Card }).matchupWinner).toEqual(expectedWinner);
    });
  });

  it('correctly increases the score of the player that wins the matchup', () => {
    const neutralBoard = completeBoard([Rank.Seven]);
    const game = new Game({ neutralBoard });
    expect(game.score.p1).toEqual(0);
    game.advance({ p1Card: Rank.Queen, p2Card: Rank.Ten });
    expect(game.score.p1).toEqual(1);
  });

  describe('correctly awards the matchup winner points', () => {
    it('after no stalemates', () => {
      const game = new Game({ neutralBoard: completeBoard([Rank.Four]) });
      game.advance({ p1Card: Rank.Three, p2Card: Rank.Seven });
      expect(game.score).toEqual({ p1: 0, p2: 1 });
    });

    it('after stalemates', () => {
      const neutralBoard = completeBoard([Rank.Ace, Rank.Five, Rank.Jack]);
      const game = new Game({ neutralBoard });
      game.advance({ p1Card: Rank.King, p2Card: Rank.King });
      expect(game.score).toEqual({ p1: 0, p2: 0 });
      game.advance({ p1Card: Rank.Five, p2Card: Rank.Five });
      expect(game.score).toEqual({ p1: 0, p2: 0 });
      game.advance({ p1Card: Rank.Queen, p2Card: Rank.Four });
      expect(game.score).toEqual({ p1: 3, p2: 0 });
    });
  });

  it('correctly resets the worth of the next matchup after resolved stalemates', () => {
    const neutralBoard = completeBoard([Rank.Ace, Rank.Five, Rank.Jack, Rank.Two]);
    const game = new Game({ neutralBoard });
    game.advance({ p1Card: Rank.King, p2Card: Rank.King });
    game.advance({ p1Card: Rank.Five, p2Card: Rank.Five });
    game.advance({ p1Card: Rank.Queen, p2Card: Rank.Four });
    game.advance({ p1Card: Rank.Three, p2Card: Rank.Ace });
    expect(game.score).toEqual({ p1: 4, p2: 0 });
  });
});

function completeBoard(incompleteBeginning: Rank[]): Rank[] {
  const result = new Set([...incompleteBeginning]);
  Rank.all().forEach((r) => result.add(r));
  return [...result];
}

function generateRandomMatchups(n: number): [Rank, Rank, Rank, MatchupWinner][] {
  const all = Rank.all();
  const result: [Rank, Rank, Rank, MatchupWinner][] = [];
  for (let i = 0; i < n; i++) {
    const p1Card = randomElement(all);
    const neutral = randomElement(all);
    const p2Card = randomElement(all);
    const p1Won = p1Card.beats([neutral, p2Card]);
    const p2Won = p2Card.beats([neutral, p1Card]);

    const expectedWinner = p1Won ? MatchupWinner.P1 : p2Won ? MatchupWinner.P2 : MatchupWinner.None;
    result.push([p1Card, neutral, p2Card, expectedWinner]);
  }
  return result;
}

function randomElement<T>(arr: T[]): T {
  return arr[randomNaturalUpToInc(arr.length - 1)];
}
