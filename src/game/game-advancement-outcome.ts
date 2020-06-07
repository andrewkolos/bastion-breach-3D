import { MatchupWinner } from './matchup-winner';

export interface GameAdvancementStalemateOutcome {
  matchupWinner: MatchupWinner.None;
}

export interface GameAdvancementWinOutcome {
  matchupWinner: MatchupWinner.P1 | MatchupWinner.P2;
  winnerScoreIncease: number;
}

export type GameAdvancementOutcome = GameAdvancementStalemateOutcome | GameAdvancementWinOutcome;
