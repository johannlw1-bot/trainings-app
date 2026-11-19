import { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import { SubpageHeader } from '../components/PageHeader';
import { formatShortDate } from '../lib/dates';
import { formatDurationShort, workoutDuration } from '../lib/duration';
import { splitLabel } from '../lib/schedule';
import { loadHistory, type HistoryEntry } from '../lib/workoutDb';

/** Vergangene Trainings, neueste zuerst. Ein Tipp öffnet die Auswertung. */
export default function Verlauf() {
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);

  useEffect(() => {
    loadHistory().then(setHistory);
  }, []);

  return (
    <>
      <SubpageHeader label="Vergangene Trainings" title="Verlauf" />

      {history && (
        <>
          {history.length === 0 ? (
            <section className="card">
              <p className="muted">Noch keine Trainings.</p>
            </section>
          ) : (
            <ul className="item-list">
              {history.map(({ workout, setCount }) => {
                const duration = workoutDuration(workout);
                return (
                  <li key={workout.id}>
                    <a className="item" href={`#/auswertung/${workout.id}`}>
                      <span className="icon-tile">
                        <Icon name="dumbbell" />
                      </span>
                      <span className="item__main">
                        <span className="item__title">{formatShortDate(workout.date)}</span>
                        <span className="item__sub">
                          {splitLabel(workout.split)}
                          {duration !== undefined && ` · ${formatDurationShort(duration)}`}
                        </span>
                      </span>
                      <span className="num num--m">
                        {setCount}
                        <span className="num__unit">{setCount === 1 ? 'Satz' : 'Sätze'}</span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </>
  );
}
