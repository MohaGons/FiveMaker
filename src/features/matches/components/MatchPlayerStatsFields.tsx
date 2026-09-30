import { Minus, Plus, Star } from 'lucide-react';
import type { ID } from '../../../shared/types/common';
import type { Player } from '../../players/types';
import type { Team } from '../../teams/types';
import type { MatchPlayerStats } from '../types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MatchPlayerStatsFieldsProps {
  teams: [Team, Team];
  value: Record<ID, MatchPlayerStats>;
  onChange: (value: Record<ID, MatchPlayerStats>) => void;
  mvpPlayerId: ID | null;
  onMvpChange: (playerId: ID | null) => void;
  /** Score saisi, pour indiquer combien de buts restent à attribuer. */
  goalsScored?: [number | null, number | null];
}

const EMPTY_STATS: MatchPlayerStats = { goals: 0, assists: 0 };

interface StepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

function Stepper({ label, value, onChange }: StepperProps) {
  return (
    <div className="flex items-center gap-0.5" role="group" aria-label={label}>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value === 0}
        aria-label={`Retirer 1 (${label})`}
      >
        <Minus />
      </Button>
      <span className={cn('w-5 text-center text-sm tabular-nums', value === 0 && 'text-muted-foreground')}>
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => onChange(value + 1)}
        aria-label={`Ajouter 1 (${label})`}
      >
        <Plus />
      </Button>
    </div>
  );
}

/** Buts, passes décisives et homme du match, joueur par joueur, pour un match joué. */
export function MatchPlayerStatsFields({
  teams,
  value,
  onChange,
  mvpPlayerId,
  onMvpChange,
  goalsScored,
}: MatchPlayerStatsFieldsProps) {
  function update(player: Player, change: Partial<MatchPlayerStats>) {
    const next = { ...(value[player.id] ?? EMPTY_STATS), ...change };
    const { [player.id]: _removed, ...others } = value;
    // On ne garde que les joueurs ayant contribué, pour un JSON compact.
    onChange(next.goals === 0 && next.assists === 0 ? others : { ...others, [player.id]: next });
  }

  return (
    <div className="flex flex-col gap-4">
      {teams.map((team, index) => {
        const assignedGoals = team.players.reduce((sum, player) => sum + (value[player.id]?.goals ?? 0), 0);
        const teamGoals = goalsScored?.[index];

        return (
          <div key={team.id}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-foreground">{team.name}</p>
              {teamGoals != null && (
                <p
                  className={cn(
                    'text-xs',
                    assignedGoals > teamGoals ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground',
                  )}
                >
                  {assignedGoals}/{teamGoals} but{teamGoals > 1 ? 's' : ''} attribué{assignedGoals > 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-2 text-xs text-muted-foreground">
              <span />
              <span className="text-center">Buts</span>
              <span className="text-center">Passes</span>
              <span className="sr-only">Homme du match</span>

              {team.players.map((player) => {
                const stats = value[player.id] ?? EMPTY_STATS;
                const isMvp = mvpPlayerId === player.id;

                return (
                  <div key={player.id} className="contents">
                    <span className="truncate text-sm text-foreground">{player.name}</span>
                    <Stepper
                      label={`Buts de ${player.name}`}
                      value={stats.goals}
                      onChange={(goals) => update(player, { goals })}
                    />
                    <Stepper
                      label={`Passes de ${player.name}`}
                      value={stats.assists}
                      onChange={(assists) => update(player, { assists })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onMvpChange(isMvp ? null : player.id)}
                      aria-pressed={isMvp}
                      aria-label={`Homme du match : ${player.name}`}
                      title="Homme du match"
                    >
                      <Star className={cn(isMvp ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground')} />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <Star className="h-3 w-3" /> Clique sur l'étoile pour désigner l'homme du match.
      </p>
    </div>
  );
}
