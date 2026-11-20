// Abgleich zwischen iPhone und Mac über Dexie Cloud: Start, Anmelden, Abmelden, fester Plan.
// Ohne Anmeldung läuft alles lokal. Andere Server als Dexie Cloud gibt es nicht.
import { db } from './db';
import { migrateLegacyData } from './lib/legacyDb';
import { buildDefaultPlan, isUntouchedDefaultPlan } from './lib/seed';

function isLoggedIn(): boolean {
  return !!db.cloud.currentUser.value.isLoggedIn;
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

/** Beim Start, bevor die App gezeigt wird. */
export async function startCloud(): Promise<void> {
  await db.open();
  await migrateLegacyData();
  await waitForUser();

  // Nicht angemeldet (auch direkt nach dem Abmelden, das die Daten auf dem Gerät leert):
  // fester Plan lokal, damit die App benutzbar ist.
  if (!isLoggedIn()) await seedDefaultPlan();
  db.cloud.currentUser.subscribe((user) => {
    if (user.isLoading || user.isLoggedIn || loginInProgress) return;
    seedDefaultPlan()
      .then((seeded) => seeded && bumpDataVersion())
      .catch((error) => console.error('Plan konnte nicht eingetragen werden', error));
  });

  // Angemeldet: erst nach einem Abgleich prüfen, ob es schon Übungen gibt.
  db.cloud.events.syncComplete.subscribe(() => {
    const seeding = isLoggedIn() ? seedDefaultPlan() : Promise.resolve(false);
    seeding
      .catch((error) => console.error('Plan konnte nicht eingetragen werden', error))
      .finally(bumpDataVersion);
  });
}

let loginInProgress = false;

/**
 * Meldet an. Die Abfrage von E-Mail und Code zeigt CloudDialog (db.cloud.userInteraction).
 *
 * Nach dem Anmelden lädt Dexie Cloud alle lokalen Daten hoch. Steht auf dem Gerät nur der
 * unveränderte feste Plan und noch kein Training, wird er vorher entfernt: Sonst gäbe es ihn nach
 * dem Abgleich doppelt, falls das andere Gerät ihn schon hochgeladen hat. Fehlt nach dem ersten
 * Abgleich jeder Plan, trägt seedDefaultPlan() ihn wieder ein. Ein geänderter Plan oder eingetragene
 * Trainings bleiben immer erhalten und werden hochgeladen.
 */
export async function login(): Promise<void> {
  if (isLoggedIn()) return;
  loginInProgress = true;
  try {
    await db.transaction(
      'rw',
      [db.exercises, db.planEntries, db.workouts, db.sets, db.segments],
      async () => {
        const trained =
          (await db.workouts.count()) + (await db.sets.count()) + (await db.segments.count()) > 0;
        const plan = { exercises: await db.exercises.toArray(), planEntries: await db.planEntries.toArray() };
        if (trained || !isUntouchedDefaultPlan(plan)) return;
        await db.planEntries.clear();
        await db.exercises.clear();
      },
    );
    await db.cloud.login();
  } finally {
    loginInProgress = false;
    // Abgebrochen oder fehlgeschlagen: Der Plan muss wieder da sein.
    if (!isLoggedIn()) {
      await seedDefaultPlan();
      bumpDataVersion();
    }
  }
}

/**
 * Meldet ab. Dexie Cloud leert dabei die Daten auf diesem Gerät, in der Cloud bleiben sie erhalten.
 * Gibt es noch nicht abgeglichene Änderungen, fragt CloudDialog vorher nach.
 */
export async function logout(): Promise<void> {
  await db.cloud.logout();
}
