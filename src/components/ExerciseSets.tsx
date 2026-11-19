import { useRef, type MouseEvent, type PointerEvent } from 'react';
import type { WorkoutSet } from '../db';
import type { LastTime } from '../lib/lastTime';
import { formatKg } from '../lib/numbers';
import type { Targets } from '../lib/plan';
import {
  buildRows,
  checkState,
  pressCheck,
  shownDraft,
  startEditing,
  typeInto,
  type Draft,
  type EntryResult,
  type SetRowModel,
} from '../lib/setEntry';

/** So lange nach dem Speichern bleibt die Tastatur offen, damit das Layout nicht unter dem Finger springt. */
const BLUR_DELAY_MS = 300;

/**
 * Eine Satzzeile. Graue Zahlen sind Vorschläge, weiße eingetippt oder gespeichert.
 * Haken: Umriss (leer), gelb (wird bearbeitet, ein Tipp speichert), grau (gespeichert, ein Tipp tut nichts).
 */
function SetRow({
  marker,
  name,
  row,
  draft,
  onResult,
}: {
  /** Was vorne in der Zeile steht: die Satznummer oder „A“ für Aufwärmen */
  marker: string;
  /** Für Screenreader, z. B. „Satz 2“ oder „Aufwärmsatz“ */
  name: string;
  row: SetRowModel;
  draft: Draft | undefined;
  onResult: (result: EntryResult) => void;
}) {
  const weightRef = useRef<HTMLInputElement>(null);
  const repsRef = useRef<HTMLInputElement>(null);
  // Finger liegt auf dem Haken / Tipp wurde schon beim Loslassen ausgeführt (dann zählt der Klick danach nicht)
  const pressing = useRef(false);
  const handled = useRef(false);
  const { saved, suggestion } = row;
  const fields = shownDraft(draft, saved);
  const state = checkState(fields, saved);

  const press = () => {
    const result = pressCheck(fields, row);
    if (result.kind === 'focus') {
      (result.field === 'weight' ? weightRef : repsRef).current?.focus();
      return;
    }
    onResult(result);
    // Erst nach dem Speichern die Tastatur schließen. Das Layout springt dann (Ring-Uhr kommt zurück),
    // der Tipp ist aber schon angekommen.
    const active = document.activeElement;
    if (result.kind === 'save' && active instanceof HTMLInputElement) {
      window.setTimeout(() => {
        if (document.activeElement === active) active.blur();
      }, BLUR_DELAY_MS);
    }
  };

  // Der Tipp wird schon beim Loslassen ausgeführt, nicht erst beim Klick. Safari schickt den Klick bei offener
  // Tastatur erst nach dem Ende der Eingabe, dann ist das Layout womöglich schon verschoben.
  // Das aktive Feld behält beim Drücken den Fokus, die Tastatur bleibt bis nach dem Speichern offen.
  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    pressing.current = true;
    if (document.activeElement instanceof HTMLInputElement) event.preventDefault();
  };
  const onPointerUp = () => {
    if (!pressing.current) return;
    pressing.current = false;
    handled.current = true;
    // Kommt kein Klick hinterher (z. B. weil Safari ihn verschluckt), verfällt die Markierung.
    window.setTimeout(() => (handled.current = false), 800);
    press();
  };
  const onClick = () => {
    // Tastatur (Enter, Leertaste) oder ein Browser ohne Pointer-Events
    if (handled.current) handled.current = false;
    else press();
  };
  const keepFocus = (event: MouseEvent) => {
    if (document.activeElement instanceof HTMLInputElement) event.preventDefault();
  };

  // Antippen eines Feldes: Der Satz wird bearbeitet, der Haken gelb.
  const onFocus = (event: { currentTarget: HTMLInputElement }) => {
    event.currentTarget.select();
    if (!fields.editing) onResult({ kind: 'none', draft: startEditing(fields) });
  };

  // Ein geleertes Feld eines gespeicherten Satzes zeigt nach dem Verlassen wieder den gespeicherten Wert.
  const restoreSaved = () => {
    if (!saved || (fields.weight.trim() !== '' && fields.reps.trim() !== '')) return;
    onResult({
      kind: 'none',
      draft: {
        weight: fields.weight.trim() === '' ? formatKg(saved.weightKg) : fields.weight,
        reps: fields.reps.trim() === '' ? String(saved.reps) : fields.reps,
        editing: fields.editing,
      },
    });
  };

  return (
    <div className={row.warmup ? 'set-row set-row--warmup' : 'set-row'}>
      <span className="set-row__no" aria-hidden="true">
        {marker}
      </span>
      <label className="set-field">
        <input
          ref={weightRef}
          className="field__input"
          inputMode="decimal"
          autoComplete="off"
          aria-label={`${name}: Gewicht in kg`}
          placeholder={suggestion.weightKg === null ? '' : formatKg(suggestion.weightKg)}
          value={fields.weight}
          onFocus={onFocus}
          onChange={(event) => onResult({ kind: 'none', draft: typeInto({ ...fields, weight: event.target.value }) })}
          onBlur={restoreSaved}
        />
        <span className="set-field__unit" aria-hidden="true">
          kg
        </span>
      </label>
      <label className="set-field">
        <input
          ref={repsRef}
          className="field__input"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          aria-label={`${name}: Wiederholungen`}
          placeholder={String(suggestion.reps)}
          value={fields.reps}
          onFocus={onFocus}
          onChange={(event) => onResult({ kind: 'none', draft: typeInto({ ...fields, reps: event.target.value }) })}
          onBlur={restoreSaved}
        />
        <span className="set-field__unit" aria-hidden="true">
          Wdh
        </span>
      </label>
      <button
        type="button"
        className="check-btn"
        data-state={state}
        aria-label={
          state === 'saved' ? `${name} gespeichert` : state === 'editing' ? `${name} speichern` : `${name} eintragen`
        }
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (pressing.current = false)}
        onMouseDown={keepFocus}
        onClick={onClick}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

