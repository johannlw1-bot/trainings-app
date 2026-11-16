// Reine Hilfsfunktionen für den Plan, ohne Datenbankzugriff.

export const WARMUP_RANGE = { min: 0, max: 3, initial: 0 };
export const SETS_RANGE = { min: 1, max: 10, initial: 3 };
export const REPS_RANGE = { min: 1, max: 50, initialMin: 8, initialMax: 12 };

/** Die Ziele einer Übung in einer Liste. */
export interface Targets {
  warmupSets: number;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
}

export const INITIAL_TARGETS: Targets = {
  warmupSets: WARMUP_RANGE.initial,
  targetSets: SETS_RANGE.initial,
  targetRepsMin: REPS_RANGE.initialMin,
  targetRepsMax: REPS_RANGE.initialMax,
};

/** Leerzeichen am Rand entfernen und mehrfache Leerzeichen zusammenziehen. */
export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/** Zwei Namen gelten als gleich, wenn sie sich nur in Groß-/Kleinschreibung oder Leerzeichen unterscheiden. */
export function sameName(a: string, b: string): boolean {
  return normalizeName(a).toLocaleLowerCase('de') === normalizeName(b).toLocaleLowerCase('de');
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Verschiebt das Element an `index` um eine Stelle nach oben (-1) oder unten (+1).
 * Gibt eine neue Liste zurück, oder null, wenn es am Rand steht und nichts zu tun ist.
 */
export function moveItem<T>(items: readonly T[], index: number, direction: -1 | 1): T[] | null {
  const target = index + direction;
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return null;
  const moved = [...items];
  [moved[index], moved[target]] = [moved[target], moved[index]];
  return moved;
}

/**
 * Hält den Wiederholungsbereich gültig: Wird das untere Ende über das obere geschoben
 * (oder umgekehrt), wandert das andere Ende mit.
 */
export function adjustRepRange(
  min: number,
  max: number,
  changed: 'min' | 'max',
): { min: number; max: number } {
  const lo = clamp(min, REPS_RANGE.min, REPS_RANGE.max);
  const hi = clamp(max, REPS_RANGE.min, REPS_RANGE.max);
  if (lo <= hi) return { min: lo, max: hi };
  return changed === 'min' ? { min: lo, max: lo } : { min: hi, max: hi };
}

/** „8–12“, oder „10“, wenn beide Enden gleich sind. */
export function formatReps(min: number, max: number): string {
  return min === max ? String(min) : `${min}–${max}`;
}

/** „1 Aufwärmsatz + 3 × 8–12“ bzw. „3 × 8–12“. */
export function formatTarget(targets: Targets): string {
  const work = `${targets.targetSets} × ${formatReps(targets.targetRepsMin, targets.targetRepsMax)}`;
  if (targets.warmupSets === 0) return work;
  const warmup = targets.warmupSets === 1 ? '1 Aufwärmsatz' : `${targets.warmupSets} Aufwärmsätze`;
  return `${warmup} + ${work}`;
}
