import { useCallback, useEffect, useState } from 'react';
import ExerciseSets from '../components/ExerciseSets';
import RingClock from '../components/RingClock';
import { useNow } from '../components/useNow';
import WorkoutOverview, { type OverviewItem } from '../components/WorkoutOverview';
import type { Segment, Workout, WorkoutSet } from '../db';
import { formatShortDate } from '../lib/dates';
import { elapsedMs, formatTimer } from '../lib/duration';
import {
  activeExerciseId,
  exerciseStatus,
  exerciseTimes,
  nextOpenExercise,
  previousExercise,
  setProgress,
} from '../lib/exerciseTiming';
import { formatSets, increaseHint, type LastTime } from '../lib/lastTime';
import { formatReps, type Targets } from '../lib/plan';
import { loadPlan } from '../lib/planDb';
import { keepScreenOn } from '../lib/wakeLock';
import {
  deleteSet,
  finishWorkout,
  getActiveWorkout,
  loadExercises,
  loadLastTimes,
  loadSegments,
  loadSets,
  saveSet,
  switchExercise,
} from '../lib/workoutDb';
import { replaceHash } from '../nav';

interface SessionExercise extends Targets {
  id: number;
  name: string;
}

interface Loaded {
  workout: Workout;
  exercises: SessionExercise[];
  lastTimes: Map<number, LastTime>;
}

function Icon({ d }: { d: string }) {
  return (
    <svg className="icon-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Lädt das laufende Training mit seinen Übungen in Planreihenfolge. */
async function loadSession(): Promise<Loaded | null> {
  const workout = await getActiveWorkout();
  if (!workout) return null;

  const [items, sets] = await Promise.all([loadPlan(workout.split), loadSets(workout.id)]);
  const planned: SessionExercise[] = items.map(({ entry, exercise }) => ({
    id: exercise.id,
    name: exercise.name,
    warmupSets: entry.warmupSets,
    targetSets: entry.targetSets,
    targetRepsMin: entry.targetRepsMin,
    targetRepsMax: entry.targetRepsMax,
  }));
  // Übungen mit eingetragenen Sätzen, die inzwischen nicht mehr im Plan stehen, bleiben dabei.
  const plannedIds = new Set(planned.map((exercise) => exercise.id));
  const orphanIds = [...new Set(sets.map((set) => set.exerciseId))].filter((id) => !plannedIds.has(id));
  const orphans = (await loadExercises(orphanIds)).map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    warmupSets: 0,
    targetSets: 0,
    targetRepsMin: 8,
    targetRepsMax: 12,
  }));
  const exercises = [...planned, ...orphans];
  const lastTimes = await loadLastTimes(
    exercises.map((exercise) => exercise.id),
    workout.id,
  );
  return { workout, exercises, lastTimes };
}

