import { describe, expect, it } from 'vitest';
import type { WorkoutSet } from '../db';
import type { LastTime } from './lastTime';
import { buildRows, pendingSaves, pressCheck, shownDraft, typeInto, type Draft, type SetRowModel } from './setEntry';

const exercise = { warmupSets: 0, targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 };
const last: LastTime = {
  date: '2026-11-12',
  sets: [
    { setNumber: 1, weightKg: 80, reps: 8 },
    { setNumber: 2, weightKg: 80, reps: 7 },
  ],
  warmups: [],
};

const saved = (setNumber: number, weightKg: number, reps: number, warmup = false): WorkoutSet => ({
  id: setNumber,
  workoutId: 1,
  exerciseId: 1,
  warmup,
  setNumber,
  weightKg,
  reps,
});

const row = (savedSet?: WorkoutSet): SetRowModel => ({
  warmup: false,
  setNumber: 1,
  saved: savedSet,
  suggestion: { weightKg: 80, reps: 8 },
});

/** Simuliert eine Zeile: Tippen und Haken wie in der Oberfläche, mit einer kleinen „Datenbank“. */
function simulate(start?: WorkoutSet) {
  let stored = start;
  let draft: Draft | undefined;
  const apply = (result: ReturnType<typeof pressCheck>) => {
    draft = result.draft;
    if (result.kind === 'save') stored = saved(1, result.value.weightKg, result.value.reps);
    if (result.kind === 'clear') stored = undefined;
  };
  return {
    type(field: 'weight' | 'reps', text: string) {
      const current = shownDraft(draft, stored);
      apply(typeInto({ ...current, [field]: text }, row(stored)));
    },
    check() {
      apply(pressCheck(shownDraft(draft, stored), row(stored)));
    },
    get stored() {
      return stored;
    },
    get fields() {
      return shownDraft(draft, stored);
    },
  };
}

describe('Satz eintragen', () => {
  it('Wert eintippen, dann Haken drücken → Satz ist gespeichert', () => {
    const set = simulate();
    set.type('weight', '85');
    expect(set.stored).toBeUndefined();
    set.check();
    expect(set.stored).toMatchObject({ weightKg: 85, reps: 8 });
    expect(set.fields).toMatchObject({ weight: '85', reps: '8' });
  });

  it('beide Werte eintippen, dann Haken → beide gespeichert', () => {
    const set = simulate();
    set.type('weight', '82,5');
    set.type('reps', '10');
    set.check();
    expect(set.stored).toMatchObject({ weightKg: 82.5, reps: 10 });
  });

  it('Tippen allein speichert nichts, die Werte stehen aber im Feld', () => {
    const set = simulate();
    set.type('weight', '85');
    set.type('reps', '6');
    expect(set.stored).toBeUndefined();
    expect(set.fields).toEqual({ weight: '85', reps: '6', typed: true });
  });

  it('Haken ohne Eingabe übernimmt den grauen Vorschlag', () => {
    const set = simulate();
    set.check();
    expect(set.stored).toMatchObject({ weightKg: 80, reps: 8 });
  });

  it('Haken auf gespeichertem Satz trägt ihn aus, die Werte bleiben im Feld', () => {
    const set = simulate();
    set.type('weight', '85');
    set.type('reps', '6');
    set.check();
    set.check();
    expect(set.stored).toBeUndefined();
    expect(set.fields).toMatchObject({ weight: '85', reps: '6' });
    // Erneut abhaken speichert wieder dieselben Werte.
    set.check();
    expect(set.stored).toMatchObject({ weightKg: 85, reps: 6 });
  });

  it('auch ein aus der Datenbank geladener Satz behält beim Austragen seine Werte', () => {
    const set = simulate(saved(1, 70, 9));
    set.check();
    expect(set.stored).toBeUndefined();
    expect(set.fields).toMatchObject({ weight: '70', reps: '9' });
  });

  it('Ändern eines gespeicherten Satzes aktualisiert ihn direkt, er bleibt gespeichert', () => {
    const set = simulate();
    set.check();
    set.type('reps', '9');
    expect(set.stored).toMatchObject({ weightKg: 80, reps: 9 });
    set.type('weight', '82,5');
    expect(set.stored).toMatchObject({ weightKg: 82.5, reps: 9 });
  });

  it('ein geleertes Feld löscht einen gespeicherten Satz nicht', () => {
    const set = simulate(saved(1, 70, 9));
    set.type('weight', '');
    set.type('reps', '');
    expect(set.stored).toMatchObject({ weightKg: 70, reps: 9 });
  });

  it('ungültige Eingabe: Haken springt ins Feld statt zu speichern', () => {
    const result = pressCheck({ weight: 'abc', reps: '', typed: true }, row());
    expect(result).toMatchObject({ kind: 'focus', field: 'weight' });
  });

  it('ohne Gewichtsvorschlag (erstes Mal) springt der Haken ins Gewichtsfeld', () => {
    const first = { ...row(), suggestion: { weightKg: null, reps: 8 } };
    expect(pressCheck({ weight: '', reps: '', typed: false }, first)).toMatchObject({
      kind: 'focus',
      field: 'weight',
    });
  });
});

describe('pendingSaves (Wechsel der Übung oder Schließen)', () => {
  const drafts = (entries: Record<number, Draft>) => (warmup: boolean, setNumber: number) =>
    warmup ? undefined : entries[setNumber];

  it('speichert eingetippte, nicht abgehakte Sätze, leere Felder mit Vorschlag', () => {
    const result = pendingSaves(exercise, [], last, 3, drafts({ 1: { weight: '85', reps: '', typed: true } }));
    expect(result).toEqual([{ warmup: false, setNumber: 1, weightKg: 85, reps: 8 }]);
  });

  it('übernimmt das gerade gespeicherte Gewicht als Vorschlag für den nächsten Satz', () => {
    const result = pendingSaves(
      exercise,
      [],
      last,
      3,
      drafts({ 1: { weight: '85', reps: '', typed: true }, 2: { weight: '', reps: '6', typed: true } }),
    );
    expect(result).toEqual([
      { warmup: false, setNumber: 1, weightKg: 85, reps: 8 },
      { warmup: false, setNumber: 2, weightKg: 85, reps: 6 },
    ]);
  });

  it('lässt ausgetragene Sätze und gespeicherte Sätze in Ruhe', () => {
    const result = pendingSaves(
      exercise,
      [saved(2, 80, 7)],
      last,
      3,
      drafts({ 1: { weight: '85', reps: '6', typed: false }, 2: { weight: '90', reps: '6', typed: true } }),
    );
    expect(result).toEqual([]);
  });

  it('überspringt Zeilen ohne gültigen Wert', () => {
    const result = pendingSaves(exercise, [], undefined, 3, drafts({ 1: { weight: '', reps: '10', typed: true } }));
    expect(result).toEqual([]);
  });
});

describe('buildRows', () => {
  it('legt Aufwärm- und Arbeitszeilen mit gespeichertem Satz und Vorschlag an', () => {
    const rows = buildRows({ ...exercise, warmupSets: 1 }, [saved(1, 85, 8)], last, 3);
    expect(rows.map((r) => [r.warmup, r.setNumber, !!r.saved])).toEqual([
      [true, 1, false],
      [false, 1, true],
      [false, 2, false],
      [false, 3, false],
    ]);
    expect(rows[2].suggestion).toEqual({ weightKg: 85, reps: 7 });
  });
});
