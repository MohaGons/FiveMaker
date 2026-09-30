import { useState } from 'react';
import type { FormEvent } from 'react';
import type { MatchUpdate } from '../hooks/useMatches';
import type { ID } from '../../../shared/types/common';
import type { Match, MatchPlayerStats } from '../types';
import { parseScoreInput } from '../utils/scoreInput';
import { MatchPlayerStatsFields } from './MatchPlayerStatsFields';
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
  const [playerStats, setPlayerStats] = useState<Record<ID, MatchPlayerStats>>(match.playerStats);
  const [mvpPlayerId, setMvpPlayerId] = useState<ID | null>(match.mvpPlayerId ?? null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      status: 'completed',
      score: { teamA: Number(scoreA), teamB: Number(scoreB) },
      playerStats,
      mvpPlayerId,
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
