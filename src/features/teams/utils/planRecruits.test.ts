import { describe, expect, it } from 'vitest';
import type { Player } from '../../players/types';
import { makeConstraint, makePlayer } from '../../../test/factories';
import { planRecruits, TEAM_SIZE } from './planRecruits';

describe('planRecruits', () => {
  it('demande au moins un joueur', () => {
    expect(planRecruits([], [], 3)).toMatchObject({ ok: false });
  });

  it('ne propose aucune recrue quand les deux équipes sont complètes', () => {
    const levels: Player['skillLevel'][] = [5, 5, 4, 4, 3, 3, 2, 2, 1, 1];
    const result = planRecruits(levels.map((level, index) => makePlayer(`p${index}`, level)), [], 3);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.slots).toEqual([]);
    expect(result.plan.remainingGap).toBeCloseTo(0);
  });

  it('compense un joueur fort par des recrues plus faibles dans son équipe', () => {
    const result = planRecruits([makePlayer('star', 5)], [], 3);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { slots, remainingGap } = result.plan;
    expect(slots).toHaveLength(2 * TEAM_SIZE - 1);
    expect(remainingGap).toBeCloseTo(0);

    const levelOf = (teamIndex: 0 | 1) => slots.find((slot) => slot.teamIndex === teamIndex)!.level;
    expect(levelOf(0)).toBeLessThan(3);
    expect(levelOf(1)).toBeGreaterThan(3);
  });

  it('garde les niveaux conseillés entre 1 et 5', () => {
    const stars = ['a', 'b', 'c', 'd', 'e'].map((id) => makePlayer(id, 5));
    const result = planRecruits(stars, [makeConstraint('a', 'b', 'together')], 1);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const slot of result.plan.slots) {
      expect(slot.level).toBeGreaterThanOrEqual(1);
      expect(slot.level).toBeLessThanOrEqual(5);
    }
  });

  it('conseille d\'abord les postes manquants', () => {
    const players = [makePlayer('d1', 3, 'defender'), makePlayer('d2', 3, 'defender')];
    const result = planRecruits(players, [makeConstraint('d1', 'd2', 'together')], 3);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [firstSlot] = result.plan.slots.filter((slot) => slot.teamIndex === 0);
    expect(firstSlot.positions).toEqual(['midfielder', 'forward']);
  });

  it('remonte les conditions impossibles', () => {
    const players = [makePlayer('a'), makePlayer('b')];
    const constraints = [makeConstraint('a', 'b', 'together'), makeConstraint('a', 'b', 'apart')];

    expect(planRecruits(players, constraints, 3)).toMatchObject({ ok: false });
  });
});
