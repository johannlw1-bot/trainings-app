import { useEffect, useState } from 'react';
import { elapsedMs, formatTimer } from '../lib/duration';

/**
 * Laufender Trainingstimer. Er zählt nicht selbst hoch, sondern rechnet bei jedem Tick
 * die Zeit seit dem gespeicherten Start aus. Nach dem Sperren des iPhones oder dem
 * Wechsel zurück in die App stimmt er deshalb sofort wieder.
 */
export default function WorkoutTimer({ startedAt }: { startedAt: string }) {
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

  return (
    <p className="num num--l timer" role="timer" aria-label="Trainingsdauer">
      {formatTimer(elapsedMs(startedAt, now))}
    </p>
  );
}
