import type { ID } from '../../../shared/types/common';
import type { Player, PlayerPosition } from '../../players/types';
import type { PairingConstraint, Team } from '../types';
import { DEFAULT_TEAM_NAMES } from './teamColors';
import { findValidSplits } from './teamSplits';

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
 */
export function balanceTeams(
  players: Player[],
  constraints: PairingConstraint[] = [],
  { shuffle = false, exclude, getLevel = manualLevel }: BalanceOptions = {},
): BalanceResult {
  if (players.length < 2) {
    return { ok: false, reason: 'Il faut au moins 2 joueurs pour former deux équipes.' };
  }

  const search = findValidSplits(
    players,
    constraints,
    Math.ceil(players.length / 2),
    (sizeA, sizeB) => sizeB > 0 && Math.abs(sizeA - sizeB) <= 1,
  );
  if (!search.ok) return search;

  const candidates: Candidate[] = search.splits.map(([teamA, teamB]) => {
    const averageA = teamA.reduce((sum, player) => sum + getLevel(player), 0) / teamA.length;
    const averageB = teamB.reduce((sum, player) => sum + getLevel(player), 0) / teamB.length;
    const cost = Math.abs(averageA - averageB) + POSITION_WEIGHT * positionImbalance(teamA, teamB);
    return { teamA, teamB, cost };
  });

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
