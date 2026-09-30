/** Identifiants de dépôt du glisser-déposer : une équipe (déplacement) ou un joueur (échange). */
const TEAM_DROP_PREFIX = 'team-';
const PLAYER_DROP_PREFIX = 'player-';

export type DropTarget = { type: 'team'; index: 0 | 1 } | { type: 'player'; playerId: string };

export function teamDropId(index: 0 | 1): string {
  return TEAM_DROP_PREFIX + index;
}

export function playerDropId(playerId: string): string {
  return PLAYER_DROP_PREFIX + playerId;
}

export function parseDropId(id: string): DropTarget | null {
  if (id === teamDropId(0)) return { type: 'team', index: 0 };
  if (id === teamDropId(1)) return { type: 'team', index: 1 };
  if (id.startsWith(PLAYER_DROP_PREFIX)) return { type: 'player', playerId: id.slice(PLAYER_DROP_PREFIX.length) };
  return null;
}
