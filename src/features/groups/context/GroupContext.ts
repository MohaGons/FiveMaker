import { createContext } from 'react';
import type { ID } from '../../../shared/types/common';
import type { Group } from '../types';

export interface GroupContextValue {
  groups: Group[];
  /** Groupe dont on affiche les données ; null si l'utilisateur n'appartient à aucun groupe. */
  currentGroup: Group | null;
  isLoading: boolean;
  error: string | null;
  selectGroup: (groupId: ID) => void;
  /** Recharge la liste (après une création, une adhésion, un départ...). */
  refreshGroups: () => Promise<Group[]>;
}

export const GroupContext = createContext<GroupContextValue | undefined>(undefined);
