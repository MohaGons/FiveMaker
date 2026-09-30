import type { ID } from '../../../shared/types/common';
import type { Player, PlayerPosition } from '../../players/types';
import type { PairingConstraint, Team } from '../types';
import { DEFAULT_TEAM_NAMES } from './teamColors';

/**
 * Écart toléré par rapport à la meilleure répartition lors d'un remélange, en niveau moyen
 * (0.2 = un point de niveau d'écart sur une équipe de 5).
 */
const SHUFFLE_TOLERANCE = 0.2;
/**
 * Coût d'un joueur "mal réparti" entre les postes, exprimé en écart de niveau moyen.
 * Inférieur à SHUFFLE_TOLERANCE : le niveau reste prioritaire, les postes départagent les répartitions proches.
 */
const POSITION_WEIGHT = 0.15;
const EPSILON = 1e-9;

/** Niveau utilisé pour l'équilibrage : par défaut celui de la fiche, sinon le niveau ajusté selon les résultats. */
export type GetLevel = (player: Player) => number;

const manualLevel: GetLevel = (player) => player.skillLevel;

const POSITIONS: PlayerPosition[] = ['defender', 'midfielder', 'forward'];

export function getAverageSkill(team: Team, getLevel: GetLevel = manualLevel): number {
  if (team.players.length === 0) return 0;
  const total = team.players.reduce((sum, player) => sum + getLevel(player), 0);
  return total / team.players.length;
}

export function countPositions(players: Player[]): Record<PlayerPosition, number> {
  const counts: Record<PlayerPosition, number> = { defender: 0, midfielder: 0, forward: 0 };
  for (const player of players) counts[player.preferredPosition] += 1;
  return counts;
}

/**
 * Nombre de joueurs à déplacer pour que chaque poste soit réparti au mieux entre les deux équipes
 * (ex. 3 défenseurs contre 1 → 1 ; 2 contre 1 → 0, car un nombre impair ne peut pas être partagé).
 */
function positionImbalance(teamA: Player[], teamB: Player[]): number {
  const countsA = countPositions(teamA);
  const countsB = countPositions(teamB);
  return POSITIONS.reduce(
    (sum, position) => sum + Math.floor(Math.abs(countsA[position] - countsB[position]) / 2),
    0,
  );
}

/** Conditions "ensemble" / "séparés" non respectées par des équipes (utile après un déplacement manuel). */
export function findViolatedConstraints(
  teams: [Team, Team],
  constraints: PairingConstraint[],
): PairingConstraint[] {
  const teamIndexById = new Map<ID, number>();
  teams.forEach((team, index) => team.players.forEach((player) => teamIndexById.set(player.id, index)));

  return constraints.filter((constraint) => {
    const [a, b] = constraint.playerIds.map((id) => teamIndexById.get(id));
    if (a === undefined || b === undefined) return false;
    return constraint.rule === 'together' ? a !== b : a === b;
  });
}

export interface BalanceOptions {
  /** Tire au hasard parmi les répartitions presque aussi équilibrées que la meilleure. */
  shuffle?: boolean;
  /** Répartition à éviter (typiquement celle affichée), pour qu'un remélange change vraiment les équipes. */
  exclude?: [Team, Team];
  getLevel?: GetLevel;
}

export type BalanceResult = { ok: true; teams: [Team, Team] } | { ok: false; reason: string };

interface Candidate {
  teamA: Player[];
  teamB: Player[];
  /** Écart de niveau moyen + pénalité de répartition des postes : plus c'est bas, mieux c'est. */
  cost: number;
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
 * l'écart de niveau moyen, puis en répartissant les postes, tout en respectant les contraintes
 * "ensemble" / "séparés".
 * Avec 10 joueurs max, toutes les répartitions sont évaluées (au plus 2^9).
 */
export function balanceTeams(
  players: Player[],
  constraints: PairingConstraint[] = [],
  { shuffle = false, exclude, getLevel = manualLevel }: BalanceOptions = {},
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

    const averageA = teamA.reduce((sum, player) => sum + getLevel(player), 0) / teamA.length;
    const averageB = teamB.reduce((sum, player) => sum + getLevel(player), 0) / teamB.length;
    const cost = Math.abs(averageA - averageB) + POSITION_WEIGHT * positionImbalance(teamA, teamB);
    candidates.push({ teamA, teamB, cost });
  }

  if (candidates.length === 0) {
    return { ok: false, reason: 'Aucune répartition possible avec ces conditions.' };
  }

  const bestCost = Math.min(...candidates.map((candidate) => candidate.cost));
  const maxCost = bestCost + (shuffle ? SHUFFLE_TOLERANCE : 0) + EPSILON;
  let pool = candidates.filter((candidate) => candidate.cost <= maxCost);

  if (exclude) {
    pool = pool.filter((candidate) => !isSameSplit(candidate.teamA, exclude));
    if (pool.length === 0) {
      return { ok: false, reason: "Pas d'autre répartition équilibrée possible avec ces joueurs." };
    }
  }

  const { teamA, teamB } = pickRandom(pool);
  const bySkill = (a: Player, b: Player) => getLevel(b) - getLevel(a);

  return {
    ok: true,
    teams: [
      { id: crypto.randomUUID(), name: DEFAULT_TEAM_NAMES[0], players: teamA.sort(bySkill) },
      { id: crypto.randomUUID(), name: DEFAULT_TEAM_NAMES[1], players: teamB.sort(bySkill) },
    ],
  };
}
