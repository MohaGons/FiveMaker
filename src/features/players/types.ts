import type { ID } from '../../shared/types/common';

export type PlayerPosition = 'goalkeeper' | 'defender' | 'midfielder' | 'forward';

export interface Player {
  id: ID;
  name: string;
  /** Niveau utilisé pour l'équilibrage des équipes, de 1 (débutant) à 5 (expert). */
  skillLevel: 1 | 2 | 3 | 4 | 5;
  preferredPosition: PlayerPosition;
  /** Joueur ponctuel non inscrit au groupe habituel. */
  isGuest: boolean;
  avatarUrl?: string;
}
