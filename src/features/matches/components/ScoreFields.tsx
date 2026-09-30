import type { Team } from '../../teams/types';
import { Input } from '@/components/ui/input';

interface ScoreFieldsProps {
  teams: [Team, Team];
  scoreA: string;
  scoreB: string;
  onScoreAChange: (value: string) => void;
  onScoreBChange: (value: string) => void;
  required?: boolean;
}

export function ScoreFields({
  teams,
  scoreA,
  scoreB,
  onScoreAChange,
  onScoreBChange,
  required = false,
}: ScoreFieldsProps) {
  return (
    <div className="flex items-center gap-3">
      <Input
        type="number"
        min={0}
        value={scoreA}
        onChange={(event) => onScoreAChange(event.target.value)}
        placeholder={teams[0].name}
        aria-label={`Score ${teams[0].name}`}
        required={required}
      />
      <span className="text-muted-foreground">–</span>
      <Input
        type="number"
        min={0}
        value={scoreB}
        onChange={(event) => onScoreBChange(event.target.value)}
        placeholder={teams[1].name}
        aria-label={`Score ${teams[1].name}`}
        required={required}
      />
    </div>
  );
}
