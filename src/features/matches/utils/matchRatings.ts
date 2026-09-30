import type { ID } from '../../../shared/types/common';
import type { RatingAverageRow } from '../api/ratingsApi';
import type { Match, PlayerRating } from '../types';

/** Pour être homme du match, il faut au moins ce nombre de votes (ou le maximum reçu, s'il est plus bas). */
const MIN_MVP_VOTES = 3;

export function getMatchPlayerIds(match: Match): ID[] {
  return [...match.teams[0].players, ...match.teams[1].players].map((player) => player.id);
}

export function areRatingsOpen(match: Match, now = new Date()): boolean {
  return match.status === 'completed' && match.ratingsCloseAt !== undefined && match.ratingsCloseAt > now;
}

/**
 * Meilleure moyenne parmi les joueurs assez notés (pour qu'un seul 5/5 ne suffise pas).
 * Égalité : plus de votes, puis plus de buts.
 */
export function pickMvp(match: Match, ratings: Record<ID, PlayerRating>): ID | undefined {
  const entries = Object.entries(ratings);
  if (entries.length === 0) return undefined;

  const maxVotes = Math.max(...entries.map(([, rating]) => rating.votes));
  const minVotes = Math.min(MIN_MVP_VOTES, maxVotes);
  const goalsOf = (id: ID) => match.playerStats[id]?.goals ?? 0;

  return entries
    .filter(([, rating]) => rating.votes >= minVotes)
    .sort(
      ([idA, a], [idB, b]) => b.average - a.average || b.votes - a.votes || goalsOf(idB) - goalsOf(idA),
    )[0]?.[0];
}

/** Ajoute aux matchs leurs moyennes, les votants, ses propres votes et l'homme du match désigné par les notes. */
export function applyRatings(
  matches: Match[],
  averages: RatingAverageRow[],
  openVoteCounts: Map<ID, number>,
  myRatingCounts: Map<ID, number>,
): Match[] {
  const ratingsByMatch = new Map<ID, Record<ID, PlayerRating>>();
  for (const row of averages) {
    const ratings = ratingsByMatch.get(row.match_id) ?? {};
    ratings[row.player_id] = { average: row.average, votes: row.votes };
    ratingsByMatch.set(row.match_id, ratings);
  }

  return matches.map((match) => {
    const ratings = ratingsByMatch.get(match.id) ?? {};
    return {
      ...match,
      ratings,
      openVoters: openVoteCounts.get(match.id) ?? 0,
      myRatingsCount: myRatingCounts.get(match.id) ?? 0,
      // Sans notes (anciens matchs), on garde l'homme du match choisi à la main.
      mvpPlayerId: pickMvp(match, ratings) ?? match.mvpPlayerId,
    };
  });
}
