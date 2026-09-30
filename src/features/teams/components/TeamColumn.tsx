import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Check } from 'lucide-react';
import type { CSSProperties } from 'react';
import { PlayerCard } from '../../players/components/PlayerCard';
import type { Player } from '../../players/types';
import type { Team } from '../types';
import { countPositions, getAverageSkill } from '../utils/balanceTeams';
import type { GetLevel } from '../utils/balanceTeams';
import { playerDropId, teamDropId } from '../utils/dropTargets';
import { DEFAULT_TEAM_COLORS, TEAM_COLOR_OPTIONS, tint } from '../utils/teamColors';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TeamColumnProps {
  index: 0 | 1;
  team: Team;
  getLevel?: GetLevel;
  /** Nom tel que saisi (peut être vide pendant la frappe), affiché dans le champ d'édition. */
  nameInput?: string;
  onNameChange?: (name: string) => void;
  onColorChange?: (color: string) => void;
}

/** Couleurs claires : la coche doit être foncée pour rester visible. */
const LIGHT_COLORS = new Set(['#f5f5f5', '#eab308']);

function DraggablePlayer({ player, level }: { player: Player; level?: number }) {
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({ id: player.id });
  // Déposer un joueur sur un autre l'échange avec lui.
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: playerDropId(player.id) });

  return (
    <div
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      {...attributes}
      {...listeners}
      className={cn(
        'cursor-grab touch-none rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing',
        isDragging && 'opacity-30',
        isOver && !isDragging && 'ring-2 ring-primary',
      )}
    >
      <PlayerCard player={player} level={level} />
    </div>
  );
}

export function TeamColumn({ index, team, getLevel, nameInput, onNameChange, onColorChange }: TeamColumnProps) {
  const color = team.color ?? DEFAULT_TEAM_COLORS[index];
  const { setNodeRef, isOver } = useDroppable({ id: teamDropId(index) });
  const positions = countPositions(team.players);

  return (
    <Card
      ref={setNodeRef}
      className={cn('p-4 ring-2 transition-colors', isOver && 'bg-muted/60')}
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
          Niveau moyen {getAverageSkill(team, getLevel).toFixed(1)}
        </Badge>
      </div>

      <p className="-mt-1 text-xs text-muted-foreground">
        {positions.defender} déf. · {positions.midfielder} mil. · {positions.forward} att.
      </p>

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

      <div className="flex min-h-16 flex-col gap-3">
        {team.players.map((player) => (
          <DraggablePlayer key={player.id} player={player} level={getLevel?.(player)} />
        ))}
      </div>
    </Card>
  );
}
