import { describe, expect, it } from 'vitest';
import { makeConstraint, makePlayer } from '../../../test/factories';
import { findValidSplits } from './teamSplits';

const acceptAll = () => true;
const ids = (players: { id: string }[]) => players.map((player) => player.id).sort();

describe('findValidSplits', () => {
  it('énumère chaque répartition une seule fois (sans doublon A/B inversé)', () => {
    const players = ['a', 'b', 'c', 'd'].map((id) => makePlayer(id));
    const result = findValidSplits(players, [], 2, acceptAll);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // C(4,2) / 2 = 3 façons de faire deux paires.
    expect(result.splits).toHaveLength(3);
  });

  it('garde ensemble les joueurs liés, y compris par transitivité', () => {
    const players = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => makePlayer(id));
    const constraints = [makeConstraint('a', 'b', 'together'), makeConstraint('b', 'c', 'together')];
    const result = findValidSplits(players, constraints, 3, acceptAll);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const [teamA, teamB] of result.splits) {
      const team = teamA.some((player) => player.id === 'a') ? teamA : teamB;
      expect(ids(team)).toEqual(expect.arrayContaining(['a', 'b', 'c']));
    }
  });

  it('sépare les joueurs à mettre dans des équipes différentes', () => {
    const players = ['a', 'b', 'c', 'd'].map((id) => makePlayer(id));
    const result = findValidSplits(players, [makeConstraint('a', 'b', 'apart')], 2, acceptAll);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const [teamA] of result.splits) {
      const teamAIds = ids(teamA);
      expect(teamAIds.includes('a')).not.toBe(teamAIds.includes('b'));
    }
  });

  it('refuse des conditions contradictoires', () => {
    const players = ['a', 'b', 'c'].map((id) => makePlayer(id));
    const constraints = [
      makeConstraint('a', 'b', 'together'),
      makeConstraint('b', 'c', 'together'),
      makeConstraint('a', 'c', 'apart'),
    ];

    expect(findValidSplits(players, constraints, 3, acceptAll)).toMatchObject({ ok: false });
  });

  it('refuse un groupe "ensemble" plus grand qu\'une équipe', () => {
    const players = ['a', 'b', 'c', 'd'].map((id) => makePlayer(id));
    const constraints = [makeConstraint('a', 'b', 'together'), makeConstraint('b', 'c', 'together')];

    expect(findValidSplits(players, constraints, 2, acceptAll)).toMatchObject({ ok: false });
  });

  it('ignore les conditions qui concernent un joueur absent', () => {
    const players = ['a', 'b'].map((id) => makePlayer(id));
    const result = findValidSplits(players, [makeConstraint('a', 'absent', 'together')], 1, acceptAll);

    expect(result).toMatchObject({ ok: true });
  });
});
