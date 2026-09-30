export interface TeamColorOption {
  value: string;
  label: string;
  /** Pastille utilisée dans les messages partagés (WhatsApp...). */
  emoji: string;
}

/** Couleurs courantes de maillots et de chasubles. */
export const TEAM_COLOR_OPTIONS: TeamColorOption[] = [
  { value: '#16a34a', label: 'Vert', emoji: '🟢' },
  { value: '#f97316', label: 'Orange', emoji: '🟠' },
  { value: '#2563eb', label: 'Bleu', emoji: '🔵' },
  { value: '#dc2626', label: 'Rouge', emoji: '🔴' },
  { value: '#eab308', label: 'Jaune', emoji: '🟡' },
  { value: '#9333ea', label: 'Violet', emoji: '🟣' },
  { value: '#f5f5f5', label: 'Blanc', emoji: '⚪' },
  { value: '#171717', label: 'Noir', emoji: '⚫' },
];

export const DEFAULT_TEAM_NAMES: [string, string] = ['Équipe A', 'Équipe B'];

/** Vert et orange : les couleurs utilisées avant qu'on puisse les choisir (matchs sans couleur enregistrée). */
export const DEFAULT_TEAM_COLORS: [string, string] = ['#16a34a', '#f97316'];

/** Couleur de l'équipe mélangée à du transparent, pour les fonds et contours discrets. */
export function tint(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}
