import { useContext } from 'react';
import { GroupContext } from '../context/GroupContext';
import type { GroupContextValue } from '../context/GroupContext';
import type { Group } from '../types';

export function useGroups(): GroupContextValue {
  const context = useContext(GroupContext);
  if (!context) throw new Error("useGroups doit être utilisé à l'intérieur de GroupProvider");
  return context;
}

export interface CurrentGroup {
  group: Group;
  /** Créateur ou admin : peut modifier joueurs, matchs et composition. */
  canEdit: boolean;
  /** Créateur : gère aussi les membres. */
  isOwner: boolean;
}

/** Le groupe affiché. À utiliser sous RequireGroup, qui garantit qu'il existe. */
export function useCurrentGroup(): CurrentGroup {
  const { currentGroup } = useGroups();
  if (!currentGroup) throw new Error('useCurrentGroup doit être utilisé sous RequireGroup');
  return {
    group: currentGroup,
    canEdit: currentGroup.role === 'owner' || currentGroup.role === 'admin',
    isOwner: currentGroup.role === 'owner',
  };
}
