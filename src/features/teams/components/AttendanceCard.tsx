import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Check, MapPin, X } from 'lucide-react';
import type { Match } from '../../matches/types';
import type { Player } from '../../players/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

interface AttendanceCardProps {
  /** Fiche du compte connecté, s'il a indiqué laquelle est la sienne. */
  myPlayer: Player | null;
  /** Réponse déjà donnée au sondage (undefined : pas encore répondu). */
  myResponse: boolean | undefined;
  isInLineup: boolean;
  /** Place dans la liste d'attente, à partir de 1 (0 : pas en attente). */
  waitlistPosition: number;
  lineupCount: number;
  maxPlayers: number;
  /** Prochain match programmé, s'il y en a un. */
  nextMatch?: Match;
  onRespond: (attending: boolean) => Promise<void>;
}

function statusMessage({
  myResponse,
  isInLineup,
  waitlistPosition,
  lineupCount,
  maxPlayers,
}: Omit<AttendanceCardProps, 'myPlayer' | 'nextMatch' | 'onRespond'>): string {
  if (isInLineup) return `Tu es dans la composition (${lineupCount}/${maxPlayers}).`;
  if (waitlistPosition > 0) {
    return `La composition est complète : tu es ${waitlistPosition === 1 ? '1er' : `${waitlistPosition}e`} sur la liste d'attente. Tu passeras dedans si quelqu'un se désiste.`;
  }
  if (myResponse === false) return "C'est noté, tu ne viens pas.";
  return `Tu n'as pas encore répondu (${lineupCount}/${maxPlayers} inscrits).`;
}

/** Sondage de présence : chaque membre dit s'il vient au prochain match. */
export function AttendanceCard(props: AttendanceCardProps) {
  const { myPlayer, myResponse, nextMatch, onRespond } = props;
  const [pending, setPending] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRespond(attending: boolean) {
    setPending(attending);
    setError(null);
    try {
      await onRespond(attending);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Réponse impossible à enregistrer.');
    } finally {
      setPending(null);
    }
  }

  return (
    <Card className="gap-3 p-5">
      <div>
        <h2 className="font-semibold text-foreground">Tu viens au prochain match ?</h2>
        {nextMatch && (
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1 first-letter:uppercase">
              <CalendarDays className="h-4 w-4" />
              {DATE_FORMATTER.format(nextMatch.playedAt)}
            </span>
            {nextMatch.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {nextMatch.location}
              </span>
            )}
          </p>
        )}
      </div>

      {myPlayer ? (
        <>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={myResponse === true ? 'default' : 'outline'}
              onClick={() => handleRespond(true)}
              disabled={pending !== null}
              className="rounded-full"
            >
              <Check />
              Je viens
            </Button>
            <Button
              type="button"
              variant={myResponse === false ? 'default' : 'outline'}
              onClick={() => handleRespond(false)}
              disabled={pending !== null}
              className="rounded-full"
            >
              <X />
              Je ne viens pas
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{statusMessage(props)}</p>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Pour répondre, indique d'abord quelle fiche est la tienne sur la page{' '}
          <Link to="/joueurs" className="font-medium text-primary underline-offset-4 hover:underline">
            Joueurs
          </Link>{' '}
          (« C'est moi »).
        </p>
      )}
    </Card>
  );
}
