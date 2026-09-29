import type { ID } from '../../../shared/types/common';
import type { Player } from '../../players/types';
import { getPositionLabel } from '../../players/utils/position';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface PlayerSelectorProps {
  players: Player[];
  selectedIds: Set<ID>;
  onToggle: (id: ID) => void;
  selectionLimitReached?: boolean;
}

export function PlayerSelector({
  players,
  selectedIds,
  onToggle,
  selectionLimitReached = false,
}: PlayerSelectorProps) {
  return (
    <div className="divide-y rounded-xl border bg-card">
      {players.map((player) => {
        const isSelected = selectedIds.has(player.id);
        const isDisabled = !isSelected && selectionLimitReached;

        return (
          <Label
            key={player.id}
            className={`flex items-center gap-3 px-4 py-3 font-normal ${
              isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            }`}
          >
            <Checkbox checked={isSelected} disabled={isDisabled} onCheckedChange={() => onToggle(player.id)} />
            <span className="flex-1 truncate text-sm font-medium text-foreground">{player.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {getPositionLabel(player.preferredPosition)}
            </span>
            <span className="shrink-0 text-xs font-medium text-primary">Niv. {player.skillLevel}</span>
          </Label>
        );
      })}
    </div>
  );
}
