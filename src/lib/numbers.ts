// Eingabe und Anzeige von Gewichten und Wiederholungen.

const MAX_WEIGHT_KG = 999;
const MAX_REPS = 999;

/**
 * Liest ein Gewicht aus der Eingabe. Komma und Punkt sind erlaubt, 0 ist gültig
 * (Übungen mit dem eigenen Körpergewicht). Gibt null zurück, wenn die Eingabe keine gültige Zahl ist.
 */
export function parseWeight(input: string): number | null {
  const text = input.trim().replace(',', '.');
  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(text)) return null;
  const value = Math.round(Number(text) * 100) / 100;
  return value >= 0 && value <= MAX_WEIGHT_KG ? value : null;
}

/** Liest Wiederholungen: eine ganze Zahl ab 1. */
export function parseReps(input: string): number | null {
  const text = input.trim();
  if (!/^\d+$/.test(text)) return null;
  const value = Number(text);
  return value >= 1 && value <= MAX_REPS ? value : null;
}

const kgFormat = new Intl.NumberFormat('de', { maximumFractionDigits: 2, useGrouping: false });

/** „82,5“ oder „80“: Komma als Dezimaltrenner, keine überflüssigen Nullen. */
export function formatKg(value: number): string {
  return kgFormat.format(value);
}
