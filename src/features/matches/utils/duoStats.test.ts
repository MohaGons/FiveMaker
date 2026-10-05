import { describe, expect, it } from 'vitest';
import { makeMatch, makePlayer } from '../../../test/factories';
import { computeDuoStats, MIN_MATCHES_TOGETHER } from './duoStats';

const [a, b, c, d] = ['a', 'b', 'c', 'd'].map((id) => makePlayer(id));

describe('computeDuoStats', () => {
  it('ignore les duos qui n\'ont pas assez joué ensemble', () => {
    const matches = Array.from({ length: MIN_MATCHES_TOGETHER - 1 }, () =>
      makeMatch({ teamA: [a, b], teamB: [c, d], score: [1, 0] }),
    );

    expect(computeDuoStats(matches)).toEqual([]);
  });

  it('classe les duos par taux de victoire ensemble', () => {
    const matches = [
      makeMatch({ teamA: [a, b], teamB: [c, d], score: [2, 0] }),
      makeMatch({ teamA: [c, d], teamB: [b, a], score: [0, 1] }),
      makeMatch({ teamA: [a, b], teamB: [c, d], score: [1, 1] }),
      // Ne compte pas : pas de score.
      makeMatch({ teamA: [a, b], teamB: [c, d], status: 'scheduled' }),
    ];
    const duos = computeDuoStats(matches);

    expect(duos.map((duo) => duo.playerIds)).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
    expect(duos[0]).toMatchObject({ matchesTogether: 3, wins: 2 });
    expect(duos[0].winRate).toBeCloseTo(2 / 3);
    expect(duos[1]).toMatchObject({ matchesTogether: 3, wins: 0, winRate: 0 });
  });
});
