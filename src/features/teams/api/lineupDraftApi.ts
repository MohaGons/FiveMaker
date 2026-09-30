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

/** Le brouillon du compte connecté, ou null s'il n'en a jamais enregistré. */
export async function fetchLineupDraft(): Promise<LineupDraft | null> {
  const { data, error } = await supabase
    .from('lineup_drafts')
    .select('player_ids, pairing_constraints')
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as LineupDraftRow;
  return { playerIds: row.player_ids, constraints: row.pairing_constraints };
}

export async function saveLineupDraft(draft: LineupDraft): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Connecte-toi pour enregistrer la composition.');

  const { error } = await supabase.from('lineup_drafts').upsert({
    user_id: userId,
    player_ids: draft.playerIds,
    pairing_constraints: draft.constraints,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
