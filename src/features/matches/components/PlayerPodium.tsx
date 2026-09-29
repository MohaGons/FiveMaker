import { Medal, Trophy } from 'lucide-react';
import type { PlayerStats } from '../utils/playerStats';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface PlayerPodiumProps {
  top3: PlayerStats[];
}

const RANK_CONFIG = {
  1: {
    icon: Trophy,
    iconClass: 'text-yellow-500',
    ring: 'ring-yellow-500/40',
    pedestal: 'h-24 bg-gradient-to-t from-yellow-500/25 to-yellow-500/5',
  },
  2: {
    icon: Medal,
    iconClass: 'text-slate-400',
    ring: 'ring-slate-400/30',
    pedestal: 'h-16 bg-gradient-to-t from-slate-400/20 to-slate-400/5',
  },
  3: {
    icon: Medal,
    iconClass: 'text-amber-700 dark:text-amber-600',
    ring: 'ring-amber-700/30',
    pedestal: 'h-10 bg-gradient-to-t from-amber-700/20 to-amber-700/5',
  },
} as const;

function PodiumStep({ stats, rank }: { stats: PlayerStats; rank: 1 | 2 | 3 }) {
  const config = RANK_CONFIG[rank];
  const Icon = config.icon;
  const decidedMatches = stats.wins + stats.draws + stats.losses;

  return (
    <div className="flex w-28 flex-col items-center sm:w-36">
      <Card className={`w-full p-3 text-center ring-2 ${config.ring} sm:p-4`}>
        <Icon className={`mx-auto h-7 w-7 ${config.iconClass} sm:h-8 sm:w-8`} />
        <p className="mt-2 truncate text-sm font-semibold text-foreground sm:text-base">{stats.name}</p>
        <p className="text-xs text-muted-foreground">
          {stats.matchesPlayed} match{stats.matchesPlayed > 1 ? 's' : ''}
        </p>
        {decidedMatches > 0 && (
          <Badge variant={stats.winRate >= 0.5 ? 'default' : 'secondary'} className="mt-2">
            {Math.round(stats.winRate * 100)}%
          </Badge>
        )}
      </Card>
      <div
        className={`mt-2 flex w-full items-center justify-center rounded-b-lg text-xl font-bold text-muted-foreground ${config.pedestal}`}
      >
        {rank}
      </div>
    </div>
  );
}

export function PlayerPodium({ top3 }: PlayerPodiumProps) {
  const entries = top3.map((stats, index) => ({ stats, rank: (index + 1) as 1 | 2 | 3 }));
  const displayOrder = [entries[1], entries[0], entries[2]].filter(
    (entry): entry is { stats: PlayerStats; rank: 1 | 2 | 3 } => entry !== undefined,
  );

  return (
    <div className="flex items-end justify-center gap-3 sm:gap-6">
      {displayOrder.map((entry) => (
        <PodiumStep key={entry.stats.playerId} stats={entry.stats} rank={entry.rank} />
      ))}
    </div>
  );
}
