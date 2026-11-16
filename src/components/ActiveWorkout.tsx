import { useCallback, useEffect, useRef, useState } from 'react';
import type { Workout, WorkoutSet } from '../db';
import { formatShortDate } from '../lib/dates';
import {
  formatSets,
  increaseHint,
  suggestSet,
  type LastTime,
  type Suggestion,
} from '../lib/lastTime';
import { formatKg, parseReps, parseWeight } from '../lib/numbers';
import { formatReps, type Targets } from '../lib/plan';
import type { PlanItem } from '../lib/planDb';
import { splitLabel } from '../lib/schedule';
import {
  deleteSet,
  finishWorkout,
  loadExercises,
  loadLastTimes,
  loadSets,
  saveSet,
} from '../lib/workoutDb';

interface WorkoutExercise extends Targets {
  id: number;
  name: string;
}

/**
 * Eine Satzzeile. Graue Zahlen sind Vorschläge (letztes Mal), weiße sind eingetragen.
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
  /** Für Screenreader, z. B. „Satz 2“ oder „Aufwärmsatz 1“ */
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

function ExerciseCard({
  exercise,
  sets,
  last,
  rowCount,
  onRowCount,
  onSave,
  onClear,
}: {
  exercise: WorkoutExercise;
  sets: WorkoutSet[];
  last: LastTime | undefined;
  /** Anzahl der Zeilen für Arbeitssätze */
  rowCount: number;
  onRowCount: (count: number) => void;
  onSave: (warmup: boolean, setNumber: number, weightKg: number, reps: number) => void;
  onClear: (warmup: boolean, setNumber: number) => void;
}) {
  const warmups = sets.filter((set) => set.warmup);
  const working = sets.filter((set) => !set.warmup);
  const warmupByNumber = new Map(warmups.map((set) => [set.setNumber, set]));
  const workingByNumber = new Map(working.map((set) => [set.setNumber, set]));
  const warmupRows = Math.max(exercise.warmupSets, ...warmups.map((set) => set.setNumber));
  const hint = increaseHint(last?.sets, working, exercise.targetSets, exercise.targetRepsMax);
  const hasRows = warmupRows > 0 || rowCount > 0;

  return (
    <section className="card">
      <div>
        <h3 className="heading">
          <a className="plain-link" href={`#/uebung/${exercise.id}`}>
            {exercise.name}
          </a>
        </h3>
        <p className="muted small">
          Ziel: {exercise.targetSets} × {formatReps(exercise.targetRepsMin, exercise.targetRepsMax)}
          {' · '}
          {last
            ? `Letztes Mal: ${formatSets(last.sets)} (${formatShortDate(last.date)})`
            : 'Letztes Mal: noch nie'}
        </p>
      </div>

      {hint && (
        <p className="hint">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 19V5M5 12l7-7 7 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {hint === 'now' ? 'Gewicht erhöhen' : 'Nächstes Mal Gewicht erhöhen'}
        </p>
      )}

      {hasRows && (
        <div className="sets">
          <div className="set-row set-row--head" aria-hidden="true">
            <span />
            <span className="label">kg</span>
            <span className="label">Wdh</span>
            <span />
          </div>

          {warmupRows > 0 && <p className="sets__caption label">Aufwärmen</p>}
          {Array.from({ length: warmupRows }, (_, index) => {
            const number = index + 1;
            return (
              <SetRow
                key={`w${number}`}
                marker="A"
                name={warmupRows > 1 ? `Aufwärmsatz ${number}` : 'Aufwärmsatz'}
                warmup
                saved={warmupByNumber.get(number)}
                suggestion={suggestSet(
                  index,
                  last?.warmups,
                  previousSaved(warmups, number),
                  exercise.targetRepsMax,
                )}
                onSave={(weightKg, reps) => onSave(true, number, weightKg, reps)}
                onClear={() => onClear(true, number)}
              />
            );
          })}

          {warmupRows > 0 && rowCount > 0 && <p className="sets__caption label">Arbeitssätze</p>}
          {Array.from({ length: rowCount }, (_, index) => {
            const number = index + 1;
            return (
              <SetRow
                key={`s${number}`}
                marker={String(number)}
                name={`Satz ${number}`}
                warmup={false}
                saved={workingByNumber.get(number)}
                suggestion={suggestSet(
                  index,
                  last?.sets,
                  previousSaved(working, number),
                  exercise.targetRepsMin,
                )}
                onSave={(weightKg, reps) => onSave(false, number, weightKg, reps)}
                onClear={() => onClear(false, number)}
              />
            );
          })}
        </div>
      )}

      <div className="card__row">
        <button
          type="button"
          className="btn btn--ghost"
          disabled={rowCount === 0}
          aria-label={`${exercise.name}: letzten Satz löschen`}
          onClick={() => {
            if (workingByNumber.has(rowCount)) onClear(false, rowCount);
            onRowCount(rowCount - 1);
          }}
        >
          − Satz
        </button>
        <button
          type="button"
          className="btn"
          aria-label={`${exercise.name}: Satz hinzufügen`}
          onClick={() => onRowCount(rowCount + 1)}
        >
          + Satz
        </button>
      </div>
    </section>
  );
}

