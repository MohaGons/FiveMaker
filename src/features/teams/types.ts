import type { ID } from '../../shared/types/common';
import type { Player } from '../players/types';

export interface Team {
  id: ID;
  name: string;
  players: Player[];
  /** Couleur de maillot/affichage (ex. "#1E90FF"). */
  color?: string;
}
