import { useEffect, useState } from 'react';
import type { ID } from '../../../shared/types/common';
import { useCurrentGroup } from '../../groups/hooks/useGroups';
import { deleteMatchRow, fetchMatches, insertMatch, updateMatchRow } from '../api/matchesApi';
import type { MatchInput, MatchUpdate } from '../api/matchesApi';
import type { Match } from '../types';

export type { MatchInput, MatchUpdate };

/** Matchs du groupe courant (la page est remontée quand on change de groupe). */
export function useMatches() {
  const groupId = useCurrentGroup().group.id;
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchMatches(groupId)
      .then((data) => {
        if (isMounted) setMatches(data);
      })
      .catch((err: Error) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [groupId]);

  async function addMatch(input: MatchInput): Promise<void> {
    const match = await insertMatch(groupId, input);
    setMatches((current) => [match, ...current]);
  }

  async function updateMatch(id: ID, update: MatchUpdate): Promise<void> {
    const updated = await updateMatchRow(id, update);
    setMatches((current) => current.map((match) => (match.id === id ? updated : match)));
  }

  async function removeMatch(id: ID): Promise<void> {
    await deleteMatchRow(id);
    setMatches((current) => current.filter((match) => match.id !== id));
  }

  return { matches, isLoading, error, addMatch, updateMatch, removeMatch };
}
