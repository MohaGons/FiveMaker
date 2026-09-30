import type { Player, PlayerPosition } from '../../players/types';
import type { PairingConstraint } from '../types';
import { countPositions } from './balanceTeams';
import type { GetLevel } from './balanceTeams';
import { findValidSplits } from './teamSplits';

/** Un five : deux équipes de 5. */
export const TEAM_SIZE = 5;

const POSITION_ORDER: PlayerPosition[] = ['defender', 'midfielder', 'forward'];
/** Une recrue loin du niveau habituel du groupe est plus dure à trouver : ça compte dans le choix. */
const RECRUIT_DEVIATION_WEIGHT = 0.5;
/**
 * Pénalité par joueur d'écart entre les équipes provisoires : sans elle, mettre tout le monde d'un côté
 * et compléter l'autre avec des recrues "moyennes" serait équilibré sur le papier, mais absurde à l'écran.
 */
const SIZE_GAP_WEIGHT = 0.3;

export interface RecruitSlot {
  teamIndex: 0 | 1;
  /** Niveau conseillé, entre 1 et 5. */
  level: number;
  /** Postes conseillés (plusieurs en cas d'égalité), du plus manquant au moins manquant. */
  positions: PlayerPosition[];
}

export interface RecruitPlan {
  teams: [Player[], Player[]];
  slots: RecruitSlot[];
  /** Écart de niveau moyen qui restera si les recrues ont le niveau conseillé (0 = équilibre parfait). */
  remainingGap: number;
}

export type RecruitPlanResult = { ok: true; plan: RecruitPlan } | { ok: false; reason: string };

function clampLevel(level: number): number {
  return Math.min(5, Math.max(1, level));
}

/** Pour chaque place, le poste le moins représenté dans l'équipe (en comptant les places déjà prévues). */
function suggestPositions(players: Player[], openSlots: number): PlayerPosition[][] {
  const counts = countPositions(players);
  const suggestions: PlayerPosition[][] = [];

  for (let slot = 0; slot < openSlots; slot++) {
    const fewest = Math.min(...POSITION_ORDER.map((position) => counts[position]));
    const candidates = POSITION_ORDER.filter((position) => counts[position] === fewest);
    suggestions.push(candidates);
    counts[candidates[0]] += 1;
  }
  return suggestions;
}

/**
 * Pour un effectif incomplet : la répartition provisoire et le profil des joueurs à recruter
 * pour que les deux équipes de 5 soient équilibrées une fois complètes.
 *
 * Pour chaque répartition possible, on cherche le niveau des recrues le plus proche du niveau de référence
 * qui égalise les deux équipes : les recrues de A à (référence + λ), celles de B à (référence − λ).
 *
 * `referenceLevel` : niveau moyen de tout le groupe (là où l'on recrute), pas seulement des inscrits —
 * sinon un seul inscrit de niveau 5 ferait conseiller 9 recrues de niveau 5.
 */
export function planRecruits(
  players: Player[],
  constraints: PairingConstraint[],
  referenceLevel: number,
  getLevel: GetLevel = (player) => player.skillLevel,
): RecruitPlanResult {
  if (players.length === 0) {
    return { ok: false, reason: 'Ajoute des joueurs pour voir les équipes se former.' };
  }

  const search = findValidSplits(players, constraints, TEAM_SIZE, () => true);
  if (!search.ok) return search;

  const sumLevels = (team: Player[]) => team.reduce((sum, player) => sum + getLevel(player), 0);

  let best: { plan: RecruitPlan; cost: number } | null = null;

  for (const [teamA, teamB] of search.splits) {
    const openA = TEAM_SIZE - teamA.length;
    const openB = TEAM_SIZE - teamB.length;
    const sumA = sumLevels(teamA);
    const sumB = sumLevels(teamB);

    // Égalise les totaux : sumA + openA·(réf + λ) = sumB + openB·(réf − λ).
    const lambda = openA + openB === 0 ? 0 : (sumB - sumA + (openB - openA) * referenceLevel) / (openA + openB);
    const levelA = clampLevel(referenceLevel + lambda);
    const levelB = clampLevel(referenceLevel - lambda);
    const remainingGap = Math.abs(sumA + openA * levelA - (sumB + openB * levelB)) / TEAM_SIZE;

    const cost =
      remainingGap +
      RECRUIT_DEVIATION_WEIGHT * Math.abs(lambda) +
      SIZE_GAP_WEIGHT * Math.abs(teamA.length - teamB.length);

    if (!best || cost < best.cost) {
      const slots: RecruitSlot[] = [
        ...suggestPositions(teamA, openA).map((positions) => ({ teamIndex: 0 as const, level: levelA, positions })),
        ...suggestPositions(teamB, openB).map((positions) => ({ teamIndex: 1 as const, level: levelB, positions })),
      ];
      best = { plan: { teams: [teamA, teamB], slots, remainingGap }, cost };
    }
  }

  const bySkill = (a: Player, b: Player) => getLevel(b) - getLevel(a);
  const { plan } = best!;
  return {
    ok: true,
    plan: { ...plan, teams: [[...plan.teams[0]].sort(bySkill), [...plan.teams[1]].sort(bySkill)] },
  };
}
