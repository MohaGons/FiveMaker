import type { ID } from '../../../shared/types/common';
import type { Player } from '../../players/types';
import { getPositionLabel } from '../../players/utils/position';

interface PlayerSelectorProps {
  players: Player[];
  selectedIds: Set<ID>;
  onToggle: (id: ID) => void;
}

export function PlayerSelector({ players, selectedIds, onToggle }: PlayerSelectorProps) {
  return (
    <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
      {players.map((player) => (
        <label
          key={player.id}
          className="flex cursor-pointer items-center gap-3 px-4 py-3"
        >
          <input
            type="checkbox"
            checked={selectedIds.has(player.id)}
            onChange={() => onToggle(player.id)}
            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 dark:border-gray-700"
          />
          <span className="flex-1 truncate text-sm font-medium text-gray-900 dark:text-gray-100">
            {player.name}
          </span>
          <span className="shrink-0 text-xs text-gray-400">
            {getPositionLabel(player.preferredPosition)}
          </span>
          <span className="shrink-0 text-xs font-medium text-purple-600 dark:text-purple-400">
            Niv. {player.skillLevel}
          </span>
        </label>
      ))}
    </div>
  );
}
