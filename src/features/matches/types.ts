import type { ID } from '../../shared/types/common';
import type { Team } from '../teams/types';

export type MatchStatus = 'scheduled' | 'completed' | 'cancelled';

export interface MatchScore {
  teamA: number;
  teamB: number;
}

export interface Match {
  id: ID;
  playedAt: Date;
  location?: string;
  /** Un match à 5 oppose exactement deux équipes. */
  teams: [Team, Team];
  status: MatchStatus;
  score?: MatchScore;
}
