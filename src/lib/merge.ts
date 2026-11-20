// Zusammenführen der Daten eines Geräts mit der Cloud beim ersten Abgleich nach dem Anmelden.
// Reine Funktion, das Lesen und Schreiben steht in cloud.ts.
import type { Exercise, Id, PlanEntry } from '../db';
import type { BackupTables } from './backup';
import { sameName } from './plan';
import { isUntouchedDefaultPlan } from './seed';

/**
 * Welche Zeilen des Geräts (`local`) in die Cloud-Daten (`cloud`) übernommen werden.
 *
 * - Ist die Cloud noch leer, wird alles übernommen.
 * - Übungen mit gleichem Namen werden nicht doppelt angelegt: Die Übung aus der Cloud bleibt,
 *   Sätze, Zeitabschnitte und Planeinträge des Geräts werden auf sie umgehängt.
 * - Steht eine Übung schon in derselben Liste, bleibt der Eintrag aus der Cloud mit seinen Zielen.
 *   Neue Einträge kommen ans Ende der Liste.
 * - Ist der Plan des Geräts nur der unveränderte feste Plan, kommt er nicht dazu. Seine Übungen
 *   bleiben nur, wenn an ihnen Sätze oder Zeitabschnitte hängen (dann aus dem Plan genommen).
 * - Trainings, Sätze, Abschnitte und Körpergewicht gehen nie verloren. Ein Körpergewicht für einen
 *   Tag, den die Cloud schon hat, bleibt wie in der Cloud.
 */
export function mergeLocalIntoCloud(cloud: BackupTables, local: BackupTables): BackupTables {
  const result: BackupTables = {
    exercises: [],
    planEntries: [],
    workouts: [],
    sets: [],
    segments: [],
    bodyWeights: [],
  };

  const has = <T extends { id: Id }>(rows: T[]) => {
    const ids = new Set(rows.map((row) => row.id));
    return (row: T) => ids.has(row.id);
  };

  if (cloud.exercises.length === 0) {
    result.exercises = local.exercises;
    result.planEntries = local.planEntries;
    result.sets = local.sets;
    result.segments = local.segments;
  } else {
    const skipPlan = isUntouchedDefaultPlan(local);
    const used = new Set([...local.sets, ...local.segments].map((row) => row.exerciseId));

    // Übungen: gleicher Name → die aus der Cloud, sonst die vom Gerät.
    const known: Exercise[] = [...cloud.exercises];
    const added = new Map<Id, Exercise>();
    const idMap = new Map<Id, Id>();
    for (const exercise of local.exercises) {
      const matches = known.filter((other) => sameName(other.name, exercise.name));
      const match = matches.find((other) => !other.archived) ?? matches[0];
      if (match) {
        idMap.set(exercise.id, match.id);
        continue;
      }
      if (skipPlan && !used.has(exercise.id)) continue;
      const copy = { ...exercise, archived: skipPlan ? true : exercise.archived };
      known.push(copy);
      added.set(copy.id, copy);
      idMap.set(exercise.id, copy.id);
    }
    const mapId = (id: Id) => idMap.get(id) ?? id;

    // Planeinträge: nur, was in der Liste noch fehlt, ans Ende.
    if (!skipPlan) {
      const entries: PlanEntry[] = [...cloud.planEntries];
      const sorted = [...local.planEntries].sort((a, b) => a.order - b.order);
      for (const entry of sorted) {
        const exerciseId = mapId(entry.exerciseId);
        if (!known.some((exercise) => exercise.id === exerciseId)) continue;
        if (entries.some((other) => other.split === entry.split && other.exerciseId === exerciseId)) continue;
        const inList = entries.filter((other) => other.split === entry.split);
        const order = inList.length ? Math.max(...inList.map((other) => other.order)) + 1 : 0;
        const copy = { ...entry, exerciseId, order };
        entries.push(copy);
        result.planEntries.push(copy);
        // Eine archivierte Übung aus der Cloud kommt so wieder in den Plan.
        const cloudExercise = cloud.exercises.find((exercise) => exercise.id === exerciseId);
        if (cloudExercise?.archived && !added.has(exerciseId)) {
          const revived = { ...cloudExercise, archived: false };
          added.set(exerciseId, revived);
        }
      }
    }
    result.exercises = [...added.values()];

    result.sets = local.sets.map((set) => ({ ...set, exerciseId: mapId(set.exerciseId) }));
    result.segments = local.segments.map((segment) => ({ ...segment, exerciseId: mapId(segment.exerciseId) }));
  }

  const inCloud = {
    workouts: has(cloud.workouts),
    sets: has(cloud.sets),
    segments: has(cloud.segments),
    bodyWeights: has(cloud.bodyWeights),
  };
  result.workouts = local.workouts.filter((row) => !inCloud.workouts(row));
  result.sets = result.sets.filter((row) => !inCloud.sets(row));
  result.segments = result.segments.filter((row) => !inCloud.segments(row));
  result.bodyWeights = local.bodyWeights.filter((row) => !inCloud.bodyWeights(row));
  return result;
}
