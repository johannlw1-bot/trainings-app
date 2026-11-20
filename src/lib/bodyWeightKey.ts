import type { Id, LocalDate } from '../db';

/**
 * Schlüssel des Körpergewichts eines Tages: „#2026-11-20“. Das „#“ macht ihn zu einem privaten
 * Schlüssel des Nutzers in Dexie Cloud. Tragen iPhone und Mac am selben Tag ein, bleibt ein Eintrag.
 */
export function bodyWeightId(date: LocalDate): Id {
  return `#${date}`;
}
