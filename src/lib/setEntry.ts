// Eingabe eines Satzes im Training: was Tippen und der Haken bewirken, und was beim Wechsel gespeichert wird.
// Tippen speichert nichts, erst der Haken. Nur ein schon gespeicherter Satz wird beim Tippen direkt aktualisiert.
import type { WorkoutSet } from '../db';
import { suggestSet, type LastTime, type LoggedSet, type Suggestion } from './lastTime';
import { formatKg, parseReps, parseWeight } from './numbers';
import type { Targets } from './plan';

/** Was in den beiden Feldern einer Zeile steht. */
export interface Draft {
  weight: string;
  reps: string;
  /** Eingetippt und noch nicht abgehakt. Nur solche Zeilen werden beim Wechsel gespeichert. */
  typed: boolean;
}

export interface SetRowModel {
  warmup: boolean;
  setNumber: number;
  saved: WorkoutSet | undefined;
  suggestion: Suggestion;
}

export interface SetValue {
  weightKg: number;
  reps: number;
}

/** Ergebnis einer Eingabe: was gespeichert werden soll und was danach in den Feldern steht. */
export type EntryResult =
  | { kind: 'save'; value: SetValue; draft: Draft }
  | { kind: 'clear'; draft: Draft }
  | { kind: 'focus'; field: 'weight' | 'reps'; draft: Draft }
  | { kind: 'none'; draft: Draft };

export const draftKey = (exerciseId: number, warmup: boolean, setNumber: number) =>
  `${exerciseId}:${warmup ? 'w' : 's'}:${setNumber}`;

const isEmpty = (text: string) => text.trim() === '';

/** Was in den Feldern steht: das Eingetippte, sonst der gespeicherte Satz, sonst nichts (dann zeigt der Vorschlag grau). */
export function shownDraft(draft: Draft | undefined, saved: WorkoutSet | undefined): Draft {
  if (draft) return draft;
  if (saved) return { weight: formatKg(saved.weightKg), reps: String(saved.reps), typed: false };
  return { weight: '', reps: '', typed: false };
}

/** Leere Felder nehmen den Ersatzwert, ungültige Eingaben ergeben einen fehlenden Wert. */
function resolve(
  texts: Pick<Draft, 'weight' | 'reps'>,
  fallback: { weightKg: number | null; reps: number | null },
): SetValue | { missing: 'weight' | 'reps' } {
  const weightKg = isEmpty(texts.weight) ? fallback.weightKg : parseWeight(texts.weight);
  const reps = isEmpty(texts.reps) ? fallback.reps : parseReps(texts.reps);
  if (weightKg === null) return { missing: 'weight' };
  if (reps === null) return { missing: 'reps' };
  return { weightKg, reps };
}

/**
 * Tipp auf den Haken.
 * Nicht gespeichert: speichert die eingetippten Werte, leere Felder nehmen den grauen Vorschlag.
 * Gespeichert: trägt den Satz wieder aus, die Werte bleiben aber in den Feldern stehen.
 */
export function pressCheck(current: Draft, row: SetRowModel): EntryResult {
  if (row.saved) return { kind: 'clear', draft: { ...current, typed: false } };
  const value = resolve(current, row.suggestion);
  if ('missing' in value) return { kind: 'focus', field: value.missing, draft: current };
  return {
    kind: 'save',
    value,
    draft: { weight: formatKg(value.weightKg), reps: String(value.reps), typed: false },
  };
}

/**
 * Eingabe in ein Feld. Speichert nichts, außer der Satz ist schon gespeichert:
 * Dann wird er mit dem neuen Wert aktualisiert. Ein geleertes Feld lässt den gespeicherten Wert stehen.
 */
export function typeInto(texts: Pick<Draft, 'weight' | 'reps'>, row: SetRowModel): EntryResult {
  if (!row.saved) {
    return { kind: 'none', draft: { ...texts, typed: !isEmpty(texts.weight) || !isEmpty(texts.reps) } };
  }
  const draft = { ...texts, typed: false };
  const value = resolve(texts, row.saved);
  if ('missing' in value) return { kind: 'none', draft };
  if (value.weightKg === row.saved.weightKg && value.reps === row.saved.reps) return { kind: 'none', draft };
  return { kind: 'save', value, draft };
}

