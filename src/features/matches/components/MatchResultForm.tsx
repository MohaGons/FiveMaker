import { useState } from 'react';
import type { FormEvent } from 'react';
import type { MatchUpdate } from '../hooks/useMatches';
import type { Match } from '../types';
import { ScoreFields } from './ScoreFields';
import { Button } from '@/components/ui/button';

interface MatchResultFormProps {
  match: Match;
  onSubmit: (update: MatchUpdate) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

/** Saisie du score d'un match programmé, qui passe alors en « joué ». */
export function MatchResultForm({ match, onSubmit, onCancel, isSubmitting = false }: MatchResultFormProps) {
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      status: 'completed',
      score: { teamA: Number(scoreA), teamB: Number(scoreB) },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <ScoreFields
        teams={match.teams}
        scoreA={scoreA}
        scoreB={scoreB}
        onScoreAChange={setScoreA}
        onScoreBChange={setScoreB}
        required
      />

      <div className="mt-2 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-full">
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting} className="rounded-full">
          {isSubmitting ? 'Enregistrement...' : 'Valider le score'}
        </Button>
      </div>
    </form>
  );
}
