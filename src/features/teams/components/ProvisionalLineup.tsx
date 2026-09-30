import type { CSSProperties } from 'react';
import { TriangleAlert, UserPlus } from 'lucide-react';
import { PlayerAvatar } from '../../players/components/PlayerAvatar';
import type { PlayerPosition } from '../../players/types';
import { getPositionLabel } from '../../players/utils/position';
import type { GetLevel } from '../utils/balanceTeams';
import { TEAM_SIZE } from '../utils/planRecruits';
import type { RecruitPlan, RecruitSlot } from '../utils/planRecruits';
import { tint } from '../utils/teamColors';
import { Card } from '@/components/ui/card';

interface ProvisionalLineupProps {
  plan: RecruitPlan;
  teamNames: [string, string];
  teamColors: [string, string];
  getLevel?: GetLevel;
  /** Peut lancer « Équilibrer » (créateur ou admin) : on l'invite à le faire. */
  canBalance: boolean;
}

/** Au-delà, l'équilibre reste atteignable mais demande des recrues très fortes ou très faibles. */
const EXTREME_LEVEL_MARGIN = 0.25;
/** Écart de niveau moyen à partir duquel on prévient que l'équilibre ne sera pas parfait. */
const NOTICEABLE_GAP = 0.2;

/** Niveau conseillé arrondi au demi-point : les fiches sont notées en entiers. */
function formatLevel(level: number): string {
  return `~${Math.round(level * 2) / 2}`;
}

function formatPositions(positions: PlayerPosition[]): string {
  if (positions.length === 3) return 'tout poste';
  return positions.map((position) => getPositionLabel(position).toLowerCase()).join(' ou ');
}

function OpenSlot({ slot }: { slot: RecruitSlot }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed px-3 py-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <UserPlus className="h-4 w-4" />
      </div>
      <div className="min-w-0 text-sm">
        <p className="font-medium text-foreground">À recruter · niv. {formatLevel(slot.level)}</p>
        <p className="text-xs text-muted-foreground first-letter:uppercase">{formatPositions(slot.positions)}</p>
      </div>
    </div>
  );
}

/**
 * Composition en cours : les joueurs déjà confirmés répartis au mieux, et pour chaque place libre
 * le profil à recruter pour que les équipes soient équilibrées une fois complètes.
 */
export function ProvisionalLineup({ plan, teamNames, teamColors, getLevel, canBalance }: ProvisionalLineupProps) {
  const missing = plan.slots.length;
  const needsExtremeRecruits = plan.slots.some(
    (slot) => slot.level <= 1 + EXTREME_LEVEL_MARGIN || slot.level >= 5 - EXTREME_LEVEL_MARGIN,
  );

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-semibold text-foreground">
          {missing === 0
            ? 'Composition complète'
            : `Composition provisoire — il manque ${missing} joueur${missing > 1 ? 's' : ''}`}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {missing > 0 && 'Les profils conseillés équilibreront les équipes une fois complètes. '}
          {canBalance
            ? missing === 0
              ? 'Clique sur « Équilibrer les équipes » pour valider la répartition, la remélanger ou l\'ajuster.'
              : 'Clique sur « Équilibrer » quand tout le monde est là : la répartition sera recalculée.'
            : 'Le créateur ou un admin formera les équipes définitives.'}
        </p>
      </div>

      {/* Avertissements sur les recrues : sans objet quand la composition est complète. */}
      {missing > 0 && (needsExtremeRecruits || plan.remainingGap > NOTICEABLE_GAP) && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {plan.remainingGap > NOTICEABLE_GAP
              ? 'Même avec ces recrues, les équipes resteront un peu déséquilibrées : vérifie les conditions.'
              : 'Tes conditions déséquilibrent les équipes : il faudra des recrues très fortes d\'un côté et plus faibles de l\'autre.'}
          </p>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {([0, 1] as const).map((index) => {
          const players = plan.teams[index];
          const slots = plan.slots.filter((slot) => slot.teamIndex === index);
          const color = teamColors[index];

          return (
            <Card
              key={index}
              className="p-4 ring-2"
              style={{ '--tw-ring-color': tint(color, 45) } as CSSProperties}
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-foreground/20"
                  style={{ backgroundColor: color }}
                />
                <h3 className="min-w-0 flex-1 truncate font-semibold text-foreground">{teamNames[index]}</h3>
                <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                  {players.length}/{TEAM_SIZE}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {players.map((player) => (
                  <div key={player.id} className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2.5">
                    <PlayerAvatar name={player.name} avatarUrl={player.avatarUrl} className="h-9 w-9 text-xs" />
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="truncate font-medium text-foreground">{player.name}</p>
                      <p className="text-xs text-muted-foreground">{getPositionLabel(player.preferredPosition)}</p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-primary tabular-nums">
                      Niv. {getLevel ? getLevel(player).toFixed(1) : player.skillLevel}
                    </span>
                  </div>
                ))}
                {slots.map((slot, slotIndex) => (
                  <OpenSlot key={slotIndex} slot={slot} />
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
