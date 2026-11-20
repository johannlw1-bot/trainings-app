// Wochenvolumen: bewegte Kilos (Gewicht × Wiederholungen) aller Arbeitssätze.

import type { LocalDate } from '../db';
import { addDays } from './dates';
import { weekStart } from './overview';

export interface VolumeSet {
  /** Tag des Trainings, zu dem der Satz gehört */
  date: LocalDate;
  weightKg: number;
  reps: number;
  warmup: boolean;
  /** Übung des Satzes, für das Volumen pro Übung */
  exerciseId?: string;
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

export interface WeekVolume {
  /** Montag der Kalenderwoche */
  weekStart: LocalDate;
  volumeKg: number;
}

/** Volumen der letzten `weeks` Kalenderwochen (Mo bis So), älteste zuerst, die aktuelle zuletzt. */
export function weeklyBuckets(sets: VolumeSet[], today: LocalDate, weeks = 8): WeekVolume[] {
  const current = weekStart(today);
  return Array.from({ length: weeks }, (_, index) => {
    const start = addDays(current, -7 * (weeks - 1 - index));
    return { weekStart: start, volumeKg: volumeBetween(sets, start, addDays(start, 6)) };
  });
}

export interface ExerciseVolume {
  exerciseId: string;
  volumeKg: number;
}

/** Volumen pro Übung von `from` bis `to`, größtes zuerst. Übungen nur mit Aufwärmsätzen fehlen. */
export function exerciseVolumes(sets: VolumeSet[], from: LocalDate, to: LocalDate): ExerciseVolume[] {
  const totals = new Map<string, number>();
  for (const set of sets) {
    if (set.warmup || set.exerciseId === undefined || set.date < from || set.date > to) continue;
    totals.set(set.exerciseId, (totals.get(set.exerciseId) ?? 0) + set.weightKg * set.reps);
  }
  return [...totals]
    .map(([exerciseId, volumeKg]) => ({ exerciseId, volumeKg }))
    .sort((a, b) => b.volumeKg - a.volumeKg || a.exerciseId.localeCompare(b.exerciseId));
}

const tonnes = new Intl.NumberFormat('de', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Kurz für die Werte über den Balken: „950“ unter einer Tonne, sonst „32,4 t“. */
export function formatVolumeShort(value: number): string {
  if (Math.round(value) < 1000) return formatVolume(value);
  return `${tonnes.format(value / 1000)} t`;
}
