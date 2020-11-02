import { Rank } from 'card';
import { MatchupWinner } from './matchup-winner';

export interface Matchup {
  p1Card: Rank;
  p2Card: Rank;
  neutralCard: Rank;
  matchupWinner: MatchupWinner;
}
