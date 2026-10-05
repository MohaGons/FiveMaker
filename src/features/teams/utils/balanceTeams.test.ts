import { describe, expect, it } from 'vitest';
import type { Player } from '../../players/types';
import { makeConstraint, makePlayer } from '../../../test/factories';
import type { Team } from '../types';
import { balanceTeams, countPositions, findViolatedConstraints, getAverageSkill } from './balanceTeams';

const levels: Player['skillLevel'][] = [5, 5, 4, 4, 3, 3, 2, 2, 1, 1];
const tenPlayers = levels.map((level, index) => makePlayer(`p${index}`, level));

function teamIds(team: Team): string[] {
  return team.players.map((player) => player.id).sort();
}

describe('balanceTeams', () => {
  it('exige au moins 2 joueurs', () => {
    expect(balanceTeams([makePlayer('a')])).toMatchObject({ ok: false });
  });

  it('forme deux équipes de 5 au même niveau moyen quand c\'est possible', () => {
    const result = balanceTeams(tenPlayers);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [teamA, teamB] = result.teams;
    expect(teamA.players).toHaveLength(5);
    expect(teamB.players).toHaveLength(5);
    expect(getAverageSkill(teamA)).toBeCloseTo(getAverageSkill(teamB));
  });

  it('accepte un nombre impair de joueurs (écart de taille de 1)', () => {
    const result = balanceTeams(tenPlayers.slice(0, 7));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.teams.map((team) => team.players.length).sort()).toEqual([3, 4]);
  });

  it('trie chaque équipe du plus fort au plus faible', () => {
    const result = balanceTeams(tenPlayers);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const team of result.teams) {
      const teamLevels = team.players.map((player) => player.skillLevel);
      expect(teamLevels).toEqual([...teamLevels].sort((a, b) => b - a));
    }
  });

  it('respecte les conditions "ensemble" et "séparés"', () => {
    // Sans conditions, les deux 5 seraient séparés.
    const constraints = [makeConstraint('p0', 'p1', 'together'), makeConstraint('p8', 'p9', 'apart')];

    for (let run = 0; run < 20; run++) {
      const result = balanceTeams(tenPlayers, constraints, { shuffle: true });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(findViolatedConstraints(result.teams, constraints)).toEqual([]);
    }
  });

  it('départage par les postes à niveau égal', () => {
    const players = [
      makePlayer('d1', 3, 'defender'),
      makePlayer('d2', 3, 'defender'),
      makePlayer('f1', 3, 'forward'),
      makePlayer('f2', 3, 'forward'),
    ];

    for (let run = 0; run < 20; run++) {
      const result = balanceTeams(players);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      for (const team of result.teams) {
        expect(countPositions(team.players)).toEqual({ defender: 1, midfielder: 0, forward: 1 });
      }
    }
  });

  it('fait passer le niveau avant les postes', () => {
    // Mettre les deux défenseurs ensemble est le seul moyen d'équilibrer les niveaux.
    const players = [
      makePlayer('d5', 5, 'defender'),
      makePlayer('d1', 1, 'defender'),
      makePlayer('f3', 3, 'forward'),
      makePlayer('f3bis', 3, 'forward'),
    ];
    const result = balanceTeams(players);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.teams.map(teamIds).sort()).toEqual([
      ['d1', 'd5'],
      ['f3', 'f3bis'],
    ]);
  });

  it('utilise le niveau fourni par getLevel', () => {
    const players = [makePlayer('a', 1), makePlayer('b', 1), makePlayer('c', 1), makePlayer('d', 1)];
    const adjusted: Record<string, number> = { a: 5, b: 5, c: 1, d: 1 };
    const result = balanceTeams(players, [], { getLevel: (player) => adjusted[player.id] });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const teamWithA = result.teams.find((team) => team.players.some((player) => player.id === 'a'))!;
    expect(teamIds(teamWithA)).not.toContain('b');
  });

  it('propose une autre répartition quand on exclut celle affichée', () => {
    const first = balanceTeams(tenPlayers);
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = balanceTeams(tenPlayers, [], { shuffle: true, exclude: first.teams });
    expect(second.ok).toBe(true);
    if (!second.ok) return;

    const firstSplit = first.teams.map(teamIds).sort();
    const secondSplit = second.teams.map(teamIds).sort();
    expect(secondSplit).not.toEqual(firstSplit);
  });

  it('signale quand aucune autre répartition n\'est possible', () => {
    const players = [makePlayer('a'), makePlayer('b')];
    const first = balanceTeams(players);
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    expect(balanceTeams(players, [], { shuffle: true, exclude: first.teams })).toMatchObject({ ok: false });
  });
});

describe('findViolatedConstraints', () => {
  const teams: [Team, Team] = [
    { id: 'a', name: 'A', players: [makePlayer('x'), makePlayer('y')] },
    { id: 'b', name: 'B', players: [makePlayer('z')] },
  ];

  it('repère une condition non respectée après un déplacement manuel', () => {
    const together = makeConstraint('x', 'z', 'together');
    const apart = makeConstraint('x', 'y', 'apart');
    const respected = makeConstraint('y', 'z', 'apart');

    expect(findViolatedConstraints(teams, [together, apart, respected])).toEqual([together, apart]);
  });

  it('ignore les joueurs qui ne sont dans aucune équipe', () => {
    expect(findViolatedConstraints(teams, [makeConstraint('x', 'absent', 'together')])).toEqual([]);
  });
});
