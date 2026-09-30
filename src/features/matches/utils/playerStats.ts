import type { ID } from '../../../shared/types/common';
import type { Match } from '../types';

export interface PlayerStats {
  playerId: ID;
  name: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  /** Sur les matchs avec un score renseigné uniquement. */
  winRate: number;
}

export function computePlayerStats(matches: Match[]): PlayerStats[] {
  const statsById = new Map<ID, PlayerStats>();

  for (const match of matches) {
    // Les matchs à venir ou annulés ne comptent pas comme joués.
    if (match.status !== 'completed') continue;

    const [teamA, teamB] = match.teams;
    const outcome = match.score
      ? match.score.teamA === match.score.teamB
        ? 'draw'
        : match.score.teamA > match.score.teamB
          ? 'teamA'
          : 'teamB'
      : null;

    for (const [team, isTeamA] of [
      [teamA, true],
      [teamB, false],
    ] as const) {
      for (const player of team.players) {
        const stats = statsById.get(player.id) ?? {
          playerId: player.id,
          name: player.name,
          matchesPlayed: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          winRate: 0,
        };

        stats.name = player.name;
        stats.matchesPlayed += 1;

        if (outcome === 'draw') {
          stats.draws += 1;
        } else if (outcome === (isTeamA ? 'teamA' : 'teamB')) {
          stats.wins += 1;
        } else if (outcome !== null) {
          stats.losses += 1;
        }

        statsById.set(player.id, stats);
      }
    }
  }

  return Array.from(statsById.values())
    .map((stats) => {
      const decidedMatches = stats.wins + stats.draws + stats.losses;
      return { ...stats, winRate: decidedMatches > 0 ? stats.wins / decidedMatches : 0 };
    })
    .sort((a, b) => b.winRate - a.winRate || b.matchesPlayed - a.matchesPlayed || a.name.localeCompare(b.name));
}
