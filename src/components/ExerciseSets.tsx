import { useEffect, useRef, useState } from 'react';
import type { WorkoutSet } from '../db';
import { suggestSet, type LastTime, type Suggestion } from '../lib/lastTime';
import { formatKg, parseReps, parseWeight } from '../lib/numbers';
import type { Targets } from '../lib/plan';

/**
 * Eine Satzzeile. Graue Zahlen sind Vorschläge (letztes Mal), helle sind eingetragen.
 * Der Haken übernimmt den Vorschlag mit einem Tipp, Tippen in ein Feld überschreibt ihn.
 */
function SetRow({
  marker,
  name,
  warmup,
  saved,
  suggestion,
  onSave,
  onClear,
}: {
  /** Was vorne in der Zeile steht: die Satznummer oder „A“ für Aufwärmen */
  marker: string;
  /** Für Screenreader, z. B. „Satz 2“ oder „Aufwärmsatz“ */
  name: string;
  warmup: boolean;
  saved: WorkoutSet | undefined;
  suggestion: Suggestion;
  onSave: (weightKg: number, reps: number) => void;
  onClear: () => void;
}) {
  const [weight, setWeight] = useState(saved ? formatKg(saved.weightKg) : '');
  const [reps, setReps] = useState(saved ? String(saved.reps) : '');
  const weightRef = useRef<HTMLInputElement>(null);
  const repsRef = useRef<HTMLInputElement>(null);

  // Wurde der Satz gespeichert, zeigen leere Felder den gespeicherten Wert,
  // außer in dem Feld, in dem gerade getippt wird.
  useEffect(() => {
    if (!saved) return;
    if (document.activeElement !== weightRef.current) setWeight(formatKg(saved.weightKg));
    if (document.activeElement !== repsRef.current) setReps(String(saved.reps));
  }, [saved]);

  const resolve = (weightText: string, repsText: string) => ({
    weightKg: weightText.trim() === '' ? suggestion.weightKg : parseWeight(weightText),
    reps: repsText.trim() === '' ? suggestion.reps : parseReps(repsText),
  });

  const commit = (weightText: string, repsText: string) => {
    if (weightText.trim() === '' && repsText.trim() === '') {
      if (saved) onClear();
      return;
    }
    const value = resolve(weightText, repsText);
    if (value.weightKg !== null && value.reps !== null) onSave(value.weightKg, value.reps);
  };

  const toggle = () => {
    if (saved) {
      setWeight('');
      setReps('');
      onClear();
      return;
    }
    const value = resolve(weight, reps);
    if (value.weightKg === null) {
      weightRef.current?.focus();
    } else if (value.reps === null) {
      repsRef.current?.focus();
    } else {
      setWeight(formatKg(value.weightKg));
      setReps(String(value.reps));
      onSave(value.weightKg, value.reps);
    }
  };

  return (
    <div className={warmup ? 'set-row set-row--warmup' : 'set-row'}>
      <span className="set-row__no" aria-hidden="true">
        {marker}
      </span>
      <label className="set-field">
        <input
          ref={weightRef}
          className="field__input"
          inputMode="decimal"
          autoComplete="off"
          aria-label={`${name}: Gewicht in kg`}
          placeholder={suggestion.weightKg === null ? '' : formatKg(suggestion.weightKg)}
          value={weight}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => {
            setWeight(event.target.value);
            commit(event.target.value, reps);
          }}
          onBlur={() => saved && setWeight(formatKg(saved.weightKg))}
        />
        <span className="set-field__unit" aria-hidden="true">
          kg
        </span>
      </label>
      <label className="set-field">
        <input
          ref={repsRef}
          className="field__input"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          aria-label={`${name}: Wiederholungen`}
          placeholder={String(suggestion.reps)}
          value={reps}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => {
            setReps(event.target.value);
            commit(weight, event.target.value);
          }}
          onBlur={() => saved && setReps(String(saved.reps))}
        />
        <span className="set-field__unit" aria-hidden="true">
          Wdh
        </span>
      </label>
      <button
        type="button"
        className="check-btn"
        aria-pressed={!!saved}
        aria-label={saved ? `${name} wieder austragen` : `${name} eintragen`}
        onClick={toggle}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

/** Der letzte schon eingetragene Satz vor der Zeile mit dieser Nummer. */
function previousSaved(sets: readonly WorkoutSet[], number: number): WorkoutSet | undefined {
  return sets.filter((set) => set.setNumber < number).sort((a, b) => b.setNumber - a.setNumber)[0];
}

/** Aufwärm- und Arbeitssätze einer Übung als Eingabezeilen. */
export default function ExerciseSets({
  exercise,
  sets,
  last,
  rowCount,
  onSave,
  onClear,
}: {
  exercise: Targets;
  /** Die heute eingetragenen Sätze dieser Übung */
  sets: WorkoutSet[];
  last: LastTime | undefined;
  /** Anzahl der Zeilen für Arbeitssätze */
  rowCount: number;
  onSave: (warmup: boolean, setNumber: number, weightKg: number, reps: number) => void;
  onClear: (warmup: boolean, setNumber: number) => void;
}) {
  const warmups = sets.filter((set) => set.warmup);
  const working = sets.filter((set) => !set.warmup);
  const warmupByNumber = new Map(warmups.map((set) => [set.setNumber, set]));
  const workingByNumber = new Map(working.map((set) => [set.setNumber, set]));
  const warmupRows = Math.max(exercise.warmupSets, ...warmups.map((set) => set.setNumber));

  return (
    <div className="sets">
      {Array.from({ length: warmupRows }, (_, index) => {
        const number = index + 1;
        return (
          <SetRow
            key={`w${number}`}
            marker="A"
            name={warmupRows > 1 ? `Aufwärmsatz ${number}` : 'Aufwärmsatz'}
            warmup
            saved={warmupByNumber.get(number)}
            suggestion={suggestSet(index, last?.warmups, previousSaved(warmups, number), exercise.targetRepsMax)}
            onSave={(weightKg, reps) => onSave(true, number, weightKg, reps)}
            onClear={() => onClear(true, number)}
          />
        );
      })}
      {Array.from({ length: rowCount }, (_, index) => {
        const number = index + 1;
        return (
          <SetRow
            key={`s${number}`}
            marker={String(number)}
            name={`Satz ${number}`}
            warmup={false}
            saved={workingByNumber.get(number)}
            suggestion={suggestSet(index, last?.sets, previousSaved(working, number), exercise.targetRepsMin)}
            onSave={(weightKg, reps) => onSave(false, number, weightKg, reps)}
            onClear={() => onClear(false, number)}
          />
        );
      })}
    </div>
  );
}
