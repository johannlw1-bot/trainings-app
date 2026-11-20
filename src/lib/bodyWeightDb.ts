import { db, type BodyWeight, type LocalDate } from '../db';
import { bodyWeightId } from './bodyWeightKey';

/** Alle Einträge, aufsteigend nach Datum. */
export function loadBodyWeights(): Promise<BodyWeight[]> {
  return db.bodyWeights.orderBy('date').toArray();
}

/** Ein Eintrag pro Tag: Ein zweiter Eintrag am selben Tag überschreibt den ersten. */
export async function saveBodyWeight(date: LocalDate, weightKg: number): Promise<void> {
  await db.bodyWeights.put({ id: bodyWeightId(date), date, weightKg });
}

export async function deleteBodyWeight(date: LocalDate): Promise<void> {
  await db.bodyWeights.delete(bodyWeightId(date));
}
