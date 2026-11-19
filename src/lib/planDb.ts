// Lesen und Ändern des Plans in der Datenbank. Jede Änderung wird sofort gespeichert.
import Dexie from 'dexie';
import { db, type Exercise, type PlanEntry, type Split } from '../db';
import { moveItem, normalizeName, sameName, type Targets } from './plan';

export interface PlanItem {
  entry: PlanEntry;
  exercise: Exercise;
  /** Steht die Übung auch in der anderen Liste? */
  inOtherList: boolean;
  /** Gibt es schon eingetragene Sätze zu dieser Übung? */
  trained: boolean;
}

/** Eine Übung aus der anderen Liste, die sich in diese übernehmen lässt. */
export interface AddableExercise {
  exercise: Exercise;
  targets: Targets;
}

export type NameResult = 'ok' | 'empty' | 'duplicate';

function entriesOf(split: Split) {
  return db.planEntries
    .where('[split+order]')
    .between([split, Dexie.minKey], [split, Dexie.maxKey])
    .toArray();
}

function setCount(exerciseId: number) {
  return db.sets
    .where('[exerciseId+workoutId]')
    .between([exerciseId, Dexie.minKey], [exerciseId, Dexie.maxKey])
    .count();
}

function targetsOf(entry: PlanEntry): Targets {
  const { warmupSets, targetSets, targetRepsMin, targetRepsMax } = entry;
  return { warmupSets, targetSets, targetRepsMin, targetRepsMax };
}

/** Die Übungen einer Liste in ihrer Reihenfolge. */
export async function loadPlan(split: Split): Promise<PlanItem[]> {
  const entries = await entriesOf(split);
  const exercises = await db.exercises.bulkGet(entries.map((entry) => entry.exerciseId));
  const elsewhere = new Set(
    (await db.planEntries.toArray()).filter((e) => e.split !== split).map((e) => e.exerciseId),
  );
  const counts = await Promise.all(entries.map((entry) => setCount(entry.exerciseId)));
  return entries.flatMap((entry, i) => {
    const exercise = exercises[i];
    return exercise
      ? [{ entry, exercise, inOtherList: elsewhere.has(exercise.id), trained: counts[i] > 0 }]
      : [];
  });
}

/** Die Übungen der anderen Liste, die in dieser noch nicht stehen. */
export async function loadAddable(split: Split): Promise<AddableExercise[]> {
  const entries = await db.planEntries.toArray();
  const inThisList = new Set(entries.filter((e) => e.split === split).map((e) => e.exerciseId));
  const others = entries.filter((e) => e.split !== split && !inThisList.has(e.exerciseId));
  const exercises = await db.exercises.bulkGet(others.map((entry) => entry.exerciseId));
  return others
    .flatMap((entry, i) => {
      const exercise = exercises[i];
      return exercise ? [{ exercise, targets: targetsOf(entry) }] : [];
    })
    .sort((a, b) => a.exercise.name.localeCompare(b.exercise.name, 'de'));
}

/**
 * Hängt eine Übung ans Ende der Liste. Gibt es schon eine Übung mit diesem Namen
 * (in der anderen Liste, oder gelöscht mit erhaltenem Verlauf), wird sie wiederverwendet.
 * So bleibt ihr Verlauf zusammen, statt dass zwei gleichnamige Übungen entstehen.
 */
export async function addExercise(
  split: Split,
  rawName: string,
  targets: Targets,
): Promise<NameResult> {
  const name = normalizeName(rawName);
  if (!name) return 'empty';

  return db.transaction('rw', db.exercises, db.planEntries, async () => {
    const entries = await entriesOf(split);
    const matches = (await db.exercises.toArray()).filter((exercise) => sameName(exercise.name, name));
    const existing = matches.find((exercise) => !exercise.archived) ?? matches[0];

    if (existing && entries.some((entry) => entry.exerciseId === existing.id)) return 'duplicate';

    let exerciseId: number;
    if (existing) {
      exerciseId = existing.id;
      if (existing.archived) await db.exercises.update(existing.id, { archived: false });
    } else {
      exerciseId = await db.exercises.add({ name, archived: false });
    }

    const order = entries.length ? entries[entries.length - 1].order + 1 : 0;
    await db.planEntries.add({ split, exerciseId, order, ...targets });
    return 'ok';
  });
}

/** Benennt die Übung um. Das gilt für beide Listen und alle bisherigen Trainings. */
export async function renameExercise(exerciseId: number, rawName: string): Promise<NameResult> {
  const name = normalizeName(rawName);
  if (!name) return 'empty';

  return db.transaction('rw', db.exercises, async () => {
    const taken = (await db.exercises.toArray()).some(
      (exercise) => exercise.id !== exerciseId && !exercise.archived && sameName(exercise.name, name),
    );
    if (taken) return 'duplicate';
    await db.exercises.update(exerciseId, { name });
    return 'ok';
  });
}

export async function setTargets(entryId: number, targets: Targets): Promise<void> {
  await db.planEntries.update(entryId, { ...targets });
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
 * Löscht die Übung aus der Liste.
 * - Steht sie auch in der anderen Liste, bleibt sie dort unverändert.
 * - Wurde sie noch nie trainiert, wird sie vollständig gelöscht.
 * - Wurde sie schon trainiert, verschwindet sie aus dem Plan, die Übung selbst und ihre
 *   eingetragenen Sätze bleiben aber für den Verlauf erhalten.
 */
export async function deleteFromPlan(entryId: number): Promise<void> {
  await db.transaction('rw', [db.exercises, db.planEntries, db.sets, db.segments], async () => {
    const entry = await db.planEntries.get(entryId);
    if (!entry) return;
    await db.planEntries.delete(entryId);

    const stillPlanned = await db.planEntries.where('exerciseId').equals(entry.exerciseId).count();
    if (stillPlanned > 0) return;

    if ((await setCount(entry.exerciseId)) === 0) {
      // Nie trainiert: Übung und ihre Zeitabschnitte (falls sie nur angesehen wurde) ganz entfernen.
      await db.segments.where('exerciseId').equals(entry.exerciseId).delete();
      await db.exercises.delete(entry.exerciseId);
    } else {
      await db.exercises.update(entry.exerciseId, { archived: true });
    }
  });
}
