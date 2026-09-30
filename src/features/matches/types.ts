import type { ID } from '../../shared/types/common';
import type { Team } from '../teams/types';

export type MatchStatus = 'scheduled' | 'completed' | 'cancelled';

/** Contribution d'un joueur sur un match. */
export interface MatchPlayerStats {
  goals: number;
  assists: number;
}

/** Moyenne des notes (1 à 5) reçues par un joueur sur un match, votes clos. */
export interface PlayerRating {
  average: number;
  votes: number;
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
  /**
   * Homme du match : meilleure moyenne des notes une fois les votes clos, sinon celui choisi à la main
   * sur les anciens matchs (avant les notes).
   */
  mvpPlayerId?: ID;
  /** Fin des votes ; absent pour les matchs enregistrés avant les notes (pas de vote possible). */
  ratingsCloseAt?: Date;
  /** Moyennes par joueur, connues seulement après la clôture des votes. */
  ratings: Record<ID, PlayerRating>;
  /** Nombre de votants pendant que les votes sont ouverts. */
  openVoters: number;
  /** Nombre de joueurs que le compte connecté a notés sur ce match. */
  myRatingsCount: number;
}
