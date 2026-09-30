import type { ReactNode } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { Player } from '../types';
import { getPositionLabel } from '../utils/position';
import { PlayerAvatar } from './PlayerAvatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface PlayerCardProps {
  player: Player;
  onEdit?: (player: Player) => void;
  onDelete?: (player: Player) => void;
  /** Niveau ajusté selon les résultats, affiché à la place du niveau de la fiche. */
  level?: number;
  /** Fiche du compte connecté. */
  isMe?: boolean;
  /** Action affichée à gauche du pied de carte (ex. « C'est moi »). */
  footerAction?: ReactNode;
}

export function PlayerCard({ player, onEdit, onDelete, level, isMe = false, footerAction }: PlayerCardProps) {
  const displayedLevel = level ?? player.skillLevel;

  return (
    <Card className="p-4 transition hover:shadow-md">
      <div className="flex items-start gap-3">
        <PlayerAvatar name={player.name} avatarUrl={player.avatarUrl} />

        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium text-foreground">{player.name}</p>
            {isMe && <Badge>Toi</Badge>}
            {player.isGuest && <Badge variant="secondary">Invité</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{getPositionLabel(player.preferredPosition)}</p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 pt-1" title={`Niveau ${level === undefined ? displayedLevel : displayedLevel.toFixed(1)}/5`}>
          {Array.from({ length: 5 }, (_, index) => (
            <span
              key={index}
              className={`h-2 w-2 rounded-full ${index < Math.round(displayedLevel) ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>
      </div>

      {(onEdit || onDelete || footerAction) && (
        <div className="mt-3 flex items-center gap-1 border-t pt-3">
          <div className="mr-auto">{footerAction}</div>
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
