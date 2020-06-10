import { shuffleInPlace } from '../card/shuffle';
import { Rank } from '../card/rank';
import { cloneDumbObject } from '@akolos/clone-dumb-object';
import { MatchupWinner } from './matchup-winner';
import { GameAdvancementOutcome } from './game-advancement-outcome';

enum Player {
  P1,
  P2,
}

interface Score {
  p1: number;
  p2: number;
}

export interface GameCards {
  onBoard: {
    p1: Rank[];
    p2: Rank[];
    neutral: Rank[];
  };
  inHand: {
    p1: Rank[];
    p2: Rank[];
  };
}

export interface GameConfig {
  neutralBoard?: Rank[];
}

export class Game {
  private nextMatchupValue: number;
  private _score: Score;
  private _cards: GameCards;

  public constructor(config: GameConfig = {}) {
    const { neutralBoard: configBoard } = config;
    if (configBoard != null) {
      validateNeutralBoard(configBoard);
    }

    this._score = {
      p1: 0,
      p2: 0,
    };
    this.nextMatchupValue = 1;
    this._cards = {
      onBoard: {
        p1: [],
        p2: [],
        neutral: configBoard != null ? configBoard : shuffleInPlace(Rank.all()),
      },
      inHand: {
        p1: Rank.all(),
        p2: Rank.all(),
      },
    };

    function validateNeutralBoard(neutralBoard: Rank[]) {
      if (!areUnique(neutralBoard)) {
        throw Error('Configured neutral board cannot contain cards of the same rank.');
      }
      if (!isComplete(neutralBoard)) {
        throw Error('Configured neutral board must contain every rank.');
      }
    }
  }

  public get score(): Readonly<Score> {
    return cloneDumbObject(this._score);
  }

  public get cards(): Readonly<GameCards> {
    return cloneDumbObject(this._cards);
  }

  public advance({ p1Card, p2Card }: { p1Card: Rank; p2Card: Rank }): GameAdvancementOutcome {
    const nextNeutralCard = this._cards.onBoard.neutral[this._cards.onBoard.p1.length];

    this.moveCardToBoard(Player.P1, p1Card);
    this.moveCardToBoard(Player.P2, p2Card);

    const winner = determineMatchupWinner({ p1: p1Card, neutral: nextNeutralCard, p2: p2Card });

    if (winner === MatchupWinner.None) {
      this.nextMatchupValue += 1;
      return {
        matchupWinner: winner,
      };
    } else {
      const pointsWon = this.nextMatchupValue;
      this.awardPoints(winner, pointsWon);
      this.nextMatchupValue = 1;
      return {
        matchupWinner: winner,
        winnerScoreIncease: pointsWon,
      };
    }
  }

  private moveCardToBoard(player: Player, rank: Rank) {
    const hand = player === Player.P1 ? this._cards.inHand.p1 : this._cards.inHand.p2;
    const board = player === Player.P1 ? this._cards.onBoard.p1 : this._cards.onBoard.p2;

    const indexOfCard = hand.findIndex((r) => r === rank);
    if (indexOfCard === -1) {
      throw Error(`Could not find card ${rank.name} in ${Player[player]}'s hand.`);
    }

    const card = hand[indexOfCard];
    hand.splice(indexOfCard, 1);

    board.push(card);
  }

  private awardPoints(winner: MatchupWinner.P1 | MatchupWinner.P2, amount: number) {
    if (winner === MatchupWinner.P1) {
      this._score.p1 += amount;
    }
    if (winner === MatchupWinner.P2) {
      this._score.p2 += amount;
    }
  }
}

function determineMatchupWinner({ p1, neutral, p2 }: { p1: Rank; neutral: Rank; p2: Rank }): MatchupWinner {
  if (p1.beats([neutral, p2])) {
    return MatchupWinner.P1;
  } else if (p2.beats([neutral, p1])) {
    return MatchupWinner.P2;
  }

  return MatchupWinner.None;
}

function areUnique(cards: Rank[]) {
  const foundPresent = new Set<Rank>();
  const duplicates = new Set<Rank>();
  cards.forEach((c) => {
    if (foundPresent.has(c)) {
      duplicates.add(c);
    }
  });
  return duplicates.size === 0;
}

function isComplete(cards: Rank[]) {
  const notFound = new Set<Rank>(Rank.all());
  cards.forEach((c) => notFound.delete(c));
  return notFound.size === 0;
}
