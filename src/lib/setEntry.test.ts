import { describe, expect, it } from 'vitest';
import type { WorkoutSet } from '../db';
import type { LastTime } from './lastTime';
import {
  buildRows,
  checkState,
  draftKey,
  pendingSaves,
  pressCheck,
  shownDraft,
  startEditing,
  typeInto,
  withSavedSet,
  type Draft,
  type EntryResult,
  type SetRowModel,
} from './setEntry';

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

/** Simuliert eine Zeile: Antippen, Tippen und Haken wie in der Oberfläche, mit einer kleinen „Datenbank“. */
function simulate(start?: WorkoutSet) {
  let stored = start;
  let draft: Draft | undefined;
  let writes = 0;
  const current = () => shownDraft(draft, stored);
  return {
    focus() {
      draft = startEditing(current());
    },
    type(field: 'weight' | 'reps', text: string) {
      draft = typeInto({ ...current(), [field]: text });
    },
    check() {
      const result = pressCheck(current(), row(stored));
      draft = result.draft;
      if (result.kind === 'save') {
        stored = saved(1, result.value.weightKg, result.value.reps);
        writes++;
      }
    },
    get state() {
      return checkState(current(), stored);
    },
    get stored() {
      return stored;
    },
    get writes() {
      return writes;
    },
    get fields() {
      return current();
    },
  };
}

