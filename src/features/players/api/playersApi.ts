import { supabase } from '../../../shared/lib/supabaseClient';
import type { PlayerInput } from '../hooks/usePlayers';
import type { ID } from '../../../shared/types/common';
import type { Player } from '../types';

const PLAYER_COLUMNS = 'id, name, skill_level, preferred_position, is_guest, avatar_url, account_user_id';

interface PlayerRow {
  id: string;
  name: string;
  skill_level: number;
  preferred_position: Player['preferredPosition'];
  is_guest: boolean;
  avatar_url: string | null;
  account_user_id: string | null;
}

function toPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    name: row.name,
    skillLevel: row.skill_level as Player['skillLevel'],
    preferredPosition: row.preferred_position,
    isGuest: row.is_guest,
    avatarUrl: row.avatar_url ?? undefined,
    accountUserId: row.account_user_id ?? undefined,
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

/** "C'est moi" : relie le compte connecté à cette fiche (et libère son ancienne fiche du groupe). */
export async function claimPlayer(playerId: ID): Promise<void> {
  const { error } = await supabase.rpc('claim_player', { pid: playerId });
  if (error) throw error;
}

/** "Ce n'est pas moi" : le compte connecté n'a plus de fiche dans ce groupe. */
export async function releasePlayer(groupId: ID): Promise<void> {
  const { error } = await supabase.rpc('release_player', { gid: groupId });
  if (error) throw error;
}

/** Réservé au créateur : relie une fiche à un membre, ou la libère (userId null). */
export async function linkPlayer(playerId: ID, userId: ID | null): Promise<void> {
  const { error } = await supabase.rpc('link_player', { pid: playerId, uid: userId });
  if (error) throw error;
}

export async function deletePlayerRow(id: ID): Promise<void> {
  const { error } = await supabase.from('players').delete().eq('id', id);
  if (error) throw error;
}
