import { shuffleInPlace } from '../card/shuffle';
import { Rank } from '../card/rank';
import { cloneDumbObject } from '@akolos/clone-dumb-object';
import { MatchupWinner } from './matchup-winner';
import { GameAdvancementOutcome } from './game-advancement-outcome';
import { Player } from './Player';
import { GameCardCollection } from './game-card-collection';
import { InheritableEventEmitter } from '@akolos/event-emitter';
import { Matchup } from './matchup';

interface Score {
  p1: number;
  p2: number;
}

export interface GameConfig {
  neutralBoard?: Rank[];
}

export interface GameEvents {
  advanced: [p1Card: Rank, p2Card: Rank, outcome: GameAdvancementOutcome];
}

export class Game extends InheritableEventEmitter<GameEvents> {
  private nextMatchupValue: number;
  private _score: Score;
  private _matchups: Matchup[] = [];
  private _cards: GameCardCollection<Rank>;

  public get score(): Readonly<Score> {
    return cloneDumbObject(this._score);
  }

  public get cards(): GameCardCollection<Rank> {
    return cloneDumbObject(this._cards);
  }

  public get matchups(): Array<Readonly<Matchup>> {
    return this._matchups.slice();
  }

  public constructor(config: GameConfig = {}) {
    super();

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

  public advance({ p1Card, p2Card }: { p1Card: Rank; p2Card: Rank }): GameAdvancementOutcome {

    const outcome: GameAdvancementOutcome = this.advanceGameState(p1Card, p2Card);

    this._matchups.push({
      p1Card,
      p2Card,
      neutralCard: outcome.neutralCard,
      winner: outcome.matchupWinner,
    });

    this.emit('advanced', p1Card, p2Card, outcome);

    return outcome;
  }

  private advanceGameState(p1Card: Rank, p2Card: Rank) {
    const nextNeutralCard = this._cards.onBoard.neutral[this._cards.onBoard.p1.length];

    this.moveCardToBoard(Player.P1, p1Card);
    this.moveCardToBoard(Player.P2, p2Card);

    const matchupWinner = determineMatchupWinner({ p1: p1Card, neutral: nextNeutralCard, p2: p2Card });
    const winnerScoreIncrease = matchupWinner === MatchupWinner.None ? 0 : this.nextMatchupValue;
    const outcome: GameAdvancementOutcome = {
      neutralCard: nextNeutralCard,
      matchupWinner,
      winnerScoreIncrease,
    };

    if (matchupWinner === MatchupWinner.None) {
      this.nextMatchupValue += 1;
    } else {
      this.awardPoints(matchupWinner, this.nextMatchupValue);
      this.nextMatchupValue = 1;
    }

    return outcome;
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
