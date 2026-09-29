import { Trash2 } from 'lucide-react';
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

export function MatchCard({ match, onDelete }: MatchCardProps) {
  const [teamA, teamB] = match.teams;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium capitalize text-foreground">
            {DATE_FORMATTER.format(match.playedAt)}
          </p>
          {match.location && <p className="text-sm text-muted-foreground">{match.location}</p>}
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

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="text-right">
          <p className="font-semibold text-foreground">{teamA.name}</p>
          <p className="text-xs text-muted-foreground">Niveau moyen {getAverageSkill(teamA).toFixed(1)}</p>
        </div>

        <div className="text-center text-lg font-bold text-foreground">
          {match.score ? `${match.score.teamA} – ${match.score.teamB}` : 'vs'}
        </div>

        <div>
          <p className="font-semibold text-foreground">{teamB.name}</p>
          <p className="text-xs text-muted-foreground">Niveau moyen {getAverageSkill(teamB).toFixed(1)}</p>
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
