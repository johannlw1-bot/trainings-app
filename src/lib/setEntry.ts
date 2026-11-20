// Eingabe eines Satzes im Training: was Tippen und der Haken bewirken, und was beim Wechsel gespeichert wird.
// Drei Zustände je Satz: leer (Vorschlag), wird bearbeitet (Haken gelb), gespeichert (Haken grau).
// Nur der Haken speichert, und der Wechsel der Übung für Sätze, die gerade bearbeitet werden.
import type { WorkoutSet } from '../db';
import { suggestSet, type LastTime, type LoggedSet, type Suggestion } from './lastTime';
import { formatKg, parseReps, parseWeight } from './numbers';
import type { Targets } from './plan';

/** Was in den beiden Feldern einer Zeile steht. */
export interface Draft {
  weight: string;
  reps: string;
  /** Feld angetippt oder Wert geändert, noch nicht gespeichert: Haken gelb. Wird beim Wechsel gespeichert. */
  editing: boolean;
}

/** Zustand des Hakens: Umriss, gelb gefüllt oder grau gefüllt. */
export type CheckState = 'empty' | 'editing' | 'saved';

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
  | { kind: 'focus'; field: 'weight' | 'reps'; draft: Draft }
  | { kind: 'none'; draft: Draft };

export const draftKey = (exerciseId: string, warmup: boolean, setNumber: number) =>
  `${exerciseId}:${warmup ? 'w' : 's'}:${setNumber}`;

const isEmpty = (text: string) => text.trim() === '';

/** Was in den Feldern steht: das Eingetippte, sonst der gespeicherte Satz, sonst nichts (dann zeigt der Vorschlag grau). */
export function shownDraft(draft: Draft | undefined, saved: WorkoutSet | undefined): Draft {
  if (draft) return draft;
  if (saved) return { weight: formatKg(saved.weightKg), reps: String(saved.reps), editing: false };
  return { weight: '', reps: '', editing: false };
}

export function checkState(fields: Draft, saved: WorkoutSet | undefined): CheckState {
  if (fields.editing) return 'editing';
  return saved ? 'saved' : 'empty';
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

/** Ersatz für leere Felder: der gespeicherte Satz, sonst der graue Vorschlag. */
const fallbackOf = (row: SetRowModel) => row.saved ?? row.suggestion;

/** Antippen eines Feldes: Der Satz wird bearbeitet, der Haken gelb. */
export function startEditing(current: Draft): Draft {
  return current.editing ? current : { ...current, editing: true };
}

/** Eingabe in ein Feld. Speichert nichts, der Haken wird gelb. */
export function typeInto(texts: Pick<Draft, 'weight' | 'reps'>): Draft {
  return { weight: texts.weight, reps: texts.reps, editing: true };
}

/**
 * Tipp auf den Haken.
 * Gelb (wird bearbeitet) oder Umriss (leer): speichert, leere Felder nehmen den gespeicherten Wert bzw. den Vorschlag.
 * Grau (gespeichert): tut nichts, es wird nie etwas gelöscht.
 */
export function pressCheck(current: Draft, row: SetRowModel): EntryResult {
  if (checkState(current, row.saved) === 'saved') return { kind: 'none', draft: current };
  const value = resolve(current, fallbackOf(row));
  if ('missing' in value) return { kind: 'focus', field: value.missing, draft: current };
  return {
    kind: 'save',
    value,
    draft: { weight: formatKg(value.weightKg), reps: String(value.reps), editing: false },
  };
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
 * bevor die Datenbank antwortet. Ein neuer Satz bekommt eine vorläufige id „pending-…“.
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
  const id = `pending-${sets.filter((s) => s.id.startsWith('pending-')).length + 1}`;
  return [...sets, { ...set, id }];
}

export interface PendingSave extends SetValue {
  warmup: boolean;
  setNumber: number;
}

/**
 * Sätze, die beim Wechsel der Übung oder beim Schließen gespeichert werden müssen:
 * Zeilen, die gerade bearbeitet werden (Haken gelb). Leere Felder nehmen den gespeicherten Wert
 * bzw. den Vorschlag, der sich wie beim Abhaken nach dem Satz davor richtet.
 * Zeilen ohne gültigen Wert bleiben als Entwurf.
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
    if (!draft?.editing) continue;
    // Vorschlag neu berechnen, damit ein gerade gespeicherter Satz davor berücksichtigt wird.
    const row = buildRows(exercise, virtual, last, rowCount).find(
      (r) => r.warmup === warmup && r.setNumber === setNumber,
    );
    if (!row) continue;
    const value = resolve(draft, fallbackOf(row));
    if ('missing' in value) continue;
    result.push({ warmup, setNumber, ...value });
    const ids = { workoutId: row.saved?.workoutId ?? '', exerciseId: row.saved?.exerciseId ?? '' };
    virtual = withSavedSet(virtual, { ...ids, warmup, setNumber, ...value });
  }
  return result;
}
