import { useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { loadPlan, type PlanItem } from '../lib/planDb';
import { nextTraining, splitForDate, splitLabel } from '../lib/schedule';

const dateFormat = new Intl.DateTimeFormat('de', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const weekdayFormat = new Intl.DateTimeFormat('de', { weekday: 'long' });

export default function Training() {
  const [today] = useState(() => new Date());
  const split = splitForDate(today);
  const [items, setItems] = useState<PlanItem[] | null>(null);

  useEffect(() => {
    if (split) loadPlan(split).then(setItems);
  }, [split]);

  const next = nextTraining(today);

  return (
    <>
      <PageHeader label={dateFormat.format(today)} title="Training" />

      <div className="stack">
        <div>
          <a className="btn btn--small" href="#/plan">
            Plan bearbeiten
          </a>
        </div>

        {!split && (
          <section className="card">
            <p className="label">Heute</p>
            <h2 className="heading">Ruhetag</h2>
            <p className="muted">
              Heute steht kein Training an. Weiter geht es am {weekdayFormat.format(next.date)} mit{' '}
              {splitLabel(next.split)}.
            </p>
          </section>
        )}

        {split && items && (
          <section className="card">
            <p className="label">Heute</p>
            <h2 className="heading">{splitLabel(split)}</h2>
            {items.length === 0 ? (
              <p className="muted">
                Für {splitLabel(split)} sind noch keine Übungen angelegt. Das geht über „Plan
                bearbeiten“.
              </p>
            ) : (
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
            )}
          </section>
        )}
      </div>

      <section className="section">
        <h2 className="label">Vergangene Trainings</h2>
        <div className="card">
          <p className="muted">Noch keine Trainings.</p>
        </div>
      </section>
    </>
  );
}
