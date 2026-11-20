import { useEffect, useState } from 'react';
import type { PageProps } from '../App';
import { SubpageHeader } from '../components/PageHeader';
import { useDataVersion } from '../components/useDataVersion';
import { formatDayMonth, formatShortDate } from '../lib/dates';
import { formatTimer } from '../lib/duration';
import { formatSets } from '../lib/lastTime';
import { splitLabel } from '../lib/schedule';
import { discardWorkout, loadSummary, type WorkoutSummary } from '../lib/workoutDb';
import { replaceHash, returnTo } from '../nav';

/**
 * Zusammenfassung eines Trainings (#/auswertung/<id>): Gesamtzeit, Sätze, Zeit pro Übung.
 * Direkt nach dem Beenden (#/auswertung/<id>/neu) steht unten „Fertig“.
 */
export default function Auswertung({ param, extra }: PageProps) {
  // undefined = wird geladen, null = nicht gefunden
  const [summary, setSummary] = useState<WorkoutSummary | null | undefined>(undefined);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const justFinished = extra === 'neu';
  const dataVersion = useDataVersion();

  useEffect(() => {
    const id = param;
    if (!id) {
      setSummary(null);
      return;
    }
    loadSummary(id).then((found) => setSummary(found ?? null));
  }, [param, dataVersion]);

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
        <div className="glow">
          <section className="card card--hero card--glass">
            <p className="label">Gesamtzeit</p>
            <p className="num num--xl timer">{formatTimer(totalMs)}</p>
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
        </div>

        <section className="section section--tight">
          <h2 className="heading">Zeit pro Übung</h2>
          {exercises.length === 0 ? (
            <p className="muted">Keine Übungen eingetragen.</p>
          ) : (
            <ul className="item-list">
              {exercises.map((exercise) => (
                <li key={exercise.id}>
                  <a className="item item--plain" href={`#/uebung/${encodeURIComponent(exercise.id)}`}>
                    <span className="item__main">
                      <span className="item__title">{exercise.name}</span>
                      <span className="item__sub">
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
        </section>

        {justFinished && (
          <button type="button" className="btn btn--primary btn--block" onClick={() => replaceHash('#/')}>
            Fertig
          </button>
        )}

        {!justFinished && workout.finishedAt && !confirmingDelete && (
          <button
            type="button"
            className="btn btn--danger btn--block"
            onClick={() => setConfirmingDelete(true)}
          >
            Training löschen
          </button>
        )}

        {confirmingDelete && (
          <section className="card confirm" role="alertdialog" aria-labelledby="delete-workout-text">
            <p id="delete-workout-text" className="confirm__text">
              Training vom {formatDayMonth(workout.date)} {setCountPhrase(workingSetCount)} endgültig
              löschen?
            </p>
            <div className="confirm__buttons">
              <button type="button" className="btn btn--ghost" onClick={() => setConfirmingDelete(false)}>
                Abbrechen
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={async () => {
                  await discardWorkout(workout.id);
                  returnTo('#/verlauf');
                }}
              >
                Ja, löschen
              </button>
            </div>
          </section>
        )}
      </div>
    </>
  );
}

/** „mit 12 Sätzen“, „mit 1 Satz“, „ohne Sätze“ (nur Arbeitssätze) */
function setCountPhrase(count: number): string {
  if (count === 0) return 'ohne Sätze';
  return count === 1 ? 'mit 1 Satz' : `mit ${count} Sätzen`;
}
