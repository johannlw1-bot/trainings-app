// Trainings, Sätze und Abschnitte (Zeit pro Übung) in der Datenbank. Jede Eingabe wird sofort gespeichert.
import Dexie from 'dexie';
import {
  db,
  type Exercise,
  type LocalDate,
  type Segment,
  type Split,
  type Workout,
  type WorkoutSet,
} from '../db';
import { elapsedMs } from './duration';
import type { VolumeSet } from './volume';
import { exerciseTimes, planSwitch } from './exerciseTiming';
import { pickLastTime, type LastTime, type LoggedSet } from './lastTime';
import { loadPlan } from './planDb';

function setsOf(workoutId: number, exerciseId: number) {
  return db.sets.where('[exerciseId+workoutId]').equals([exerciseId, workoutId]).toArray();
}

/** Das laufende (nicht beendete) Training, falls es eines gibt. */
/** Alle Trainings, auch das laufende (für Wochenzählung, Kalender und die Karte „Erledigt“). */
export function loadWorkouts(): Promise<Workout[]> {
  return db.workouts.toArray();
}

/** Alle Sätze aus Trainings ab einem Tag, mit dem Tag des Trainings (für das Wochenvolumen). */
export async function loadVolumeSets(since: LocalDate): Promise<VolumeSet[]> {
  const workouts = await db.workouts.where('date').aboveOrEqual(since).toArray();
  const dateOf = new Map(workouts.map((workout) => [workout.id, workout.date]));
  const sets = await db.sets.where('workoutId').anyOf([...dateOf.keys()]).toArray();
  return sets.map((set) => ({
    date: dateOf.get(set.workoutId)!,
    weightKg: set.weightKg,
    reps: set.reps,
    warmup: set.warmup,
    exerciseId: set.exerciseId,
  }));
}

export async function getActiveWorkout(): Promise<Workout | undefined> {
  const open = (await db.workouts.toArray()).filter((workout) => !workout.finishedAt);
  return open.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
}

/**
 * Startet ein Training. Die erste Übung der Liste läuft ab demselben Zeitpunkt,
 * damit die Zeiten pro Übung zusammen die Gesamtzeit ergeben.
 */
export async function startWorkout(split: Split, date: LocalDate): Promise<number> {
  const startedAt = new Date().toISOString();
  const first = (await loadPlan(split))[0];
  return db.transaction('rw', db.workouts, db.segments, async () => {
    const workoutId = await db.workouts.add({ date, split, startedAt });
    if (first) await db.segments.add({ workoutId, exerciseId: first.exercise.id, startedAt });
    return workoutId;
  });
}

export async function loadSets(workoutId: number): Promise<WorkoutSet[]> {
  return db.sets.where('workoutId').equals(workoutId).toArray();
}

export async function loadSegments(workoutId: number): Promise<Segment[]> {
  return db.segments.where('workoutId').equals(workoutId).toArray();
}

/**
 * Wechselt die angezeigte Übung: Der laufende Abschnitt endet, ein neuer für die Ziel-Übung beginnt.
 * Läuft die Übung schon, passiert nichts.
 */
export async function switchExercise(workoutId: number, exerciseId: number): Promise<void> {
  const now = new Date().toISOString();
  await db.transaction('rw', db.segments, async () => {
    const change = planSwitch(await loadSegments(workoutId), exerciseId);
    for (const id of change.close) await db.segments.update(id, { endedAt: now });
    if (change.open !== null) await db.segments.add({ workoutId, exerciseId: change.open, startedAt: now });
  });
}

/** Legt den Satz an oder überschreibt ihn. In einer Transaktion, damit schnelles Tippen keine Doppelten erzeugt. */
export async function saveSet(
  workoutId: number,
  exerciseId: number,
  warmup: boolean,
  setNumber: number,
  weightKg: number,
  reps: number,
): Promise<void> {
  await db.transaction('rw', db.sets, async () => {
    const existing = (await setsOf(workoutId, exerciseId)).find(
      (set) => set.warmup === warmup && set.setNumber === setNumber,
    );
    if (existing) await db.sets.update(existing.id, { weightKg, reps });
    else await db.sets.add({ workoutId, exerciseId, warmup, setNumber, weightKg, reps });
  });
}

