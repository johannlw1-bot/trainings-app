import Dexie, { type EntityTable, type Table } from 'dexie';

/** Die zwei Übungslisten: Oberkörper (Mo, Do) und Unterkörper (Di, Fr). */
export type Split = 'upper' | 'lower';

/** Lokaler Kalendertag im Format YYYY-MM-DD, kein UTC-Zeitstempel. */
export type LocalDate = string;

export interface Exercise {
  id: number;
  name: string;
  note?: string;
  /**
   * Aus dem Plan gelöscht, aber schon trainiert: Die Übung bleibt nur noch für den Verlauf erhalten
   * und taucht im Plan nicht mehr auf. Nie trainierte Übungen werden beim Löschen ganz entfernt.
   */
  archived: boolean;
}

/** Position einer Übung in einer der beiden Listen, mit ihren Zielen. */
export interface PlanEntry {
  id: number;
  split: Split;
  exerciseId: number;
  order: number;
  /** Aufwärmsätze vor den Arbeitssätzen, 0 wenn keiner */
  warmupSets: number;
  /** Arbeitssätze */
  targetSets: number;
  /** Zielbereich der Wiederholungen, z. B. 8 bis 12 */
  targetRepsMin: number;
  targetRepsMax: number;
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
  /**
   * Aufwärmsatz. Zählt nicht für „Letztes Mal“, den Hinweis „Gewicht erhöhen“ und das Fortschrittsdiagramm.
   * Aufwärm- und Arbeitssätze werden getrennt nummeriert.
   */
  warmup: boolean;
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

// Schemaänderungen nur über eine neue Version mit Migration, die bestehende Daten erhält.
// Frühere Versionen bleiben unverändert stehen.
// Aufgeführt sind nur Schlüssel und Indizes, nicht alle Felder.
const STORES = {
  exercises: '++id, name',
  planEntries: '++id, exerciseId, [split+order]',
  workouts: '++id, date, [split+date]',
  sets: '++id, workoutId, [exerciseId+workoutId]',
  bodyWeights: 'date',
};

db.version(1).stores(STORES);

// Version 2 (16.11.2026): Wiederholungen als Bereich (targetRepsMin/Max statt targetReps),
// Aufwärmsätze (planEntries.warmupSets, sets.warmup).
// Bis hierher gab es nur Test-Daten aus der Entwicklung. Sie werden mit ausdrücklicher Zustimmung
// einmalig gelöscht, danach trägt seedDefaultPlan() den festen Plan ein.
// Das ist eine Ausnahme: Künftige Migrationen müssen bestehende Daten umwandeln, nicht löschen.
// Das Körpergewicht bleibt unberührt.
db.version(2)
  .stores(STORES)
  .upgrade(async (tx) => {
    await tx.table('sets').clear();
    await tx.table('workouts').clear();
    await tx.table('planEntries').clear();
    await tx.table('exercises').clear();
  });
