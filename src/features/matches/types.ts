import type { ID } from '../../shared/types/common';
import type { Team } from '../teams/types';

export type MatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface MatchScore {
  teamA: number;
  teamB: number;
}

export interface Match {
  id: ID;
  date: Date;
  location?: string;
  /** Un match à 5 oppose exactement deux équipes. */
  teams: [Team, Team];
  status: MatchStatus;
  score?: MatchScore;
  durationMinutes?: number;
  maxPlayersPerTeam?: number;
}
