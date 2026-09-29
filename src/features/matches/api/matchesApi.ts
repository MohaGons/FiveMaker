import { supabase } from '../../../shared/lib/supabaseClient';
import type { ID } from '../../../shared/types/common';
import type { Player } from '../../players/types';
import type { Match, MatchStatus } from '../types';

const MATCH_COLUMNS =
  'id, played_at, location, status, score_team_a, score_team_b, team_a_name, team_a_players, team_b_name, team_b_players';

interface MatchRow {
  id: string;
  played_at: string;
  location: string | null;
  status: MatchStatus;
  score_team_a: number | null;
  score_team_b: number | null;
  team_a_name: string;
  team_a_players: Player[];
  team_b_name: string;
  team_b_players: Player[];
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
      { id: row.id + '-a', name: row.team_a_name, players: row.team_a_players },
      { id: row.id + '-b', name: row.team_b_name, players: row.team_b_players },
    ],
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
    team_b_name: input.teams[1].name,
    team_b_players: input.teams[1].players,
  };
}

export async function fetchMatches(): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select(MATCH_COLUMNS)
    .order('played_at', { ascending: false });

  if (error) throw error;
  return (data as MatchRow[]).map(toMatch);
}

export async function insertMatch(input: MatchInput): Promise<Match> {
  const { data, error } = await supabase
    .from('matches')
    .insert(toRow(input))
    .select(MATCH_COLUMNS)
    .single();

  if (error) throw error;
  return toMatch(data as MatchRow);
}

export async function deleteMatchRow(id: ID): Promise<void> {
  const { error } = await supabase.from('matches').delete().eq('id', id);
  if (error) throw error;
}
