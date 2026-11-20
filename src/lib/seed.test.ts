import { describe, expect, it } from 'vitest';
import { buildDefaultPlan, DEFAULT_PLAN, isUntouchedDefaultPlan, type PlanRows } from './seed';

const prefixes = { exercises: 'exr', planEntries: 'plnE' };

/** Derselbe Plan mit anderen Schlüsseln, wie nach der Umwandlung alter Daten. */
function withOtherIds(rows: PlanRows): PlanRows {
  const ids = new Map(rows.exercises.map((exercise, i) => [exercise.id, `exrRandom${i}`]));
  return {
    exercises: rows.exercises.map((exercise) => ({ ...exercise, id: ids.get(exercise.id)! })),
    planEntries: rows.planEntries.map((entry, i) => ({
      ...entry,
      id: `plnERandom${i}`,
      exerciseId: ids.get(entry.exerciseId)!,
    })),
  };
}

describe('buildDefaultPlan', () => {
  const rows = buildDefaultPlan(prefixes);

  it('enthält alle Übungen beider Listen', () => {
    const total = DEFAULT_PLAN.upper.length + DEFAULT_PLAN.lower.length;
    expect(rows.exercises).toHaveLength(total);
    expect(rows.planEntries).toHaveLength(total);
  });

  it('hat feste, private Schlüssel mit dem Präfix der Tabelle', () => {
    expect(rows.exercises[0].id).toBe('#exrPlanUpper0');
    expect(rows.planEntries[0]).toMatchObject({ id: '#plnEPlanUpper0', exerciseId: '#exrPlanUpper0' });
    expect(new Set(rows.exercises.map((exercise) => exercise.id)).size).toBe(rows.exercises.length);
  });

  it('ergibt auf jedem Gerät dieselben Zeilen, damit der Plan nicht doppelt entsteht', () => {
    expect(buildDefaultPlan(prefixes)).toEqual(rows);
  });
});

describe('isUntouchedDefaultPlan', () => {
  const rows = buildDefaultPlan(prefixes);

  it('erkennt den unveränderten Plan, auch mit anderen Schlüsseln', () => {
    expect(isUntouchedDefaultPlan(rows)).toBe(true);
    expect(isUntouchedDefaultPlan(withOtherIds(rows))).toBe(true);
  });

  it('erkennt geänderte Ziele', () => {
    const changed = { ...rows, planEntries: rows.planEntries.map((e, i) => (i === 0 ? { ...e, targetSets: 4 } : e)) };
    expect(isUntouchedDefaultPlan(changed)).toBe(false);
  });

  it('erkennt umbenannte, verschobene, gelöschte und neue Übungen', () => {
    const renamed = { ...rows, exercises: rows.exercises.map((e, i) => (i === 0 ? { ...e, name: 'Bankdrücken' } : e)) };
    const moved = {
      ...rows,
      planEntries: rows.planEntries.map((e, i) => (i === 0 ? { ...e, order: 1 } : i === 1 ? { ...e, order: 0 } : e)),
    };
    const removed = { exercises: rows.exercises.slice(1), planEntries: rows.planEntries.slice(1) };
    const added = { ...rows, exercises: [...rows.exercises, { id: 'exrNew', name: 'Dips', archived: false }] };
    for (const plan of [renamed, moved, removed, added]) expect(isUntouchedDefaultPlan(plan)).toBe(false);
  });

  it('erkennt eine Notiz an einer Übung', () => {
    const noted = { ...rows, exercises: rows.exercises.map((e, i) => (i === 0 ? { ...e, note: 'Sitz 4' } : e)) };
    expect(isUntouchedDefaultPlan(noted)).toBe(false);
  });

  it('ein leerer Plan ist nicht der feste Plan', () => {
    expect(isUntouchedDefaultPlan({ exercises: [], planEntries: [] })).toBe(false);
  });
});
