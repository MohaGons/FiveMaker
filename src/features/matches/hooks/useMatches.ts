import { useEffect, useState } from 'react';
import type { ID } from '../../../shared/types/common';
import { useCurrentGroup } from '../../groups/hooks/useGroups';
import { deleteMatchRow, fetchMatches, insertMatch, updateMatchRow } from '../api/matchesApi';
import type { MatchInput, MatchUpdate } from '../api/matchesApi';
import { fetchMyRatingCounts, fetchOpenVoteCounts, fetchRatingAverages, submitRatings } from '../api/ratingsApi';
import type { Match } from '../types';
import { applyRatings, areRatingsOpen, pickMvp } from '../utils/matchRatings';

export type { MatchInput, MatchUpdate };

/** Matchs du groupe courant avec leurs votes (la page est remontée quand on change de groupe). */
export function useMatches() {
  const groupId = useCurrentGroup().group.id;
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    Promise.all([fetchMatches(groupId), fetchRatingAverages(groupId), fetchOpenVoteCounts(groupId)])
      .then(async ([data, averages, openVoteCounts]) => {
        // Ses propres votes, pour les matchs encore ouverts (« Modifier mes notes »).
        const openMatchIds = data.filter((match) => areRatingsOpen(match)).map((match) => match.id);
        const myRatingCounts = await fetchMyRatingCounts(openMatchIds);
        if (isMounted) setMatches(applyRatings(data, averages, openVoteCounts, myRatingCounts));
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
    // Les votes ne changent pas avec une modification du match : on les reprend.
    setMatches((current) =>
      current.map((match) =>
        match.id === id
          ? {
              ...updated,
              ratings: match.ratings,
              openVoters: match.openVoters,
              myRatingsCount: match.myRatingsCount,
              mvpPlayerId: pickMvp(updated, match.ratings) ?? updated.mvpPlayerId,
            }
          : match,
      ),
    );
  }

  async function removeMatch(id: ID): Promise<void> {
    await deleteMatchRow(id);
    setMatches((current) => current.filter((match) => match.id !== id));
  }

  /** Enregistre ses notes, puis met à jour le nombre de votants et ses propres votes affichés. */
  async function rateMatch(id: ID, ratings: Record<ID, number | null>): Promise<void> {
    await submitRatings(id, ratings);
    const openVoteCounts = await fetchOpenVoteCounts(groupId);
    const myRatingsCount = Object.values(ratings).filter((score) => score !== null).length;
    setMatches((current) =>
      current.map((match) =>
        match.id === id ? { ...match, openVoters: openVoteCounts.get(id) ?? 0, myRatingsCount } : match,
      ),
    );
  }

  return { matches, isLoading, error, addMatch, updateMatch, removeMatch, rateMatch };
}
