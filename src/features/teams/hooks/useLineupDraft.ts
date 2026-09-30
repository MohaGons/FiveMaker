import { useEffect, useState } from 'react';
import type { ID } from '../../../shared/types/common';
import { fetchLineupDraft, saveLineupDraft } from '../api/lineupDraftApi';
import type { LineupDraft } from '../api/lineupDraftApi';
import type { PairingConstraint, PairingRule } from '../types';

/** Délai avant enregistrement : plusieurs clics rapprochés ne font qu'une écriture. */
const SAVE_DELAY_MS = 600;
/** Ancien emplacement des conditions (navigateur uniquement), repris lors du premier chargement. */
const LEGACY_CONSTRAINTS_KEY = 'pairing-constraints';

export type DraftSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function loadLegacyConstraints(): PairingConstraint[] {
  try {
    const stored = localStorage.getItem(LEGACY_CONSTRAINTS_KEY);
    return stored ? (JSON.parse(stored) as PairingConstraint[]) : [];
  } catch {
    return [];
  }
}

function forgetLegacyConstraints(): void {
  try {
    localStorage.removeItem(LEGACY_CONSTRAINTS_KEY);
  } catch {
    // Stockage indisponible : rien à nettoyer.
  }
}

function isSamePair(constraint: PairingConstraint, [a, b]: [ID, ID]): boolean {
  const [x, y] = constraint.playerIds;
  return (x === a && y === b) || (x === b && y === a);
}

/**
 * Composition du prochain match construite au fil des confirmations : joueurs retenus et conditions,
 * enregistrés dans Supabase pour les retrouver d'un jour et d'un appareil à l'autre.
 */
export function useLineupDraft() {
  const [draft, setDraft] = useState<LineupDraft>({ playerIds: [], constraints: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<DraftSaveStatus>('idle');
  // Incrémenté à chaque modification de l'utilisateur : déclenche l'enregistrement (pas au chargement).
  const [changeCount, setChangeCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    fetchLineupDraft()
      .then((stored) => {
        if (!isMounted) return;
        if (stored) {
          setDraft(stored);
        } else {
          const legacyConstraints = loadLegacyConstraints();
          setDraft({ playerIds: [], constraints: legacyConstraints });
          // Première utilisation : on enregistre tout de suite les conditions reprises du navigateur.
          if (legacyConstraints.length > 0) {
            setSaveStatus('saving');
            setChangeCount((count) => count + 1);
          }
        }
      })
      .catch((err: Error) => {
        if (!isMounted) return;
        setLoadError(err.message);
        setDraft({ playerIds: [], constraints: loadLegacyConstraints() });
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (changeCount === 0) return;

    const timeout = setTimeout(() => {
      saveLineupDraft(draft)
        .then(() => {
          setSaveStatus('saved');
          forgetLegacyConstraints();
        })
        .catch(() => setSaveStatus('error'));
    }, SAVE_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [draft, changeCount]);

  function update(change: (current: LineupDraft) => LineupDraft): void {
    setDraft(change);
    setSaveStatus('saving');
    setChangeCount((count) => count + 1);
  }

  function togglePlayer(id: ID, maxPlayers: number): void {
    update((current) => {
      if (current.playerIds.includes(id)) {
        return { ...current, playerIds: current.playerIds.filter((playerId) => playerId !== id) };
      }
      if (current.playerIds.length >= maxPlayers) return current;
      return { ...current, playerIds: [...current.playerIds, id] };
    });
  }

  function clearPlayers(): void {
    update((current) => ({ ...current, playerIds: [] }));
  }

  /** Une seule condition par paire de joueurs : en ajouter une nouvelle remplace l'ancienne. */
  function addConstraint(playerIds: [ID, ID], rule: PairingRule): void {
    update((current) => ({
      ...current,
      constraints: [
        ...current.constraints.filter((constraint) => !isSamePair(constraint, playerIds)),
        { id: crypto.randomUUID(), playerIds, rule },
      ],
    }));
  }

  function removeConstraint(id: ID): void {
    update((current) => ({
      ...current,
      constraints: current.constraints.filter((constraint) => constraint.id !== id),
    }));
  }

  return {
    selectedIds: new Set(draft.playerIds),
    constraints: draft.constraints,
    isLoading,
    loadError,
    saveStatus,
    togglePlayer,
    clearPlayers,
    addConstraint,
    removeConstraint,
  };
}
