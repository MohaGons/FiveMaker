import { useState } from 'react';
import { Link2, Plus, Unlink2, X } from 'lucide-react';
import type { Player } from '../../players/types';
import type { ID } from '../../../shared/types/common';
import type { PairingConstraint, PairingRule } from '../types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface PairingConstraintsPanelProps {
  players: Player[];
  selectedIds: Set<ID>;
  constraints: PairingConstraint[];
  /** Absents en consultation seule (membre sans droits). */
  onAdd?: (playerIds: [ID, ID], rule: PairingRule) => void;
  onRemove?: (id: ID) => void;
}

const RULE_OPTIONS: { value: PairingRule; label: string }[] = [
  { value: 'together', label: 'Ensemble' },
  { value: 'apart', label: 'Séparés' },
];

interface PlayerSelectProps {
  label: string;
  players: Player[];
  value: ID | null;
  onChange: (id: ID | null) => void;
}

function PlayerSelect({ label, players, value, onChange }: PlayerSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next as ID | null)}
      items={players.map((player) => ({ value: player.id, label: player.name }))}
    >
      <SelectTrigger aria-label={label} className="w-full min-w-0">
        <SelectValue placeholder="Joueur" />
      </SelectTrigger>
      <SelectContent>
        {players.map((player) => (
          <SelectItem key={player.id} value={player.id}>
            {player.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function PairingConstraintsPanel({
  players,
  selectedIds,
  constraints,
  onAdd,
  onRemove,
}: PairingConstraintsPanelProps) {
  const [firstId, setFirstId] = useState<ID | null>(null);
  const [secondId, setSecondId] = useState<ID | null>(null);
  const [rule, setRule] = useState<PairingRule>('together');

  const playersById = new Map(players.map((player) => [player.id, player]));
  const presentPlayers = players.filter((player) => selectedIds.has(player.id));
  // Les conditions visant un joueur supprimé ne sont plus affichées.
  const visibleConstraints = constraints.filter((constraint) =>
    constraint.playerIds.every((id) => playersById.has(id)),
  );
  const canAdd = firstId !== null && secondId !== null && firstId !== secondId;

  function handleAdd() {
    if (!canAdd || !onAdd) return;
    onAdd([firstId, secondId], rule);
    setFirstId(null);
    setSecondId(null);
  }

  return (
    <div className="mt-6">
      <h2 className="font-semibold text-foreground">Conditions</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {onAdd
          ? "Force deux joueurs à jouer ensemble ou l'un contre l'autre."
          : visibleConstraints.length > 0
            ? "Joueurs qui doivent jouer ensemble ou l'un contre l'autre."
            : 'Aucune condition pour ce match.'}
      </p>

      {onAdd && (
        <div className="mt-3 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <PlayerSelect label="Premier joueur" players={presentPlayers} value={firstId} onChange={setFirstId} />
            <PlayerSelect
              label="Second joueur"
              players={presentPlayers.filter((player) => player.id !== firstId)}
              value={secondId}
              onChange={setSecondId}
            />
          </div>

          <div className="flex gap-2">
            {RULE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={rule === option.value ? 'default' : 'outline'}
                onClick={() => setRule(option.value)}
                className="flex-1 rounded-full"
              >
                {option.label}
              </Button>
            ))}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleAdd}
              disabled={!canAdd}
              aria-label="Ajouter la condition"
              className="rounded-full"
            >
              <Plus />
            </Button>
          </div>
        </div>
      )}

      {visibleConstraints.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {visibleConstraints.map((constraint) => {
            const [a, b] = constraint.playerIds;
            const isActive = selectedIds.has(a) && selectedIds.has(b);
            const Icon = constraint.rule === 'together' ? Link2 : Unlink2;

            return (
              <li
                key={constraint.id}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
                  !isActive && 'opacity-60',
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0',
                    constraint.rule === 'together' ? 'text-primary' : 'text-orange-600 dark:text-orange-400',
                  )}
                />
                <span className="min-w-0 flex-1 truncate text-foreground">
                  {playersById.get(a)?.name}
                  <span className="text-muted-foreground">
                    {constraint.rule === 'together' ? ' avec ' : ' contre '}
                  </span>
                  {playersById.get(b)?.name}
                  {!isActive && <span className="text-xs text-muted-foreground"> · joueur absent</span>}
                </span>
                {onRemove && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onRemove(constraint.id)}
                    aria-label="Supprimer la condition"
                    className="shrink-0"
                  >
                    <X />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
