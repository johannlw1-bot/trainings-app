import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import WorkoutTimer from '../components/WorkoutTimer';
import type { Split, Workout } from '../db';
import { toLocalDate } from '../lib/dates';
import { formatDurationShort, workoutDuration } from '../lib/duration';
import { loadPlan, type PlanItem } from '../lib/planDb';
import { SPLITS, nextTraining, splitForDate, splitLabel } from '../lib/schedule';
import {
  getActiveWorkout,
  loadHistory,
  reopenWorkout,
  startWorkout,
  type HistoryEntry,
} from '../lib/workoutDb';

const dateFormat = new Intl.DateTimeFormat('de', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const weekdayFormat = new Intl.DateTimeFormat('de', { weekday: 'long' });

interface Loaded {
  active: Workout | undefined;
  plans: Record<Split, PlanItem[]>;
  history: HistoryEntry[];
}

function Chevron() {
  return (
    <svg
      className="list__chevron"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/** Dezente Wege zu Plan und Verlauf, unter dem Inhalt des Tabs. */
function QuietLinks({ historyCount }: { historyCount: number }) {
  return (
    <ul className="list list--quiet">
      <li>
        <a className="list__item" href="#/verlauf">
          <span>Vergangene Trainings</span>
          <span className="list__end">
            {historyCount > 0 && <span>{historyCount}</span>}
            <Chevron />
          </span>
        </a>
      </li>
      <li>
        <a className="list__item" href="#/plan">
          <span>Plan bearbeiten</span>
          <Chevron />
        </a>
      </li>
    </ul>
  );
}

function exerciseCount(count: number): string {
  return count === 1 ? '1 Übung' : `${count} Übungen`;
}

export default function Training() {
  const [today] = useState(() => new Date());
  const todayDate = toLocalDate(today);
  const split = splitForDate(today);
  const [data, setData] = useState<Loaded | null>(null);

  const reload = useCallback(async () => {
    const [active, upper, lower, history] = await Promise.all([
      getActiveWorkout(),
      loadPlan('upper'),
      loadPlan('lower'),
      loadHistory(),
    ]);
    setData({ active, plans: { upper, lower }, history });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const start = async (which: Split) => {
    await startWorkout(which, todayDate);
    window.location.hash = '#/einheit';
  };

  const doneToday = data?.history.find((entry) => entry.workout.date === todayDate);
  const doneDuration = doneToday && workoutDuration(doneToday.workout);
  const next = nextTraining(today);

  return (
    <>
      <PageHeader label={dateFormat.format(today)} title="Training" />

      {data && (
        <div className="stack">
          {data.active && (
            <section className="card card--hero">
              <p className="label">Läuft · {splitLabel(data.active.split)}</p>
              <WorkoutTimer startedAt={data.active.startedAt} className="num num--xl" />
              <a className="btn btn--primary btn--block" href="#/einheit">
                Training fortsetzen
              </a>
            </section>
          )}

          {!data.active && doneToday && (
            <section className="card">
              <p className="label">Heute · {splitLabel(doneToday.workout.split)}</p>
              <h2 className="title">Erledigt</h2>
              <p className="muted">
                {doneDuration !== undefined && `${formatDurationShort(doneDuration)} · `}
                {doneToday.setCount} {doneToday.setCount === 1 ? 'Satz' : 'Sätze'}
              </p>
              <a className="btn btn--block" href={`#/auswertung/${doneToday.workout.id}`}>
                Auswertung
              </a>
              <button
                type="button"
                className="btn btn--ghost btn--block"
                onClick={async () => {
                  await reopenWorkout(doneToday.workout.id);
                  window.location.hash = '#/einheit';
                }}
              >
                Wieder öffnen
              </button>
            </section>
          )}

          {!data.active && !doneToday && split && (
            <section className="card card--hero">
              <p className="label">Heute</p>
              <h2 className="title">{splitLabel(split)}</h2>
              {data.plans[split].length === 0 ? (
                <p className="muted">
                  Für {splitLabel(split)} sind noch keine Übungen angelegt. Das geht über „Plan
                  bearbeiten“.
                </p>
              ) : (
                <>
                  <p className="muted">{exerciseCount(data.plans[split].length)}</p>
                  <button type="button" className="btn btn--primary btn--block" onClick={() => start(split)}>
                    Training starten
                  </button>
                </>
              )}
            </section>
          )}

          {!data.active && !doneToday && !split && (
            <section className="card card--hero">
              <p className="label">Heute</p>
              <h2 className="title">Ruhetag</h2>
              <p className="muted">
                Weiter geht es am {weekdayFormat.format(next.date)} mit {splitLabel(next.split)}.
              </p>
              {SPLITS.filter((list) => data.plans[list.split].length > 0).map((list) => (
                <button
                  key={list.split}
                  type="button"
                  className="btn btn--block"
                  onClick={() => start(list.split)}
                >
                  {list.label} nachholen
                </button>
              ))}
            </section>
          )}

          <QuietLinks historyCount={data.history.length} />
        </div>
      )}
    </>
  );
}
