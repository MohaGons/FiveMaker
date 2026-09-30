import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { ID } from '../../../shared/types/common';
import { useAuth } from '../../auth/hooks/useAuth';
import { fetchMyGroups } from '../api/groupsApi';
import type { Group } from '../types';
import { GroupContext } from './GroupContext';

// Retenu sur l'appareil : on retrouve le dernier groupe consulté.
const STORAGE_KEY = 'current-group-id';

function loadStoredGroupId(): ID | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

interface LoadedGroups {
  /** Compte pour lequel la liste a été chargée : évite d'afficher les groupes d'un compte précédent. */
  userId: ID;
  groups: Group[];
  error: string | null;
}

export function GroupProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [loaded, setLoaded] = useState<LoadedGroups | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<ID | null>(loadStoredGroupId);

  const refreshGroups = useCallback(async (): Promise<Group[]> => {
    if (!userId) return [];
    try {
      const groups = await fetchMyGroups();
      setLoaded({ userId, groups, error: null });
      return groups;
    } catch (err) {
      setLoaded({ userId, groups: [], error: err instanceof Error ? err.message : 'Chargement impossible.' });
      return [];
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;

    fetchMyGroups()
      .then((groups) => {
        if (isMounted) setLoaded({ userId, groups, error: null });
      })
      .catch((err: Error) => {
        if (isMounted) setLoaded({ userId, groups: [], error: err.message });
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const selectGroup = useCallback((groupId: ID) => {
    setSelectedGroupId(groupId);
    try {
      localStorage.setItem(STORAGE_KEY, groupId);
    } catch {
      // Stockage indisponible : le choix vaut pour la session.
    }
  }, []);

  const isCurrentUserLoaded = loaded !== null && loaded.userId === userId;
  const groups = isCurrentUserLoaded ? loaded.groups : [];
  // Le groupe retenu peut avoir été quitté entre-temps : on retombe alors sur le premier.
  const currentGroup = groups.find((group) => group.id === selectedGroupId) ?? groups[0] ?? null;

  return (
    <GroupContext.Provider
      value={{
        groups,
        currentGroup,
        isLoading: userId !== null && !isCurrentUserLoaded,
        error: isCurrentUserLoaded ? loaded.error : null,
        selectGroup,
        refreshGroups,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
}
