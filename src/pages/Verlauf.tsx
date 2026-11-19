import { useEffect, useState } from 'react';
import { SubpageHeader } from '../components/PageHeader';
import { formatShortDate } from '../lib/dates';
import { formatDurationShort, workoutDuration } from '../lib/duration';
import { splitLabel } from '../lib/schedule';
import { loadHistory, type HistoryEntry } from '../lib/workoutDb';

/** Vergangene Trainings, neueste zuerst. Ansehen und Korrigieren einzelner Trainings folgt in Schritt 6. */
export default function Verlauf() {
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);

  useEffect(() => {
    loadHistory().then(setHistory);
  }, []);

  return (
    <>
      <SubpageHeader label="Vergangene Trainings" title="Verlauf" />

      {history && (
        <section className="card">
          {history.length === 0 ? (
            <p className="muted">Noch keine Trainings.</p>
          ) : (
            <ul className="rows">
              {history.map(({ workout, setCount }) => {
                const duration = workoutDuration(workout);
                return (
                  <li key={workout.id}>
                    <div className="row">
                      <span className="row__main">
                        <span className="row__name">{formatShortDate(workout.date)}</span>
                        <span className="muted small">
                          {splitLabel(workout.split)}
                          {duration !== undefined && ` · ${formatDurationShort(duration)}`}
                        </span>
                      </span>
                      <span className="num num--m">
                        {setCount}
                        <span className="num__unit">{setCount === 1 ? 'Satz' : 'Sätze'}</span>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
