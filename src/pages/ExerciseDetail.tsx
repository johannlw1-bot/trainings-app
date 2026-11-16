import { useEffect, useState } from 'react';
import type { PageProps } from '../App';
import { SubpageHeader } from '../components/PageHeader';
import { db, type Exercise } from '../db';

/** Detailseite einer Übung (#/uebung/<id>). Das Fortschrittsdiagramm folgt in Schritt 5. */
export default function ExerciseDetail({ param }: PageProps) {
  // undefined = wird geladen, null = nicht gefunden
  const [exercise, setExercise] = useState<Exercise | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const id = Number(param);
    const load = Number.isInteger(id) ? db.exercises.get(id) : Promise.resolve(undefined);
    load
      .then((found) => {
        if (!cancelled) setExercise(found ?? null);
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
      <section className="card">
        <h2 className="heading">Noch keine Trainings</h2>
        <p className="muted">
          Sobald du diese Übung trainiert hast, siehst du hier, wie sie sich entwickelt.
        </p>
      </section>
    </>
  );
}
