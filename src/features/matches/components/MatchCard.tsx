import { CalendarDays, MapPin, Trash2 } from 'lucide-react';
import { getAverageSkill } from '../../teams/utils/balanceTeams';
import type { Match } from '../types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface MatchCardProps {
  match: Match;
  onDelete?: (match: Match) => void;
}

const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function PitchOverlay() {
  return (
    <svg
      viewBox="0 0 400 160"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full text-foreground/15"
    >
      <line x1="200" y1="0" x2="200" y2="160" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="200" cy="80" r="38" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="200" cy="80" r="2" fill="currentColor" />
      <path d="M0 30 h36 v100 h-36" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M400 30 h-36 v100 h36" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export function MatchCard({ match, onDelete }: MatchCardProps) {
  const [teamA, teamB] = match.teams;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-1.5 text-sm font-medium capitalize text-foreground">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            {DATE_FORMATTER.format(match.playedAt)}
          </p>
          {match.location && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {match.location}
            </p>
          )}
        </div>

        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(match)}
            aria-label="Supprimer le match"
            className="shrink-0 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 />
          </Button>
        )}
      </div>

      <div className="relative mt-4 overflow-hidden rounded-xl">
        <div className="absolute inset-0 grid grid-cols-2" aria-hidden="true">
          <div className="bg-primary/8" />
          <div className="bg-orange-500/8" />
        </div>
        <PitchOverlay />

        <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-5">
          <div className="text-right">
            <p className="font-semibold text-foreground">{teamA.name}</p>
            <p className="text-xs text-muted-foreground">Niveau moyen {getAverageSkill(teamA).toFixed(1)}</p>
          </div>

          <div className="rounded-lg bg-card px-3 py-1 text-lg font-bold text-foreground shadow-sm ring-1 ring-border">
            {match.score ? `${match.score.teamA} – ${match.score.teamB}` : 'vs'}
          </div>

          <div>
            <p className="font-semibold text-foreground">{teamB.name}</p>
            <p className="text-xs text-muted-foreground">Niveau moyen {getAverageSkill(teamB).toFixed(1)}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 border-t pt-4 text-sm text-muted-foreground sm:grid-cols-2">
        <ul className="text-right">
          {teamA.players.map((player) => (
            <li key={player.id}>{player.name}</li>
          ))}
        </ul>
        <ul>
          {teamB.players.map((player) => (
            <li key={player.id}>{player.name}</li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
