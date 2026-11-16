// Zurück-Navigation für Unterseiten. Wurde die Unterseite innerhalb der App geöffnet,
// geht es im Browser-Verlauf zurück (so landet man wieder auf dem Tab, von dem man kam).
// Wurde sie direkt aufgerufen, gibt es nichts zum Zurückgehen, dann gilt die Ausweichseite.

let depth = 0;
let returning = false;

/** Bei jedem Seitenwechsel aufrufen (hashchange). */
export function noteNavigation(): void {
  if (returning) {
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
