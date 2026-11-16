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

const shortFormat = new Intl.DateTimeFormat('de', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
});

/** „Do., 12.11.“ */
export function formatShortDate(value: LocalDate): string {
  return shortFormat.format(fromLocalDate(value));
}