export async function deleteSet(
  workoutId: number,
  exerciseId: number,
  warmup: boolean,
  setNumber: number,
): Promise<void> {
  await db.transaction('rw', db.sets, async () => {
    const sets = await setsOf(workoutId, exerciseId);
    await db.sets.bulkDelete(
      sets.filter((set) => set.warmup === warmup && set.setNumber === setNumber).map((set) => set.id),
    );
  });
}

/**
 * Schließt das Training ab. Der laufende Abschnitt endet mit dem Training. Die Sätze jeder Übung
 * werden lückenlos durchnummeriert, falls zwischendrin ein Satz ausgelassen wurde.
 * Ein Training ohne Sätze wird nie still verworfen: Dann passiert nichts, und die Oberfläche fragt,
 * ob es mit `discardWorkout` verworfen werden soll.
 *
 * @returns true, wenn das Training abgeschlossen wurde, false, wenn es keine Sätze hat
 */
export async function finishWorkout(workoutId: number): Promise<boolean> {
  return db.transaction('rw', db.workouts, db.sets, db.segments, async () => {
    const sets = await loadSets(workoutId);
    if (sets.length === 0) return false;

    // Aufwärm- und Arbeitssätze werden je Übung getrennt nummeriert.
    const groups = new Map<string, WorkoutSet[]>();
    for (const set of sets) {
      const key = `${set.exerciseId}:${set.warmup}`;
      groups.set(key, [...(groups.get(key) ?? []), set]);
    }
    for (const group of groups.values()) {
      group.sort((a, b) => a.setNumber - b.setNumber);
      for (const [index, set] of group.entries()) {
        if (set.setNumber !== index + 1) await db.sets.update(set.id, { setNumber: index + 1 });
      }
    }

    const finishedAt = new Date().toISOString();
    for (const segment of await loadSegments(workoutId)) {
      if (!segment.endedAt) await db.segments.update(segment.id, { endedAt: finishedAt });
    }
    await db.workouts.update(workoutId, { finishedAt });
    return true;
  });
}

/** Verwirft ein Training samt Sätzen und Abschnitten. Nur nach ausdrücklicher Nachfrage aufrufen. */
export async function discardWorkout(workoutId: number): Promise<void> {
  await db.transaction('rw', db.workouts, db.sets, db.segments, async () => {
    await db.sets.where('workoutId').equals(workoutId).delete();
    await db.segments.where('workoutId').equals(workoutId).delete();
    await db.workouts.delete(workoutId);
  });
}

/** „Letztes Mal“ für mehrere Übungen auf einmal. */
export async function loadLastTimes(
  exerciseIds: readonly number[],
  excludeWorkoutId: number,
): Promise<Map<number, LastTime>> {
  const result = new Map<number, LastTime>();
  for (const exerciseId of exerciseIds) {
    const sets = await db.sets
      .where('[exerciseId+workoutId]')
      .between([exerciseId, Dexie.minKey], [exerciseId, Dexie.maxKey])
      .toArray();
    const workoutIds = [...new Set(sets.map((set) => set.workoutId))];
    const workouts = (await db.workouts.bulkGet(workoutIds)).filter((w): w is Workout => !!w);
    const last = pickLastTime(sets, workouts, excludeWorkoutId);
    if (last) result.set(exerciseId, last);
  }
  return result;
}

export async function loadExercises(ids: readonly number[]): Promise<Exercise[]> {
  return (await db.exercises.bulkGet([...ids])).filter((e): e is Exercise => !!e);
}

export async function getWorkout(workoutId: number): Promise<Workout | undefined> {
  return db.workouts.get(workoutId);
}

export interface HistoryEntry {
  workout: Workout;
  /** Anzahl der Arbeitssätze, Aufwärmsätze zählen nicht mit */
  setCount: number;
}

/** Beendete Trainings, neueste zuerst. */
export async function loadHistory(limit = Infinity): Promise<HistoryEntry[]> {
  const finished = (await db.workouts.toArray())
    .filter((workout) => workout.finishedAt)
    .sort((a, b) => b.date.localeCompare(a.date) || b.startedAt.localeCompare(a.startedAt))
    .slice(0, limit);
  return Promise.all(
    finished.map(async (workout) => ({
      workout,
      setCount: (await loadSets(workout.id)).filter((set) => !set.warmup).length,
    })),
  );
}

