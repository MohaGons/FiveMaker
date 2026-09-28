import { useState } from 'react';
import type { FormEvent } from 'react';
import type { PlayerInput } from '../hooks/usePlayers';
import type { Player, PlayerPosition } from '../types';
import { POSITION_OPTIONS } from '../utils/position';

interface PlayerFormProps {
  initialPlayer?: Player;
  onSubmit: (input: PlayerInput) => void;
  onCancel: () => void;
}

const SKILL_LEVELS = [1, 2, 3, 4, 5] as const;

const inputClassName =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100';

const labelClassName = 'block text-sm font-medium text-gray-700 dark:text-gray-300';

export function PlayerForm({ initialPlayer, onSubmit, onCancel }: PlayerFormProps) {
  const [name, setName] = useState(initialPlayer?.name ?? '');
  const [skillLevel, setSkillLevel] = useState<Player['skillLevel']>(initialPlayer?.skillLevel ?? 3);
  const [preferredPosition, setPreferredPosition] = useState<PlayerPosition>(
    initialPlayer?.preferredPosition ?? 'midfielder',
  );
  const [isGuest, setIsGuest] = useState(initialPlayer?.isGuest ?? false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) return;

    onSubmit({ name: trimmedName, skillLevel, preferredPosition, isGuest });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="player-name" className={labelClassName}>
          Nom
        </label>
        <input
          id="player-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex. Karim Haddad"
          required
          className={`mt-1 ${inputClassName}`}
        />
      </div>

      <div>
        <label htmlFor="player-position" className={labelClassName}>
          Poste préféré
        </label>
        <select
          id="player-position"
          value={preferredPosition}
          onChange={(event) => setPreferredPosition(event.target.value as PlayerPosition)}
          className={`mt-1 ${inputClassName}`}
        >
          {POSITION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className={labelClassName}>Niveau</span>
        <div className="mt-2 flex gap-2">
          {SKILL_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setSkillLevel(level)}
              aria-pressed={skillLevel === level}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition ${
                skillLevel === level
                  ? 'border-purple-600 bg-purple-600 text-white'
                  : 'border-gray-300 text-gray-600 hover:border-purple-400 dark:border-gray-700 dark:text-gray-300'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={isGuest}
          onChange={(event) => setIsGuest(event.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 dark:border-gray-700"
        />
        Joueur invité (non régulier)
      </label>

      <div className="mt-2 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400 dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-600"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
        >
          {initialPlayer ? 'Enregistrer' : 'Ajouter le joueur'}
        </button>
      </div>
    </form>
  );
}
