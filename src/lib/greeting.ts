/** Name in der Begrüßung auf der Startseite. */
export const USER_NAME = 'Johann';

/** Begrüßung nach Tageszeit: 5–11 Uhr Morgen, 11–18 Uhr Hallo, 18–5 Uhr Abend. */
export function greeting(date: Date, name = USER_NAME): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return `Guten Morgen, ${name}`;
  if (hour >= 11 && hour < 18) return `Hallo, ${name}`;
  return `Guten Abend, ${name}`;
}
