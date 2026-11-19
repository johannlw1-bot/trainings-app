// Zeit pro Übung. Jeder Aufenthalt bei einer Übung ist ein Abschnitt (Segment) mit Start und Ende.
// Die Zeiten werden aus diesen Zeitstempeln berechnet, nie hochgezählt. Deshalb stimmen sie auch,
// wenn Safari geschlossen oder das iPhone gesperrt war.
import type { Segment } from '../db';

type SegmentTimes = Pick<Segment, 'exerciseId' | 'startedAt' | 'endedAt'>;

/** Dauer eines Abschnitts. Ein offener Abschnitt läuft bis `now`. Nie negativ. */
export function segmentMs(segment: Pick<Segment, 'startedAt' | 'endedAt'>, now: number): number {
  const end = segment.endedAt ? Date.parse(segment.endedAt) : now;
  return Math.max(0, end - Date.parse(segment.startedAt));
}

/** Zusammengezählte Zeit je Übung über alle ihre Abschnitte. */
export function exerciseTimes(segments: readonly SegmentTimes[], now: number): Map<number, number> {
  const times = new Map<number, number>();
  for (const segment of segments) {
    times.set(segment.exerciseId, (times.get(segment.exerciseId) ?? 0) + segmentMs(segment, now));
  }
  return times;
}

/**
 * Die Übung, die gerade angezeigt wird: die mit dem offenen Abschnitt.
 * Gibt es keinen offenen (z. B. nach dem Beenden), die zuletzt begonnene.
 */
export function activeExerciseId(segments: readonly SegmentTimes[]): number | undefined {
  const open = segments.filter((segment) => !segment.endedAt);
  const pool = open.length ? open : segments;
  return [...pool].sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0]?.exerciseId;
}

export type ExerciseStatus = 'open' | 'current' | 'done';

/**
 * Status einer Übung im laufenden Training. Erledigt ist sie, wenn mindestens ein Arbeitssatz
 * eingetragen ist und sie mindestens einmal verlassen wurde (abgeschlossener Abschnitt).
 */
export function exerciseStatus(
  exerciseId: number,
  currentId: number | undefined,
  segments: readonly SegmentTimes[],
  workingSetCount: number,
): ExerciseStatus {
  if (exerciseId === currentId) return 'current';
  const left = segments.some((segment) => segment.exerciseId === exerciseId && segment.endedAt);
  return workingSetCount > 0 && left ? 'done' : 'open';
}

/**
 * Ziel von „Nächste Übung“: die nächste noch nicht erledigte Übung in Planreihenfolge nach der
 * aktuellen. Ist danach keine mehr offen, geht die Suche vorne weiter. Die aktuelle Übung selbst
 * zählt nicht. Gibt null zurück, wenn alle anderen erledigt sind.
 */
export function nextOpenExercise(
  order: readonly number[],
  currentId: number | undefined,
  isDone: (exerciseId: number) => boolean,
): number | null {
  const start = currentId === undefined ? -1 : order.indexOf(currentId);
  for (let step = 1; step <= order.length; step++) {
    const candidate = order[(start + step + order.length) % order.length];
    if (candidate !== currentId && !isDone(candidate)) return candidate;
  }
  return null;
}

/** Ziel von „Zurück“: die vorige Übung in Planreihenfolge, ohne Umlauf. */
export function previousExercise(order: readonly number[], currentId: number | undefined): number | null {
  const index = currentId === undefined ? -1 : order.indexOf(currentId);
  return index > 0 ? order[index - 1] : null;
}

/** Anteil der eingetragenen Arbeitssätze an den geplanten, zwischen 0 und 1. */
export function setProgress(doneWorkingSets: number, plannedWorkingSets: number): number {
  if (plannedWorkingSets <= 0) return doneWorkingSets > 0 ? 1 : 0;
  return Math.min(1, Math.max(0, doneWorkingSets / plannedWorkingSets));
}

export interface SegmentSwitch {
  /** Abschnitte, die jetzt enden */
  close: number[];
  /** Neuer Abschnitt für diese Übung, oder null, wenn sie schon läuft */
  open: number | null;
}

/** Was beim Wechsel zu einer Übung passiert: offene Abschnitte schließen, einen neuen öffnen. */
export function planSwitch(
  segments: readonly Pick<Segment, 'id' | 'exerciseId' | 'endedAt'>[],
  toExerciseId: number,
): SegmentSwitch {
  const open = segments.filter((segment) => !segment.endedAt);
  if (open.length === 1 && open[0].exerciseId === toExerciseId) return { close: [], open: null };
  return { close: open.map((segment) => segment.id), open: toExerciseId };
}
