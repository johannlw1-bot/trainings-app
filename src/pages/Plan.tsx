import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { SubpageHeader } from '../components/PageHeader';
import Stepper from '../components/Stepper';
import type { Split } from '../db';
import { REPS_RANGE, SETS_RANGE, formatTarget } from '../lib/plan';
import {
  addExercise,
  loadAddable,
  loadPlan,
  moveEntry,
  removeFromPlan,
  renameExercise,
  setTargets,
  type AddableExercise,
  type NameResult,
  type PlanItem,
} from '../lib/planDb';
import { SPLITS, splitForDate } from '../lib/schedule';

const NAME_ERRORS: Record<Exclude<NameResult, 'ok'>, string> = {
  empty: 'Bitte einen Namen eingeben.',
  duplicate: 'Diese Übung gibt es schon.',
};

function Arrow({ up }: { up?: boolean }) {
  return (
    <svg className="icon-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={up ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Aufgeklappter Bereich einer Zeile: umbenennen, Ziele ändern, aus der Liste nehmen. */
function RowEditor({
  item,
  usedElsewhere,
  onChanged,
  onClose,
}: {
  item: PlanItem;
  usedElsewhere: boolean;
  onChanged: () => Promise<void>;
  onClose: () => void;
}) {
  const { entry, exercise } = item;
  const [name, setName] = useState(exercise.name);
  const [error, setError] = useState('');

  const saveName = async () => {
    const result = await renameExercise(exercise.id, name);
    if (result === 'ok') {
      setError('');
      await onChanged();
    } else if (result === 'empty') {
      // Ein leerer Name wird nicht gespeichert, der alte bleibt stehen.
      setName(exercise.name);
      setError('');
    } else {
      setError(NAME_ERRORS[result]);
    }
  };

  const changeTargets = async (sets: number, reps: number) => {
    await setTargets(entry.id, sets, reps);
    await onChanged();
  };

  return (
    <div className="row__editor">
      <label className="field">
        <span className="label">Name</span>
        <input
          className="field__input field__input--text"
          value={name}
          enterKeyHint="done"
          autoCapitalize="sentences"
          autoComplete="off"
          onChange={(event) => setName(event.target.value)}
          onBlur={saveName}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
        />
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <Stepper
        label="Sätze"
        value={entry.targetSets}
        min={SETS_RANGE.min}
        max={SETS_RANGE.max}
        onChange={(sets) => changeTargets(sets, entry.targetReps)}
      />
      <Stepper
        label="Wiederholungen"
        value={entry.targetReps}
        min={REPS_RANGE.min}
        max={REPS_RANGE.max}
        onChange={(reps) => changeTargets(entry.targetSets, reps)}
      />
      <div className="card__row">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={async () => {
            await removeFromPlan(entry.id);
            onClose();
            await onChanged();
          }}
        >
          {usedElsewhere ? 'Aus Liste nehmen' : 'Archivieren'}
        </button>
        <button type="button" className="btn" onClick={onClose}>
          Fertig
        </button>
      </div>
    </div>
  );
}

/** Formular zum Hinzufügen: neuer Name oder eine vorhandene Übung, dazu die Ziele. */
function AddForm({
  split,
  addable,
  onAdded,
  onClose,
}: {
  split: Split;
  addable: AddableExercise[];
  onAdded: () => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [sets, setSets] = useState(SETS_RANGE.initial);
  const [reps, setReps] = useState(REPS_RANGE.initial);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await addExercise(split, name, sets, reps);
    if (result === 'ok') {
      // Formular bleibt offen, damit mehrere Übungen nacheinander angelegt werden können.
      setName('');
      setError('');
      await onAdded();
    } else {
      setError(result === 'duplicate' ? 'Diese Übung steht schon in der Liste.' : NAME_ERRORS[result]);
    }
  };

  const pick = (item: AddableExercise) => {
    setName(item.exercise.name);
    if (item.targetSets) setSets(item.targetSets);
    if (item.targetReps) setReps(item.targetReps);
    setError('');
  };

  return (
    <form className="card" onSubmit={submit}>
      <h2 className="heading">Neue Übung</h2>
      <label className="field">
        <span className="label">Name</span>
        <input
          className="field__input field__input--text"
          value={name}
          placeholder="z. B. Bankdrücken"
          enterKeyHint="done"
          autoCapitalize="sentences"
          autoComplete="off"
          autoFocus
          onChange={(event) => {
            setName(event.target.value);
            setError('');
          }}
        />
      </label>

      {addable.length > 0 && (
        <div className="field">
          <span className="label">Vorhandene Übung übernehmen</span>
          <div className="chips">
            {addable.map((item) => (
              <button
                key={item.exercise.id}
                type="button"
                className="btn btn--small"
                onClick={() => pick(item)}
              >
                {item.exercise.name}
                {item.exercise.archived && <span className="muted"> · archiviert</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <Stepper label="Sätze" value={sets} min={SETS_RANGE.min} max={SETS_RANGE.max} onChange={setSets} />
      <Stepper
        label="Wiederholungen"
        value={reps}
        min={REPS_RANGE.min}
        max={REPS_RANGE.max}
        onChange={setReps}
      />

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="btn btn--primary btn--block">
        Hinzufügen
      </button>
      <button type="button" className="btn btn--ghost btn--block" onClick={onClose}>
        Schließen
      </button>
    </form>
  );
}

export default function Plan() {
  // Startet mit der Liste von heute, an Ruhetagen mit Oberkörper.
  const [split, setSplit] = useState<Split>(() => splitForDate(new Date()) ?? 'upper');
  const [items, setItems] = useState<PlanItem[] | null>(null);
  const [addable, setAddable] = useState<AddableExercise[]>([]);
  const [openEntryId, setOpenEntryId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  const reload = useCallback(async () => {
    const [plan, others] = await Promise.all([loadPlan(split), loadAddable(split)]);
    setItems(plan);
    setAddable(others);
  }, [split]);

  useEffect(() => {
    reload();
  }, [reload]);

  const switchTo = (next: Split) => {
    setSplit(next);
    setItems(null);
    setOpenEntryId(null);
    setAdding(false);
  };

  const current = SPLITS.find((list) => list.split === split)!;

  return (
    <>
      <SubpageHeader label="Zwei Listen, vier Tage" title="Plan" />

      <div className="stack">
        <div className="segmented" role="group" aria-label="Liste wählen">
          {SPLITS.map((list) => (
            <button
              key={list.split}
              type="button"
              className="segmented__option"
              aria-pressed={list.split === split}
              onClick={() => switchTo(list.split)}
            >
              {list.label}
              <small>{list.days}</small>
            </button>
          ))}
        </div>

        {items && (
          <section className="card">
            <p className="label">{current.days}</p>
            <h2 className="heading">{current.label}</h2>
            {items.length === 0 ? (
              <p className="muted">Diese Liste ist noch leer.</p>
            ) : (
              <ul className="rows">
                {items.map((item, index) => {
                  const { entry, exercise } = item;
                  const open = entry.id === openEntryId;
                  return (
                    <li key={entry.id}>
                      <div className="row">
                        <button
                          type="button"
                          className="row__main"
                          aria-expanded={open}
                          onClick={() => setOpenEntryId(open ? null : entry.id)}
                        >
                          <span className="row__name">{exercise.name}</span>
                          <span className="muted small">
                            {formatTarget(entry.targetSets, entry.targetReps)}
                          </span>
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn--on-card"
                          aria-label={`${exercise.name} nach oben`}
                          disabled={index === 0}
                          onClick={async () => {
                            await moveEntry(split, entry.id, -1);
                            await reload();
                          }}
                        >
                          <Arrow up />
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn--on-card"
                          aria-label={`${exercise.name} nach unten`}
                          disabled={index === items.length - 1}
                          onClick={async () => {
                            await moveEntry(split, entry.id, 1);
                            await reload();
                          }}
                        >
                          <Arrow />
                        </button>
                      </div>
                      {open && (
                        <RowEditor
                          key={exercise.id}
                          item={item}
                          usedElsewhere={item.inOtherList}
                          onChanged={reload}
                          onClose={() => setOpenEntryId(null)}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {items &&
          (adding ? (
            <AddForm
              key={split}
              split={split}
              addable={addable}
              onAdded={reload}
              onClose={() => setAdding(false)}
            />
          ) : (
            <button type="button" className="btn btn--primary btn--block" onClick={() => setAdding(true)}>
              Übung hinzufügen
            </button>
          ))}
      </div>
    </>
  );
}
