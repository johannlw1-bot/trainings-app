import { describe, expect, it } from 'vitest';
import { convertLegacy, isLegacyEmpty, type LegacyTables, type NewId } from './legacy';

const empty: LegacyTables = {
  exercises: [],
  planEntries: [],
  workouts: [],
  sets: [],
  segments: [],
  bodyWeights: [],
};

const legacy: LegacyTables = {
  exercises: [
    { id: 1, name: 'Brustpresse', archived: false },
    { id: 2, name: 'Latzug', archived: true, note: 'Griff eng' },
  ],
  planEntries: [
    { id: 5, split: 'upper', exerciseId: 1, order: 0, warmupSets: 1, targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
  ],
  workouts: [
    { id: 7, date: '2026-11-19', split: 'upper', startedAt: '2026-11-19T17:00:00.000Z', finishedAt: '2026-11-19T18:00:00.000Z' },
  ],
  sets: [
    { id: 1, workoutId: 7, exerciseId: 1, warmup: true, setNumber: 1, weightKg: 40, reps: 10 },
    { id: 2, workoutId: 7, exerciseId: 2, warmup: false, setNumber: 1, weightKg: 82.5, reps: 8 },
  ],
  segments: [{ id: 3, workoutId: 7, exerciseId: 1, startedAt: '2026-11-19T17:00:00.000Z', endedAt: '2026-11-19T17:20:00.000Z' }],
  bodyWeights: [{ date: '2026-11-19', weightKg: 78.4 }],
};

/** Zählt pro Tabelle hoch: exercises-1, exercises-2 … */
function counter(): NewId {
  const counts: Record<string, number> = {};
  return (table) => {
    counts[table] = (counts[table] ?? 0) + 1;
    return `${table}-${counts[table]}`;
  };
}

describe('convertLegacy', () => {
  const converted = convertLegacy(legacy, counter());

  it('gibt jeder Zeile einen Text-Schlüssel und behält alle Felder', () => {
    expect(converted.exercises).toEqual([
      { id: 'exercises-1', name: 'Brustpresse', archived: false },
      { id: 'exercises-2', name: 'Latzug', archived: true, note: 'Griff eng' },
    ]);
    expect(converted.workouts).toEqual([{ ...legacy.workouts[0], id: 'workouts-1' }]);
  });

  it('setzt die Verweise auf Übung und Training um', () => {
    expect(converted.planEntries[0]).toMatchObject({ exerciseId: 'exercises-1', targetRepsMax: 12 });
    expect(converted.sets.map((set) => [set.workoutId, set.exerciseId, set.warmup, set.weightKg])).toEqual([
      ['workouts-1', 'exercises-1', true, 40],
      ['workouts-1', 'exercises-2', false, 82.5],
    ]);
    expect(converted.segments[0]).toMatchObject({ workoutId: 'workouts-1', exerciseId: 'exercises-1' });
  });

  it('schlüsselt das Körpergewicht nach dem Tag', () => {
    expect(converted.bodyWeights).toEqual([{ id: '#2026-11-19', date: '2026-11-19', weightKg: 78.4 }]);
  });

  it('verliert keine Zeile', () => {
    for (const table of Object.keys(legacy) as (keyof LegacyTables)[]) {
      expect(converted[table]).toHaveLength(legacy[table].length);
    }
  });

  it('behält Sätze auch dann, wenn ihre Übung fehlt', () => {
    const orphan = convertLegacy({ ...empty, sets: [legacy.sets[0]] }, counter());
    expect(orphan.sets[0]).toMatchObject({ workoutId: 'workouts-1', exerciseId: 'exercises-1' });
  });
});

describe('isLegacyEmpty', () => {
  it('erkennt, ob es noch etwas umzuwandeln gibt', () => {
    expect(isLegacyEmpty(empty)).toBe(true);
    expect(isLegacyEmpty({ ...empty, bodyWeights: legacy.bodyWeights })).toBe(false);
  });
});
