// Rechenlogik für das Körpergewicht: 7-Tage-Durchschnitt, Veränderung, Zeitraum, Eingabe.

import type { BodyWeight, LocalDate } from '../db';
import { addDays, addMonths } from './dates';
import { parseWeight } from './numbers';

export const MIN_BODY_WEIGHT = 20;
export const MAX_BODY_WEIGHT = 400;

/** Liest ein Körpergewicht (Komma oder Punkt), gültig von 20 bis 400 kg, auf 0,1 kg gerundet. */
export function parseBodyWeight(input: string): number | null {
  const value = parseWeight(input);
  if (value === null || value < MIN_BODY_WEIGHT || value > MAX_BODY_WEIGHT) return null;
  return Math.round(value * 10) / 10;
}

/** Ändert ein Gewicht um `delta` (z. B. ±0,1) ohne Rundungsfehler wie 82,30000001. */
export function stepWeight(value: number, delta: number): number {
  const next = Math.round((value + delta) * 10) / 10;
  return Math.min(MAX_BODY_WEIGHT, Math.max(MIN_BODY_WEIGHT, next));
}

/**
 * 7-Tage-Durchschnitt für einen Tag: Mittelwert aller Einträge der letzten 7 Kalendertage
 * einschließlich dieses Tages. Fehlende Tage werden ausgelassen. Ohne Eintrag in dem Fenster: null.
 */
export function sevenDayAverage(entries: BodyWeight[], date: LocalDate): number | null {
  const from = addDays(date, -6);
  const inWindow = entries.filter((entry) => entry.date >= from && entry.date <= date);
  if (inWindow.length === 0) return null;
  return inWindow.reduce((sum, entry) => sum + entry.weightKg, 0) / inWindow.length;
}

export interface AveragePoint {
  date: LocalDate;
  averageKg: number;
}

/** Durchschnitt an jedem Tag mit Eintrag, aufsteigend nach Datum. Grundlage der Linie im Diagramm. */
export function averageSeries(entries: BodyWeight[]): AveragePoint[] {
  const dates = [...new Set(entries.map((entry) => entry.date))].sort();
  return dates.map((date) => ({ date, averageKg: sevenDayAverage(entries, date)! }));
}

export interface WeightSummary {
  /** Tag, auf den sich der Durchschnitt bezieht: der neueste Eintrag */
  date: LocalDate;
  averageKg: number;
  /** Veränderung zum Durchschnitt 7 Tage davor, null wenn es damals keinen gab */
  changeKg: number | null;
}

/** Aktueller 7-Tage-Durchschnitt (zum neuesten Eintrag) und die Veränderung zur Vorwoche. */
export function weightSummary(entries: BodyWeight[]): WeightSummary | null {
  if (entries.length === 0) return null;
  const date = entries.reduce((latest, entry) => (entry.date > latest ? entry.date : latest), entries[0].date);
  const averageKg = sevenDayAverage(entries, date)!;
  const before = sevenDayAverage(entries, addDays(date, -7));
  return { date, averageKg, changeKg: before === null ? null : averageKg - before };
}

export type WeightRange = '4w' | '3m' | 'all';

/** Erster Tag des Zeitraums bis einschließlich `end`, null für „Alles“. */
export function rangeStart(range: WeightRange, end: LocalDate): LocalDate | null {
  if (range === '4w') return addDays(end, -27);
  if (range === '3m') return addDays(addMonths(end, -3), 1);
  return null;
}

/** Einträge sortiert, neueste zuerst (für die Liste). */
export function newestFirst(entries: BodyWeight[]): BodyWeight[] {
  return [...entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

const oneDecimal = new Intl.NumberFormat('de', { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false });

/** „82,4“, immer mit einer Nachkommastelle */
export function formatKg1(value: number): string {
  return oneDecimal.format(value);
}

/** „+0,3 kg“, „−0,2 kg“, „±0,0 kg“. Ohne Bewertung, nur das Vorzeichen. */
export function formatChange(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  if (rounded === 0) return '±0,0 kg';
  return `${rounded > 0 ? '+' : '−'}${formatKg1(Math.abs(rounded))} kg`;
}
