import { supabase } from '../../../shared/lib/supabaseClient';
import type { PlayerInput } from '../hooks/usePlayers';
import type { ID } from '../../../shared/types/common';
import type { Player } from '../types';

const PLAYER_COLUMNS = 'id, name, skill_level, preferred_position, is_guest, avatar_url';

interface PlayerRow {
  id: string;
  name: string;
  skill_level: number;
  preferred_position: Player['preferredPosition'];
  is_guest: boolean;
  avatar_url: string | null;
}

function toPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    name: row.name,
    skillLevel: row.skill_level as Player['skillLevel'],
    preferredPosition: row.preferred_position,
    isGuest: row.is_guest,
    avatarUrl: row.avatar_url ?? undefined,
  };
}

function toRow(input: PlayerInput) {
  return {
    name: input.name,
    skill_level: input.skillLevel,
    preferred_position: input.preferredPosition,
    is_guest: input.isGuest,
    avatar_url: input.avatarUrl ?? null,
  };
}

export async function fetchPlayers(groupId: ID): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select(PLAYER_COLUMNS)
    .eq('group_id', groupId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data as PlayerRow[]).map(toPlayer);
}

export async function insertPlayer(groupId: ID, input: PlayerInput): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .insert({ ...toRow(input), group_id: groupId })
    .select(PLAYER_COLUMNS)
    .single();

  if (error) throw error;
  return toPlayer(data as PlayerRow);
}

export async function updatePlayerRow(id: ID, input: PlayerInput): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .update(toRow(input))
    .eq('id', id)
    .select(PLAYER_COLUMNS)
    .single();

  if (error) throw error;
  return toPlayer(data as PlayerRow);
}

export async function deletePlayerRow(id: ID): Promise<void> {
  const { error } = await supabase.from('players').delete().eq('id', id);
  if (error) throw error;
}
