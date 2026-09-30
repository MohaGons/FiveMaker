import type { ID } from '../../../shared/types/common';
import type { Player } from '../../players/types';
import type { PairingConstraint } from '../types';

export type Split = [Player[], Player[]];

export type SplitSearchResult = { ok: true; splits: Split[] } | { ok: false; reason: string };

/** Regroupe les joueurs liés par une contrainte "ensemble" (union-find). */
function buildBlocks(players: Player[], togetherPairs: [ID, ID][]): Player[][] {
  const parent = new Map<ID, ID>(players.map((player) => [player.id, player.id]));

  function find(id: ID): ID {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root)!;
    parent.set(id, root);
    return root;
  }

  for (const [a, b] of togetherPairs) parent.set(find(a), find(b));

  const blocks = new Map<ID, Player[]>();
  for (const player of players) {
    const root = find(player.id);
    blocks.set(root, [...(blocks.get(root) ?? []), player]);
  }
  return Array.from(blocks.values());
}

/**
 * Toutes les répartitions en deux équipes qui respectent les contraintes "ensemble" / "séparés"
 * et dont les tailles sont acceptées par `acceptSizes`.
 * Avec 10 joueurs max, on peut toutes les énumérer (au plus 2^9).
 */
export function findValidSplits(
  players: Player[],
  constraints: PairingConstraint[],
  maxTeamSize: number,
  acceptSizes: (sizeA: number, sizeB: number) => boolean,
): SplitSearchResult {
  const playersById = new Map(players.map((player) => [player.id, player]));
  const nameOf = (id: ID) => playersById.get(id)?.name ?? '?';

  // Les contraintes concernant un joueur absent sont ignorées.
  const activeConstraints = constraints.filter((constraint) =>
    constraint.playerIds.every((id) => playersById.has(id)),
  );
  const togetherPairs = activeConstraints.filter((c) => c.rule === 'together').map((c) => c.playerIds);
  const apartPairs = activeConstraints.filter((c) => c.rule === 'apart').map((c) => c.playerIds);

  const blocks = buildBlocks(players, togetherPairs);
  const blockIndexById = new Map<ID, number>();
  blocks.forEach((block, index) => block.forEach((player) => blockIndexById.set(player.id, index)));

  for (const [a, b] of apartPairs) {
    if (blockIndexById.get(a) === blockIndexById.get(b)) {
      return {
        ok: false,
        reason: `${nameOf(a)} et ${nameOf(b)} ne peuvent pas être à la fois ensemble et séparés.`,
      };
    }
  }

  const oversizedBlock = blocks.find((block) => block.length > maxTeamSize);
  if (oversizedBlock) {
    return {
      ok: false,
      reason: `${oversizedBlock.map((player) => player.name).join(', ')} doivent être ensemble, mais une équipe ne peut compter que ${maxTeamSize} joueurs.`,
    };
  }

  // Le premier bloc est toujours placé dans l'équipe A : on évite ainsi d'évaluer chaque répartition en double (A/B inversés).
  const splits: Split[] = [];
  const combinations = blocks.length === 0 ? 0 : 1 << (blocks.length - 1);

  for (let mask = 0; mask < combinations; mask++) {
    const teamA: Player[] = [...blocks[0]];
    const teamB: Player[] = [];
    for (let index = 1; index < blocks.length; index++) {
      (mask & (1 << (index - 1)) ? teamA : teamB).push(...blocks[index]);
    }

    if (teamA.length > maxTeamSize || teamB.length > maxTeamSize) continue;
    if (!acceptSizes(teamA.length, teamB.length)) continue;

    const teamAIds = new Set(teamA.map((player) => player.id));
    if (apartPairs.some(([a, b]) => teamAIds.has(a) === teamAIds.has(b))) continue;

    splits.push([teamA, teamB]);
  }

  if (splits.length === 0) {
    return { ok: false, reason: 'Aucune répartition possible avec ces conditions.' };
  }
  return { ok: true, splits };
}
