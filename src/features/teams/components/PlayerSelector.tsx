import type { ID } from '../../../shared/types/common';
import type { Player } from '../../players/types';
import { getPositionLabel } from '../../players/utils/position';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface PlayerSelectorProps {
  players: Player[];
  selectedIds: Set<ID>;
  onToggle: (id: ID) => void;
}

export function PlayerSelector({ players, selectedIds, onToggle }: PlayerSelectorProps) {
  return (
    <div className="divide-y rounded-xl border bg-card">
      {players.map((player) => (
        <Label key={player.id} className="flex cursor-pointer items-center gap-3 px-4 py-3 font-normal">
          <Checkbox
            checked={selectedIds.has(player.id)}
            onCheckedChange={() => onToggle(player.id)}
          />
          <span className="flex-1 truncate text-sm font-medium text-foreground">{player.name}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {getPositionLabel(player.preferredPosition)}
          </span>
          <span className="shrink-0 text-xs font-medium text-primary">Niv. {player.skillLevel}</span>
        </Label>
      ))}
    </div>
  );
}
