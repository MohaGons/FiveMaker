import { supabase } from '../../../shared/lib/supabaseClient';
import type { ID } from '../../../shared/types/common';
import type { LineupResponse, PairingConstraint } from '../types';

export interface LineupDraft {
  playerIds: ID[];
  constraints: PairingConstraint[];
}

interface LineupDraftRow {
  player_ids: ID[];
  pairing_constraints: PairingConstraint[];
}

interface LineupResponseRow {
  player_id: ID;
  attending: boolean;
  responded_at: string;
}

/** Le brouillon du groupe, ou null s'il n'en a jamais été enregistré. */
export async function fetchLineupDraft(groupId: ID): Promise<LineupDraft | null> {
  const { data, error } = await supabase
    .from('lineup_drafts')
    .select('player_ids, pairing_constraints')
    .eq('group_id', groupId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as LineupDraftRow;
  return { playerIds: row.player_ids, constraints: row.pairing_constraints };
}

/**
 * N'enregistre que les conditions : les joueurs passent par les fonctions ci-dessous, qui ne
 * s'écrasent pas entre elles quand plusieurs membres répondent en même temps.
 */
export async function saveLineupConstraints(groupId: ID, constraints: PairingConstraint[]): Promise<void> {
  const { error } = await supabase.from('lineup_drafts').upsert({
    group_id: groupId,
    pairing_constraints: constraints,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/** Coche ou décoche un joueur (créateur et admins) ; renvoie les joueurs de la composition à jour. */
export async function setLineupPlayer(groupId: ID, playerId: ID, included: boolean): Promise<ID[]> {
  const { data, error } = await supabase.rpc('set_lineup_player', { gid: groupId, pid: playerId, included });
  if (error) throw error;
  return data as ID[];
}

/** Retire tous les joueurs et efface les réponses au sondage ; les conditions sont conservées. */
export async function clearLineup(groupId: ID): Promise<void> {
  const { error } = await supabase.rpc('clear_lineup', { gid: groupId });
  if (error) throw error;
}

export async function fetchLineupResponses(groupId: ID): Promise<LineupResponse[]> {
  const { data, error } = await supabase
    .from('lineup_responses')
    .select('player_id, attending, responded_at')
    .eq('group_id', groupId);

  if (error) throw error;
  return (data as LineupResponseRow[]).map((row) => ({
    playerId: row.player_id,
    attending: row.attending,
    respondedAt: new Date(row.responded_at),
  }));
}

/** Réponse du compte connecté au sondage ; renvoie les joueurs de la composition à jour. */
export async function respondToLineup(groupId: ID, attending: boolean): Promise<ID[]> {
  const { data, error } = await supabase.rpc('respond_to_lineup', { gid: groupId, attending });
  if (error) throw error;
  return data as ID[];
}
