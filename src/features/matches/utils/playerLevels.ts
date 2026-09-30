import type { ID } from '../../../shared/types/common';
import type { Player } from '../../players/types';
import type { Match } from '../types';

/**
 * Niveau dynamique façon Elo : on part du niveau noté à la main (1 à 5), puis chaque match avec un score
 * le fait monter ou descendre. Battre une équipe plus forte rapporte plus que battre une équipe plus faible.
 */

/** 1 point de niveau = 100 points de classement (écart de 100 ≈ 64 % de chances de gagner). */
const RATING_PER_LEVEL = 100;
/**
 * Points de classement en jeu par match : une victoire d'un but entre équipes de même niveau
 * rapporte +0,1 de niveau. Assez lent pour lisser la part de chance d'un five.
 */
const K_FACTOR = 20;
const MIN_LEVEL = 1;
const MAX_LEVEL = 5;

export interface PlayerLevel {
  /** Niveau noté à la main. */
  baseLevel: number;
  /** Niveau ajusté selon les résultats, borné entre 1 et 5. */
  level: number;
  /** Nombre de matchs avec score ayant compté dans le calcul. */
  ratedMatches: number;
  /** Niveau après chaque match avec score, dans l'ordre chronologique. */
  history: LevelPoint[];
}

export interface LevelPoint {
  match: Match;
  /** Équipe du joueur sur ce match (0 = A, 1 = B). */
  teamIndex: 0 | 1;
  level: number;
}

function toRating(level: number): number {
  return level * RATING_PER_LEVEL;
}

function toLevel(rating: number): number {
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, rating / RATING_PER_LEVEL));
}

/** Une large victoire pèse un peu plus : ×1 pour un but d'écart, ×2 pour 3 buts, ×3 pour 7 buts. */
function marginMultiplier(goalDifference: number): number {
  return goalDifference === 0 ? 1 : Math.log2(Math.abs(goalDifference) + 1);
}

/**
 * Rejoue les matchs joués avec score, du plus ancien au plus récent.
 * Le point de départ est le niveau actuel de la fiche joueur (ou celui du match pour un joueur supprimé).
 */
export function computePlayerLevels(matches: Match[], players: Player[]): Map<ID, PlayerLevel> {
  const ratings = new Map<ID, number>();
  const baseLevels = new Map<ID, number>();
  const histories = new Map<ID, LevelPoint[]>();

  for (const player of players) {
    baseLevels.set(player.id, player.skillLevel);
    ratings.set(player.id, toRating(player.skillLevel));
  }

  const scoredMatches = matches
    .filter((match) => match.status === 'completed' && match.score)
    .sort((a, b) => a.playedAt.getTime() - b.playedAt.getTime());

  for (const match of scoredMatches) {
    const [teamA, teamB] = match.teams;
    if (teamA.players.length === 0 || teamB.players.length === 0) continue;

    const ratingOf = (player: Player): number => {
      if (!ratings.has(player.id)) {
        baseLevels.set(player.id, player.skillLevel);
        ratings.set(player.id, toRating(player.skillLevel));
      }
      return ratings.get(player.id)!;
    };
    const averageRating = (team: Player[]) => team.reduce((sum, player) => sum + ratingOf(player), 0) / team.length;

    const ratingA = averageRating(teamA.players);
    const ratingB = averageRating(teamB.players);
    const expectedA = 1 / (1 + 10 ** ((ratingB - ratingA) / 400));

    const { teamA: goalsA, teamB: goalsB } = match.score!;
    const resultA = goalsA > goalsB ? 1 : goalsA === goalsB ? 0.5 : 0;
    const deltaA = K_FACTOR * marginMultiplier(goalsA - goalsB) * (resultA - expectedA);

    for (const [team, delta, teamIndex] of [
      [teamA.players, deltaA, 0],
      [teamB.players, -deltaA, 1],
    ] as const) {
      for (const player of team) {
        const rating = ratingOf(player) + delta;
        ratings.set(player.id, rating);
        histories.set(player.id, [...(histories.get(player.id) ?? []), { match, teamIndex, level: toLevel(rating) }]);
      }
    }
  }

  const levels = new Map<ID, PlayerLevel>();
  for (const [id, rating] of ratings) {
    levels.set(id, {
      baseLevel: baseLevels.get(id)!,
      level: toLevel(rating),
      ratedMatches: histories.get(id)?.length ?? 0,
      history: histories.get(id) ?? [],
    });
  }
  return levels;
}
