// Reine Hilfsfunktionen für den Plan, ohne Datenbankzugriff.

export const SETS_RANGE = { min: 1, max: 10, initial: 3 };
export const REPS_RANGE = { min: 1, max: 50, initial: 10 };

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

/** „3 Sätze × 10 Wdh“, mit richtiger Einzahl. */
export function formatTarget(sets: number, reps: number): string {
  return `${sets} ${sets === 1 ? 'Satz' : 'Sätze'} × ${reps} Wdh`;
}
