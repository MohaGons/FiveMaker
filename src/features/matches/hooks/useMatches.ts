import { useEffect, useState } from 'react';
import type { ID } from '../../../shared/types/common';
import { deleteMatchRow, fetchMatches, insertMatch } from '../api/matchesApi';
import type { MatchInput } from '../api/matchesApi';
import type { Match } from '../types';

export type { MatchInput };

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchMatches()
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
  }, []);

  async function addMatch(input: MatchInput): Promise<void> {
    const match = await insertMatch(input);
    setMatches((current) => [match, ...current]);
  }

  async function removeMatch(id: ID): Promise<void> {
    await deleteMatchRow(id);
    setMatches((current) => current.filter((match) => match.id !== id));
  }

  return { matches, isLoading, error, addMatch, removeMatch };
}