/** Trainingsansicht: eine Übung nach der anderen, mit Ring-Uhr und Steuerleiste. */
export default function WorkoutSession() {
  const [data, setData] = useState<Loaded | null>(null);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  // Vom Nutzer geänderte Zeilenzahl je Übung. Ohne Eintrag gilt der Vorschlag.
  const [rowCounts, setRowCounts] = useState<Record<number, number>>({});
  const [overview, setOverview] = useState(false);
  const [typing, setTyping] = useState(false);
  const now = useNow();

  const refresh = useCallback(async (workoutId: number) => {
    const [loadedSets, loadedSegments] = await Promise.all([loadSets(workoutId), loadSegments(workoutId)]);
    setSets(loadedSets);
    setSegments(loadedSegments);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadSession();
      if (cancelled) return;
      if (!loaded) {
        replaceHash('#/');
        return;
      }
      // Ohne offenen Abschnitt (z. B. Training von vor der Zeitmessung) die passende Übung starten.
      const existing = await loadSegments(loaded.workout.id);
      const first = loaded.exercises[0]?.id;
      if (!existing.some((segment) => !segment.endedAt) && first !== undefined) {
        await switchExercise(loaded.workout.id, activeExerciseId(existing) ?? first);
      }
      if (cancelled) return;
      setData(loaded);
      await refresh(loaded.workout.id);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  // Display wach halten, solange die Trainingsansicht offen ist.
  useEffect(() => keepScreenOn(), []);

  // Solange ein Eingabefeld aktiv ist (Tastatur offen), weicht die Ring-Uhr den Feldern.
  useEffect(() => {
    const update = () => {
      const active = document.activeElement;
      setTyping(active instanceof HTMLInputElement);
    };
    const onFocusOut = () => window.setTimeout(update, 50);
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', update);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  if (!data) return null;
  const { workout, exercises, lastTimes } = data;

  if (exercises.length === 0) {
    return (
      <div className="session">
        <header className="session__top">
          <p className="label">Training</p>
        </header>
        <p className="muted">In dieser Liste stehen keine Übungen.</p>
        <button
          type="button"
          className="btn btn--block"
          onClick={async () => {
            await finishWorkout(workout.id);
            replaceHash('#/');
          }}
        >
          Training abbrechen
        </button>
      </div>
    );
  }

  const order = exercises.map((exercise) => exercise.id);
  const currentId = activeExerciseId(segments) ?? order[0];
  const index = Math.max(0, order.indexOf(currentId));
  const current = exercises[index];
  const times = exerciseTimes(segments, now);
  const workingCount = (id: number) => sets.filter((set) => set.exerciseId === id && !set.warmup).length;
  const statusOf = (id: number) => exerciseStatus(id, currentId, segments, workingCount(id));
  const statuses = order.map(statusOf);

  const own = sets.filter((set) => set.exerciseId === current.id);
  const ownWorking = own.filter((set) => !set.warmup);
  const last = lastTimes.get(current.id);
  const highestSaved = Math.max(0, ...ownWorking.map((set) => set.setNumber));
  // So viele Zeilen wie im Plan, oder mehr, wenn es letztes Mal mehr Sätze waren.
  const suggestedRows = Math.max(current.targetSets, last?.sets.length ?? 0);
  const rowCount = Math.max(highestSaved, rowCounts[current.id] ?? suggestedRows);
  const hint = increaseHint(last?.sets, ownWorking, current.targetSets, current.targetRepsMax);

  const plannedSets = exercises.reduce((sum, exercise) => sum + exercise.targetSets, 0);
  const doneSets = sets.filter((set) => !set.warmup).length;

  const next = nextOpenExercise(order, currentId, (id) => statusOf(id) === 'done');
  const previous = previousExercise(order, currentId);
  const exerciseMs = times.get(current.id) ?? 0;
  const totalMs = elapsedMs(workout.startedAt, now);

  const goTo = async (exerciseId: number) => {
    await switchExercise(workout.id, exerciseId);
    await refresh(workout.id);
    setOverview(false);
  };

  const finish = async () => {
    const saved = await finishWorkout(workout.id);
    replaceHash(saved ? `#/auswertung/${workout.id}/neu` : '#/');
  };

  const overviewItems: OverviewItem[] = exercises.map((exercise, i) => ({
    id: exercise.id,
    name: exercise.name,
    status: statuses[i],
    timeMs: times.get(exercise.id) ?? 0,
    workingSets: workingCount(exercise.id),
  }));

  return (
    <div className={typing ? 'session vivid session--typing' : 'session vivid'}>
      <header className="session__top">
        <p className="label">
          Übung {index + 1} von {exercises.length}
          {typing && <span className="session__mini-time"> · {formatTimer(exerciseMs)}</span>}
        </p>
        <button
          type="button"
          className="icon-btn"
          aria-label="Trainingsansicht verlassen, das Training läuft weiter"
          onClick={() => replaceHash('#/')}
        >
          <Icon d="M6 6l12 12M18 6L6 18" />
        </button>
      </header>

      <section className="session__exercise">
        <h1 className="session__name">{current.name}</h1>
        <div className="session__meta">
          <p className="muted small">
            Ziel {current.targetSets} × {formatReps(current.targetRepsMin, current.targetRepsMax)}
          </p>
          <div className="session__set-buttons">
            <button
              type="button"
              className="btn btn--small btn--ghost"
              disabled={rowCount === 0}
              aria-label="Letzten Satz löschen"
              onClick={async () => {
                if (ownWorking.some((set) => set.setNumber === rowCount)) {
                  await deleteSet(workout.id, current.id, false, rowCount);
                  await refresh(workout.id);
                }
                setRowCounts((prev) => ({ ...prev, [current.id]: Math.max(0, rowCount - 1) }));
              }}
            >
              − Satz
            </button>
            <button
              type="button"
              className="btn btn--small"
              aria-label="Satz hinzufügen"
              onClick={() => setRowCounts((prev) => ({ ...prev, [current.id]: rowCount + 1 }))}
            >
              + Satz
            </button>
          </div>
        </div>
        <p className="muted small">
          {last ? `Letztes Mal: ${formatSets(last.sets)} (${formatShortDate(last.date)})` : 'Letztes Mal: noch nie'}
        </p>
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
      </section>

      <div className="session__sets">
        <ExerciseSets
          key={current.id}
          exercise={current}
          sets={own}
          last={last}
          rowCount={rowCount}
          onSave={async (warmup, setNumber, weightKg, reps) => {
            await saveSet(workout.id, current.id, warmup, setNumber, weightKg, reps);
            await refresh(workout.id);
          }}
          onClear={async (warmup, setNumber) => {
            await deleteSet(workout.id, current.id, warmup, setNumber);
            await refresh(workout.id);
          }}
        />
      </div>

      {!typing && (
        <RingClock
          exerciseMs={exerciseMs}
          totalMs={totalMs}
          statuses={statuses}
          progress={setProgress(doneSets, plannedSets)}
        />
      )}

      <nav className="session__controls" aria-label="Übungen">
        <button
          type="button"
          className="control-btn"
          aria-label="Vorige Übung"
          disabled={previous === null}
          onClick={() => previous !== null && goTo(previous)}
        >
          <Icon d="M15 6l-6 6 6 6" />
        </button>
        <button
          type="button"
          className="btn btn--primary session__next"
          onClick={() => (next === null ? finish() : goTo(next))}
        >
          {next === null ? 'Training beenden' : 'Nächste Übung'}
        </button>
        <button type="button" className="control-btn" aria-label="Übersicht" onClick={() => setOverview(true)}>
          <Icon d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
        </button>
      </nav>

      {overview && (
        <WorkoutOverview items={overviewItems} onPick={goTo} onClose={() => setOverview(false)} onFinish={finish} />
      )}
    </div>
  );
}