describe('Satz eintragen: leer → gelb → grau', () => {
  it('leere Zeile: Haken als Umriss', () => {
    expect(simulate().state).toBe('empty');
  });

  it('Feld antippen macht den Haken gelb, speichert aber nichts', () => {
    const set = simulate();
    set.focus();
    expect(set.state).toBe('editing');
    expect(set.stored).toBeUndefined();
  });

  it('Zahl eintippen, einmal Haken → gespeichert und grau', () => {
    const set = simulate();
    set.focus();
    set.type('weight', '85');
    expect(set.state).toBe('editing');
    expect(set.stored).toBeUndefined();
    set.check();
    expect(set.state).toBe('saved');
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

  it('Haken ohne Eingabe übernimmt den grauen Vorschlag', () => {
    const set = simulate();
    set.check();
    expect(set.stored).toMatchObject({ weightKg: 80, reps: 8 });
    expect(set.state).toBe('saved');
  });

  it('Tipp auf den grauen Haken löscht nichts und ändert nichts', () => {
    const set = simulate();
    set.type('weight', '85');
    set.check();
    set.check();
    set.check();
    expect(set.state).toBe('saved');
    expect(set.stored).toMatchObject({ weightKg: 85, reps: 8 });
    expect(set.writes).toBe(1);
  });

  it('auch ein aus der Datenbank geladener Satz ist grau und bleibt beim Tipp gespeichert', () => {
    const set = simulate(saved(1, 70, 9));
    expect(set.state).toBe('saved');
    set.check();
    expect(set.stored).toMatchObject({ weightKg: 70, reps: 9 });
    expect(set.writes).toBe(0);
  });

  it('gespeicherten Satz wieder antippen → gelb, ändern speichert erst mit dem Haken, danach grau', () => {
    const set = simulate(saved(1, 80, 8));
    set.focus();
    expect(set.state).toBe('editing');
    set.type('reps', '9');
    expect(set.stored).toMatchObject({ weightKg: 80, reps: 8 });
    set.check();
    expect(set.stored).toMatchObject({ weightKg: 80, reps: 9 });
    expect(set.state).toBe('saved');
  });

  it('geleertes Feld eines gespeicherten Satzes nimmt beim Speichern den gespeicherten Wert', () => {
    const set = simulate(saved(1, 70, 9));
    set.type('weight', '');
    set.type('reps', '10');
    set.check();
    expect(set.stored).toMatchObject({ weightKg: 70, reps: 10 });
  });

  it('ungültige Eingabe: Haken springt ins Feld statt zu speichern', () => {
    const result = pressCheck({ weight: 'abc', reps: '', editing: true }, row());
    expect(result).toMatchObject({ kind: 'focus', field: 'weight' });
  });

  it('ohne Gewichtsvorschlag (erstes Mal) springt der Haken ins Gewichtsfeld', () => {
    const first = { ...row(), suggestion: { weightKg: null, reps: 8 } };
    expect(pressCheck({ weight: '', reps: '', editing: false }, first)).toMatchObject({
      kind: 'focus',
      field: 'weight',
    });
  });
});

describe('pendingSaves (Wechsel der Übung oder Schließen)', () => {
  const drafts = (entries: Record<number, Draft>) => (warmup: boolean, setNumber: number) =>
    warmup ? undefined : entries[setNumber];

  it('speichert Sätze mit gelbem Haken, leere Felder mit Vorschlag', () => {
    const result = pendingSaves(exercise, [], last, 3, drafts({ 1: { weight: '85', reps: '', editing: true } }));
    expect(result).toEqual([{ warmup: false, setNumber: 1, weightKg: 85, reps: 8 }]);
  });

  it('übernimmt das gerade gespeicherte Gewicht als Vorschlag für den nächsten Satz', () => {
    const result = pendingSaves(
      exercise,
      [],
      last,
      3,
      drafts({ 1: { weight: '85', reps: '', editing: true }, 2: { weight: '', reps: '6', editing: true } }),
    );
    expect(result).toEqual([
      { warmup: false, setNumber: 1, weightKg: 85, reps: 8 },
      { warmup: false, setNumber: 2, weightKg: 85, reps: 6 },
    ]);
  });

  it('lässt Zeilen ohne gelben Haken in Ruhe', () => {
    const result = pendingSaves(
      exercise,
      [saved(2, 80, 7)],
      last,
      3,
      drafts({ 1: { weight: '85', reps: '6', editing: false }, 2: { weight: '90', reps: '6', editing: false } }),
    );
    expect(result).toEqual([]);
  });

  it('speichert die Änderung eines gespeicherten Satzes mit gelbem Haken', () => {
    const result = pendingSaves(
      exercise,
      [saved(1, 80, 8)],
      last,
      3,
      drafts({ 1: { weight: '', reps: '9', editing: true } }),
    );
    expect(result).toEqual([{ warmup: false, setNumber: 1, weightKg: 80, reps: 9 }]);
  });

  it('überspringt Zeilen ohne gültigen Wert', () => {
    const result = pendingSaves(exercise, [], undefined, 3, drafts({ 1: { weight: '', reps: '10', editing: true } }));
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

describe('Haken in der Trainingsansicht, auch nach dem Wechsel der Übung', () => {
  /** Trainingsansicht mit zwei Übungen: Sätze und Entwürfe liegen wie dort außerhalb der Zeilen. */
  function session() {
    let sets: WorkoutSet[] = [];
    const drafts: Record<string, Draft> = {};
    let currentId = 1;
    const own = () => sets.filter((s) => s.exerciseId === currentId);
    const rowOf = (setNumber: number) =>
      buildRows(exercise, own(), last, 3).find((r) => !r.warmup && r.setNumber === setNumber)!;
    const key = (setNumber: number) => draftKey(currentId, false, setNumber);
    const save = (setNumber: number, weightKg: number, reps: number) => {
      // Wie in der Trainingsansicht: sofort in die Anzeige, ohne auf die Datenbank zu warten.
      sets = withSavedSet(sets, { workoutId: 1, exerciseId: currentId, warmup: false, setNumber, weightKg, reps });
    };
    const fields = (setNumber: number) => shownDraft(drafts[key(setNumber)], rowOf(setNumber).saved);
    return {
      focus(setNumber: number) {
        drafts[key(setNumber)] = startEditing(fields(setNumber));
      },
      type(setNumber: number, field: 'weight' | 'reps', text: string) {
        drafts[key(setNumber)] = typeInto({ ...fields(setNumber), [field]: text });
      },
      check(setNumber: number) {
        const result: EntryResult = pressCheck(fields(setNumber), rowOf(setNumber));
        drafts[key(setNumber)] = result.draft;
        if (result.kind === 'save') save(setNumber, result.value.weightKg, result.value.reps);
      },
      /** Wie goTo in der Trainingsansicht: gelbe Sätze speichern, dann wechseln. */
      switchTo(exerciseId: number) {
        const pending = pendingSaves(exercise, own(), last, 3, (warmup, n) =>
          drafts[draftKey(currentId, warmup, n)],
        );
        for (const p of pending) {
          save(p.setNumber, p.weightKg, p.reps);
          drafts[key(p.setNumber)] = { ...drafts[key(p.setNumber)], editing: false };
        }
        currentId = exerciseId;
      },
      state: (setNumber: number) => checkState(fields(setNumber), rowOf(setNumber).saved),
      fields,
      get sets() {
        return sets;
      },
    };
  }

  it('antippen → gelb, Zahl, Haken → grau, wieder antippen → gelb, Haken → grau, Wechsel und zurück → grau', () => {
    const s = session();
    expect(s.state(1)).toBe('empty');
    s.focus(1);
    expect(s.state(1)).toBe('editing');
    s.type(1, 'weight', '85');
    s.check(1);
    expect(s.state(1)).toBe('saved');
    expect(s.sets).toEqual([expect.objectContaining({ exerciseId: 1, setNumber: 1, weightKg: 85, reps: 8 })]);
    s.focus(1);
    expect(s.state(1)).toBe('editing');
    s.type(1, 'reps', '6');
    s.check(1);
    expect(s.state(1)).toBe('saved');
    s.switchTo(2);
    expect(s.state(1)).toBe('empty');
    s.switchTo(1);
    expect(s.state(1)).toBe('saved');
    expect(s.fields(1)).toMatchObject({ weight: '85', reps: '6' });
    expect(s.sets).toHaveLength(1);
    expect(s.sets[0]).toMatchObject({ weightKg: 85, reps: 6 });
  });

  it('Wechsel bei gelbem Haken speichert den Satz, danach ist er grau', () => {
    const s = session();
    s.focus(1);
    s.type(1, 'weight', '90');
    s.switchTo(2);
    s.switchTo(1);
    expect(s.state(1)).toBe('saved');
    expect(s.sets[0]).toMatchObject({ weightKg: 90, reps: 8 });
  });

  it('ein Tipp auf den grauen Haken trägt nichts aus', () => {
    const s = session();
    s.check(1);
    s.check(1);
    expect(s.state(1)).toBe('saved');
    expect(s.sets).toHaveLength(1);
  });
});

describe('withSavedSet', () => {
  const key = { workoutId: 1, exerciseId: 1, warmup: false, setNumber: 1 };

  it('fügt einen neuen Satz mit vorläufiger negativer id hinzu', () => {
    const result = withSavedSet([saved(2, 80, 8)], { ...key, weightKg: 85, reps: 6 });
    expect(result).toHaveLength(2);
    expect(result[1]).toMatchObject({ ...key, weightKg: 85, reps: 6 });
    expect(result[1].id).toBeLessThan(0);
  });

  it('ändert einen vorhandenen Satz, statt ihn doppelt anzulegen', () => {
    const result = withSavedSet([saved(1, 80, 8)], { ...key, weightKg: 85, reps: 6 });
    expect(result).toEqual([{ ...saved(1, 85, 6) }]);
  });

  it('trennt Aufwärm- und Arbeitssatz mit derselben Nummer', () => {
    const sets = [saved(1, 40, 12, true), saved(1, 80, 8)];
    expect(withSavedSet(sets, { ...key, weightKg: 85, reps: 6 })).toEqual([saved(1, 40, 12, true), saved(1, 85, 6)]);
  });
});
