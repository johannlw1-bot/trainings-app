// Wochenvolumen: bewegte Kilos (Gewicht × Wiederholungen) aller Arbeitssätze.

import type { LocalDate } from '../db';
import { addDays } from './dates';

export interface VolumeSet {
  /** Tag des Trainings, zu dem der Satz gehört */
  date: LocalDate;
  weightKg: number;
  reps: number;
  warmup: boolean;
}

/** Volumen der Arbeitssätze von `from` bis `to` (beide eingeschlossen). Aufwärmsätze zählen nicht. */
export function volumeBetween(sets: VolumeSet[], from: LocalDate, to: LocalDate): number {
  return sets
    .filter((set) => !set.warmup && set.date >= from && set.date <= to)
    .reduce((sum, set) => sum + set.weightKg * set.reps, 0);
}

export interface WeeklyVolume {
  /** Letzte 7 Tage einschließlich heute */
  currentKg: number;
  /** Die 7 Tage davor */
  previousKg: number;
  changeKg: number;
}

/** Volumen der letzten 7 Tage und Vergleich mit den 7 Tagen davor. */
export function weeklyVolume(sets: VolumeSet[], today: LocalDate): WeeklyVolume {
  const currentKg = volumeBetween(sets, addDays(today, -6), today);
  const previousKg = volumeBetween(sets, addDays(today, -13), addDays(today, -7));
  return { currentKg, previousKg, changeKg: currentKg - previousKg };
}

const wholeKg = new Intl.NumberFormat('de', { maximumFractionDigits: 0 });

/** „3.200“: ganze Kilo mit Tausenderpunkt */
export function formatVolume(value: number): string {
  return wholeKg.format(Math.round(value));
}

/** „+450 kg“, „−1.200 kg“, „±0 kg“. Ohne Bewertung, nur das Vorzeichen. */
export function formatVolumeChange(value: number): string {
  const rounded = Math.round(value);
  if (rounded === 0) return '±0 kg';
  return `${rounded > 0 ? '+' : '−'}${formatVolume(Math.abs(rounded))} kg`;
}
