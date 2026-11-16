import Dexie, { type EntityTable, type Table } from 'dexie';

/** Die zwei Übungslisten: Oberkörper (Mo, Do) und Unterkörper (Di, Fr). */
export type Split = 'upper' | 'lower';

/** Lokaler Kalendertag im Format YYYY-MM-DD, kein UTC-Zeitstempel. */
export type LocalDate = string;

export interface Exercise {
  id: number;
  name: string;
  note?: string;
  /** Archivierte Übungen bleiben für alte Trainings lesbar, tauchen aber nicht mehr im Plan auf. */
  archived: boolean;
}

/** Position einer Übung in einer der beiden Listen. */
export interface PlanEntry {
  id: number;
  split: Split;
  exerciseId: number;
  order: number;
  targetSets: number;
}

export interface Workout {
  id: number;
  date: LocalDate;
  split: Split;
  /** ISO-Zeitstempel */
  startedAt: string;
  /** ISO-Zeitstempel, fehlt bei einem laufenden Training */
  finishedAt?: string;
}

export interface WorkoutSet {
  id: number;
  workoutId: number;
  exerciseId: number;
  /** Beginnt bei 1 */
  setNumber: number;
  weightKg: number;
  reps: number;
}

/** Ein Eintrag pro Tag, das Datum ist der Schlüssel. */
export interface BodyWeight {
  date: LocalDate;
  weightKg: number;
}

export const db = new Dexie('trainings-app') as Dexie & {
  exercises: EntityTable<Exercise, 'id'>;
  planEntries: EntityTable<PlanEntry, 'id'>;
  workouts: EntityTable<Workout, 'id'>;
  sets: EntityTable<WorkoutSet, 'id'>;
  bodyWeights: Table<BodyWeight, LocalDate>;
};

// Schemaänderungen nur über eine neue Version (db.version(2)...) mit Migration,
// die bestehende Daten erhält. Version 1 bleibt unverändert stehen.
// Aufgeführt sind nur Schlüssel und Indizes, nicht alle Felder.
db.version(1).stores({
  exercises: '++id, name',
  planEntries: '++id, exerciseId, [split+order]',
  workouts: '++id, date, [split+date]',
  sets: '++id, workoutId, [exerciseId+workoutId]',
  bodyWeights: 'date',
});
