import { shuffleInPlace } from '../card/shuffle';
import { Rank, isNumerical, isFace, validate } from '../card/rank';
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
  },
  inHand: {
   p1: Rank[];
   p2: Rank[]; 
  };
}

export class Game {
  private nextMatchupValue;
  private _score: Score;
  private _cards: GameCards;

  public constructor() {
    this.reset();
  }

  public get score(): Readonly<Score> {
    return cloneDumbObject(this._score);
  }

  public get cards(): Readonly<GameCards> {
    return cloneDumbObject(this._cards);
  }

  public reset() {
    this._score = {
      p1: 0,
      p2: 0,
    };
    this.nextMatchupValue = 1;
    this._cards = {
      onBoard: {
        p1: [],
        p2: [],
        neutral: shuffleInPlace(allRanks()),
      },
      inHand: {
        p1: [],
        p2: [],
      },
    };
  }

  public advance({p1Card, p2Card}: {
    p1Card: Rank;
    p2Card: Rank;
  }): GameAdvancementOutcome {
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
      throw Error(`Could not find card ${Rank[rank]} in ${Player[player]}'s hand.`);
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
  if (doesCardBeat(p1, [neutral, p2])) {
    return MatchupWinner.P1;
  } else if (doesCardBeat(p2, [neutral, p1])) {
    return MatchupWinner.P2;
  } else {
    MatchupWinner.None;
  }
}

function doesCardBeat(card: Rank, toBeat: Rank[]) {
  if (toBeat.length == 0) {
    throw Error('No cards were provided to compare to.');
  }
  return toBeat.every((tb) => compareCards(card, tb) > 0);
}

function compareCards(r1: Rank, r2: Rank): number {
  validate(r1);
  validate(r2);

  if (r1 === r2) return 0;

  if (r1 === Rank.Ace) {
    return isNumerical(r2) ? -1 : 1;
  } else if (isFace(r1)) {
    return isNumerical(r2) ? 1 : -1;
  } else if (isNumerical(r1)) {
    return isNumerical(r2) ? r1 - r2 : -1;
  }
}

function allRanks(): Rank[] {
  return enumValues(Rank);
}

type NumberEnum<T> = Record<keyof T, number | string> & { [k: number]: string };
function enumValues<T>(e: NumberEnum<T>): number[] {
  const result: number[] = [];
  for (const v of Object.values(e)) {
    const asNumber = Number(v);
    if (!isNaN(asNumber)) {
      result.push(asNumber);
    }
  }
  return result;
}
