import { useCallback, useEffect, useState } from 'react';
import ActiveWorkout from '../components/ActiveWorkout';
import { PageHeader } from '../components/PageHeader';
import type { Split, Workout } from '../db';
import { formatShortDate, toLocalDate } from '../lib/dates';
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

function PlanList({ items }: { items: PlanItem[] }) {
  return (
    <ul className="rows">
      {items.map(({ entry, exercise }) => (
        <li key={entry.id}>
          <a className="row" href={`#/uebung/${exercise.id}`}>
            <span className="row__main">
              <span className="row__name">{exercise.name}</span>
            </span>
            <span
              className="num num--m"
              aria-label={`${entry.targetSets} Sätze mal ${entry.targetReps} Wiederholungen`}
            >
              {entry.targetSets}
              <span className="num__unit">×</span>
              {entry.targetReps}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
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
      loadHistory(30),
    ]);
    setData({ active, plans: { upper, lower }, history });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const start = async (which: Split) => {
    await startWorkout(which, todayDate);
    await reload();
    window.scrollTo(0, 0);
  };

  const doneToday = data?.history.find((entry) => entry.workout.date === todayDate);
  const next = nextTraining(today);

  return (
    <>
      <PageHeader label={dateFormat.format(today)} title="Training" />

      {data && (
        <div className="stack">
          <div>
            <a className="btn btn--small" href="#/plan">
              Plan bearbeiten
            </a>
          </div>

          {data.active && (
            <ActiveWorkout
              key={data.active.id}
              workout={data.active}
              items={data.plans[data.active.split]}
              onDone={async () => {
                await reload();
                window.scrollTo(0, 0);
              }}
            />
          )}

          {!data.active && doneToday && (
            <section className="card">
              <p className="label">Heute · {splitLabel(doneToday.workout.split)}</p>
              <h2 className="heading">Erledigt</h2>
              <p className="muted">
                {doneToday.setCount} {doneToday.setCount === 1 ? 'Satz' : 'Sätze'} eingetragen. Fehlt
                noch etwas, kannst du das Training wieder öffnen.
              </p>
              <button
                type="button"
                className="btn btn--block"
                onClick={async () => {
                  await reopenWorkout(doneToday.workout.id);
                  await reload();
                }}
              >
                Wieder öffnen
              </button>
            </section>
          )}

          {!data.active && !doneToday && split && (
            <section className="card">
              <p className="label">Heute</p>
              <h2 className="heading">{splitLabel(split)}</h2>
              {data.plans[split].length === 0 ? (
                <p className="muted">
                  Für {splitLabel(split)} sind noch keine Übungen angelegt. Das geht über „Plan
                  bearbeiten“.
                </p>
              ) : (
                <>
                  <PlanList items={data.plans[split]} />
                  <button type="button" className="btn btn--primary btn--block" onClick={() => start(split)}>
                    Training starten
                  </button>
                </>
              )}
            </section>
          )}

          {!data.active && !doneToday && !split && (
            <section className="card">
              <p className="label">Heute</p>
              <h2 className="heading">Ruhetag</h2>
              <p className="muted">
                Heute steht kein Training an. Weiter geht es am {weekdayFormat.format(next.date)} mit{' '}
                {splitLabel(next.split)}.
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
        </div>
      )}

      {data && (
        <section className="section">
          <h2 className="label">Vergangene Trainings</h2>
          <div className="card">
            {data.history.length === 0 ? (
              <p className="muted">Noch keine Trainings.</p>
            ) : (
              <ul className="rows">
                {data.history.map(({ workout, setCount }) => (
                  <li key={workout.id}>
                    <div className="row">
                      <span className="row__main">
                        <span className="row__name">{formatShortDate(workout.date)}</span>
                        <span className="muted small">{splitLabel(workout.split)}</span>
                      </span>
                      <span className="num num--m">
                        {setCount}
                        <span className="num__unit">{setCount === 1 ? 'Satz' : 'Sätze'}</span>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </>
  );
}
