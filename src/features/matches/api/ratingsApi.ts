import { supabase } from '../../../shared/lib/supabaseClient';
import type { ID } from '../../../shared/types/common';

export interface RatingAverageRow {
  match_id: string;
  player_id: string;
  average: number;
  votes: number;
}

/** Moyennes par match et par joueur du groupe, pour les votes clos uniquement. */
export async function fetchRatingAverages(groupId: ID): Promise<RatingAverageRow[]> {
  const { data, error } = await supabase.rpc('get_rating_averages', { gid: groupId });
  if (error) throw error;
  return (data as RatingAverageRow[]).map((row) => ({
    ...row,
    average: Number(row.average),
    votes: Number(row.votes),
  }));
}

/** Nombre de votants par match dont les votes sont ouverts. */
export async function fetchOpenVoteCounts(groupId: ID): Promise<Map<ID, number>> {
  const { data, error } = await supabase.rpc('get_open_vote_counts', { gid: groupId });
  if (error) throw error;
  return new Map((data as { match_id: string; voters: number }[]).map((row) => [row.match_id, Number(row.voters)]));
}

/** Nombre de joueurs déjà notés par le compte connecté, par match (seules ses propres notes sont lisibles). */
export async function fetchMyRatingCounts(matchIds: ID[]): Promise<Map<ID, number>> {
  if (matchIds.length === 0) return new Map();

  const { data, error } = await supabase.from('match_ratings').select('match_id').in('match_id', matchIds);
  if (error) throw error;

  const counts = new Map<ID, number>();
  for (const row of data as { match_id: string }[]) {
    counts.set(row.match_id, (counts.get(row.match_id) ?? 0) + 1);
  }
  return counts;
}

/** Les notes déjà données par le compte connecté sur ce match (joueur noté -> note). */
export async function fetchMyRatings(matchId: ID): Promise<Record<ID, number>> {
  const { data, error } = await supabase
    .from('match_ratings')
    .select('ratee_player_id, score')
    .eq('match_id', matchId);

  if (error) throw error;
  return Object.fromEntries(
    (data as { ratee_player_id: string; score: number }[]).map((row) => [row.ratee_player_id, row.score]),
  );
}

/** Enregistre ses notes (1 à 5) ; null retire une note donnée auparavant. */
export async function submitRatings(matchId: ID, ratings: Record<ID, number | null>): Promise<void> {
  const payload = Object.entries(ratings).map(([playerId, score]) => ({ player_id: playerId, score }));
  const { error } = await supabase.rpc('rate_players', { mid: matchId, ratings: payload });
  if (error) throw error;
}
