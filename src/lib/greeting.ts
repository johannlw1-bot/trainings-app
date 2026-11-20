/** Name in der Begrüßung auf der Startseite. */
export const USER_NAME = 'Johann';

/** Gruß nach Tageszeit, ohne Name und Komma: 5–11 Uhr Morgen, 11–18 Uhr Hallo, 18–5 Uhr Abend. */
export function greeting(date: Date): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return 'Guten Morgen';
  if (hour >= 11 && hour < 18) return 'Hallo';
  return 'Guten Abend';
}
