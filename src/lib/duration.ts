// Trainingsdauer: Timer-Anzeige und gespeicherte Dauer. Alles wird aus Zeitstempeln berechnet,
// nicht hochgezählt. Deshalb stimmt der Timer auch, wenn Safari geschlossen oder das iPhone gesperrt war.
import type { Workout } from '../db';

const pad = (value: number) => String(value).padStart(2, '0');

/** Vergangene Zeit seit dem Start in Millisekunden, nie negativ. */
export function elapsedMs(startedAt: string, now: number): number {
  return Math.max(0, now - Date.parse(startedAt));
}

/** Timer-Anzeige: „0:07“, „12:34“, ab einer Stunde „1:05:00“. */
export function formatTimer(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/** Kurze Dauer für Listen: „< 1 Min“, „52 Min“, „1 Std 5 Min“, „2 Std“. */
export function formatDurationShort(ms: number): string {
  const minutes = Math.round(Math.max(0, ms) / 60000);
  if (minutes < 1) return '< 1 Min';
  if (minutes < 60) return `${minutes} Min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} Std ${rest} Min` : `${hours} Std`;
}

/** Dauer eines beendeten Trainings, gespeichert als Start- und Endzeitpunkt. */
export function workoutDuration(workout: Pick<Workout, 'startedAt' | 'finishedAt'>): number | undefined {
  return workout.finishedAt ? elapsedMs(workout.startedAt, Date.parse(workout.finishedAt)) : undefined;
}
