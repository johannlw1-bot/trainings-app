import { useCallback, useEffect, useRef, useState } from 'react';
import type { Workout, WorkoutSet } from '../db';
import { formatShortDate } from '../lib/dates';
import { formatSets, suggestSet, type LastTime, type Suggestion } from '../lib/lastTime';
import { formatKg, parseReps, parseWeight } from '../lib/numbers';
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

interface WorkoutExercise {
  id: number;
  name: string;
  targetSets: number;
  targetReps: number;
}

/**
 * Eine Satzzeile. Graue Zahlen sind Vorschläge (letztes Mal), weiße sind eingetragen.
 * Der Haken übernimmt den Vorschlag mit einem Tipp, Tippen in ein Feld überschreibt ihn.
 */
function SetRow({
  number,
  saved,
  suggestion,
  onSave,
  onClear,
}: {
  number: number;
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
    <div className="set-row">
      <span className="set-row__no" aria-hidden="true">
        {number}
      </span>
      <input
        ref={weightRef}
        className="field__input"
        inputMode="decimal"
        autoComplete="off"
        aria-label={`Satz ${number}: Gewicht in kg`}
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
        aria-label={`Satz ${number}: Wiederholungen`}
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
        aria-label={saved ? `Satz ${number} wieder austragen` : `Satz ${number} eintragen`}
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
  rowCount: number;
  onRowCount: (count: number) => void;
  onSave: (setNumber: number, weightKg: number, reps: number) => void;
  onClear: (setNumber: number) => void;
}) {
  const bySetNumber = new Map(sets.map((set) => [set.setNumber, set]));

  return (
    <section className="card">
      <div>
        <h3 className="heading">
          <a className="plain-link" href={`#/uebung/${exercise.id}`}>
            {exercise.name}
          </a>
        </h3>
        <p className="muted small">
          {last
            ? `Letztes Mal: ${formatSets(last.sets)} (${formatShortDate(last.date)})`
            : 'Letztes Mal: noch nie'}
        </p>
      </div>

      {rowCount > 0 && (
        <div className="sets">
          <div className="set-row set-row--head" aria-hidden="true">
            <span />
            <span className="label">kg</span>
            <span className="label">Wdh</span>
            <span />
          </div>
          {Array.from({ length: rowCount }, (_, index) => {
            const number = index + 1;
            // Der letzte heute schon eingetragene Satz vor dieser Zeile
            const previous = sets
              .filter((set) => set.setNumber < number)
              .sort((a, b) => b.setNumber - a.setNumber)[0];
            return (
              <SetRow
                key={number}
                number={number}
                saved={bySetNumber.get(number)}
                suggestion={suggestSet(index, last?.sets, previous, exercise.targetReps)}
                onSave={(weightKg, reps) => onSave(number, weightKg, reps)}
                onClear={() => onClear(number)}
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
            if (bySetNumber.has(rowCount)) onClear(rowCount);
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
        targetSets: entry.targetSets,
        targetReps: entry.targetReps,
      }));
      // Übungen mit eingetragenen Sätzen, die inzwischen nicht mehr im Plan stehen, bleiben sichtbar.
      const plannedIds = new Set(planned.map((exercise) => exercise.id));
      const orphanIds = [...new Set(loaded.map((set) => set.exerciseId))].filter(
        (id) => !plannedIds.has(id),
      );
      const orphans = (await loadExercises(orphanIds)).map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        targetSets: 0,
        targetReps: 10,
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

  return (
    <>
      <div>
        <p className="label">Läuft seit {startedAt} Uhr</p>
        <h2 className="heading">{splitLabel(workout.split)}</h2>
      </div>

      {exercises.map((exercise) => {
        const own = sets.filter((set) => set.exerciseId === exercise.id);
        const last = lastTimes.get(exercise.id);
        const highestSaved = Math.max(0, ...own.map((set) => set.setNumber));
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
            onSave={async (setNumber, weightKg, reps) => {
              await saveSet(workout.id, exercise.id, setNumber, weightKg, reps);
              await reloadSets();
            }}
            onClear={async (setNumber) => {
              await deleteSet(workout.id, exercise.id, setNumber);
              await reloadSets();
            }}
          />
        );
      })}

      <button
        type="button"
        className={sets.length > 0 ? 'btn btn--primary btn--block' : 'btn btn--block'}
        onClick={async () => {
          await finishWorkout(workout.id);
          onDone();
        }}
      >
        {sets.length > 0 ? 'Training beenden' : 'Training abbrechen'}
      </button>
    </>
  );
}
