import type { LocalDate } from '../db';

/** Lokaler Kalendertag als YYYY-MM-DD. Bewusst nicht über UTC, sonst rutscht der späte Abend auf den Folgetag. */
export function toLocalDate(date: Date): LocalDate {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Mitternacht des Kalendertags in lokaler Zeit. */
export function fromLocalDate(value: LocalDate): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Kalendertag plus/minus n Tage. Über das lokale Datum gerechnet, damit Zeitumstellungen nichts verschieben. */
export function addDays(value: LocalDate, days: number): LocalDate {
  const date = fromLocalDate(value);
  date.setDate(date.getDate() + days);
  return toLocalDate(date);
}

/** Kalendertag plus/minus n Monate. Gibt es den Tag im Zielmonat nicht (31.), wird der letzte Tag genommen. */
export function addMonths(value: LocalDate, months: number): LocalDate {
  const [year, month, day] = value.split('-').map(Number);
  const lastDay = new Date(year, month - 1 + months + 1, 0).getDate();
  return toLocalDate(new Date(year, month - 1 + months, Math.min(day, lastDay)));
}

/** Ganze Tage von a bis b (b − a). */
export function daysBetween(a: LocalDate, b: LocalDate): number {
  return Math.round((fromLocalDate(b).getTime() - fromLocalDate(a).getTime()) / 86_400_000);
}

/** Kalenderwoche nach ISO 8601 (Woche mit dem ersten Donnerstag des Jahres ist KW 1). */
export function isoWeek(value: LocalDate): number {
  const date = fromLocalDate(value);
  const weekday = (date.getDay() + 6) % 7;
  const thursday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - weekday + 3);
  const firstThursday = new Date(thursday.getFullYear(), 0, 4);
  const firstWeekday = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstWeekday + 3);
  return 1 + Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
}

const longFormat = new Intl.DateTimeFormat('de', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/** „Do., 19.11.2026“ */
export function formatLongDate(value: LocalDate): string {
  return longFormat.format(fromLocalDate(value));
}

const dayMonthFormat = new Intl.DateTimeFormat('de', { day: '2-digit', month: '2-digit' });

/** „19.11.“ */
export function formatDayMonth(value: LocalDate): string {
  return dayMonthFormat.format(fromLocalDate(value));
}

const shortFormat = new Intl.DateTimeFormat('de', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
});

/** „Do., 12.11.“ */
export function formatShortDate(value: LocalDate): string {
  return shortFormat.format(fromLocalDate(value));
}
