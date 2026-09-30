import type { ReactNode } from 'react';
import { CalendarDays, MapPin, Pencil, Star, Trash2 } from 'lucide-react';
import { getAverageSkill } from '../../teams/utils/balanceTeams';
import { DEFAULT_TEAM_COLORS, tint } from '../../teams/utils/teamColors';
import type { Player } from '../../players/types';
import type { Match, MatchStatus } from '../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MatchCardProps {
  match: Match;
  onEdit?: (match: Match) => void;
  onDelete?: (match: Match) => void;
  /** Boutons affichés en bas de la carte (ex. saisie du score d'un match à venir). */
  actions?: ReactNode;
}

const STATUS_BADGES: Record<Exclude<MatchStatus, 'completed'>, { label: string; variant: 'default' | 'destructive' }> = {
  scheduled: { label: 'À venir', variant: 'default' },
  cancelled: { label: 'Annulé', variant: 'destructive' },
};

const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const TIME_FORMATTER = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

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

/** Nom du joueur, avec ses buts, passes et l'étoile d'homme du match s'il y en a. */
function PlayerLine({ player, match }: { player: Player; match: Match }) {
  const stats = match.playerStats[player.id];
  const isMvp = match.mvpPlayerId === player.id;
  const details = [
    stats?.goals ? `${stats.goals} but${stats.goals > 1 ? 's' : ''}` : null,
    stats?.assists ? `${stats.assists} passe${stats.assists > 1 ? 's' : ''}` : null,
  ].filter(Boolean);

  return (
    <li className={cn(isMvp && 'font-medium text-foreground')}>
      {isMvp && <Star aria-label="Homme du match" className="mr-1 inline h-3.5 w-3.5 fill-yellow-400 text-yellow-500" />}
      {player.name}
      {details.length > 0 && <span className="text-xs text-muted-foreground"> · {details.join(', ')}</span>}
    </li>
  );
}

function TeamColorDot({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      className="h-3 w-3 shrink-0 rounded-full ring-1 ring-foreground/20"
      style={{ backgroundColor: color }}
    />
  );
}

export function MatchCard({ match, onEdit, onDelete, actions }: MatchCardProps) {
  const [teamA, teamB] = match.teams;
  const statusBadge = match.status === 'completed' ? null : STATUS_BADGES[match.status];
  const colorA = teamA.color ?? DEFAULT_TEAM_COLORS[0];
  const colorB = teamB.color ?? DEFAULT_TEAM_COLORS[1];

  return (
    <Card className={cn('p-5', match.status === 'cancelled' && 'opacity-70')}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-foreground">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="capitalize">{DATE_FORMATTER.format(match.playedAt)}</span>
            {match.status === 'scheduled' && <span>à {TIME_FORMATTER.format(match.playedAt)}</span>}
            {statusBadge && <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>}
          </p>
          {match.location && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {match.location}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {onEdit && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(match)}
              aria-label="Modifier le match"
            >
              <Pencil />
            </Button>
          )}
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(match)}
              aria-label="Supprimer le match"
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-xl">
        <div className="absolute inset-0 grid grid-cols-2" aria-hidden="true">
          <div style={{ backgroundColor: tint(colorA, 12) }} />
          <div style={{ backgroundColor: tint(colorB, 12) }} />
        </div>
        <PitchOverlay />

        <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-5">
          <div className="text-right">
            <p className="flex items-center justify-end gap-1.5 font-semibold text-foreground">
              {teamA.name}
              <TeamColorDot color={colorA} />
            </p>
            <p className="text-xs text-muted-foreground">Niveau moyen {getAverageSkill(teamA).toFixed(1)}</p>
          </div>

          <div className="rounded-lg bg-card px-3 py-1 text-lg font-bold text-foreground shadow-sm ring-1 ring-border">
            {match.score ? `${match.score.teamA} – ${match.score.teamB}` : 'vs'}
          </div>

          <div>
            <p className="flex items-center gap-1.5 font-semibold text-foreground">
              <TeamColorDot color={colorB} />
              {teamB.name}
            </p>
            <p className="text-xs text-muted-foreground">Niveau moyen {getAverageSkill(teamB).toFixed(1)}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 border-t pt-4 text-sm text-muted-foreground sm:grid-cols-2">
        <ul className="text-right">
          {teamA.players.map((player) => (
            <PlayerLine key={player.id} player={player} match={match} />
          ))}
        </ul>
        <ul>
          {teamB.players.map((player) => (
            <PlayerLine key={player.id} player={player} match={match} />
          ))}
        </ul>
      </div>

      {actions && <div className="mt-4 flex flex-wrap justify-end gap-2 border-t pt-4">{actions}</div>}
    </Card>
  );
}
