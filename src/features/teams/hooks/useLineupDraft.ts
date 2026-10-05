import { useEffect, useRef, useState } from 'react';
import type { ID } from '../../../shared/types/common';
import { useCurrentGroup } from '../../groups/hooks/useGroups';
import {
  clearLineup,
  fetchLineupDraft,
  fetchLineupResponses,
  respondToLineup,
  saveLineupConstraints,
  setLineupPlayer,
} from '../api/lineupDraftApi';
import type { LineupDraft } from '../api/lineupDraftApi';
import type { LineupResponse, PairingConstraint, PairingRule } from '../types';

/** Délai avant enregistrement des conditions : plusieurs clics rapprochés ne font qu'une écriture. */
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
 * Composition du prochain match construite au fil des confirmations : joueurs retenus, conditions et
 * réponses au sondage de présence, enregistrés dans Supabase et partagés par tout le groupe.
 *
 * Les joueurs sont modifiés un par un côté base (plusieurs membres peuvent répondre en même temps) ;
 * les conditions, réservées aux admins, sont enregistrées d'un bloc après un court délai.
 */
export function useLineupDraft() {
  const { group, canEdit } = useCurrentGroup();
  const groupId = group.id;
  const [draft, setDraft] = useState<LineupDraft>({ playerIds: [], constraints: [] });
  const [responses, setResponses] = useState<LineupResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<DraftSaveStatus>('idle');
  const [actionError, setActionError] = useState<string | null>(null);
  // Incrémenté à chaque modification des conditions : déclenche leur enregistrement (pas au chargement).
  const [constraintChangeCount, setConstraintChangeCount] = useState(0);
  // Numéro de la dernière écriture des joueurs : un résultat plus ancien arrivé en retard est ignoré.
  const playerWriteRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    Promise.all([fetchLineupDraft(groupId), fetchLineupResponses(groupId)])
      .then(([stored, storedResponses]) => {
        if (!isMounted) return;
        setResponses(storedResponses);
        if (stored) {
          setDraft(stored);
        } else {
          // Première utilisation : on reprend (et enregistre) les conditions gardées dans le navigateur,
          // si l'on a le droit de modifier le groupe.
          const legacyConstraints = canEdit ? loadLegacyConstraints() : [];
          setDraft({ playerIds: [], constraints: legacyConstraints });
          if (legacyConstraints.length > 0) {
            setSaveStatus('saving');
            setConstraintChangeCount((count) => count + 1);
          }
        }
      })
      .catch((err: Error) => {
        if (!isMounted) return;
        setLoadError(err.message);
        setDraft({ playerIds: [], constraints: canEdit ? loadLegacyConstraints() : [] });
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [groupId, canEdit]);

  /** Recharge les joueurs et les réponses (pas les conditions, qui peuvent être en cours de saisie). */
  async function refreshPlayers(): Promise<void> {
    const writeId = playerWriteRef.current;
    const [stored, storedResponses] = await Promise.all([fetchLineupDraft(groupId), fetchLineupResponses(groupId)]);
    if (writeId !== playerWriteRef.current) return;
    setDraft((current) => ({ ...current, playerIds: stored?.playerIds ?? [] }));
    setResponses(storedResponses);
  }

  // Les autres membres répondent pendant que la page est ouverte : on se met à jour en y revenant.
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') refreshPlayers().catch(() => {});
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  });

  useEffect(() => {
    if (constraintChangeCount === 0) return;

    const timeout = setTimeout(() => {
      saveLineupConstraints(groupId, draft.constraints)
        .then(() => {
          setSaveStatus('saved');
          forgetLegacyConstraints();
        })
        .catch(() => setSaveStatus('error'));
    }, SAVE_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [groupId, draft.constraints, constraintChangeCount]);

  /** Affiche tout de suite le changement, puis reprend la composition renvoyée par la base. */
  async function writePlayers(optimistic: (ids: ID[]) => ID[], request: () => Promise<ID[]>): Promise<void> {
    const writeId = ++playerWriteRef.current;
    setDraft((current) => ({ ...current, playerIds: optimistic(current.playerIds) }));
    setSaveStatus('saving');
    setActionError(null);

    try {
      const playerIds = await request();
      if (writeId !== playerWriteRef.current) return;
      setDraft((current) => ({ ...current, playerIds }));
      setSaveStatus('saved');
    } catch (err) {
      if (writeId !== playerWriteRef.current) return;
      setSaveStatus('error');
      setActionError(err instanceof Error ? err.message : 'Enregistrement impossible.');
      await refreshPlayers().catch(() => {});
    }
  }

  function togglePlayer(id: ID, maxPlayers: number): void {
    const included = !draft.playerIds.includes(id);
    if (included && draft.playerIds.length >= maxPlayers) return;

    void writePlayers(
      (ids) => (included ? [...ids, id] : ids.filter((playerId) => playerId !== id)),
      () => setLineupPlayer(groupId, id, included),
    );
  }

  /** Nouvelle composition : plus aucun joueur ni réponse au sondage. */
  function clearPlayers(): void {
    setResponses([]);
    void writePlayers(
      () => [],
      async () => {
        await clearLineup(groupId);
        return [];
      },
    );
  }

  /** Réponse du compte connecté au sondage. Lève une erreur si elle n'a pas pu être enregistrée. */
  async function respond(attending: boolean): Promise<void> {
    const writeId = ++playerWriteRef.current;
    const playerIds = await respondToLineup(groupId, attending);
    const storedResponses = await fetchLineupResponses(groupId).catch(() => null);
    if (writeId !== playerWriteRef.current) return;
    setDraft((current) => ({ ...current, playerIds }));
    if (storedResponses) setResponses(storedResponses);
  }

  function updateConstraints(change: (current: PairingConstraint[]) => PairingConstraint[]): void {
    setDraft((current) => ({ ...current, constraints: change(current.constraints) }));
    setSaveStatus('saving');
    setConstraintChangeCount((count) => count + 1);
  }

  /** Une seule condition par paire de joueurs : en ajouter une nouvelle remplace l'ancienne. */
  function addConstraint(playerIds: [ID, ID], rule: PairingRule): void {
    updateConstraints((current) => [
      ...current.filter((constraint) => !isSamePair(constraint, playerIds)),
      { id: crypto.randomUUID(), playerIds, rule },
    ]);
  }

  function removeConstraint(id: ID): void {
    updateConstraints((current) => current.filter((constraint) => constraint.id !== id));
  }

  return {
    selectedIds: new Set(draft.playerIds),
    constraints: draft.constraints,
    responses,
    isLoading,
    loadError,
    saveStatus,
    actionError,
    togglePlayer,
    clearPlayers,
    respond,
    addConstraint,
    removeConstraint,
  };
}
