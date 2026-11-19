import { elapsedMs, formatTimer } from '../lib/duration';
import { useNow } from './useNow';

/**
 * Laufende Gesamtzeit eines Trainings. Sie wird bei jedem Tick aus dem gespeicherten Start
 * berechnet und stimmt deshalb sofort wieder, nachdem das iPhone gesperrt war.
 */
export default function WorkoutTimer({ startedAt, className = 'num num--l' }: { startedAt: string; className?: string }) {
  const now = useNow();
  return (
    <p className={`${className} timer`} role="timer" aria-label="Trainingsdauer">
      {formatTimer(elapsedMs(startedAt, now))}
    </p>
  );
}
