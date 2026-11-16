import type { Split } from '../db';

/** Index = Date.getDay(), also Sonntag = 0. Mo/Do Oberkörper, Di/Fr Unterkörper, sonst Ruhetag. */
const BY_WEEKDAY: (Split | null)[] = [null, 'upper', 'lower', null, 'upper', 'lower', null];

export const SPLITS: { split: Split; label: string; days: string }[] = [
  { split: 'upper', label: 'Oberkörper', days: 'Mo · Do' },
  { split: 'lower', label: 'Unterkörper', days: 'Di · Fr' },
];

export function splitLabel(split: Split): string {
  return split === 'upper' ? 'Oberkörper' : 'Unterkörper';
}

/** Welche Liste an diesem Tag dran ist, oder null an einem Ruhetag. */
export function splitForDate(date: Date): Split | null {
  return BY_WEEKDAY[date.getDay()];
}

/** Der nächste Trainingstag nach dem angegebenen Tag (der Tag selbst zählt nicht). */
export function nextTraining(after: Date): { date: Date; split: Split } {
  const date = new Date(after.getFullYear(), after.getMonth(), after.getDate());
  for (;;) {
    date.setDate(date.getDate() + 1);
    const split = splitForDate(date);
    if (split) return { date, split };
  }
}
