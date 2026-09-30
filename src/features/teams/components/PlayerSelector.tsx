import { useState } from 'react';
import { Search } from 'lucide-react';
import type { ID } from '../../../shared/types/common';
import type { Player } from '../../players/types';
import { getPositionLabel } from '../../players/utils/position';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** Au-delà, la liste défile pour ne pas repousser le reste de la page. */
const VISIBLE_ROWS = 10;
/** Hauteur d'une ligne (h-11 = 2.75rem), à garder synchronisée avec la classe des lignes. */
const ROW_HEIGHT_REM = 2.75;
// Lignes + séparateurs entre elles + bordures haut/bas du conteneur (1px chacun).
const LIST_MAX_HEIGHT = `calc(${VISIBLE_ROWS} * ${ROW_HEIGHT_REM}rem + ${VISIBLE_ROWS + 1}px)`;

/** Minuscules sans accents, pour que "helene" trouve "Hélène". */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

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
  const [query, setQuery] = useState('');
  const normalizedQuery = normalize(query);
  const visiblePlayers = normalizedQuery
    ? players.filter((player) => normalize(player.name).includes(normalizedQuery))
    : players;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher un joueur"
          aria-label="Rechercher un joueur"
          className="pl-8"
        />
      </div>

      {visiblePlayers.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          Aucun joueur ne correspond à « {query.trim()} ».
        </p>
      ) : (
        <div
          className="divide-y overflow-y-auto overscroll-contain rounded-xl border bg-card"
          style={{ maxHeight: LIST_MAX_HEIGHT }}
        >
          {visiblePlayers.map((player) => {
            const isSelected = selectedIds.has(player.id);
            const isDisabled = !isSelected && selectionLimitReached;

            return (
              <Label
                key={player.id}
                className={`flex h-11 shrink-0 items-center gap-3 px-4 font-normal ${
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
      )}
    </div>
  );
}
