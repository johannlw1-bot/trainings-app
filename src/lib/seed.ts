// Der feste Trainingsplan, der beim ersten Start eingetragen wird. Reine Funktionen, das Eintragen
// steht in seedDb.ts.
import type { Exercise, Id, PlanEntry, Split } from '../db';

interface SeedExercise {
  name: string;
  warmupSets: number;
  sets: number;
  reps: [min: number, max: number];
}

export const DEFAULT_PLAN: Record<Split, SeedExercise[]> = {
  upper: [
    { name: 'Brustpresse', warmupSets: 1, sets: 3, reps: [8, 12] },
    { name: 'Rudern (Maschine)', warmupSets: 1, sets: 3, reps: [8, 12] },
    { name: 'Schulterpresse', warmupSets: 0, sets: 3, reps: [8, 12] },
    { name: 'Latzug', warmupSets: 0, sets: 3, reps: [8, 12] },
    { name: 'Butterfly', warmupSets: 0, sets: 3, reps: [10, 15] },
    { name: 'Seitheben (Maschine/Kabel)', warmupSets: 0, sets: 3, reps: [12, 15] },
    { name: 'Reverse Butterfly', warmupSets: 0, sets: 3, reps: [12, 15] },
    { name: 'Trizeps am Kabelturm', warmupSets: 0, sets: 3, reps: [10, 15] },
    { name: 'Bizeps am Kabelturm', warmupSets: 0, sets: 3, reps: [10, 15] },
  ],
  lower: [
    { name: 'Beinpresse', warmupSets: 1, sets: 3, reps: [8, 12] },
    { name: 'Beinbeuger', warmupSets: 1, sets: 3, reps: [10, 12] },
    { name: 'Beinstrecker', warmupSets: 0, sets: 3, reps: [10, 15] },
    { name: 'Abduktoren', warmupSets: 0, sets: 3, reps: [12, 15] },
    { name: 'Adduktoren', warmupSets: 0, sets: 3, reps: [12, 15] },
    { name: 'Waden an der Beinpresse', warmupSets: 0, sets: 3, reps: [12, 15] },
    { name: 'Bauch (Crunch-Maschine)', warmupSets: 0, sets: 3, reps: [12, 15] },
  ],
};

/** Präfixe der Schlüssel, die Dexie Cloud den Tabellen gibt (`db.cloud.schema[table].idPrefix`). */
export interface IdPrefixes {
  exercises: string;
  planEntries: string;
}

export interface PlanRows {
  exercises: Exercise[];
  planEntries: PlanEntry[];
}

const SPLITS: readonly Split[] = ['upper', 'lower'];
const splitName = (split: Split) => (split === 'upper' ? 'Upper' : 'Lower');

/**
 * Der feste Plan als Zeilen. Die Schlüssel sind fest und privat („#“ + Präfix der Tabelle, z. B.
 * „#exrPlanUpper0“). Tragen iPhone und Mac den Plan beide ein, bevor sie sich abgleichen, sind es
 * dieselben Zeilen und es entsteht beim Abgleich kein doppelter Plan.
 */
export function buildDefaultPlan(prefixes: IdPrefixes): PlanRows {
  const rows: PlanRows = { exercises: [], planEntries: [] };
  for (const split of SPLITS) {
    for (const [order, item] of DEFAULT_PLAN[split].entries()) {
      const key = `Plan${splitName(split)}${order}`;
      const exerciseId: Id = `#${prefixes.exercises}${key}`;
      rows.exercises.push({ id: exerciseId, name: item.name, archived: false });
      rows.planEntries.push({
        id: `#${prefixes.planEntries}${key}`,
        split,
        exerciseId,
        order,
        warmupSets: item.warmupSets,
        targetSets: item.sets,
        targetRepsMin: item.reps[0],
        targetRepsMax: item.reps[1],
      });
    }
  }
  return rows;
}

/** Inhalt eines Plans ohne Schlüssel, zum Vergleichen. */
function planContent({ exercises, planEntries }: PlanRows): string[] {
  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const used = new Set(planEntries.map((entry) => entry.exerciseId));
  const lines = planEntries.map((entry) => {
    const exercise = byId.get(entry.exerciseId);
    return JSON.stringify([
      entry.split,
      entry.order,
      exercise?.name,
      exercise?.archived,
      exercise?.note ?? '',
      entry.warmupSets,
      entry.targetSets,
      entry.targetRepsMin,
      entry.targetRepsMax,
    ]);
  });
  // Übungen ohne Platz im Plan (gelöscht, aber schon trainiert) zählen als Änderung.
  for (const exercise of exercises) if (!used.has(exercise.id)) lines.push(`unplanned:${exercise.name}`);
  return lines.sort();
}

/**
 * Ist der Plan genau der feste Plan, unverändert? Die Schlüssel spielen dabei keine Rolle.
 * Dann kann er vor dem Anmelden weg: Er geht nicht verloren, er ist ja der feste Plan.
 */
export function isUntouchedDefaultPlan(rows: PlanRows): boolean {
  const expected = planContent(buildDefaultPlan({ exercises: '', planEntries: '' }));
  const actual = planContent(rows);
  return actual.length === expected.length && actual.every((line, i) => line === expected[i]);
}
