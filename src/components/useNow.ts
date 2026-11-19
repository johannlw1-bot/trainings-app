import { useEffect, useState } from 'react';

/**
 * Aktuelle Zeit in Millisekunden, zweimal pro Sekunde und bei der Rückkehr in die App aktualisiert.
 * Für Timer, die aus gespeicherten Zeitstempeln rechnen.
 */
export function useNow(): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const update = () => setNow(Date.now());
    const interval = window.setInterval(update, 500);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  return now;
}
