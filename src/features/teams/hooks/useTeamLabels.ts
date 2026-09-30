import { useEffect, useState } from 'react';
import { DEFAULT_TEAM_COLORS, DEFAULT_TEAM_NAMES } from '../utils/teamColors';

export interface TeamLabel {
  name: string;
  color: string;
}

type TeamLabels = [TeamLabel, TeamLabel];

// Conservés sur l'appareil : on joue souvent avec les mêmes chasubles d'une semaine à l'autre.
const STORAGE_KEY = 'team-labels';

const DEFAULT_LABELS: TeamLabels = [
  { name: DEFAULT_TEAM_NAMES[0], color: DEFAULT_TEAM_COLORS[0] },
  { name: DEFAULT_TEAM_NAMES[1], color: DEFAULT_TEAM_COLORS[1] },
];

function loadLabels(): TeamLabels {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as TeamLabels) : DEFAULT_LABELS;
  } catch {
    return DEFAULT_LABELS;
  }
}

export function useTeamLabels() {
  const [labels, setLabels] = useState<TeamLabels>(loadLabels);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(labels));
    } catch {
      // Stockage indisponible (navigation privée...) : les libellés restent valables pour la session.
    }
  }, [labels]);

  function updateLabel(index: 0 | 1, change: Partial<TeamLabel>): void {
    setLabels((current) => {
      const next: TeamLabels = [...current];
      next[index] = { ...current[index], ...change };
      return next;
    });
  }

  /** Nom affiché et enregistré : le nom par défaut si le champ a été vidé. */
  function getTeamName(index: 0 | 1): string {
    return labels[index].name.trim() || DEFAULT_TEAM_NAMES[index];
  }

  return { labels, updateLabel, getTeamName };
}
