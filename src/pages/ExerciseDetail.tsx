import { useEffect, useState } from 'react';
import type { PageProps } from '../App';
import { SubpageHeader } from '../components/PageHeader';
import { db, type Exercise } from '../db';
import { formatShortDate } from '../lib/dates';
import { formatTimer } from '../lib/duration';
import { loadExerciseVisits, type ExerciseVisit } from '../lib/workoutDb';

const VISIT_LIMIT = 10;

/** Detailseite einer Übung (#/uebung/<id>). Das Fortschrittsdiagramm folgt in Schritt 5. */
export default function ExerciseDetail({ param }: PageProps) {
  // undefined = wird geladen, null = nicht gefunden
  const [exercise, setExercise] = useState<Exercise | null | undefined>(undefined);
  const [visits, setVisits] = useState<ExerciseVisit[]>([]);

  useEffect(() => {
    let cancelled = false;
    const id = Number(param);
    if (!Number.isInteger(id)) {
      setExercise(null);
      return;
    }
    Promise.all([db.exercises.get(id), loadExerciseVisits(id, VISIT_LIMIT)])
      .then(([found, loaded]) => {
        if (cancelled) return;
        setExercise(found ?? null);
        setVisits(loaded);
      })
      .catch(() => {
        if (!cancelled) setExercise(null);
      });
    return () => {
      cancelled = true;
    };
  }, [param]);

  if (exercise === undefined) {
    return <SubpageHeader label="Fortschritt" title="" />;
  }

  if (exercise === null) {
    return (
      <>
        <SubpageHeader label="Fortschritt" title="Übung" />
        <section className="card">
          <h2 className="heading">Nicht gefunden</h2>
          <p className="muted">Diese Übung gibt es nicht oder nicht mehr.</p>
        </section>
      </>
    );
  }

  return (
    <>
      <SubpageHeader label="Fortschritt" title={exercise.name} />

      {visits.length === 0 ? (
        <section className="card">
          <h2 className="heading">Noch keine Trainings</h2>
          <p className="muted">
            Sobald du diese Übung trainiert hast, siehst du hier, wie sie sich entwickelt.
          </p>
        </section>
      ) : (
        <section className="section section--tight">
          <h2 className="heading">Zeit bei den letzten Trainings</h2>
          <ul className="item-list">
            {visits.map(({ workout, timeMs, workingSets }) => (
              <li key={workout.id}>
                <a className="item item--plain" href={`#/auswertung/${workout.id}`}>
                  <span className="item__main">
                    <span className="item__title">{formatShortDate(workout.date)}</span>
                    <span className="item__sub">
                      {workingSets} {workingSets === 1 ? 'Satz' : 'Sätze'}
                    </span>
                  </span>
                  <span className="num num--m timer">{timeMs !== undefined ? formatTimer(timeMs) : '–'}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
