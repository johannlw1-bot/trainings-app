import { useEffect, useState } from 'react';
import type { PageProps } from '../App';
import { SubpageHeader } from '../components/PageHeader';
import { formatShortDate } from '../lib/dates';
import { formatTimer } from '../lib/duration';
import { formatSets } from '../lib/lastTime';
import { splitLabel } from '../lib/schedule';
import { loadSummary, type WorkoutSummary } from '../lib/workoutDb';
import { replaceHash } from '../nav';

/**
 * Zusammenfassung eines Trainings (#/auswertung/<id>): Gesamtzeit, Sätze, Zeit pro Übung.
 * Direkt nach dem Beenden (#/auswertung/<id>/neu) steht unten „Fertig“.
 */
export default function Auswertung({ param, extra }: PageProps) {
  // undefined = wird geladen, null = nicht gefunden
  const [summary, setSummary] = useState<WorkoutSummary | null | undefined>(undefined);
  const justFinished = extra === 'neu';

  useEffect(() => {
    const id = Number(param);
    if (!Number.isInteger(id)) {
      setSummary(null);
      return;
    }
    loadSummary(id).then((found) => setSummary(found ?? null));
  }, [param]);

  if (summary === undefined) return <SubpageHeader label="Training" title="Auswertung" />;

  if (summary === null) {
    return (
      <>
        <SubpageHeader label="Training" title="Auswertung" />
        <section className="card">
          <h2 className="heading">Nicht gefunden</h2>
          <p className="muted">Dieses Training gibt es nicht mehr.</p>
        </section>
      </>
    );
  }

  const { workout, totalMs, workingSetCount, exercises } = summary;

  return (
    <>
      <SubpageHeader
        label={`${formatShortDate(workout.date)} · ${splitLabel(workout.split)}`}
        title={justFinished ? 'Geschafft' : 'Auswertung'}
      />

      <div className="stack">
        <section className="card card--hero">
          <p className="label">Gesamtzeit</p>
          <p className="num num--xl num--accent timer">{formatTimer(totalMs)}</p>
          <div className="card__row card__row--start">
            <p className="num num--m">
              {workingSetCount}
              <span className="num__unit">{workingSetCount === 1 ? 'Satz' : 'Sätze'}</span>
            </p>
            <p className="num num--m">
              {exercises.length}
              <span className="num__unit">{exercises.length === 1 ? 'Übung' : 'Übungen'}</span>
            </p>
          </div>
        </section>

        <section className="section section--tight">
          <h2 className="label">Zeit pro Übung</h2>
          <div className="card">
            {exercises.length === 0 ? (
              <p className="muted">Keine Übungen eingetragen.</p>
            ) : (
              <ul className="rows">
                {exercises.map((exercise) => (
                  <li key={exercise.id}>
                    <a className="row" href={`#/uebung/${exercise.id}`}>
                      <span className="row__main">
                        <span className="row__name">{exercise.name}</span>
                        <span className="muted small">
                          {exercise.workingSets.length > 0 ? formatSets(exercise.workingSets) : 'Kein Satz'}
                        </span>
                      </span>
                      <span className="num num--m timer">
                        {exercise.timeMs !== undefined ? formatTimer(exercise.timeMs) : '–'}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {justFinished && (
          <button type="button" className="btn btn--primary btn--block" onClick={() => replaceHash('#/training')}>
            Fertig
          </button>
        )}
      </div>
    </>
  );
}
