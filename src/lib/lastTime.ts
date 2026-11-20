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
  /** Arbeitssätze. Nur sie zählen für „Letztes Mal“ und den Hinweis „Gewicht erhöhen“. */
  sets: LoggedSet[];
  /** Aufwärmsätze desselben Trainings, nur als Vorschlag für die Aufwärmzeilen. */
  warmups: LoggedSet[];
}

function pick(sets: readonly WorkoutSet[], workoutId: string, warmup: boolean): LoggedSet[] {
  return sets
    .filter((set) => set.workoutId === workoutId && set.warmup === warmup)
    .sort((a, b) => a.setNumber - b.setNumber)
    .map(({ setNumber, weightKg, reps }) => ({ setNumber, weightKg, reps }));
}

/**
 * Sucht unter den Sätzen einer Übung das jüngste abgeschlossene Training mit mindestens
 * einem Arbeitssatz. Das laufende Training (`excludeWorkoutId`) zählt nicht mit,
 * ein Training nur mit Aufwärmsätzen auch nicht.
 */
export function pickLastTime(
  setsOfExercise: readonly WorkoutSet[],
  workouts: readonly Workout[],
  excludeWorkoutId?: string,
): LastTime | undefined {
  const candidates = workouts
    .filter((workout) => workout.finishedAt && workout.id !== excludeWorkoutId)
    .filter((workout) => setsOfExercise.some((set) => set.workoutId === workout.id && !set.warmup))
    .sort((a, b) => b.date.localeCompare(a.date) || b.startedAt.localeCompare(a.startedAt));

  const latest = candidates[0];
  if (!latest) return undefined;

  return {
    date: latest.date,
    sets: pick(setsOfExercise, latest.id, false),
    warmups: pick(setsOfExercise, latest.id, true),
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
 * Grundlage ist derselbe Satz vom letzten Mal, sonst dessen letzter Satz, sonst `fallbackReps` aus dem Plan.
 * Wurde heute in einem früheren Satz ein anderes Gewicht eingetragen als letztes Mal, gilt das neue Gewicht weiter.
 *
 * @param previousToday der letzte heute schon eingetragene Satz vor dieser Position
 */
export function suggestSet(
  index: number,
  last: readonly LoggedSet[] | undefined,
  previousToday: LoggedSet | undefined,
  fallbackReps: number,
): Suggestion {
  const base = last?.[index] ?? last?.[last.length - 1];
  let weightKg = base?.weightKg ?? null;
  // Ohne Vorgeschichte orientieren sich die Wiederholungen am Satz davor, erst dann am Plan.
  const reps = base?.reps ?? previousToday?.reps ?? fallbackReps;

  if (previousToday) {
    const previousLast = last?.[previousToday.setNumber - 1];
    if (!previousLast || previousLast.weightKg !== previousToday.weightKg) {
      weightKg = previousToday.weightKg;
    }
  }

  return { weightKg, reps };
}

/**
 * Doppelte Progression: Sind alle geplanten Arbeitssätze gemacht und erreicht jeder
 * das obere Ende des Wiederholungsbereichs, ist es Zeit für mehr Gewicht.
 * Aufwärmsätze dürfen hier nicht übergeben werden.
 */
export function reachedTop(
  workingSets: readonly LoggedSet[],
  targetSets: number,
  targetRepsMax: number,
): boolean {
  return (
    workingSets.length >= Math.max(1, targetSets) &&
    workingSets.every((set) => set.reps >= targetRepsMax)
  );
}

export type IncreaseHint = 'now' | 'next-time' | null;

/**
 * Welcher Hinweis bei einer Übung im laufenden Training steht:
 * - 'next-time': Heute wurde das obere Ende in allen Arbeitssätzen erreicht.
 * - 'now': Letztes Mal wurde es erreicht, und heute liegt noch kein schwererer Satz vor.
 */
export function increaseHint(
  last: readonly LoggedSet[] | undefined,
  today: readonly LoggedSet[],
  targetSets: number,
  targetRepsMax: number,
): IncreaseHint {
  if (reachedTop(today, targetSets, targetRepsMax)) return 'next-time';
  if (!last || !reachedTop(last, targetSets, targetRepsMax)) return null;
  const heaviestLast = Math.max(...last.map((set) => set.weightKg));
  return today.some((set) => set.weightKg > heaviestLast) ? null : 'now';
}
