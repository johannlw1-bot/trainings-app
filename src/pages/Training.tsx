import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Icon from '../components/Icon';
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

/** Die Karte „Heute“: Milchglas mit gelbem Leuchten dahinter. */
function TodayCard({ children }: { children: ReactNode }) {
  return (
    <div className="glow">
      <section className="card card--hero card--glass">{children}</section>
    </div>
  );
}

/** Wege zu Verlauf und Plan: einzelne Karten mit gelber Icon-Kachel. */
function Links({ historyCount }: { historyCount: number }) {
  return (
    <ul className="item-list">
      <li>
        <a className="item" href="#/verlauf">
          <span className="icon-tile">
            <Icon name="clock" />
          </span>
          <span className="item__main">
            <span className="item__title">Vergangene Trainings</span>
            <span className="item__sub">
              {historyCount === 0 ? 'Noch keine' : historyCount === 1 ? '1 Training' : `${historyCount} Trainings`}
            </span>
          </span>
          <Icon name="chevron" className="item__chevron" />
        </a>
      </li>
      <li>
        <a className="item" href="#/plan">
          <span className="icon-tile">
            <Icon name="edit" />
          </span>
          <span className="item__main">
            <span className="item__title">Plan bearbeiten</span>
            <span className="item__sub">Oberkörper und Unterkörper</span>
          </span>
          <Icon name="chevron" className="item__chevron" />
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
            <TodayCard>
              <p className="label">Läuft · {splitLabel(data.active.split)}</p>
              <WorkoutTimer startedAt={data.active.startedAt} className="num num--xl" />
              <a className="btn btn--primary btn--block" href="#/einheit">
                Training fortsetzen
              </a>
            </TodayCard>
          )}

          {!data.active && doneToday && (
            <TodayCard>
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
            </TodayCard>
          )}

          {!data.active && !doneToday && split && (
            <TodayCard>
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
            </TodayCard>
          )}

          {!data.active && !doneToday && !split && (
            <TodayCard>
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
            </TodayCard>
          )}

          <Links historyCount={data.history.length} />
        </div>
      )}
    </>
  );
}
