import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import type { LevelPoint } from '../utils/playerLevels';
import { getMatchResult } from '../utils/playerStats';

interface LevelChartProps {
  history: LevelPoint[];
  baseLevel: number;
}

/** Vert du site : validé (contraste, luminosité) sur les fonds clair et sombre. */
const LINE_COLOR = '#16a34a';
const HEIGHT = 220;
const MARGIN = { top: 16, right: 44, bottom: 28, left: 28 };
const LEVEL_TICKS = [1, 2, 3, 4, 5];

const SHORT_DATE = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const RESULT_LABELS = { win: 'Victoire', draw: 'Nul', loss: 'Défaite' } as const;

interface ChartPoint {
  level: number;
  /** Absent pour le point de départ (niveau de la fiche). */
  entry?: LevelPoint;
}

function describePoint(point: ChartPoint): string {
  if (!point.entry) return 'Niveau de la fiche';
  const { match, teamIndex } = point.entry;
  const result = getMatchResult(match, teamIndex === 0);
  const score = match.score
    ? teamIndex === 0
      ? `${match.score.teamA}-${match.score.teamB}`
      : `${match.score.teamB}-${match.score.teamA}`
    : '';
  return `${SHORT_DATE.format(match.playedAt)} · ${result ? RESULT_LABELS[result] : ''} ${score}`.trim();
}

/** Largeur disponible, pour dessiner le SVG à l'échelle 1:1 (textes nets, pas étirés). */
function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

/** Évolution du niveau ajusté d'un joueur, match après match (une seule courbe). */
export function LevelChart({ history, baseLevel }: LevelChartProps) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const points: ChartPoint[] = [{ level: baseLevel }, ...history.map((entry) => ({ level: entry.level, entry }))];
  const plotWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

  // Points espacés régulièrement (un par match) : les dates d'un five sont irrégulières.
  const x = (index: number) => MARGIN.left + (points.length === 1 ? 0 : (index / (points.length - 1)) * plotWidth);
  const y = (level: number) => MARGIN.top + ((5 - level) / 4) * plotHeight;

  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${x(index)},${y(point.level)}`).join(' ');
  const last = points.length - 1;
  const active = activeIndex !== null ? points[activeIndex] : null;

  function handlePointerMove(event: PointerEvent<SVGRectElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - bounds.left) / bounds.width;
    setActiveIndex(Math.min(last, Math.max(0, Math.round(ratio * last))));
  }

  function handleKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    if (event.key === 'ArrowRight') setActiveIndex((index) => Math.min(last, (index ?? -1) + 1));
    else if (event.key === 'ArrowLeft') setActiveIndex((index) => Math.max(0, (index ?? last + 1) - 1));
    else return;
    event.preventDefault();
  }

  return (
    <div>
      <div ref={ref} className="relative">
        {width > 0 && (
          <svg
            width={width}
            height={HEIGHT}
            role="img"
            aria-label={`Niveau passé de ${baseLevel.toFixed(1)} à ${points[last].level.toFixed(1)} en ${history.length} matchs`}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onBlur={() => setActiveIndex(null)}
            className="overflow-visible outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {LEVEL_TICKS.map((tick) => (
              <g key={tick}>
                <line
                  x1={MARGIN.left}
                  x2={MARGIN.left + plotWidth}
                  y1={y(tick)}
                  y2={y(tick)}
                  stroke="var(--border)"
                  strokeWidth={1}
                />
                <text
                  x={MARGIN.left - 10}
                  y={y(tick)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-muted-foreground text-[11px] tabular-nums"
                >
                  {tick}
                </text>
              </g>
            ))}

            <text x={x(0)} y={HEIGHT - 6} className="fill-muted-foreground text-[11px]">
              Départ
            </text>
            {history.length > 0 && (
              <text x={x(last)} y={HEIGHT - 6} textAnchor="end" className="fill-muted-foreground text-[11px]">
                {SHORT_DATE.format(history[history.length - 1].match.playedAt)}
              </text>
            )}

            {active && activeIndex !== null && (
              <line
                x1={x(activeIndex)}
                x2={x(activeIndex)}
                y1={MARGIN.top}
                y2={MARGIN.top + plotHeight}
                stroke="var(--muted-foreground)"
                strokeWidth={1}
              />
            )}

            <path d={path} fill="none" stroke={LINE_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

            {/* Point final, avec un anneau couleur du fond pour rester lisible sur la courbe. */}
            <circle cx={x(last)} cy={y(points[last].level)} r={4} fill={LINE_COLOR} stroke="var(--card)" strokeWidth={2} />
            <text
              x={x(last) + 10}
              y={y(points[last].level)}
              dominantBaseline="middle"
              className="fill-foreground text-xs font-semibold tabular-nums"
            >
              {points[last].level.toFixed(1)}
            </text>

            {active && activeIndex !== null && activeIndex !== last && (
              <circle
                cx={x(activeIndex)}
                cy={y(active.level)}
                r={4}
                fill={LINE_COLOR}
                stroke="var(--card)"
                strokeWidth={2}
              />
            )}

            {/* Zone de survol plus large que la courbe : le curseur se cale sur le match le plus proche. */}
            <rect
              x={MARGIN.left - 8}
              y={0}
              width={plotWidth + 16}
              height={HEIGHT}
              fill="transparent"
              onPointerMove={handlePointerMove}
              onPointerLeave={() => setActiveIndex(null)}
            />
          </svg>
        )}

        {active && activeIndex !== null && (
          <div
            className="pointer-events-none absolute z-10 w-max -translate-x-1/2 rounded-lg border bg-popover px-3 py-2 text-xs shadow-md"
            style={{
              left: Math.min(Math.max(x(activeIndex), 80), width - 80),
              top: Math.max(0, y(active.level) - 64),
            }}
          >
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="h-0.5 w-3 rounded-full" style={{ backgroundColor: LINE_COLOR }} />
              <span className="text-sm font-semibold text-foreground tabular-nums">{active.level.toFixed(2)}</span>
            </div>
            <p className="mt-0.5 text-muted-foreground">{describePoint(active)}</p>
          </div>
        )}
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Voir les données</summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th className="py-1 font-medium">Match</th>
              <th className="py-1 text-right font-medium">Niveau</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {points.map((point, index) => (
              <tr key={index} className="border-t">
                <td className="py-1 text-foreground">{describePoint(point)}</td>
                <td className="py-1 text-right text-foreground">{point.level.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
