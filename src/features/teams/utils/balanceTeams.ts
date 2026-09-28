import type { Player } from '../../players/types';
import type { Team } from '../types';

export function getAverageSkill(team: Team): number {
  if (team.players.length === 0) return 0;
  const total = team.players.reduce((sum, player) => sum + player.skillLevel, 0);
  return total / team.players.length;
}

/**
 * Répartit les joueurs en deux équipes de taille équivalente (écart max. de 1),
 * en équilibrant le niveau total quand les effectifs sont à égalité.
 * Les gardiens sont répartis un par équipe en priorité, s'il y en a au moins deux.
 */
export function balanceTeams(players: Player[]): [Team, Team] {
  const teamAPlayers: Player[] = [];
  const teamBPlayers: Player[] = [];
  let totalA = 0;
  let totalB = 0;

  function assign(player: Player, toTeamA: boolean): void {
    if (toTeamA) {
      teamAPlayers.push(player);
      totalA += player.skillLevel;
    } else {
      teamBPlayers.push(player);
      totalB += player.skillLevel;
    }
  }

  const goalkeepers = players
    .filter((player) => player.preferredPosition === 'goalkeeper')
    .sort((a, b) => b.skillLevel - a.skillLevel);
  const outfieldPlayers = players.filter((player) => player.preferredPosition !== 'goalkeeper');

  const extraGoalkeepers = goalkeepers.slice(2);
  if (goalkeepers[0]) assign(goalkeepers[0], true);
  if (goalkeepers[1]) assign(goalkeepers[1], false);

  const remainingPlayers = [...outfieldPlayers, ...extraGoalkeepers].sort(
    (a, b) => b.skillLevel - a.skillLevel,
  );

  for (const player of remainingPlayers) {
    const countDiff = teamAPlayers.length - teamBPlayers.length;
    const assignToA = countDiff !== 0 ? countDiff < 0 : totalA <= totalB;
    assign(player, assignToA);
  }

  return [
    { id: crypto.randomUUID(), name: 'Équipe A', players: teamAPlayers },
    { id: crypto.randomUUID(), name: 'Équipe B', players: teamBPlayers },
  ];
}
