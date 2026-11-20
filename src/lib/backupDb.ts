import { db } from '../db';
import { buildBackup, type Backup, type BackupTables } from './backup';

/** Liest alle Tabellen in einem Rutsch, damit das Backup in sich stimmig ist. */
export async function loadBackup(now: Date): Promise<Backup> {
  const tables: BackupTables = await db.transaction(
    'r',
    [db.exercises, db.planEntries, db.workouts, db.sets, db.segments, db.bodyWeights],
    async () => ({
      exercises: await db.exercises.toArray(),
      planEntries: await db.planEntries.toArray(),
      workouts: await db.workouts.toArray(),
      sets: await db.sets.toArray(),
      segments: await db.segments.toArray(),
      bodyWeights: await db.bodyWeights.toArray(),
    }),
  );
  return buildBackup(tables, db.verno, now);
}
