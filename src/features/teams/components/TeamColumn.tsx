import { Check } from 'lucide-react';
import type { CSSProperties } from 'react';
import { PlayerCard } from '../../players/components/PlayerCard';
import type { Team } from '../types';
import { getAverageSkill } from '../utils/balanceTeams';
import { DEFAULT_TEAM_COLORS, TEAM_COLOR_OPTIONS, tint } from '../utils/teamColors';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TeamColumnProps {
  team: Team;
  /** Nom tel que saisi (peut être vide pendant la frappe), affiché dans le champ d'édition. */
  nameInput?: string;
  onNameChange?: (name: string) => void;
  onColorChange?: (color: string) => void;
}

/** Couleurs claires : la coche doit être foncée pour rester visible. */
const LIGHT_COLORS = new Set(['#f5f5f5', '#eab308']);

export function TeamColumn({ team, nameInput, onNameChange, onColorChange }: TeamColumnProps) {
  const color = team.color ?? DEFAULT_TEAM_COLORS[0];

  return (
    <Card
      className="p-4 ring-2"
      style={{ '--tw-ring-color': tint(color, 45) } as CSSProperties}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-foreground/20"
            style={{ backgroundColor: color }}
          />
          {onNameChange ? (
            <input
              type="text"
              value={nameInput ?? team.name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder={team.name}
              maxLength={30}
              aria-label="Nom de l'équipe"
              className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-0.5 font-semibold text-foreground outline-none hover:border-input focus:border-ring"
            />
          ) : (
            <h3 className="truncate font-semibold text-foreground">{team.name}</h3>
          )}
          <span className="shrink-0 text-sm text-muted-foreground">({team.players.length})</span>
        </div>
        <Badge className="shrink-0 text-foreground" style={{ backgroundColor: tint(color, 18) }}>
          Niveau moyen {getAverageSkill(team).toFixed(1)}
        </Badge>
      </div>

      {onColorChange && (
        <div role="radiogroup" aria-label="Couleur de l'équipe" className="flex flex-wrap gap-1.5">
          {TEAM_COLOR_OPTIONS.map((option) => {
            const isSelected = option.value === color;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={option.label}
                title={option.label}
                onClick={() => onColorChange(option.value)}
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full ring-1 ring-foreground/20 transition-transform hover:scale-110',
                  isSelected && 'ring-2 ring-foreground ring-offset-2 ring-offset-card',
                )}
                style={{ backgroundColor: option.value }}
              >
                {isSelected && (
                  <Check
                    className={cn('h-3.5 w-3.5', LIGHT_COLORS.has(option.value) ? 'text-neutral-900' : 'text-white')}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {team.players.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </Card>
  );
}
