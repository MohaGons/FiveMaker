function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Valeur d'un <input type="date"> ("AAAA-MM-JJ") en heure locale (toISOString décalerait après minuit UTC). */
export function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Valeur d'un <input type="time"> ("HH:mm") en heure locale. */
export function toTimeInputValue(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Date d'un match à partir des champs du formulaire. "AAAA-MM-JJTHH:mm" est interprété en heure locale ;
 * sans heure (match joué), on garde le format historique "AAAA-MM-JJ".
 */
export function fromInputValues(date: string, time?: string): Date {
  return new Date(time ? `${date}T${time}` : date);
}
