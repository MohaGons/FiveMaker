import type { PlayerPosition } from '../types';

const POSITION_LABELS: Record<PlayerPosition, string> = {
  defender: 'Défenseur',
  midfielder: 'Milieu',
  forward: 'Attaquant',
};

export function getPositionLabel(position: PlayerPosition): string {
  return POSITION_LABELS[position];
}

export const POSITION_OPTIONS: { value: PlayerPosition; label: string }[] = (
  Object.entries(POSITION_LABELS) as [PlayerPosition, string][]
).map(([value, label]) => ({ value, label }));
