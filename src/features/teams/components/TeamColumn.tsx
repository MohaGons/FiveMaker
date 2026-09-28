import { PlayerCard } from '../../players/components/PlayerCard';
import type { Team } from '../types';
import { getAverageSkill } from '../utils/balanceTeams';

interface TeamColumnProps {
  team: Team;
  accent: 'purple' | 'orange';
}

const ACCENT_CLASSES: Record<TeamColumnProps['accent'], { badge: string; border: string }> = {
  purple: {
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-500/30',
  },
  orange: {
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-500/30',
  },
};

export function TeamColumn({ team, accent }: TeamColumnProps) {
  const classes = ACCENT_CLASSES[accent];

  return (
    <div className={`rounded-2xl border ${classes.border} bg-white p-4 dark:bg-gray-900`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          {team.name} <span className="text-sm font-normal text-gray-400">({team.players.length})</span>
        </h3>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${classes.badge}`}>
          Niveau moyen {getAverageSkill(team).toFixed(1)}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {team.players.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
}
