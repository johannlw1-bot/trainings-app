import Dexie, { type EntityTable, type Table } from 'dexie';
import dexieCloud from 'dexie-cloud-addon';
import { DATABASE_URL } from './cloudConfig';

/** Die zwei Übungslisten: Oberkörper (Mo, Do) und Unterkörper (Di, Fr). */
export type Split = 'upper' | 'lower';

/** Lokaler Kalendertag im Format YYYY-MM-DD, kein UTC-Zeitstempel. */
export type LocalDate = string;

/**
 * Primärschlüssel. Dexie Cloud vergibt ihn beim Anlegen (`@id`), z. B. „exr0OroMWmdWtMgzS5Udb2dfysp“.
 * Schlüssel mit „#“ am Anfang sind feste, private Schlüssel des Nutzers (fester Plan, Körpergewicht
 * pro Tag): Legen zwei Geräte denselben an, entsteht beim Abgleich kein Doppel.
 */
export type Id = string;

export interface Exercise {
  id: Id;
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
  id: Id;
  split: Split;
  exerciseId: Id;
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
  id: Id;
  date: LocalDate;
  split: Split;
  /** ISO-Zeitstempel */
  startedAt: string;
  /** ISO-Zeitstempel, fehlt bei einem laufenden Training */
  finishedAt?: string;
}

export interface WorkoutSet {
  id: Id;
  workoutId: Id;
  exerciseId: Id;
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

/**
 * Ein Aufenthalt bei einer Übung während eines Trainings. Die Zeit pro Übung ist die Summe ihrer
 * Abschnitte. Offen (ohne `endedAt`) ist immer nur der Abschnitt der gerade angezeigten Übung.
 */
export interface Segment {
  id: Id;
  workoutId: Id;
  exerciseId: Id;
  /** ISO-Zeitstempel */
  startedAt: string;
  /** ISO-Zeitstempel, fehlt beim laufenden Abschnitt */
  endedAt?: string;
}

/** Ein Eintrag pro Tag: Der Schlüssel ist „#“ und das Datum (`bodyWeightId`). */
export interface BodyWeight {
  id: Id;
  date: LocalDate;
  weightKg: number;
}


/** Zeilen aus der Zeit vor Dexie Cloud (bis Version 3): Zahlen als Schlüssel, Körpergewicht ohne `id`. */
type Legacy<T> = Omit<T, 'id' | 'exerciseId' | 'workoutId'> & {
  [K in keyof T as K extends 'id' | 'exerciseId' | 'workoutId' ? K : never]: number;
};
export type LegacyExercise = Legacy<Exercise>;
export type LegacyPlanEntry = Legacy<PlanEntry>;
export type LegacyWorkout = Legacy<Workout>;
export type LegacyWorkoutSet = Legacy<WorkoutSet>;
export type LegacySegment = Legacy<Segment>;
export type LegacyBodyWeight = Omit<BodyWeight, 'id'>;

/** Zwischenablage für die Umstellung auf Dexie Cloud, siehe Version 4. Werden nie abgeglichen. */
export const LEGACY_TABLES = [
  'legacyExercises',
  'legacyPlanEntries',
  'legacyWorkouts',
  'legacySets',
  'legacySegments',
  'legacyBodyWeights',
];

// Der Name bleibt „trainings-app“ (nameSuffix: false, siehe unten), damit die bestehende Datenbank
// auf dem iPhone weiterverwendet und umgewandelt wird.
export const db = new Dexie('trainings-app', { addons: [dexieCloud] }) as Dexie & {
  exercises: EntityTable<Exercise, 'id'>;
  planEntries: EntityTable<PlanEntry, 'id'>;
  workouts: EntityTable<Workout, 'id'>;
  sets: EntityTable<WorkoutSet, 'id'>;
  segments: EntityTable<Segment, 'id'>;
  bodyWeights: Table<BodyWeight, Id>;
  legacyExercises: Table<LegacyExercise, number>;
  legacyPlanEntries: Table<LegacyPlanEntry, number>;
  legacyWorkouts: Table<LegacyWorkout, number>;
  legacySets: Table<LegacyWorkoutSet, number>;
  legacySegments: Table<LegacySegment, number>;
  legacyBodyWeights: Table<LegacyBodyWeight, LocalDate>;
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

// Version 3 (19.11.2026): Zeit pro Übung als Abschnitte (segments).
// Fügt nur die neue Tabelle hinzu. Bestehende Tabellen, Indizes und Daten bleiben unverändert,
// deshalb gibt es keine upgrade-Funktion. Alte Trainings haben einfach keine Abschnitte.
const STORES_V3 = { ...STORES, segments: '++id, workoutId, exerciseId' };
db.version(3).stores(STORES_V3);

// Version 4 und 5 (20.11.2026): Umstellung auf Dexie Cloud. Dexie Cloud verlangt Text-Schlüssel,
// den Primärschlüssel einer Tabelle kann IndexedDB aber nicht ändern. Deshalb in drei Schritten:
// 4. Alle Zeilen unverändert in die Tabellen legacy… kopieren, die alten Tabellen entfernen.
// 5. Die Tabellen mit Text-Schlüsseln neu anlegen (leer).
// Danach wandelt migrateLegacyData() (lib/legacyMigration.ts) die Zeilen beim Start in einer
// normalen Transaktion um. Erst dort vergibt Dexie Cloud neue Schlüssel, in einer upgrade-Funktion
// tut es das nicht. Die legacy-Tabellen bleiben danach leer stehen und werden nie abgeglichen.
const LEGACY_STORES = {
  legacyExercises: '++id',
  legacyPlanEntries: '++id',
  legacyWorkouts: '++id',
  legacySets: '++id',
  legacySegments: '++id',
  legacyBodyWeights: 'date',
};

db.version(4)
  .stores({
    exercises: null,
    planEntries: null,
    workouts: null,
    sets: null,
    segments: null,
    bodyWeights: null,
    ...LEGACY_STORES,
  })
  .upgrade(async (tx) => {
    const pairs: [from: keyof typeof STORES_V3, to: keyof typeof LEGACY_STORES][] = [
      ['exercises', 'legacyExercises'],
      ['planEntries', 'legacyPlanEntries'],
      ['workouts', 'legacyWorkouts'],
      ['sets', 'legacySets'],
      ['segments', 'legacySegments'],
      ['bodyWeights', 'legacyBodyWeights'],
    ];
    for (const [from, to] of pairs) {
      await tx.table(to).bulkAdd(await tx.table(from).toArray());
    }
  });

db.version(5).stores({
  ...LEGACY_STORES,
  exercises: '@id, name',
  planEntries: '@id, exerciseId, [split+order]',
  workouts: '@id, date, [split+date]',
  sets: '@id, workoutId, [exerciseId+workoutId]',
  segments: '@id, workoutId, exerciseId',
  bodyWeights: 'id, date',
});

db.cloud.configure({
  databaseUrl: DATABASE_URL,
  // Ohne Anmeldung läuft die App lokal weiter. Nach dem Anmelden werden die lokalen Daten hochgeladen.
  requireAuth: false,
  // Eigene, deutsche Anmeldung in den Einstellungen statt des englischen Standard-Dialogs.
  customLoginGui: true,
  // Bestehende Datenbank weiterverwenden (siehe oben).
  nameSuffix: false,
  unsyncedTables: LEGACY_TABLES,
});
