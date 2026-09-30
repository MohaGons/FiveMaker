import type { ID } from '../../../shared/types/common';
import type { Match } from '../types';
import { getMatchResult } from './playerStats';

export interface DuoStats {
  playerIds: [ID, ID];
  names: [string, string];
  /** Matchs avec score joués dans la même équipe. */
  matchesTogether: number;
  wins: number;
  winRate: number;
}

/** En dessous, un taux de victoire ensemble tient surtout du hasard. */
export const MIN_MATCHES_TOGETHER = 3;

/** Paires de coéquipiers, des plus victorieuses ensemble aux moins victorieuses. */
export function computeDuoStats(matches: Match[]): DuoStats[] {
  const duos = new Map<string, DuoStats>();

  for (const match of matches) {
    if (match.status !== 'completed' || !match.score) continue;

    match.teams.forEach((team, index) => {
      const won = getMatchResult(match, index === 0) === 'win';
      const players = [...team.players].sort((a, b) => a.id.localeCompare(b.id));

      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          const [a, b] = [players[i], players[j]];
          const key = `${a.id}|${b.id}`;
          const duo = duos.get(key) ?? {
            playerIds: [a.id, b.id],
            names: [a.name, b.name],
            matchesTogether: 0,
            wins: 0,
            winRate: 0,
          };
          duo.names = [a.name, b.name];
          duo.matchesTogether += 1;
          if (won) duo.wins += 1;
          duos.set(key, duo);
        }
      }
    });
  }

  return Array.from(duos.values())
    .filter((duo) => duo.matchesTogether >= MIN_MATCHES_TOGETHER)
    .map((duo) => ({ ...duo, winRate: duo.wins / duo.matchesTogether }))
    .sort((a, b) => b.winRate - a.winRate || b.matchesTogether - a.matchesTogether);
}
