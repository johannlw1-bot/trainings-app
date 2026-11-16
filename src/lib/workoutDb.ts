// Trainings und Sätze in der Datenbank. Jede Eingabe wird sofort gespeichert.
import Dexie from 'dexie';
import { db, type Exercise, type LocalDate, type Split, type Workout, type WorkoutSet } from '../db';
import { pickLastTime, type LastTime } from './lastTime';

function setsOf(workoutId: number, exerciseId: number) {
  return db.sets.where('[exerciseId+workoutId]').equals([exerciseId, workoutId]).toArray();
}

/** Das laufende (nicht beendete) Training, falls es eines gibt. */
export async function getActiveWorkout(): Promise<Workout | undefined> {
  const open = (await db.workouts.toArray()).filter((workout) => !workout.finishedAt);
  return open.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
}

export async function startWorkout(split: Split, date: LocalDate): Promise<void> {
  await db.workouts.add({ date, split, startedAt: new Date().toISOString() });
}

export async function loadSets(workoutId: number): Promise<WorkoutSet[]> {
  return db.sets.where('workoutId').equals(workoutId).toArray();
}

/** Legt den Satz an oder überschreibt ihn. In einer Transaktion, damit schnelles Tippen keine Doppelten erzeugt. */
export async function saveSet(
  workoutId: number,
  exerciseId: number,
  setNumber: number,
  weightKg: number,
  reps: number,
): Promise<void> {
  await db.transaction('rw', db.sets, async () => {
    const existing = (await setsOf(workoutId, exerciseId)).find((set) => set.setNumber === setNumber);
    if (existing) await db.sets.update(existing.id, { weightKg, reps });
    else await db.sets.add({ workoutId, exerciseId, setNumber, weightKg, reps });
  });
}

export async function deleteSet(
  workoutId: number,
  exerciseId: number,
  setNumber: number,
): Promise<void> {
  await db.transaction('rw', db.sets, async () => {
    const sets = await setsOf(workoutId, exerciseId);
    await db.sets.bulkDelete(sets.filter((set) => set.setNumber === setNumber).map((set) => set.id));
  });
}

/**
 * Schließt das Training ab. Die Sätze jeder Übung werden lückenlos durchnummeriert,
 * falls zwischendrin ein Satz ausgelassen wurde. Ein Training ohne Sätze wird verworfen.
 */
export async function finishWorkout(workoutId: number): Promise<void> {
  await db.transaction('rw', db.workouts, db.sets, async () => {
    const sets = await loadSets(workoutId);
    if (sets.length === 0) {
      await db.workouts.delete(workoutId);
      return;
    }

    const byExercise = new Map<number, WorkoutSet[]>();
    for (const set of sets) {
      byExercise.set(set.exerciseId, [...(byExercise.get(set.exerciseId) ?? []), set]);
    }
    for (const group of byExercise.values()) {
      group.sort((a, b) => a.setNumber - b.setNumber);
      for (const [index, set] of group.entries()) {
        if (set.setNumber !== index + 1) await db.sets.update(set.id, { setNumber: index + 1 });
      }
    }

    await db.workouts.update(workoutId, { finishedAt: new Date().toISOString() });
  });
}

/** Macht ein beendetes Training wieder zum laufenden, zum Beispiel nach versehentlichem Beenden. */
export async function reopenWorkout(workoutId: number): Promise<void> {
  await db.workouts
    .where('id')
    .equals(workoutId)
    .modify((workout) => {
      delete workout.finishedAt;
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

export interface HistoryEntry {
  workout: Workout;
  setCount: number;
}

/** Beendete Trainings, neueste zuerst. */
export async function loadHistory(limit: number): Promise<HistoryEntry[]> {
  const finished = (await db.workouts.toArray())
    .filter((workout) => workout.finishedAt)
    .sort((a, b) => b.date.localeCompare(a.date) || b.startedAt.localeCompare(a.startedAt))
    .slice(0, limit);
  return Promise.all(
    finished.map(async (workout) => ({
      workout,
      setCount: await db.sets.where('workoutId').equals(workout.id).count(),
    })),
  );
}
