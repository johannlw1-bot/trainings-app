// Der feste Trainingsplan, der beim ersten Start eingetragen wird.
import { db, type Split } from '../db';

interface SeedExercise {
  name: string;
  warmupSets: number;
  sets: number;
  reps: [min: number, max: number];
}

export const DEFAULT_PLAN: Record<Split, SeedExercise[]> = {
  upper: [
    { name: 'Brustpresse', warmupSets: 1, sets: 3, reps: [8, 12] },
    { name: 'Rudern (Maschine)', warmupSets: 1, sets: 3, reps: [8, 12] },
    { name: 'Schulterpresse', warmupSets: 0, sets: 3, reps: [8, 12] },
    { name: 'Latzug', warmupSets: 0, sets: 3, reps: [8, 12] },
    { name: 'Butterfly', warmupSets: 0, sets: 3, reps: [10, 15] },
    { name: 'Seitheben (Maschine/Kabel)', warmupSets: 0, sets: 3, reps: [12, 15] },
    { name: 'Reverse Butterfly', warmupSets: 0, sets: 3, reps: [12, 15] },
    { name: 'Trizeps am Kabelturm', warmupSets: 0, sets: 3, reps: [10, 15] },
    { name: 'Bizeps am Kabelturm', warmupSets: 0, sets: 3, reps: [10, 15] },
  ],
  lower: [
    { name: 'Beinpresse', warmupSets: 1, sets: 3, reps: [8, 12] },
    { name: 'Beinbeuger', warmupSets: 1, sets: 3, reps: [10, 12] },
    { name: 'Beinstrecker', warmupSets: 0, sets: 3, reps: [10, 15] },
    { name: 'Abduktoren', warmupSets: 0, sets: 3, reps: [12, 15] },
    { name: 'Adduktoren', warmupSets: 0, sets: 3, reps: [12, 15] },
    { name: 'Waden an der Beinpresse', warmupSets: 0, sets: 3, reps: [12, 15] },
    { name: 'Bauch (Crunch-Maschine)', warmupSets: 0, sets: 3, reps: [12, 15] },
  ],
};

/**
 * Trägt den festen Plan ein, aber nur, wenn es noch gar keine Übungen gibt.
 * So werden spätere Änderungen am Plan nie überschrieben. Gibt zurück, ob etwas eingetragen wurde.
 */
export async function seedDefaultPlan(): Promise<boolean> {
  return db.transaction('rw', db.exercises, db.planEntries, async () => {
    if ((await db.exercises.count()) > 0) return false;

    for (const split of ['upper', 'lower'] as const) {
      for (const [order, item] of DEFAULT_PLAN[split].entries()) {
        const exerciseId = await db.exercises.add({ name: item.name, archived: false });
        await db.planEntries.add({
          split,
          exerciseId,
          order,
          warmupSets: item.warmupSets,
          targetSets: item.sets,
          targetRepsMin: item.reps[0],
          targetRepsMax: item.reps[1],
        });
      }
    }
    return true;
  });
}
