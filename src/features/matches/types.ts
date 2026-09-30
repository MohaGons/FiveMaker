import type { ID } from '../../shared/types/common';
import type { Team } from '../teams/types';

export type MatchStatus = 'scheduled' | 'completed' | 'cancelled';

/** Contribution d'un joueur sur un match. */
export interface MatchPlayerStats {
  goals: number;
  assists: number;
}

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
  /** Buts et passes par joueur ; les joueurs sans contribution sont absents. */
  playerStats: Record<ID, MatchPlayerStats>;
  mvpPlayerId?: ID;
}
