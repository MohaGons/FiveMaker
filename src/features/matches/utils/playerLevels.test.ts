import { describe, expect, it } from 'vitest';
import { makeMatch, makePlayer } from '../../../test/factories';
import { computePlayerLevels } from './playerLevels';

const a = makePlayer('a', 3);
const b = makePlayer('b', 3);

describe('computePlayerLevels', () => {
  it('part du niveau de la fiche sans match', () => {
    const levels = computePlayerLevels([], [a]);

    expect(levels.get('a')).toMatchObject({ baseLevel: 3, level: 3, ratedMatches: 0, history: [] });
  });

  it('fait gagner 0,1 pour une victoire d\'un but entre équipes de même niveau', () => {
    const levels = computePlayerLevels([makeMatch({ teamA: [a], teamB: [b], score: [1, 0] })], [a, b]);

    expect(levels.get('a')!.level).toBeCloseTo(3.1);
    expect(levels.get('b')!.level).toBeCloseTo(2.9);
  });

  it('ne change rien sur un nul entre équipes de même niveau', () => {
    const levels = computePlayerLevels([makeMatch({ teamA: [a], teamB: [b], score: [2, 2] })], [a, b]);

    expect(levels.get('a')!.level).toBeCloseTo(3);
    expect(levels.get('a')!.ratedMatches).toBe(1);
  });

  it('compte double pour une victoire de 3 buts d\'écart', () => {
    const levels = computePlayerLevels([makeMatch({ teamA: [a], teamB: [b], score: [3, 0] })], [a, b]);

    expect(levels.get('a')!.level).toBeCloseTo(3.2);
  });

  it('récompense plus une victoire contre une équipe plus forte', () => {
    const weak = makePlayer('weak', 2);
    const strong = makePlayer('strong', 4);
    const upset = computePlayerLevels([makeMatch({ teamA: [weak], teamB: [strong], score: [1, 0] })], [weak, strong]);
    const expected = computePlayerLevels([makeMatch({ teamA: [strong], teamB: [weak], score: [1, 0] })], [weak, strong]);

    const upsetGain = upset.get('weak')!.level - 2;
    const expectedGain = expected.get('strong')!.level - 4;
    expect(upsetGain).toBeGreaterThan(0.1);
    expect(expectedGain).toBeLessThan(0.1);
  });

  it('borne le niveau entre 1 et 5', () => {
    const top = makePlayer('top', 5);
    const bottom = makePlayer('bottom', 1);
    const levels = computePlayerLevels([makeMatch({ teamA: [top], teamB: [bottom], score: [10, 0] })], [top, bottom]);

    expect(levels.get('top')!.level).toBe(5);
    expect(levels.get('bottom')!.level).toBe(1);
  });

  it('ignore les matchs programmés, annulés ou sans score', () => {
    const matches = [
      makeMatch({ teamA: [a], teamB: [b], score: [1, 0], status: 'scheduled' }),
      makeMatch({ teamA: [a], teamB: [b], score: [1, 0], status: 'cancelled' }),
      makeMatch({ teamA: [a], teamB: [b] }),
    ];

    expect(computePlayerLevels(matches, [a, b]).get('a')).toMatchObject({ level: 3, ratedMatches: 0 });
  });

  it('rejoue les matchs dans l\'ordre chronologique', () => {
    const first = makeMatch({ playedAt: new Date(2026, 0, 1), teamA: [a], teamB: [b], score: [1, 0] });
    const second = makeMatch({ playedAt: new Date(2026, 0, 8), teamA: [a], teamB: [b], score: [0, 1] });
    const history = computePlayerLevels([second, first], [a, b]).get('a')!.history;

    expect(history.map((point) => point.match.id)).toEqual([first.id, second.id]);
    expect(history[0].level).toBeGreaterThan(3);
    expect(history[0].teamIndex).toBe(0);
  });

  it('garde le niveau d\'un joueur supprimé à partir du match', () => {
    const gone = makePlayer('gone', 4);
    const levels = computePlayerLevels([makeMatch({ teamA: [gone], teamB: [b], score: [0, 1] })], [b]);

    expect(levels.get('gone')).toMatchObject({ baseLevel: 4, ratedMatches: 1 });
  });
});
