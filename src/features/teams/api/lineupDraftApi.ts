import { supabase } from '../../../shared/lib/supabaseClient';
import type { ID } from '../../../shared/types/common';
import type { PairingConstraint } from '../types';

export interface LineupDraft {
  playerIds: ID[];
  constraints: PairingConstraint[];
}

interface LineupDraftRow {
  player_ids: ID[];
  pairing_constraints: PairingConstraint[];
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

export async function saveLineupDraft(groupId: ID, draft: LineupDraft): Promise<void> {
  const { error } = await supabase.from('lineup_drafts').upsert({
    group_id: groupId,
    player_ids: draft.playerIds,
    pairing_constraints: draft.constraints,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
