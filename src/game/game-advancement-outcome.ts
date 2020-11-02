import { Rank } from 'card';
import { MatchupWinner } from './matchup-winner';

export interface GameAdvancementOutcomeBase {
  neutralCard: Rank;
}

export interface GameAdvancementStalemateOutcome extends GameAdvancementOutcomeBase {
  matchupWinner: MatchupWinner.None;
}

export interface GameAdvancementWinOutcome extends GameAdvancementOutcomeBase {
  matchupWinner: MatchupWinner.P1 | MatchupWinner.P2;
  winnerScoreIncrease: number;
}

export type GameAdvancementOutcome = GameAdvancementStalemateOutcome | GameAdvancementWinOutcome;
