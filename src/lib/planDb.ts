// Lesen und Ändern des Plans in der Datenbank. Jede Änderung wird sofort gespeichert.
import Dexie from 'dexie';
import { db, type Exercise, type PlanEntry, type Split } from '../db';
import { moveItem, normalizeName, sameName } from './plan';

export interface PlanItem {
  entry: PlanEntry;
  exercise: Exercise;
  /** Steht die Übung auch in der anderen Liste? */
  inOtherList: boolean;
}

/** Eine vorhandene Übung, die noch nicht in der gewählten Liste steht. */
export interface AddableExercise {
  exercise: Exercise;
  /** Ziele aus der anderen Liste, falls sie dort steht. */
  targetSets?: number;
  targetReps?: number;
}

export type NameResult = 'ok' | 'empty' | 'duplicate';

function entriesOf(split: Split) {
  return db.planEntries
    .where('[split+order]')
    .between([split, Dexie.minKey], [split, Dexie.maxKey])
    .toArray();
}

/** Die Übungen einer Liste in ihrer Reihenfolge. */
export async function loadPlan(split: Split): Promise<PlanItem[]> {
  const entries = await entriesOf(split);
  const exercises = await db.exercises.bulkGet(entries.map((entry) => entry.exerciseId));
  const elsewhere = new Set(
    (await db.planEntries.toArray()).filter((e) => e.split !== split).map((e) => e.exerciseId),
  );
  return entries.flatMap((entry, i) => {
    const exercise = exercises[i];
    return exercise ? [{ entry, exercise, inOtherList: elsewhere.has(exercise.id) }] : [];
  });
}

/** Alle vorhandenen Übungen, die nicht in dieser Liste stehen. Aktive zuerst, dann archivierte. */
export async function loadAddable(split: Split): Promise<AddableExercise[]> {
  const [exercises, entries] = await Promise.all([
    db.exercises.toArray(),
    db.planEntries.toArray(),
  ]);
  const inThisList = new Set(entries.filter((e) => e.split === split).map((e) => e.exerciseId));
  const elsewhere = new Map(entries.filter((e) => e.split !== split).map((e) => [e.exerciseId, e]));
  return exercises
    .filter((exercise) => !inThisList.has(exercise.id))
    .map((exercise) => ({
      exercise,
      targetSets: elsewhere.get(exercise.id)?.targetSets,
      targetReps: elsewhere.get(exercise.id)?.targetReps,
    }))
    .sort(
      (a, b) =>
        Number(a.exercise.archived) - Number(b.exercise.archived) ||
        a.exercise.name.localeCompare(b.exercise.name, 'de'),
    );
}

/**
 * Hängt eine Übung ans Ende der Liste. Gibt es schon eine Übung mit diesem Namen
 * (in der anderen Liste oder archiviert), wird sie wiederverwendet statt doppelt angelegt.
 */
export async function addExercise(
  split: Split,
  rawName: string,
  targetSets: number,
  targetReps: number,
): Promise<NameResult> {
  const name = normalizeName(rawName);
  if (!name) return 'empty';

  return db.transaction('rw', db.exercises, db.planEntries, async () => {
    const entries = await entriesOf(split);
    const existing = (await db.exercises.toArray()).find((exercise) => sameName(exercise.name, name));

    if (existing && entries.some((entry) => entry.exerciseId === existing.id)) return 'duplicate';

    let exerciseId: number;
    if (existing) {
      exerciseId = existing.id;
      if (existing.archived) await db.exercises.update(existing.id, { archived: false });
    } else {
      exerciseId = await db.exercises.add({ name, archived: false });
    }

    const order = entries.length ? entries[entries.length - 1].order + 1 : 0;
    await db.planEntries.add({ split, exerciseId, order, targetSets, targetReps });
    return 'ok';
  });
}

/** Benennt die Übung um. Das gilt für beide Listen und alle bisherigen Trainings. */
export async function renameExercise(exerciseId: number, rawName: string): Promise<NameResult> {
  const name = normalizeName(rawName);
  if (!name) return 'empty';

  return db.transaction('rw', db.exercises, async () => {
    const taken = (await db.exercises.toArray()).some(
      (exercise) => exercise.id !== exerciseId && sameName(exercise.name, name),
    );
    if (taken) return 'duplicate';
    await db.exercises.update(exerciseId, { name });
    return 'ok';
  });
}

export async function setTargets(
  entryId: number,
  targetSets: number,
  targetReps: number,
): Promise<void> {
  await db.planEntries.update(entryId, { targetSets, targetReps });
}

/** Verschiebt einen Eintrag um eine Stelle nach oben (-1) oder unten (+1). */
export async function moveEntry(split: Split, entryId: number, direction: -1 | 1): Promise<void> {
  await db.transaction('rw', db.planEntries, async () => {
    const entries = await entriesOf(split);
    const moved = moveItem(
      entries,
      entries.findIndex((entry) => entry.id === entryId),
      direction,
    );
    if (!moved) return;
    await Promise.all(moved.map((entry, order) => db.planEntries.update(entry.id, { order })));
  });
}

/**
 * Nimmt die Übung aus der Liste. Steht sie danach in keiner Liste mehr, wird sie archiviert.
 * Gelöscht wird nichts: Die Übung und ihre geloggten Sätze bleiben erhalten.
 */
export async function removeFromPlan(entryId: number): Promise<void> {
  await db.transaction('rw', db.exercises, db.planEntries, async () => {
    const entry = await db.planEntries.get(entryId);
    if (!entry) return;
    await db.planEntries.delete(entryId);
    const remaining = await db.planEntries.where('exerciseId').equals(entry.exerciseId).count();
    if (remaining === 0) await db.exercises.update(entry.exerciseId, { archived: true });
  });
}
