// Abgleich zwischen iPhone und Mac über Dexie Cloud: Start, Anmelden, Abmelden, fester Plan.
// Ohne Anmeldung läuft alles lokal. Andere Server als Dexie Cloud gibt es nicht.
import { db } from './db';
import { migrateLegacyData } from './lib/legacyDb';
import { buildDefaultPlan } from './lib/seed';
import { mergeStash, restoreStash, stashLocalData } from './lib/stashDb';

function isLoggedIn(): boolean {
  return !!db.cloud.currentUser.value.isLoggedIn;
}

/**
 * Hat ein Abgleich die Daten des angemeldeten Nutzers schon geholt? Direkt aus der Tabelle
 * $syncState von Dexie Cloud gelesen, das Observable persistedSyncState kann hinterherhinken.
 */
async function userDataSynced(): Promise<boolean> {
  if (!isLoggedIn()) return false;
  const state = (await db.table('$syncState').get('syncState')) as { realms?: string[] } | undefined;
  return state?.realms?.includes(db.cloud.currentUserId) ?? false;
}

/**
 * Trägt den festen Plan ein, aber nur, wenn es noch gar keine Übungen gibt. So werden spätere
 * Änderungen am Plan nie überschrieben. Angemeldet wird das erst nach einem Abgleich aufgerufen,
 * damit der Plan aus der Cloud zuerst ankommt.
 */
export async function seedDefaultPlan(): Promise<boolean> {
  const schema = db.cloud.schema;
  const rows = buildDefaultPlan({
    exercises: schema?.exercises?.idPrefix ?? '',
    planEntries: schema?.planEntries?.idPrefix ?? '',
  });
  return db.transaction('rw', db.exercises, db.planEntries, async () => {
    if ((await db.exercises.count()) > 0) return false;
    await db.exercises.bulkPut(rows.exercises);
    await db.planEntries.bulkPut(rows.planEntries);
    return true;
  });
}

// Seiten laden ihre Daten beim Öffnen. Kommen durch den Abgleich neue Daten an, zählt dieser Wert
// hoch und die Übersicht und die Auswertungen laden neu (useDataVersion).
let dataVersion = 0;
const versionListeners = new Set<() => void>();

function bumpDataVersion(): void {
  dataVersion += 1;
  versionListeners.forEach((listener) => listener());
}

export const dataVersionStore = {
  get: () => dataVersion,
  subscribe(listener: () => void) {
    versionListeners.add(listener);
    return () => versionListeners.delete(listener);
  },
};

async function waitForUser(): Promise<void> {
  if (!db.cloud.currentUser.value.isLoading) return;
  await new Promise<void>((resolve) => {
    const subscription = db.cloud.currentUser.subscribe((user) => {
      if (user.isLoading) return;
      queueMicrotask(() => subscription.unsubscribe());
      resolve();
    });
  });
}

let loginInProgress = false;

/**
 * Bringt die Daten in einen stimmigen Zustand. Läuft beim Start, nach jedem Abgleich und wenn sich
 * die Anmeldung ändert, immer nacheinander (settled), nie gleichzeitig.
 * - Angemeldet, nach dem Abgleich: zurückgehaltene Daten des Geräts zusammenführen, dann den festen
 *   Plan eintragen, falls es noch gar keine Übungen gibt.
 * - Nicht angemeldet (auch nach abgebrochenem Anmelden oder nach dem Abmelden, das die Daten auf
 *   dem Gerät leert): zurückgehaltene Daten zurücklegen, fester Plan, damit die App benutzbar ist.
 */
async function settle(): Promise<void> {
  if (isLoggedIn()) {
    if (!(await userDataSynced())) return;
    await mergeStash();
    await seedDefaultPlan();
  } else {
    if (loginInProgress) return;
    await restoreStash();
    await seedDefaultPlan();
  }
  bumpDataVersion();
}

let settled: Promise<void> = Promise.resolve();

function scheduleSettle(): Promise<void> {
  settled = settled
    .then(settle)
    .catch((error) => console.error('Daten konnten nicht abgestimmt werden', error));
  return settled;
}

/** Beim Start, bevor die App gezeigt wird. */
export async function startCloud(): Promise<void> {
  await db.open();
  await waitForUser();
  await migrateLegacyData(isLoggedIn());
  await scheduleSettle();

  db.cloud.currentUser.subscribe((user) => {
    if (!user.isLoading) void scheduleSettle();
  });
  db.cloud.events.syncComplete.subscribe(() => void scheduleSettle());
}

/**
 * Meldet an. Die Abfrage von E-Mail und Code zeigt CloudCard (db.cloud.userInteraction).
 *
 * Dexie Cloud würde nach dem Anmelden alle Daten des Geräts hochladen, auch einen Plan, den die
 * Cloud schon hat. Deshalb kommen sie vorher in die Ablage (stash) und werden nach dem ersten
 * Abgleich zusammengeführt: gleiche Übungen nicht doppelt, nichts geht verloren (lib/merge.ts).
 */
export async function login(): Promise<void> {
  if (isLoggedIn()) return;
  loginInProgress = true;
  try {
    await settled;
    await stashLocalData();
    await db.cloud.login();
  } finally {
    loginInProgress = false;
    // Abgebrochen: Daten zurück. Angemeldet: zusammenführen, sobald der Abgleich da ist.
    await scheduleSettle();
  }
}

/**
 * Meldet ab. Dexie Cloud leert dabei die Daten auf diesem Gerät, in der Cloud bleiben sie erhalten.
 * Gibt es noch nicht abgeglichene Änderungen, fragt CloudCard vorher nach.
 */
export async function logout(): Promise<void> {
  await db.cloud.logout();
}
