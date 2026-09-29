import { PlayerCard } from '../../players/components/PlayerCard';
import type { Team } from '../types';
import { getAverageSkill } from '../utils/balanceTeams';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface TeamColumnProps {
  team: Team;
  accent: 'purple' | 'orange';
}

const ACCENT_CLASSES: Record<TeamColumnProps['accent'], { badge: string; border: string }> = {
  purple: {
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300',
    border: 'ring-purple-200 dark:ring-purple-500/30',
  },
  orange: {
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
    border: 'ring-orange-200 dark:ring-orange-500/30',
  },
};

export function TeamColumn({ team, accent }: TeamColumnProps) {
  const classes = ACCENT_CLASSES[accent];

  return (
    <Card className={`p-4 ring-2 ${classes.border}`}>
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-semibold text-foreground">
          {team.name} <span className="text-sm font-normal text-muted-foreground">({team.players.length})</span>
        </h3>
        <Badge className={classes.badge}>Niveau moyen {getAverageSkill(team).toFixed(1)}</Badge>
      </div>
      <div className="flex flex-col gap-3">
        {team.players.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </Card>
  );
}
