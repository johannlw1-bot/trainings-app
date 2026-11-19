// Display während des Trainings wach halten (Screen Wake Lock API).
// Der Browser gibt die Sperre frei, sobald die App in den Hintergrund geht oder das iPhone
// gesperrt wird. Deshalb wird sie bei jeder Rückkehr neu angefordert.
// Fehlt die Funktion oder lehnt der Browser ab, passiert nichts: Die App läuft normal weiter.

/** Hält das Display wach, bis die zurückgegebene Funktion aufgerufen wird. */
export function keepScreenOn(): () => void {
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return () => {};

  let sentinel: WakeLockSentinel | null = null;
  let stopped = false;

  const request = async () => {
    if (stopped || document.visibilityState !== 'visible') return;
    if (sentinel && !sentinel.released) return;
    try {
      sentinel = await navigator.wakeLock.request('screen');
      // Wurde in der Zwischenzeit aufgeräumt, die eben erhaltene Sperre gleich wieder freigeben.
      if (stopped) sentinel.release().catch(() => {});
    } catch {
      // Abgelehnt, z. B. im Stromsparmodus. Kein Fehler für die App.
    }
  };

  const onVisibility = () => {
    if (document.visibilityState === 'visible') request();
  };

  document.addEventListener('visibilitychange', onVisibility);
  request();

  return () => {
    stopped = true;
    document.removeEventListener('visibilitychange', onVisibility);
    sentinel?.release().catch(() => {});
  };
}
