import type { Player } from '../../players/types';
import type { AttendanceSummary } from '../utils/attendance';

function PlayerNames({ label, players, className }: { label: string; players: Player[]; className?: string }) {
  if (players.length === 0) return null;

  return (
    <p className="text-sm">
      <span className={`font-medium ${className ?? 'text-foreground'}`}>
        {label} ({players.length})
      </span>
      <span className="text-muted-foreground"> : {players.map((player) => player.name).join(', ')}</span>
    </p>
  );
}

/** Réponses au sondage hors composition : liste d'attente, absents et habitués à relancer. */
export function AttendanceOverview({ summary }: { summary: AttendanceSummary }) {
  const { waitlist, declined, pending } = summary;
  if (waitlist.length === 0 && declined.length === 0 && pending.length === 0) return null;

  return (
    <div className="mt-4 flex flex-col gap-1.5 rounded-xl border bg-card px-4 py-3">
      <PlayerNames label="Liste d'attente" players={waitlist} className="text-primary" />
      <PlayerNames label="Ne viennent pas" players={declined} />
      <PlayerNames label="Sans réponse" players={pending} />
    </div>
  );
}
