import { TriangleAlert } from 'lucide-react';
import type { ID } from '../../../shared/types/common';
import type { Player } from '../../players/types';
import type { PairingConstraint } from '../types';

interface ConstraintViolationsAlertProps {
  violations: PairingConstraint[];
  playersById: Map<ID, Player>;
}

/** Conditions « ensemble » / « séparés » cassées par un déplacement manuel. */
export function ConstraintViolationsAlert({ violations, playersById }: ConstraintViolationsAlertProps) {
  if (violations.length === 0) return null;

  return (
    <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <ul>
        {violations.map((constraint) => {
          const [a, b] = constraint.playerIds.map((id) => playersById.get(id)?.name);
          return (
            <li key={constraint.id}>
              Condition non respectée : {a} {constraint.rule === 'together' ? 'avec' : 'contre'} {b}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
