/** Valeur numérique d'un champ de score, null s'il est vide. */
export function parseScoreInput(value: string): number | null {
  return value.trim() === '' ? null : Number(value);
}
