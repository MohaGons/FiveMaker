import { useState } from 'react';
import { ArrowDown, ArrowUp, Check, Search, X } from 'lucide-react';
import type { ID } from '../../../shared/types/common';
import type { Player } from '../../players/types';
import { getPositionLabel } from '../../players/utils/position';
import type { GetLevel } from '../utils/balanceTeams';
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
  /** Niveau ajusté selon les résultats ; sinon le niveau de la fiche est affiché. */
  getLevel?: GetLevel;
  /** Consultation seule (membre sans droits) : les cases ne sont pas cochables. */
  readOnly?: boolean;
  /** Réponses au sondage de présence (true : il vient). */
  responseById?: Map<ID, boolean>;
}

/** En dessous, l'écart avec le niveau de la fiche n'est pas signalé. */
const LEVEL_TREND_THRESHOLD = 0.05;

function LevelLabel({ player, getLevel }: { player: Player; getLevel?: GetLevel }) {
  if (!getLevel) {
    return <span className="shrink-0 text-xs font-medium text-primary">Niv. {player.skillLevel}</span>;
  }

  const level = getLevel(player);
  const trend = level - player.skillLevel;

  return (
    <span
      className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary"
      title={`Niveau de la fiche : ${player.skillLevel}`}
    >
      {trend >= LEVEL_TREND_THRESHOLD && <ArrowUp className="h-3 w-3 text-green-600 dark:text-green-400" />}
      {trend <= -LEVEL_TREND_THRESHOLD && <ArrowDown className="h-3 w-3 text-red-600 dark:text-red-400" />}
      Niv. {level.toFixed(1)}
    </span>
  );
}

function ResponseIcon({ response }: { response: boolean | undefined }) {
  if (response === true) {
    return <Check aria-label="A dit qu'il venait" className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />;
  }
  if (response === false) {
    return <X aria-label="A dit qu'il ne venait pas" className="h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400" />;
  }
  return null;
}

export function PlayerSelector({
  players,
  selectedIds,
  onToggle,
  selectionLimitReached = false,
  readOnly = false,
  getLevel,
  responseById,
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
            const isLimitReached = !isSelected && selectionLimitReached;
            const isDisabled = readOnly || isLimitReached;

            return (
              <Label
                key={player.id}
                className={`flex h-11 shrink-0 items-center gap-3 px-4 font-normal ${
                  readOnly ? 'cursor-default' : isLimitReached ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                }`}
              >
                <Checkbox checked={isSelected} disabled={isDisabled} onCheckedChange={() => onToggle(player.id)} />
                <span className="flex min-w-0 flex-1 items-center gap-1.5">
                  <span className="truncate text-sm font-medium text-foreground">{player.name}</span>
                  <ResponseIcon response={responseById?.get(player.id)} />
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {getPositionLabel(player.preferredPosition)}
                </span>
                <LevelLabel player={player} getLevel={getLevel} />
              </Label>
            );
          })}
        </div>
      )}
    </div>
  );
}
