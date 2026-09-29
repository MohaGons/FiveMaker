import { Pencil, Trash2 } from 'lucide-react';
import type { Player } from '../types';
import { getPositionLabel } from '../utils/position';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface PlayerCardProps {
  player: Player;
  onEdit?: (player: Player) => void;
  onDelete?: (player: Player) => void;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function PlayerCard({ player, onEdit, onDelete }: PlayerCardProps) {
  return (
    <Card className="p-4 transition hover:shadow-md">
      <div className="flex items-start gap-3">
        {player.avatarUrl ? (
          <img
            src={player.avatarUrl}
            alt=""
            className="h-12 w-12 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {getInitials(player.name)}
          </div>
        )}

        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium text-foreground">{player.name}</p>
            {player.isGuest && <Badge variant="secondary">Invité</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{getPositionLabel(player.preferredPosition)}</p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 pt-1" title={`Niveau ${player.skillLevel}/5`}>
          {Array.from({ length: 5 }, (_, index) => (
            <span
              key={index}
              className={`h-2 w-2 rounded-full ${index < player.skillLevel ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>
      </div>

      {(onEdit || onDelete) && (
        <div className="mt-3 flex items-center justify-end gap-1 border-t pt-3">
          {onEdit && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(player)}
              aria-label={`Modifier ${player.name}`}
            >
              <Pencil />
            </Button>
          )}
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(player)}
              aria-label={`Supprimer ${player.name}`}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 />
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
