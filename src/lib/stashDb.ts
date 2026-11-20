// Zurückhalten der Daten eines Geräts beim Anmelden und Zusammenführen nach dem ersten Abgleich.
import { db, SYNCED_TABLES, type StashRow } from '../db';
import type { BackupTables } from './backup';
import { mergeLocalIntoCloud } from './merge';

const syncedTables = () => SYNCED_TABLES.map((name) => db.table(name));

function emptyTables(): BackupTables {
  return { exercises: [], planEntries: [], workouts: [], sets: [], segments: [], bodyWeights: [] };
}

async function readSynced(): Promise<BackupTables> {
  const tables = emptyTables();
  for (const name of SYNCED_TABLES) (tables[name] as object[]) = await db.table(name).toArray();
  return tables;
}

/**
 * Liest die Ablage. `forUpload`: Ohne Anmeldung gespeicherte Zeilen tragen den Besitzer
 * „unauthorized“. Diese Felder fallen weg, Dexie Cloud setzt sie beim Speichern für den
 * angemeldeten Nutzer neu.
 */
async function readStash(forUpload = false): Promise<BackupTables> {
  const tables = emptyTables();
  for (const { table, row } of await db.stash.toArray()) {
    const copy: Record<string, unknown> = { ...row };
    if (forUpload) {
      delete copy.owner;
      delete copy.realmId;
      delete copy.$ts;
    }
    (tables[table] as object[]).push(copy);
  }
  return tables;
}

/** Legt Zeilen in die Ablage, statt sie direkt zu speichern (und damit hochzuladen). */
export async function addToStash(tables: BackupTables): Promise<void> {
  const rows: StashRow[] = SYNCED_TABLES.flatMap((table) =>
    tables[table].map((row) => ({ table, id: row.id, row })),
  );
  await db.stash.bulkPut(rows);
}

export async function hasStash(): Promise<boolean> {
  return (await db.stash.count()) > 0;
}

/** Vor dem Anmelden: alle Daten des Geräts in die Ablage, die Tabellen sind danach leer. */
export async function stashLocalData(): Promise<void> {
  await db.transaction('rw', [...syncedTables(), db.stash], async () => {
    await addToStash(await readSynced());
    await Promise.all(syncedTables().map((table) => table.clear()));
  });
}

/** Anmelden abgebrochen: alles unverändert zurück. Ohne Anmeldung wird dabei nichts hochgeladen. */
export async function restoreStash(): Promise<void> {
  await db.transaction('rw', [...syncedTables(), db.stash], async () => {
    const stashed = await readStash();
    for (const name of SYNCED_TABLES) await db.table(name).bulkPut(stashed[name]);
    await db.stash.clear();
  });
}

/**
 * Nach dem ersten Abgleich: Die Daten aus der Cloud sind da, die zurückgehaltenen Zeilen werden
 * nach mergeLocalIntoCloud ergänzt. Alles in einer Transaktion: Bricht sie ab, bleibt die Ablage
 * stehen und der nächste Abgleich versucht es erneut.
 */
export async function mergeStash(): Promise<void> {
  await db.transaction('rw', [...syncedTables(), db.stash], async () => {
    if ((await db.stash.count()) === 0) return;
    const merged = mergeLocalIntoCloud(await readSynced(), await readStash(true));
    for (const name of SYNCED_TABLES) await db.table(name).bulkPut(merged[name]);
    await db.stash.clear();
  });
}
