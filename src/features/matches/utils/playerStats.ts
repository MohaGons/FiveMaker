import type { ID } from '../../../shared/types/common';
import type { Match } from '../types';

export type MatchResult = 'win' | 'draw' | 'loss';

export interface PlayerStats {
  playerId: ID;
  name: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  /** Sur les matchs avec un score renseigné uniquement. */
  winRate: number;
  goals: number;
  assists: number;
  mvpCount: number;
  /** Résultats des 5 derniers matchs avec score, du plus ancien au plus récent. */
  form: MatchResult[];
  /** Plus longue série de victoires consécutives (matchs avec score). */
  bestWinStreak: number;
}

const FORM_LENGTH = 5;

/** Résultat du match pour l'équipe A ou B, null sans score. */
export function getMatchResult(match: Match, isTeamA: boolean): MatchResult | null {
  if (!match.score) return null;
  const { teamA, teamB } = match.score;
  if (teamA === teamB) return 'draw';
  return teamA > teamB === isTeamA ? 'win' : 'loss';
}

interface RunningStats extends PlayerStats {
  currentWinStreak: number;
}

export function computePlayerStats(matches: Match[]): PlayerStats[] {
  const statsById = new Map<ID, RunningStats>();

  // Du plus ancien au plus récent, pour la forme et les séries.
  const playedMatches = matches
    .filter((match) => match.status === 'completed')
    .sort((a, b) => a.playedAt.getTime() - b.playedAt.getTime());

  for (const match of playedMatches) {
    for (const [team, isTeamA] of [
      [match.teams[0], true],
      [match.teams[1], false],
    ] as const) {
      const result = getMatchResult(match, isTeamA);

      for (const player of team.players) {
        const stats = statsById.get(player.id) ?? {
          playerId: player.id,
          name: player.name,
          matchesPlayed: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          winRate: 0,
          goals: 0,
          assists: 0,
          mvpCount: 0,
          form: [],
          bestWinStreak: 0,
          currentWinStreak: 0,
        };

        stats.name = player.name;
        stats.matchesPlayed += 1;
        stats.goals += match.playerStats[player.id]?.goals ?? 0;
        stats.assists += match.playerStats[player.id]?.assists ?? 0;
        if (match.mvpPlayerId === player.id) stats.mvpCount += 1;

        if (result) {
          if (result === 'win') stats.wins += 1;
          else if (result === 'draw') stats.draws += 1;
          else stats.losses += 1;

          stats.form = [...stats.form, result].slice(-FORM_LENGTH);
          stats.currentWinStreak = result === 'win' ? stats.currentWinStreak + 1 : 0;
          stats.bestWinStreak = Math.max(stats.bestWinStreak, stats.currentWinStreak);
        }

        statsById.set(player.id, stats);
      }
    }
  }

  return Array.from(statsById.values())
    .map(({ currentWinStreak: _currentWinStreak, ...stats }) => {
      const decidedMatches = stats.wins + stats.draws + stats.losses;
      return { ...stats, winRate: decidedMatches > 0 ? stats.wins / decidedMatches : 0 };
    })
    .sort((a, b) => b.winRate - a.winRate || b.matchesPlayed - a.matchesPlayed || a.name.localeCompare(b.name));
}

/** Classement des buteurs : buts, puis passes, puis titres d'homme du match. */
export function rankScorers(stats: PlayerStats[]): PlayerStats[] {
  return stats
    .filter((player) => player.goals + player.assists + player.mvpCount > 0)
    .sort(
      (a, b) =>
        b.goals - a.goals || b.assists - a.assists || b.mvpCount - a.mvpCount || a.name.localeCompare(b.name),
    );
}