export interface ExerciseVisit {
  workout: Workout;
  /** Zeit bei dieser Übung, fehlt bei Trainings von vor der Zeitmessung */
  timeMs?: number;
  workingSets: number;
}

/** Wie lange die letzten beendeten Trainings bei einer Übung gedauert haben, neueste zuerst. */
export async function loadExerciseVisits(exerciseId: number, limit: number): Promise<ExerciseVisit[]> {
  const [sets, segments] = await Promise.all([
    db.sets
      .where('[exerciseId+workoutId]')
      .between([exerciseId, Dexie.minKey], [exerciseId, Dexie.maxKey])
      .toArray(),
    db.segments.where('exerciseId').equals(exerciseId).toArray(),
  ]);
  const workoutIds = [...new Set([...sets, ...segments].map((item) => item.workoutId))];
  const workouts = (await db.workouts.bulkGet(workoutIds))
    .filter((w): w is Workout => !!w?.finishedAt)
    .sort((a, b) => b.date.localeCompare(a.date) || b.startedAt.localeCompare(a.startedAt))
    .slice(0, limit);

  return workouts.map((workout) => {
    const own = segments.filter((segment) => segment.workoutId === workout.id);
    return {
      workout,
      timeMs: own.length
        ? exerciseTimes(own, Date.parse(workout.finishedAt!)).get(exerciseId)
        : undefined,
      workingSets: sets.filter((set) => set.workoutId === workout.id && !set.warmup).length,
    };
  });
}

export interface SummaryExercise {
  id: number;
  name: string;
  /** Zeit bei dieser Übung, fehlt bei Trainings von vor der Zeitmessung */
  timeMs?: number;
  /** Arbeitssätze in ihrer Reihenfolge, Aufwärmsätze zählen nicht mit */
  workingSets: LoggedSet[];
}

export interface WorkoutSummary {
  workout: Workout;
  totalMs: number;
  workingSetCount: number;
  exercises: SummaryExercise[];
}

/**
 * Zusammenfassung eines Trainings: Gesamtzeit, Arbeitssätze und Zeit pro Übung.
 * Die Übungen stehen in der Reihenfolge, in der sie zuerst besucht wurden. Übungen ohne
 * Zeitabschnitte (ältere Trainings) folgen in Planreihenfolge.
 */
export async function loadSummary(workoutId: number): Promise<WorkoutSummary | undefined> {
  const workout = await db.workouts.get(workoutId);
  if (!workout) return undefined;

  const [sets, segments, plan] = await Promise.all([
    loadSets(workoutId),
    loadSegments(workoutId),
    loadPlan(workout.split),
  ]);
  const end = workout.finishedAt ? Date.parse(workout.finishedAt) : Date.now();
  const times = exerciseTimes(segments, end);
  const ids = [...new Set([...segments.map((s) => s.exerciseId), ...sets.map((s) => s.exerciseId)])];
  const names = new Map((await loadExercises(ids)).map((exercise) => [exercise.id, exercise.name]));
  const planIndex = new Map(plan.map((item, index) => [item.exercise.id, index]));
  const firstVisit = (id: number) =>
    segments
      .filter((segment) => segment.exerciseId === id)
      .map((segment) => segment.startedAt)
      .sort()[0];

  const exercises = ids
    .map((id) => ({
      id,
      name: names.get(id) ?? 'Gelöschte Übung',
      timeMs: times.get(id),
      workingSets: sets
        .filter((set) => set.exerciseId === id && !set.warmup)
        .sort((a, b) => a.setNumber - b.setNumber)
        .map(({ setNumber, weightKg, reps }) => ({ setNumber, weightKg, reps })),
    }))
    // Nur angesehen, ohne Satz und ohne nennenswerte Zeit: weglassen.
    .filter((exercise) => exercise.workingSets.length > 0 || (exercise.timeMs ?? 0) >= 1000)
    .sort((a, b) => {
      const visitA = firstVisit(a.id);
      const visitB = firstVisit(b.id);
      if (visitA && visitB) return visitA.localeCompare(visitB);
      if (visitA || visitB) return visitA ? -1 : 1;
      return (planIndex.get(a.id) ?? Infinity) - (planIndex.get(b.id) ?? Infinity);
    });

  return {
    workout,
    totalMs: elapsedMs(workout.startedAt, end),
    workingSetCount: sets.filter((set) => !set.warmup).length,
    exercises,
  };
}
