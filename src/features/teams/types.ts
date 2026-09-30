import type { ID } from '../../shared/types/common';
import type { Player } from '../players/types';

export interface Team {
  id: ID;
  name: string;
  players: Player[];
  /** Couleur de maillot/affichage (ex. "#1E90FF"). */
  color?: string;
}

/** "together" : les deux joueurs dans la même équipe ; "apart" : dans des équipes différentes. */
export type PairingRule = 'together' | 'apart';

export interface PairingConstraint {
  id: ID;
  playerIds: [ID, ID];
  rule: PairingRule;
}
