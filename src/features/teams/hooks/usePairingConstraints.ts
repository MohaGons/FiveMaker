import { useEffect, useState } from 'react';
import type { ID } from '../../../shared/types/common';
import type { PairingConstraint, PairingRule } from '../types';

// Conservées sur l'appareil : les mêmes conditions (frères, potes...) reviennent d'un match à l'autre.
const STORAGE_KEY = 'pairing-constraints';

function loadConstraints(): PairingConstraint[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as PairingConstraint[]) : [];
  } catch {
    return [];
  }
}

function isSamePair(constraint: PairingConstraint, [a, b]: [ID, ID]): boolean {
  const [x, y] = constraint.playerIds;
  return (x === a && y === b) || (x === b && y === a);
}

export function usePairingConstraints() {
  const [constraints, setConstraints] = useState<PairingConstraint[]>(loadConstraints);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(constraints));
    } catch {
      // Stockage indisponible (navigation privée...) : les conditions restent valables pour la session.
    }
  }, [constraints]);

  /** Une seule condition par paire de joueurs : en ajouter une nouvelle remplace l'ancienne. */
  function addConstraint(playerIds: [ID, ID], rule: PairingRule): void {
    setConstraints((current) => [
      ...current.filter((constraint) => !isSamePair(constraint, playerIds)),
      { id: crypto.randomUUID(), playerIds, rule },
    ]);
  }

  function removeConstraint(id: ID): void {
    setConstraints((current) => current.filter((constraint) => constraint.id !== id));
  }

  return { constraints, addConstraint, removeConstraint };
}