export default function ActiveWorkout({
  workout,
  items,
  onDone,
}: {
  workout: Workout;
  /** Die Übungen aus dem Plan für diese Liste */
  items: PlanItem[];
  /** Wird aufgerufen, nachdem das Training beendet oder verworfen wurde. */
  onDone: () => void;
}) {
  const [sets, setSets] = useState<WorkoutSet[] | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [lastTimes, setLastTimes] = useState<Map<number, LastTime>>(new Map());
  // Vom Nutzer geänderte Zeilenzahl je Übung. Ohne Eintrag gilt der Vorschlag.
  const [rowCounts, setRowCounts] = useState<Record<number, number>>({});

  const reloadSets = useCallback(async () => setSets(await loadSets(workout.id)), [workout.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadSets(workout.id);
      const planned: WorkoutExercise[] = items.map(({ entry, exercise }) => ({
        id: exercise.id,
        name: exercise.name,
        warmupSets: entry.warmupSets,
        targetSets: entry.targetSets,
        targetRepsMin: entry.targetRepsMin,
        targetRepsMax: entry.targetRepsMax,
      }));
      // Übungen mit eingetragenen Sätzen, die inzwischen nicht mehr im Plan stehen, bleiben sichtbar.
      const plannedIds = new Set(planned.map((exercise) => exercise.id));
      const orphanIds = [...new Set(loaded.map((set) => set.exerciseId))].filter(
        (id) => !plannedIds.has(id),
      );
      const orphans: WorkoutExercise[] = (await loadExercises(orphanIds)).map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        warmupSets: 0,
        targetSets: 0,
        targetRepsMin: 8,
        targetRepsMax: 12,
      }));
      const all = [...planned, ...orphans];
      const last = await loadLastTimes(
        all.map((exercise) => exercise.id),
        workout.id,
      );
      if (cancelled) return;
      setExercises(all);
      setLastTimes(last);
      setSets(loaded);
    })();
    return () => {
      cancelled = true;
    };
  }, [workout.id, items]);

  if (!sets) return null;

  const startedAt = new Date(workout.startedAt).toLocaleTimeString('de', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const hasSets = sets.length > 0;

  return (
    <>
      <div>
        <p className="label">Läuft seit {startedAt} Uhr</p>
        <h2 className="heading">{splitLabel(workout.split)}</h2>
      </div>

      {exercises.map((exercise) => {
        const own = sets.filter((set) => set.exerciseId === exercise.id);
        const last = lastTimes.get(exercise.id);
        const highestSaved = Math.max(0, ...own.filter((set) => !set.warmup).map((set) => set.setNumber));
        // So viele Zeilen wie im Plan, oder mehr, wenn es letztes Mal mehr Sätze waren.
        const suggested = Math.max(exercise.targetSets, last?.sets.length ?? 0);
        const rowCount = Math.max(highestSaved, rowCounts[exercise.id] ?? suggested);
        return (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            sets={own}
            last={last}
            rowCount={rowCount}
            onRowCount={(count) => setRowCounts((prev) => ({ ...prev, [exercise.id]: Math.max(0, count) }))}
            onSave={async (warmup, setNumber, weightKg, reps) => {
              await saveSet(workout.id, exercise.id, warmup, setNumber, weightKg, reps);
              await reloadSets();
            }}
            onClear={async (warmup, setNumber) => {
              await deleteSet(workout.id, exercise.id, warmup, setNumber);
              await reloadSets();
            }}
          />
        );
      })}

      <button
        type="button"
        className={hasSets ? 'btn btn--primary btn--block' : 'btn btn--block'}
        onClick={async () => {
          await finishWorkout(workout.id);
          onDone();
        }}
      >
        {hasSets ? 'Training beenden' : 'Training abbrechen'}
      </button>
    </>
  );
}
