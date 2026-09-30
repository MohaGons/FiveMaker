import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Team } from '../../teams/types';
import type { MatchInput } from '../hooks/useMatches';
import { fromInputValues, toDateInputValue } from '../utils/dateInput';
import { ScoreFields } from './ScoreFields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type MatchTiming = 'played' | 'upcoming';

interface SaveMatchFormProps {
  teams: [Team, Team];
  onSubmit: (input: MatchInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const TIMING_OPTIONS: { value: MatchTiming; label: string }[] = [
  { value: 'played', label: 'Match joué' },
  { value: 'upcoming', label: 'Match à venir' },
];

export function SaveMatchForm({ teams, onSubmit, onCancel, isSubmitting = false }: SaveMatchFormProps) {
  const [timing, setTiming] = useState<MatchTiming>('played');
  const [playedAt, setPlayedAt] = useState(toDateInputValue(new Date()));
  const [time, setTime] = useState('19:00');
  const [location, setLocation] = useState('');
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');

  const isUpcoming = timing === 'upcoming';

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const hasScore = !isUpcoming && scoreA.trim() !== '' && scoreB.trim() !== '';

    onSubmit({
      playedAt: fromInputValues(playedAt, isUpcoming ? time : undefined),
      location: location.trim() || undefined,
      status: isUpcoming ? 'scheduled' : 'completed',
      score: hasScore ? { teamA: Number(scoreA), teamB: Number(scoreB) } : undefined,
      teams,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div role="radiogroup" aria-label="Type de match" className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
        {TIMING_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={timing === option.value}
            onClick={() => setTiming(option.value)}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              timing === option.value
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className={cn('grid gap-3', isUpcoming && 'grid-cols-[1fr_auto]')}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="match-date">Date</Label>
          <Input
            id="match-date"
            type="date"
            value={playedAt}
            min={isUpcoming ? toDateInputValue(new Date()) : undefined}
            onChange={(event) => setPlayedAt(event.target.value)}
            required
          />
        </div>

        {isUpcoming && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="match-time">Heure</Label>
            <Input
              id="match-time"
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              required
            />
          </div>
        )}
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

      {!isUpcoming && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm leading-none font-medium">Score (optionnel)</span>
          <ScoreFields
            teams={teams}
            scoreA={scoreA}
            scoreB={scoreB}
            onScoreAChange={setScoreA}
            onScoreBChange={setScoreB}
          />
        </div>
      )}

      <div className="mt-2 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-full">
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting} className="rounded-full">
          {isSubmitting ? 'Enregistrement...' : isUpcoming ? 'Programmer le match' : 'Enregistrer le match'}
        </Button>
      </div>
    </form>
  );
}
