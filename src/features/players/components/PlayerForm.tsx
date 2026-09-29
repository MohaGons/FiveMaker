import { useState } from 'react';
import type { FormEvent } from 'react';
import type { PlayerInput } from '../hooks/usePlayers';
import type { Player, PlayerPosition } from '../types';
import { POSITION_OPTIONS } from '../utils/position';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PlayerFormProps {
  initialPlayer?: Player;
  onSubmit: (input: PlayerInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const SKILL_LEVELS = [1, 2, 3, 4, 5] as const;

export function PlayerForm({ initialPlayer, onSubmit, onCancel, isSubmitting = false }: PlayerFormProps) {
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
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="player-name">Nom</Label>
        <Input
          id="player-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex. Karim Haddad"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="player-position">Poste préféré</Label>
        <Select
          value={preferredPosition}
          onValueChange={(value) => setPreferredPosition(value as PlayerPosition)}
        >
          <SelectTrigger id="player-position" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {POSITION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <span className="text-sm leading-none font-medium">Niveau</span>
        <div className="mt-2 flex gap-2">
          {SKILL_LEVELS.map((level) => (
            <Button
              key={level}
              type="button"
              variant={skillLevel === level ? 'default' : 'outline'}
              onClick={() => setSkillLevel(level)}
              aria-pressed={skillLevel === level}
              size="icon"
              className="rounded-lg"
            >
              {level}
            </Button>
          ))}
        </div>
      </div>

      <Label className="flex items-center gap-2 text-sm font-normal">
        <Checkbox checked={isGuest} onCheckedChange={(checked) => setIsGuest(checked === true)} />
        Joueur invité (non régulier)
      </Label>

      <div className="mt-2 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-full">
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting} className="rounded-full">
          {isSubmitting ? 'Enregistrement...' : initialPlayer ? 'Enregistrer' : 'Ajouter le joueur'}
        </Button>
      </div>
    </form>
  );
}
