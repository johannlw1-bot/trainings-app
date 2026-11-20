// Zurück-Navigation für Unterseiten. Wurde die Unterseite innerhalb der App geöffnet,
// geht es im Browser-Verlauf zurück (so landet man wieder auf der Seite, von der man kam).
// Wurde sie direkt aufgerufen, gibt es nichts zum Zurückgehen, dann gilt die Ausweichseite.

let depth = 0;
let returning = false;
let replacing = false;
let previousHash = '';

/** Bei jedem Seitenwechsel aufrufen (hashchange). */
export function noteNavigation(event: HashChangeEvent): void {
  previousHash = new URL(event.oldURL).hash;
  if (replacing) {
    // Die Seite wurde ersetzt, der Verlauf ist nicht länger geworden.
    replacing = false;
  } else if (returning) {
    returning = false;
    depth = Math.max(0, depth - 1);
  } else {
    depth += 1;
  }
}

export function goBack(fallbackHash: string): void {
  returning = true;
  if (depth > 0) {
    window.history.back();
  } else {
    window.location.replace(fallbackHash);
  }
}

/** Wechselt die Seite, ohne einen neuen Eintrag im Verlauf anzulegen. */
export function replaceHash(hash: string): void {
  if (window.location.hash === hash) return;
  replacing = true;
  window.location.replace(hash);
}

/**
 * Führt zu `hash`, z. B. nach dem Löschen eines Trainings zurück zum Verlauf. Kam man von genau
 * dieser Seite, geht es im Verlauf zurück, sonst wird die aktuelle Seite ersetzt. So entstehen
 * keine doppelten Einträge und der Zurück-Pfeil führt nicht auf die gelöschte Seite.
 */
export function returnTo(hash: string): void {
  if (depth > 0 && previousHash === hash) {
    goBack(hash);
  } else {
    replaceHash(hash);
  }
}
