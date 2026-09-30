import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Star } from 'lucide-react';
import type { ID } from '../../../shared/types/common';
import { fetchMyRatings } from '../api/ratingsApi';
import type { Match } from '../types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MatchRatingFormProps {
  match: Match;
  /** Fiche du votant : il ne se note pas lui-même. */
  myPlayerId: ID;
  onSubmit: (ratings: Record<ID, number | null>) => Promise<void>;
  onCancel: () => void;
}

const SCORES = [1, 2, 3, 4, 5] as const;
const SCORE_LABELS: Record<number, string> = {
  1: 'Pas son jour',
  2: 'Moyen',
  3: 'Correct',
  4: 'Bon match',
  5: 'Énorme',
};

const CLOSE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

interface StarRatingProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}

function StarRating({ label, value, onChange }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const shown = hovered ?? value ?? 0;

  return (
    <div role="radiogroup" aria-label={label} className="flex" onPointerLeave={() => setHovered(null)}>
      {SCORES.map((score) => (
        <button
          key={score}
          type="button"
          role="radio"
          aria-checked={value === score}
          aria-label={`${score} sur 5`}
          // Recliquer sur la note actuelle la retire.
          onClick={() => onChange(value === score ? null : score)}
          onPointerEnter={() => setHovered(score)}
          className="rounded p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Star
            className={cn(
              'h-6 w-6 transition-colors',
              score <= shown ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground/40',
            )}
          />
        </button>
      ))}
    </div>
  );
}

/** Notes (1 à 5) du votant pour les autres joueurs du match, modifiables jusqu'à la clôture. */
export function MatchRatingForm({ match, myPlayerId, onSubmit, onCancel }: MatchRatingFormProps) {
  const [ratings, setRatings] = useState<Record<ID, number | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchMyRatings(match.id)
      .then((mine) => {
        if (isMounted) setRatings(mine);
      })
      .catch((err: Error) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [match.id]);

  const ratedCount = Object.values(ratings).filter((score) => score !== null).length;
  const othersCount = match.teams.reduce(
    (sum, team) => sum + team.players.filter((player) => player.id !== myPlayerId).length,
    0,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(ratings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible.');
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement de tes notes...</p>;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Tes notes restent anonymes : chacun ne verra que sa moyenne, à la fin des votes
        {match.ratingsCloseAt && ` (${CLOSE_FORMATTER.format(match.ratingsCloseAt)})`}.
      </p>

      {match.teams.map((team) => {
        const others = team.players.filter((player) => player.id !== myPlayerId);
        if (others.length === 0) return null;

        return (
          <div key={team.id}>
            <p className="mb-1 text-sm font-medium text-foreground">{team.name}</p>
            <ul className="divide-y">
              {others.map((player) => {
                const score = ratings[player.id] ?? null;
                // Nom à gauche (tronqué si besoin), étoiles à droite : la ligne ne se coupe jamais.
                return (
                  <li key={player.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-1.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-foreground" title={player.name}>
                        {player.name}
                      </p>
                      {score !== null && <p className="text-xs text-muted-foreground">{SCORE_LABELS[score]}</p>}
                    </div>
                    <StarRating
                      label={`Note de ${player.name}`}
                      value={score}
                      onChange={(next) => setRatings((current) => ({ ...current, [player.id]: next }))}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="mt-2 flex flex-wrap items-center justify-end gap-3">
        <span className="mr-auto whitespace-nowrap text-xs text-muted-foreground tabular-nums">
          {ratedCount}/{othersCount} joueur{othersCount > 1 ? 's' : ''} noté{ratedCount > 1 ? 's' : ''}
        </span>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onCancel} className="rounded-full">
            Annuler
          </Button>
          {/* Même si toutes les notes ont été retirées, il faut pouvoir enregistrer ce retrait. */}
          <Button
            type="submit"
            disabled={isSubmitting || Object.keys(ratings).length === 0}
            className="rounded-full"
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer mes notes'}
          </Button>
        </div>
      </div>
    </form>
  );
}
