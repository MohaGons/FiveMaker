import type { ID } from '../../../shared/types/common';
import type { Player } from '../../players/types';
import type { PairingConstraint, Team } from '../types';
import { DEFAULT_TEAM_NAMES } from './teamColors';

/**
 * Écart de niveau moyen toléré par rapport à la meilleure répartition lors d'un remélange
 * (0.2 = un point de niveau d'écart sur une équipe de 5).
 */
const SHUFFLE_TOLERANCE = 0.2;
const EPSILON = 1e-9;

export function getAverageSkill(team: Team): number {
  if (team.players.length === 0) return 0;
  const total = team.players.reduce((sum, player) => sum + player.skillLevel, 0);
  return total / team.players.length;
}

export interface BalanceOptions {
  /** Tire au hasard parmi les répartitions presque aussi équilibrées que la meilleure. */
  shuffle?: boolean;
  /** Répartition à éviter (typiquement celle affichée), pour qu'un remélange change vraiment les équipes. */
  exclude?: [Team, Team];
}

export type BalanceResult = { ok: true; teams: [Team, Team] } | { ok: false; reason: string };

interface Candidate {
  teamA: Player[];
  teamB: Player[];
  gap: number;
}

function sumSkill(players: Player[]): number {
  return players.reduce((sum, player) => sum + player.skillLevel, 0);
}

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

function isSameSplit(teamA: Player[], teams: [Team, Team]): boolean {
  const ids = new Set(teamA.map((player) => player.id));
  return teams.some(
    (team) => team.players.length === ids.size && team.players.every((player) => ids.has(player.id)),
  );
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Répartit les joueurs en deux équipes de taille équivalente (écart max. de 1) en minimisant
 * l'écart de niveau moyen, tout en respectant les contraintes "ensemble" / "séparés".
 * Avec 10 joueurs max, toutes les répartitions sont évaluées (au plus 2^9).
 */
export function balanceTeams(
  players: Player[],
  constraints: PairingConstraint[] = [],
  { shuffle = false, exclude }: BalanceOptions = {},
): BalanceResult {
  if (players.length < 2) {
    return { ok: false, reason: 'Il faut au moins 2 joueurs pour former deux équipes.' };
  }

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

  const maxTeamSize = Math.ceil(players.length / 2);
  const oversizedBlock = blocks.find((block) => block.length > maxTeamSize);
  if (oversizedBlock) {
    return {
      ok: false,
      reason: `${oversizedBlock.map((player) => player.name).join(', ')} doivent être ensemble, mais une équipe ne peut compter que ${maxTeamSize} joueurs.`,
    };
  }

  // Le premier bloc est toujours placé dans l'équipe A : on évite ainsi d'évaluer chaque répartition en double (A/B inversés).
  const candidates: Candidate[] = [];
  const combinations = 1 << (blocks.length - 1);

  for (let mask = 0; mask < combinations; mask++) {
    const teamA: Player[] = [...blocks[0]];
    const teamB: Player[] = [];
    for (let index = 1; index < blocks.length; index++) {
      (mask & (1 << (index - 1)) ? teamA : teamB).push(...blocks[index]);
    }

    if (Math.abs(teamA.length - teamB.length) > 1 || teamB.length === 0) continue;

    const teamAIds = new Set(teamA.map((player) => player.id));
    if (apartPairs.some(([a, b]) => teamAIds.has(a) === teamAIds.has(b))) continue;

    const gap = Math.abs(sumSkill(teamA) / teamA.length - sumSkill(teamB) / teamB.length);
    candidates.push({ teamA, teamB, gap });
  }

  if (candidates.length === 0) {
    return { ok: false, reason: 'Aucune répartition possible avec ces conditions.' };
  }

  const bestGap = Math.min(...candidates.map((candidate) => candidate.gap));
  const maxGap = bestGap + (shuffle ? SHUFFLE_TOLERANCE : 0) + EPSILON;
  let pool = candidates.filter((candidate) => candidate.gap <= maxGap);

  if (exclude) {
    pool = pool.filter((candidate) => !isSameSplit(candidate.teamA, exclude));
    if (pool.length === 0) {
      return { ok: false, reason: "Pas d'autre répartition équilibrée possible avec ces joueurs." };
    }
  }

  const { teamA, teamB } = pickRandom(pool);
  const bySkill = (a: Player, b: Player) => b.skillLevel - a.skillLevel;

  return {
    ok: true,
    teams: [
      { id: crypto.randomUUID(), name: DEFAULT_TEAM_NAMES[0], players: teamA.sort(bySkill) },
      { id: crypto.randomUUID(), name: DEFAULT_TEAM_NAMES[1], players: teamB.sort(bySkill) },
    ],
  };
}
