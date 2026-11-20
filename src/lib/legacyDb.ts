import { db, type Id } from '../db';
import { convertLegacy, isLegacyEmpty, type LegacyTables, type NewId } from './legacy';

/** Neuer Schlüssel im Format von Dexie Cloud (`newId` ergänzt dexie-cloud-addon an jeder Tabelle). */
const newId: NewId = (table) => (db.table(table) as unknown as { newId(): Id }).newId();

/**
 * Wandelt die Daten aus der Zeit vor Dexie Cloud um (siehe Version 4 und 5 in db.ts).
 * Alles in einer Transaktion: Bricht sie ab, bleiben die alten Zeilen stehen und der nächste Start
 * versucht es erneut. Danach sind die legacy-Tabellen leer und der Aufruf tut nichts mehr.
 */
export async function migrateLegacyData(): Promise<void> {
  const legacyTables = [
    db.legacyExercises,
    db.legacyPlanEntries,
    db.legacyWorkouts,
    db.legacySets,
    db.legacySegments,
    db.legacyBodyWeights,
  ];
  const newTables = [db.exercises, db.planEntries, db.workouts, db.sets, db.segments, db.bodyWeights];

  await db.transaction('rw', [...legacyTables, ...newTables], async () => {
    const legacy: LegacyTables = {
      exercises: await db.legacyExercises.toArray(),
      planEntries: await db.legacyPlanEntries.toArray(),
      workouts: await db.legacyWorkouts.toArray(),
      sets: await db.legacySets.toArray(),
      segments: await db.legacySegments.toArray(),
      bodyWeights: await db.legacyBodyWeights.toArray(),
    };
    if (isLegacyEmpty(legacy)) return;

    const converted = convertLegacy(legacy, newId);
    await db.exercises.bulkAdd(converted.exercises);
    await db.planEntries.bulkAdd(converted.planEntries);
    await db.workouts.bulkAdd(converted.workouts);
    await db.sets.bulkAdd(converted.sets);
    await db.segments.bulkAdd(converted.segments);
    await db.bodyWeights.bulkAdd(converted.bodyWeights);

    await Promise.all(legacyTables.map((table) => table.clear()));
  });
}
