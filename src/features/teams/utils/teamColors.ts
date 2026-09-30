export interface TeamColorOption {
  value: string;
  label: string;
}

/** Couleurs courantes de maillots et de chasubles. */
export const TEAM_COLOR_OPTIONS: TeamColorOption[] = [
  { value: '#16a34a', label: 'Vert' },
  { value: '#f97316', label: 'Orange' },
  { value: '#2563eb', label: 'Bleu' },
  { value: '#dc2626', label: 'Rouge' },
  { value: '#eab308', label: 'Jaune' },
  { value: '#9333ea', label: 'Violet' },
  { value: '#f5f5f5', label: 'Blanc' },
  { value: '#171717', label: 'Noir' },
];

export const DEFAULT_TEAM_NAMES: [string, string] = ['Équipe A', 'Équipe B'];

/** Vert et orange : les couleurs utilisées avant qu'on puisse les choisir (matchs sans couleur enregistrée). */
export const DEFAULT_TEAM_COLORS: [string, string] = ['#16a34a', '#f97316'];

/** Couleur de l'équipe mélangée à du transparent, pour les fonds et contours discrets. */
export function tint(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}
