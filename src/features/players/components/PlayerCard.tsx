import type { Player } from '../types';
import { getPositionLabel } from '../utils/position';

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

function IconPencil() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

export function PlayerCard({ player, onEdit, onDelete }: PlayerCardProps) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start gap-3">
        {player.avatarUrl ? (
          <img
            src={player.avatarUrl}
            alt=""
            className="h-12 w-12 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
            {getInitials(player.name)}
          </div>
        )}

        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium text-gray-900 dark:text-gray-100">
              {player.name}
            </p>
            {player.isGuest && (
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                Invité
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {getPositionLabel(player.preferredPosition)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 pt-1" title={`Niveau ${player.skillLevel}/5`}>
          {Array.from({ length: 5 }, (_, index) => (
            <span
              key={index}
              className={`h-2 w-2 rounded-full ${
                index < player.skillLevel
                  ? 'bg-purple-500'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>

      {(onEdit || onDelete) && (
        <div className="mt-3 flex items-center justify-end gap-1 border-t border-gray-100 pt-3 dark:border-gray-800">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(player)}
              aria-label={`Modifier ${player.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <IconPencil />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(player)}
              aria-label={`Supprimer ${player.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
            >
              <IconTrash />
            </button>
          )}
        </div>
      )}
    </article>
  );
}