/** Der letzte schon eingetragene Satz vor der Zeile mit dieser Nummer. */
function previousSaved(sets: readonly LoggedSet[], number: number): LoggedSet | undefined {
  return sets.filter((set) => set.setNumber < number).sort((a, b) => b.setNumber - a.setNumber)[0];
}

/** Aufwärm- und Arbeitszeilen einer Übung mit gespeichertem Satz und Vorschlag. */
export function buildRows(
  exercise: Targets,
  sets: readonly WorkoutSet[],
  last: LastTime | undefined,
  rowCount: number,
): SetRowModel[] {
  const warmups = sets.filter((set) => set.warmup);
  const working = sets.filter((set) => !set.warmup);
  const warmupRows = Math.max(exercise.warmupSets, ...warmups.map((set) => set.setNumber));
  const rows = (warmup: boolean, count: number, own: WorkoutSet[]) =>
    Array.from({ length: count }, (_, index) => {
      const setNumber = index + 1;
      return {
        warmup,
        setNumber,
        saved: own.find((set) => set.setNumber === setNumber),
        suggestion: suggestSet(
          index,
          warmup ? last?.warmups : last?.sets,
          previousSaved(own, setNumber),
          warmup ? exercise.targetRepsMax : exercise.targetRepsMin,
        ),
      };
    });
  return [...rows(true, warmupRows, warmups), ...rows(false, rowCount, working)];
}

/**
 * Die Sätze mit einem gespeicherten oder geänderten Satz, sofort für die Anzeige,
 * bevor die Datenbank antwortet. Ein neuer Satz bekommt eine vorläufige negative id.
 */
export function withSavedSet(
  sets: readonly WorkoutSet[],
  set: Omit<WorkoutSet, 'id'>,
): WorkoutSet[] {
  const same = (s: WorkoutSet) =>
    s.workoutId === set.workoutId &&
    s.exerciseId === set.exerciseId &&
    s.warmup === set.warmup &&
    s.setNumber === set.setNumber;
  const existing = sets.find(same);
  if (existing) return sets.map((s) => (same(s) ? { ...s, weightKg: set.weightKg, reps: set.reps } : s));
  const id = Math.min(0, ...sets.map((s) => s.id)) - 1;
  return [...sets, { ...set, id }];
}

/** Die Sätze ohne den ausgetragenen Satz, sofort für die Anzeige. */
export function withoutSet(
  sets: readonly WorkoutSet[],
  key: Pick<WorkoutSet, 'workoutId' | 'exerciseId' | 'warmup' | 'setNumber'>,
): WorkoutSet[] {
  return sets.filter(
    (s) =>
      !(
        s.workoutId === key.workoutId &&
        s.exerciseId === key.exerciseId &&
        s.warmup === key.warmup &&
        s.setNumber === key.setNumber
      ),
  );
}

export interface PendingSave extends SetValue {
  warmup: boolean;
  setNumber: number;
}

/**
 * Sätze, die beim Wechsel der Übung oder beim Schließen gespeichert werden müssen:
 * Zeilen mit eingetippten, nicht abgehakten Werten. Leere Felder nehmen den Vorschlag,
 * der sich wie beim Abhaken nach dem Satz davor richtet. Zeilen ohne gültigen Wert bleiben als Entwurf.
 */
export function pendingSaves(
  exercise: Targets,
  sets: readonly WorkoutSet[],
  last: LastTime | undefined,
  rowCount: number,
  draftOf: (warmup: boolean, setNumber: number) => Draft | undefined,
): PendingSave[] {
  const result: PendingSave[] = [];
  let virtual: WorkoutSet[] = [...sets];
  for (const { warmup, setNumber } of buildRows(exercise, sets, last, rowCount)) {
    const draft = draftOf(warmup, setNumber);
    if (!draft?.typed) continue;
    // Vorschlag neu berechnen, damit ein gerade gespeicherter Satz davor berücksichtigt wird.
    const row = buildRows(exercise, virtual, last, rowCount).find(
      (r) => r.warmup === warmup && r.setNumber === setNumber,
    );
    if (!row || row.saved) continue;
    const value = resolve(draft, row.suggestion);
    if ('missing' in value) continue;
    result.push({ warmup, setNumber, ...value });
    virtual = [...virtual, { id: -result.length, workoutId: 0, exerciseId: 0, warmup, setNumber, ...value }];
  }
  return result;
}
