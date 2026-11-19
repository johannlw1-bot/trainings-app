// Daten für die Übersicht (Startseite): Trainings dieser Woche und der Trainingskalender.

import type { LocalDate } from '../db';
import { addDays, fromLocalDate, toLocalDate } from './dates';

/** Montag der Woche, in der der Tag liegt (Wochen beginnen am Montag). */
export function weekStart(date: LocalDate): LocalDate {
  const weekday = (fromLocalDate(date).getDay() + 6) % 7; // Mo = 0 … So = 6
  return addDays(date, -weekday);
}

/**
 * Trainingstage dieser Woche (Montag bis Sonntag). Gezählt werden Tage, nicht Trainings:
 * Ein wieder geöffnetes oder doppelt gestartetes Training am selben Tag zählt einmal.
 */
export function trainingsThisWeek(trainingDates: LocalDate[], today: LocalDate): number {
  const from = weekStart(today);
  const to = addDays(from, 6);
  return new Set(trainingDates.filter((date) => date >= from && date <= to)).size;
}

export type CalendarDayState = 'trained' | 'today' | 'trained-today' | 'rest' | 'future';

export interface CalendarDay {
  date: LocalDate;
  state: CalendarDayState;
}

export interface CalendarMonth {
  /** Erster Tag des Monats */
  key: LocalDate;
  label: string;
  /** Leere Plätze vor dem 1., damit die Spalten den Wochentagen entsprechen (Mo zuerst) */
  offset: number;
  days: CalendarDay[];
}

const monthFormat = new Intl.DateTimeFormat('de', { month: 'long' });

/**
 * Punkte-Raster der letzten `count` Monate einschließlich des aktuellen, ältester zuerst.
 * Jeder Tag ist trainiert, heute, Ruhetag (vergangen ohne Training) oder in der Zukunft.
 */
export function calendarMonths(trainingDates: LocalDate[], today: LocalDate, count = 3): CalendarMonth[] {
  const trained = new Set(trainingDates);
  const [year, month] = today.split('-').map(Number);
  const months: CalendarMonth[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const first = new Date(year, month - 1 - i, 1);
    const length = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const days: CalendarDay[] = [];
    for (let d = 1; d <= length; d++) {
      const date = toLocalDate(new Date(first.getFullYear(), first.getMonth(), d));
      const state: CalendarDayState =
        date === today
          ? trained.has(date)
            ? 'trained-today'
            : 'today'
          : date > today
            ? 'future'
            : trained.has(date)
              ? 'trained'
              : 'rest';
      days.push({ date, state });
    }
    months.push({
      key: toLocalDate(first),
      label: monthFormat.format(first),
      offset: (first.getDay() + 6) % 7,
      days,
    });
  }
  return months;
}

/** Wie viele Trainingstage im Kalender stehen. */
export function trainedDaysIn(months: CalendarMonth[]): number {
  return months.reduce(
    (sum, month) => sum + month.days.filter((day) => day.state === 'trained' || day.state === 'trained-today').length,
    0,
  );
}
