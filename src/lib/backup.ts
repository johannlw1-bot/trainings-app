// Backup: alle Tabellen als eine JSON-Datei. Reine Funktionen, das Laden steht in backupDb.ts.
import type { BodyWeight, Exercise, LocalDate, PlanEntry, Segment, Workout, WorkoutSet } from '../db';

/** Kennung im Backup, damit ein späterer Import fremde Dateien erkennt. */
export const BACKUP_APP = 'trainings-app';

/**
 * Alle Tabellen der Datenbank. Kommt eine Tabelle dazu, muss sie hier ergänzt werden,
 * sonst fehlt sie im Export (der Typ erzwingt das beim Laden in backupDb.ts).
 */
export interface BackupTables {
  exercises: Exercise[];
  planEntries: PlanEntry[];
  workouts: Workout[];
  sets: WorkoutSet[];
  segments: Segment[];
  bodyWeights: BodyWeight[];
}

export interface Backup {
  app: typeof BACKUP_APP;
  /** Version des Datenbank-Schemas (Dexie), für die Umwandlung beim Import */
  schemaVersion: number;
  /** ISO-Zeitstempel */
  exportedAt: string;
  tables: BackupTables;
}

export function buildBackup(tables: BackupTables, schemaVersion: number, now: Date): Backup {
  return { app: BACKUP_APP, schemaVersion, exportedAt: now.toISOString(), tables };
}

export function serializeBackup(backup: Backup): string {
  return JSON.stringify(backup, null, 2);
}

/** „training-backup-2026-11-20.json“ */
export function backupFileName(today: LocalDate): string {
  return `training-backup-${today}.json`;
}
