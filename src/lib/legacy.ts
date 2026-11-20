// Umwandlung der Daten aus der Zeit vor Dexie Cloud (Zahlen als Schlüssel) in Text-Schlüssel.
// Reine Funktion, das Lesen und Schreiben steht in legacyDb.ts.
import type {
  Id,
  LegacyBodyWeight,
  LegacyExercise,
  LegacyPlanEntry,
  LegacySegment,
  LegacyWorkout,
  LegacyWorkoutSet,
} from '../db';
import type { BackupTables } from './backup';
import { bodyWeightId } from './bodyWeightKey';

export interface LegacyTables {
  exercises: LegacyExercise[];
  planEntries: LegacyPlanEntry[];
  workouts: LegacyWorkout[];
  sets: LegacyWorkoutSet[];
  segments: LegacySegment[];
  bodyWeights: LegacyBodyWeight[];
}

export function isLegacyEmpty(tables: LegacyTables): boolean {
  return Object.values(tables).every((rows) => rows.length === 0);
}

/** Erzeugt einen neuen Schlüssel für eine Zeile der Tabelle. */
export type NewId = (table: 'exercises' | 'planEntries' | 'workouts' | 'sets' | 'segments') => Id;

/**
 * Gibt jeder Zeile einen neuen Text-Schlüssel und setzt die Verweise (exerciseId, workoutId)
 * entsprechend um. Alle Felder bleiben erhalten. Verweise auf fehlende Zeilen bekommen trotzdem
 * einen festen neuen Schlüssel, damit nichts verloren geht.
 */
export function convertLegacy(legacy: LegacyTables, newId: NewId): BackupTables {
  const exerciseIds = new Map<number, Id>();
  const workoutIds = new Map<number, Id>();
  const exerciseId = (old: number) => {
    if (!exerciseIds.has(old)) exerciseIds.set(old, newId('exercises'));
    return exerciseIds.get(old)!;
  };
  const workoutId = (old: number) => {
    if (!workoutIds.has(old)) workoutIds.set(old, newId('workouts'));
    return workoutIds.get(old)!;
  };

  return {
    exercises: legacy.exercises.map((row) => ({ ...row, id: exerciseId(row.id) })),
    workouts: legacy.workouts.map((row) => ({ ...row, id: workoutId(row.id) })),
    planEntries: legacy.planEntries.map((row) => ({
      ...row,
      id: newId('planEntries'),
      exerciseId: exerciseId(row.exerciseId),
    })),
    sets: legacy.sets.map((row) => ({
      ...row,
      id: newId('sets'),
      workoutId: workoutId(row.workoutId),
      exerciseId: exerciseId(row.exerciseId),
    })),
    segments: legacy.segments.map((row) => ({
      ...row,
      id: newId('segments'),
      workoutId: workoutId(row.workoutId),
      exerciseId: exerciseId(row.exerciseId),
    })),
    bodyWeights: legacy.bodyWeights.map((row) => ({ ...row, id: bodyWeightId(row.date) })),
  };
}
