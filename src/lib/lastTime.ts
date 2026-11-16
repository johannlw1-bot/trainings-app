// „Letztes Mal“: Werte des vorigen Trainings einer Übung und daraus abgeleitete Vorschläge.
import type { LocalDate, Workout, WorkoutSet } from '../db';
import { formatKg } from './numbers';

export interface LoggedSet {
  setNumber: number;
  weightKg: number;
  reps: number;
}

export interface LastTime {
  date: LocalDate;
  sets: LoggedSet[];
}

/**
 * Sucht unter den Sätzen einer Übung das jüngste abgeschlossene Training.
 * Das laufende Training (`excludeWorkoutId`) zählt nicht mit.
 */
export function pickLastTime(
  setsOfExercise: readonly WorkoutSet[],
  workouts: readonly Workout[],
  excludeWorkoutId?: number,
): LastTime | undefined {
  const candidates = workouts
    .filter((workout) => workout.finishedAt && workout.id !== excludeWorkoutId)
    .filter((workout) => setsOfExercise.some((set) => set.workoutId === workout.id))
    .sort((a, b) => b.date.localeCompare(a.date) || b.startedAt.localeCompare(a.startedAt));

  const latest = candidates[0];
  if (!latest) return undefined;

  return {
    date: latest.date,
    sets: setsOfExercise
      .filter((set) => set.workoutId === latest.id)
      .sort((a, b) => a.setNumber - b.setNumber)
      .map(({ setNumber, weightKg, reps }) => ({ setNumber, weightKg, reps })),
  };
}

/**
 * „80 kg × 8, 8, 7“. Aufeinanderfolgende Sätze mit gleichem Gewicht werden zusammengefasst,
 * bei wechselndem Gewicht steht „80 kg × 8 · 82,5 kg × 6“.
 */
export function formatSets(sets: readonly LoggedSet[]): string {
  const groups: { weightKg: number; reps: number[] }[] = [];
  for (const set of sets) {
    const current = groups[groups.length - 1];
    if (current && current.weightKg === set.weightKg) current.reps.push(set.reps);
    else groups.push({ weightKg: set.weightKg, reps: [set.reps] });
  }
  return groups.map((group) => `${formatKg(group.weightKg)} kg × ${group.reps.join(', ')}`).join(' · ');
}

export interface Suggestion {
  /** null, wenn es noch keinen Anhaltspunkt gibt (Übung zum ersten Mal) */
  weightKg: number | null;
  reps: number;
}

/**
 * Vorschlag für den Satz an Position `index` (ab 0).
 * Grundlage ist derselbe Satz vom letzten Mal, sonst dessen letzter Satz, sonst das Ziel aus dem Plan.
 * Wurde heute in einem früheren Satz ein anderes Gewicht eingetragen als letztes Mal, gilt das neue Gewicht weiter.
 *
 * @param previousToday der letzte heute schon eingetragene Satz vor dieser Position
 */
export function suggestSet(
  index: number,
  last: readonly LoggedSet[] | undefined,
  previousToday: LoggedSet | undefined,
  targetReps: number,
): Suggestion {
  const base = last?.[index] ?? last?.[last.length - 1];
  let weightKg = base?.weightKg ?? null;
  const reps = base?.reps ?? targetReps;

  if (previousToday) {
    const previousLast = last?.[previousToday.setNumber - 1];
    if (!previousLast || previousLast.weightKg !== previousToday.weightKg) {
      weightKg = previousToday.weightKg;
    }
  }

  return { weightKg, reps };
}
