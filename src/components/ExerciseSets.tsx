import { useRef, type MouseEvent, type PointerEvent } from 'react';
import type { WorkoutSet } from '../db';
import type { LastTime } from '../lib/lastTime';
import { formatKg } from '../lib/numbers';
import type { Targets } from '../lib/plan';
import {
  buildRows,
  pressCheck,
  shownDraft,
  typeInto,
  type Draft,
  type EntryResult,
  type SetRowModel,
} from '../lib/setEntry';

/**
 * Eine Satzzeile. Graue Zahlen sind Vorschläge, weiße eingetippt oder gespeichert.
 * Tippen speichert nichts, erst der Haken. Ein gespeicherter Satz wird beim Ändern direkt aktualisiert.
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
  const { saved, suggestion } = row;
  const fields = shownDraft(draft, saved);

  const toggle = () => {
    const result = pressCheck(fields, row);
    if (result.kind === 'focus') (result.field === 'weight' ? weightRef : repsRef).current?.focus();
    onResult(result);
    // Erst nach dem Speichern die Tastatur schließen. Das Layout springt dann (Ring-Uhr kommt zurück),
    // der Tipp ist aber schon angekommen.
    if (result.kind !== 'focus' && document.activeElement instanceof HTMLInputElement) {
      document.activeElement.blur();
    }
  };

  // Das aktive Feld behält beim Drücken des Hakens den Fokus. Sonst endet der Tastatur-Modus schon beim
  // Aufsetzen des Fingers, das Layout verschiebt sich und der Klick verfehlt den Haken.
  const keepFocus = (event: PointerEvent | MouseEvent) => {
    if (document.activeElement instanceof HTMLInputElement) event.preventDefault();
  };

  // Ein geleertes Feld eines gespeicherten Satzes zeigt nach dem Verlassen wieder den gespeicherten Wert.
  const restoreSaved = () => {
    if (!saved || (fields.weight.trim() !== '' && fields.reps.trim() !== '')) return;
    onResult({
      kind: 'none',
      draft: {
        weight: fields.weight.trim() === '' ? formatKg(saved.weightKg) : fields.weight,
        reps: fields.reps.trim() === '' ? String(saved.reps) : fields.reps,
        typed: false,
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
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => onResult(typeInto({ ...fields, weight: event.target.value }, row))}
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
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => onResult(typeInto({ ...fields, reps: event.target.value }, row))}
          onBlur={restoreSaved}
        />
        <span className="set-field__unit" aria-hidden="true">
          Wdh
        </span>
      </label>
      <button
        type="button"
        className="check-btn"
        aria-pressed={!!saved}
        aria-label={saved ? `${name} wieder austragen` : `${name} eintragen`}
        onPointerDown={keepFocus}
        onMouseDown={keepFocus}
        onClick={toggle}
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
  onClear,
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
  onClear: (warmup: boolean, setNumber: number) => void;
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
            if (result.kind === 'clear') onClear(row.warmup, row.setNumber);
          }}
        />
      ))}
    </div>
  );
}