/** Aufwärm- und Arbeitssätze einer Übung als Eingabezeilen. */
export default function ExerciseSets({
  exercise,
  sets,
  last,
  rowCount,
  draftOf,
  onDraft,
  onSave,
}: {
  exercise: Targets;
  /** Die heute eingetragenen Sätze dieser Übung */
  sets: WorkoutSet[];
  last: LastTime | undefined;
  /** Anzahl der Zeilen für Arbeitssätze */
  rowCount: number;
  /** Was in einer Zeile eingetippt ist. Liegt in der Trainingsansicht, damit es beim Wechsel gespeichert werden kann. */
  draftOf: (warmup: boolean, setNumber: number) => Draft | undefined;
  onDraft: (warmup: boolean, setNumber: number, draft: Draft) => void;
  onSave: (warmup: boolean, setNumber: number, weightKg: number, reps: number) => void;
}) {
  const rows = buildRows(exercise, sets, last, rowCount);
  const warmupRows = rows.filter((row) => row.warmup).length;

  return (
    <div className="sets">
      {rows.map((row) => (
        <SetRow
          key={`${row.warmup ? 'w' : 's'}${row.setNumber}`}
          marker={row.warmup ? 'A' : String(row.setNumber)}
          name={
            row.warmup
              ? warmupRows > 1
                ? `Aufwärmsatz ${row.setNumber}`
                : 'Aufwärmsatz'
              : `Satz ${row.setNumber}`
          }
          row={row}
          draft={draftOf(row.warmup, row.setNumber)}
          onResult={(result) => {
            onDraft(row.warmup, row.setNumber, result.draft);
            if (result.kind === 'save') onSave(row.warmup, row.setNumber, result.value.weightKg, result.value.reps);
          }}
        />
      ))}
    </div>
  );
}
