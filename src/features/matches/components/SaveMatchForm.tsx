import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Team } from '../../teams/types';
import type { MatchInput } from '../hooks/useMatches';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SaveMatchFormProps {
  teams: [Team, Team];
  onSubmit: (input: MatchInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export function SaveMatchForm({ teams, onSubmit, onCancel, isSubmitting = false }: SaveMatchFormProps) {
  const [playedAt, setPlayedAt] = useState(todayInputValue());
  const [location, setLocation] = useState('');
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const hasScore = scoreA.trim() !== '' && scoreB.trim() !== '';

    onSubmit({
      playedAt: new Date(playedAt),
      location: location.trim() || undefined,
      status: 'completed',
      score: hasScore ? { teamA: Number(scoreA), teamB: Number(scoreB) } : undefined,
      teams,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="match-date">Date</Label>
        <Input
          id="match-date"
          type="date"
          value={playedAt}
          onChange={(event) => setPlayedAt(event.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="match-location">Lieu (optionnel)</Label>
        <Input
          id="match-location"
          type="text"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Ex. Stade des Fontaines"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm leading-none font-medium">Score (optionnel)</span>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={0}
            value={scoreA}
            onChange={(event) => setScoreA(event.target.value)}
            placeholder={teams[0].name}
            aria-label={`Score ${teams[0].name}`}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            min={0}
            value={scoreB}
            onChange={(event) => setScoreB(event.target.value)}
            placeholder={teams[1].name}
            aria-label={`Score ${teams[1].name}`}
          />
        </div>
      </div>

      <div className="mt-2 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-full">
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting} className="rounded-full">
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer le match'}
        </Button>
      </div>
    </form>
  );
}
