import type { Match } from '../features/matches/types';
import type { Player, PlayerPosition } from '../features/players/types';
import type { PairingConstraint, PairingRule } from '../features/teams/types';
import type { ID } from '../shared/types/common';

export function makePlayer(
  id: ID,
  skillLevel: Player['skillLevel'] = 3,
  preferredPosition: PlayerPosition = 'midfielder',
): Player {
  return { id, name: id, skillLevel, preferredPosition, isGuest: false };
}

export function makeConstraint(a: ID, b: ID, rule: PairingRule): PairingConstraint {
  return { id: `${a}-${rule}-${b}`, playerIds: [a, b], rule };
}

interface MatchInput {
  id?: ID;
  playedAt?: Date;
  teamA: Player[];
  teamB: Player[];
  score?: [number, number];
  status?: Match['status'];
  playerStats?: Match['playerStats'];
}

let matchCount = 0;

export function makeMatch({ id, playedAt, teamA, teamB, score, status = 'completed', playerStats = {} }: MatchInput): Match {
  matchCount += 1;
  return {
    id: id ?? `match-${matchCount}`,
    playedAt: playedAt ?? new Date(2026, 0, matchCount),
    teams: [
      { id: 'a', name: 'Équipe A', players: teamA },
      { id: 'b', name: 'Équipe B', players: teamB },
    ],
    status,
    score: score && { teamA: score[0], teamB: score[1] },
    playerStats,
    ratings: {},
    openVoters: 0,
    myRatingsCount: 0,
  };
}
