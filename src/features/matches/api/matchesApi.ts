import { supabase } from '../../../shared/lib/supabaseClient';
import type { ID } from '../../../shared/types/common';
import type { Player } from '../../players/types';
import type { Match, MatchPlayerStats, MatchScore, MatchStatus } from '../types';

const MATCH_COLUMNS =
  'id, played_at, location, status, score_team_a, score_team_b, team_a_name, team_a_players, team_a_color, team_b_name, team_b_players, team_b_color, player_stats, mvp_player_id, ratings_close_at';

interface MatchRow {
  id: string;
  played_at: string;
  location: string | null;
  status: MatchStatus;
  score_team_a: number | null;
  score_team_b: number | null;
  team_a_name: string;
  team_a_players: Player[];
  team_a_color: string | null;
  team_b_name: string;
  team_b_players: Player[];
  team_b_color: string | null;
  player_stats: Record<ID, MatchPlayerStats> | null;
  mvp_player_id: string | null;
  ratings_close_at: string | null;
}

export interface MatchInput {
  playedAt: Date;
  location?: string;
  status: MatchStatus;
  score?: { teamA: number; teamB: number };
  teams: Match['teams'];
}

function toMatch(row: MatchRow): Match {
  return {
    id: row.id,
    playedAt: new Date(row.played_at),
    location: row.location ?? undefined,
    status: row.status,
    score:
      row.score_team_a != null && row.score_team_b != null
        ? { teamA: row.score_team_a, teamB: row.score_team_b }
        : undefined,
    teams: [
      {
        id: row.id + '-a',
        name: row.team_a_name,
        players: row.team_a_players,
        color: row.team_a_color ?? undefined,
      },
      {
        id: row.id + '-b',
        name: row.team_b_name,
        players: row.team_b_players,
        color: row.team_b_color ?? undefined,
      },
    ],
    playerStats: row.player_stats ?? {},
    mvpPlayerId: row.mvp_player_id ?? undefined,
    ratingsCloseAt: row.ratings_close_at ? new Date(row.ratings_close_at) : undefined,
    // Complétés par useMatches à partir des votes.
    ratings: {},
    openVoters: 0,
    myRatingsCount: 0,
  };
}

function toRow(input: MatchInput) {
  return {
    played_at: input.playedAt.toISOString(),
    location: input.location ?? null,
    status: input.status,
    score_team_a: input.score?.teamA ?? null,
    score_team_b: input.score?.teamB ?? null,
    team_a_name: input.teams[0].name,
    team_a_players: input.teams[0].players,
    team_a_color: input.teams[0].color ?? null,
    team_b_name: input.teams[1].name,
    team_b_players: input.teams[1].players,
    team_b_color: input.teams[1].color ?? null,
  };
}

export async function fetchMatches(groupId: ID): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select(MATCH_COLUMNS)
    .eq('group_id', groupId)
    .order('played_at', { ascending: false });

  if (error) throw error;
  return (data as MatchRow[]).map(toMatch);
}

export async function insertMatch(groupId: ID, input: MatchInput): Promise<Match> {
  const { data, error } = await supabase
    .from('matches')
    .insert({ ...toRow(input), group_id: groupId })
    .select(MATCH_COLUMNS)
    .single();

  if (error) throw error;
  return toMatch(data as MatchRow);
}

/** Champs modifiables d'un match déjà enregistré ; seuls les champs fournis sont mis à jour. */
export interface MatchUpdate {
  playedAt?: Date;
  /** null efface le lieu. */
  location?: string | null;
  status?: MatchStatus;
  /** null efface le score. */
  score?: MatchScore | null;
  playerStats?: Record<ID, MatchPlayerStats>;
}

export async function updateMatchRow(id: ID, update: MatchUpdate): Promise<Match> {
  const patch: Record<string, unknown> = {};
  if (update.playedAt !== undefined) patch.played_at = update.playedAt.toISOString();
  if (update.location !== undefined) patch.location = update.location;
  if (update.status !== undefined) patch.status = update.status;
  if (update.score !== undefined) {
    patch.score_team_a = update.score?.teamA ?? null;
    patch.score_team_b = update.score?.teamB ?? null;
  }
  if (update.playerStats !== undefined) patch.player_stats = update.playerStats;

  const { data, error } = await supabase
    .from('matches')
    .update(patch)
    .eq('id', id)
    .select(MATCH_COLUMNS)
    .single();

  if (error) throw error;
  return toMatch(data as MatchRow);
}

export async function deleteMatchRow(id: ID): Promise<void> {
  const { error } = await supabase.from('matches').delete().eq('id', id);
  if (error) throw error;
}
