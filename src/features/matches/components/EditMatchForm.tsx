import { useState } from 'react';
import type { FormEvent } from 'react';
import type { MatchUpdate } from '../hooks/useMatches';
import type { ID } from '../../../shared/types/common';
import type { Match, MatchPlayerStats } from '../types';
import { fromInputValues, toDateInputValue, toTimeInputValue } from '../utils/dateInput';
import { parseScoreInput } from '../utils/scoreInput';
import { MatchPlayerStatsFields } from './MatchPlayerStatsFields';
import { ScoreFields } from './ScoreFields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface EditMatchFormProps {
  match: Match;
  onSubmit: (update: MatchUpdate) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function EditMatchForm({ match, onSubmit, onCancel, isSubmitting = false }: EditMatchFormProps) {
  const [date, setDate] = useState(toDateInputValue(match.playedAt));
  const [time, setTime] = useState(toTimeInputValue(match.playedAt));
  const [location, setLocation] = useState(match.location ?? '');
  const [scoreA, setScoreA] = useState(match.score ? String(match.score.teamA) : '');
  const [scoreB, setScoreB] = useState(match.score ? String(match.score.teamB) : '');
  const [playerStats, setPlayerStats] = useState<Record<ID, MatchPlayerStats>>(match.playerStats);
  const [mvpPlayerId, setMvpPlayerId] = useState<ID | null>(match.mvpPlayerId ?? null);

  // Seuls les matchs à venir ont une heure ; seuls les matchs joués ont un score.
  const isScheduled = match.status === 'scheduled';
  const isCompleted = match.status === 'completed';

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const hasScore = scoreA.trim() !== '' && scoreB.trim() !== '';

    onSubmit({
      playedAt: fromInputValues(date, isScheduled ? time : undefined),
      location: location.trim() || null,
      ...(isCompleted && {
        score: hasScore ? { teamA: Number(scoreA), teamB: Number(scoreB) } : null,
        playerStats,
        mvpPlayerId,
      }),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className={cn('grid gap-3', isScheduled && 'grid-cols-[1fr_auto]')}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-match-date">Date</Label>
          <Input
            id="edit-match-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </div>

        {isScheduled && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-match-time">Heure</Label>
            <Input
              id="edit-match-time"
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              required
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-match-location">Lieu (optionnel)</Label>
        <Input
          id="edit-match-location"
          type="text"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Ex. Stade des Fontaines"
        />
      </div>

      {isCompleted && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm leading-none font-medium">Score (optionnel)</span>
          <ScoreFields
            teams={match.teams}
            scoreA={scoreA}
            scoreB={scoreB}
            onScoreAChange={setScoreA}
            onScoreBChange={setScoreB}
          />
        </div>
      )}

      {isCompleted && (
        <div className="border-t pt-4">
          <p className="mb-3 text-sm font-medium text-foreground">Buteurs & passeurs (optionnel)</p>
          <MatchPlayerStatsFields
            teams={match.teams}
            value={playerStats}
            onChange={setPlayerStats}
            mvpPlayerId={mvpPlayerId}
            onMvpChange={setMvpPlayerId}
            goalsScored={[parseScoreInput(scoreA), parseScoreInput(scoreB)]}
          />
        </div>
      )}

      <div className="mt-2 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-full">
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting} className="rounded-full">
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
}
