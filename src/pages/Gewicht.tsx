import { useCallback, useEffect, useState } from 'react';
import Icon from '../components/Icon';
import LineChart from '../components/LineChart';
import { PageHeader } from '../components/PageHeader';
import type { BodyWeight, LocalDate } from '../db';
import {
  averageSeries,
  formatChange,
  formatKg1,
  newestFirst,
  parseBodyWeight,
  rangeStart,
  stepWeight,
  weightSummary,
  type WeightRange,
} from '../lib/bodyWeight';
import { deleteBodyWeight, loadBodyWeights, saveBodyWeight } from '../lib/bodyWeightDb';
import { daysBetween, formatDayMonth, formatLongDate, toLocalDate } from '../lib/dates';

const RANGES: { range: WeightRange; label: string }[] = [
  { range: '4w', label: '4 Wochen' },
  { range: '3m', label: '3 Monate' },
  { range: 'all', label: 'Alles' },
];

const INVALID = 'Bitte ein Gewicht zwischen 20 und 400 kg eingeben.';

/** Feld mit − 0,1 und + 0,1 links und rechts, für die Eingabe mit einer Hand. */
function WeightField({
  value,
  onChange,
  fallback,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Ausgangswert für − / +, wenn das Feld leer ist */
  fallback: number;
  label: string;
}) {
  const step = (delta: number) => {
    const current = parseBodyWeight(value) ?? fallback;
    onChange(formatKg1(stepWeight(current, delta)));
  };
  return (
    <div className="weight-field">
      <button type="button" className="control-btn" aria-label="0,1 kg weniger" onClick={() => step(-0.1)}>
        <Icon name="minus" className="icon-btn__icon" />
      </button>
      <label className="set-field weight-field__input">
        <input
          className="field__input"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          aria-label={label}
          value={value}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="set-field__unit" aria-hidden="true">
          kg
        </span>
      </label>
      <button type="button" className="control-btn" aria-label="0,1 kg mehr" onClick={() => step(0.1)}>
        <Icon name="plus" className="icon-btn__icon" />
      </button>
    </div>
  );
}

/** Glas-Karte oben: heutiges Gewicht eintragen, auf Wunsch für einen anderen Tag. */
function EntryCard({ entries, today, onSaved }: { entries: BodyWeight[]; today: LocalDate; onSaved: () => Promise<void> }) {
  const latest = entries[entries.length - 1];
  const valueFor = (date: LocalDate) => {
    const existing = entries.find((entry) => entry.date === date) ?? latest;
    return existing ? formatKg1(existing.weightKg) : '';
  };
  const [date, setDate] = useState(today);
  const [value, setValue] = useState(() => valueFor(today));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const existing = entries.find((entry) => entry.date === date);

  const save = async () => {
    const kg = parseBodyWeight(value);
    if (kg === null) {
      setError(INVALID);
      return;
    }
    await saveBodyWeight(date, kg);
    setError('');
    setMessage(`${formatKg1(kg)} kg für ${date === today ? 'heute' : formatLongDate(date)} gespeichert`);
    await onSaved();
  };

  return (
    <div className="glow">
      <section className="card card--hero card--glass">
        <div className="card__row weight-entry__head">
          <p className="label">{date === today ? 'Heute' : 'Nachtragen'}</p>
          <label className="date-chip">
            <span className="visually-hidden">Datum</span>
            <input
              type="date"
              className="date-chip__input"
              value={date}
              max={today}
              onChange={(event) => {
                const next = event.target.value || today;
                setDate(next);
                setValue(valueFor(next));
                setMessage('');
                setError('');
              }}
            />
          </label>
        </div>
        <WeightField
          value={value}
          onChange={(next) => {
            setValue(next);
            setMessage('');
            setError('');
          }}
          fallback={latest?.weightKg ?? 75}
          label="Gewicht in kg"
        />
        <button type="button" className="btn btn--primary btn--block" onClick={save}>
          Speichern
        </button>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : (
          <p className="label" aria-live="polite">
            {message ||
              (existing
                ? `Für diesen Tag sind ${formatKg1(existing.weightKg)} kg eingetragen. Speichern überschreibt den Wert.`
                : latest
                  ? `Vorbefüllt mit dem letzten Wert vom ${formatLongDate(latest.date)}`
                  : 'Noch kein Eintrag')}
          </p>
        )}
      </section>
    </div>
  );
}

/** Eintrag in der Liste: antippen zum Korrigieren, Löschen mit Nachfrage. */
function EntryRow({
  entry,
  open,
  onToggle,
  onChanged,
}: {
  entry: BodyWeight;
  open: boolean;
  onToggle: () => void;
  onChanged: () => Promise<void>;
}) {
  const [value, setValue] = useState(formatKg1(entry.weightKg));
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  return (
    <li className="entry">
      <button type="button" className="item item--plain" aria-expanded={open} onClick={onToggle}>
        <span className="item__main">
          <span className="item__title">{formatLongDate(entry.date)}</span>
        </span>
        <span className="num num--m">
          {formatKg1(entry.weightKg)}
          <span className="num__unit">kg</span>
        </span>
      </button>

      {open && !confirming && (
        <div className="entry__editor">
          <WeightField value={value} onChange={setValue} fallback={entry.weightKg} label={`Gewicht am ${formatLongDate(entry.date)}`} />
          {error && <p className="error">{error}</p>}
          <div className="card__row">
            <button type="button" className="btn btn--danger" onClick={() => setConfirming(true)}>
              Löschen
            </button>
            <button
              type="button"
              className="btn"
              onClick={async () => {
                const kg = parseBodyWeight(value);
                if (kg === null) {
                  setError(INVALID);
                  return;
                }
                await saveBodyWeight(entry.date, kg);
                onToggle();
                await onChanged();
              }}
            >
              Korrektur speichern
            </button>
          </div>
        </div>
      )}

      {open && confirming && (
        <div className="entry__editor" role="alertdialog" aria-label="Eintrag löschen">
          <p>Eintrag vom {formatLongDate(entry.date)} mit {formatKg1(entry.weightKg)} kg endgültig löschen?</p>
          <div className="card__row">
            <button type="button" className="btn btn--ghost" onClick={() => setConfirming(false)}>
              Abbrechen
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={async () => {
                await deleteBodyWeight(entry.date);
                await onChanged();
              }}
            >
              Ja, löschen
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export default function Gewicht() {
  const [today] = useState(() => toLocalDate(new Date()));
  const [entries, setEntries] = useState<BodyWeight[] | null>(null);
  const [range, setRange] = useState<WeightRange>('4w');
  const [openDate, setOpenDate] = useState<LocalDate | null>(null);

  const reload = useCallback(async () => {
    setEntries(await loadBodyWeights());
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!entries) return null;

  const summary = weightSummary(entries);
  const series = averageSeries(entries);

  // Zeitraum bis zum neuesten Eintrag. Die Linie nutzt auch frühere Einträge für den Durchschnitt.
  const end = summary?.date ?? today;
  const start = rangeStart(range, end) ?? entries[0]?.date ?? end;
  const from = entries[0] && entries[0].date > start ? entries[0].date : start;
  const x = (date: LocalDate) => daysBetween(from, date);
  const line = series.filter((p) => p.date >= from).map((p) => ({ x: x(p.date), y: p.averageKg }));
  const marks = entries.filter((e) => e.date >= from).map((e) => ({ x: x(e.date), y: e.weightKg }));

  return (
    <div className="vivid">
      <PageHeader label="Körpergewicht" title="Gewicht" />

      <div className="stack">
        <EntryCard entries={entries} today={today} onSaved={reload} />

        {summary && (
          <section className="weight-summary" aria-label="Übersicht">
            <p className="label">7-Tage-Durchschnitt{summary.date !== today && ` · Stand ${formatLongDate(summary.date)}`}</p>
            <div className="weight-summary__row">
              <p className="num num--xl">
                {formatKg1(summary.averageKg)}
                <span className="num__unit">kg</span>
              </p>
              {summary.changeKg !== null && (
                <p className="weight-summary__change">
                  <span className="num num--m">{formatChange(summary.changeKg)}</span>
                  <span className="label">zur Vorwoche</span>
                </p>
              )}
            </div>
          </section>
        )}

        {summary && (
          <>
            <div className="segmented" role="group" aria-label="Zeitraum">
              {RANGES.map((option) => (
                <button
                  key={option.range}
                  type="button"
                  className="segmented__option"
                  aria-pressed={range === option.range}
                  onClick={() => setRange(option.range)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="chart-bleed">
              <LineChart
                line={line}
                marks={marks}
                xDomain={[0, Math.max(1, x(end))]}
                xLabels={from === end ? [{ x: 0, text: formatDayMonth(end) }] : [
                  { x: 0, text: formatDayMonth(from) },
                  { x: x(end), text: formatDayMonth(end) },
                ]}
                yFormat={formatKg1}
                tag={`${formatKg1(summary.averageKg)} kg`}
                label={`Verlauf des 7-Tage-Durchschnitts, zuletzt ${formatKg1(summary.averageKg)} kg`}
              />
            </div>
          </>
        )}

        {entries.length > 0 && (
          <section className="section section--tight">
            <h2 className="heading">Einträge</h2>
            <ul className="item-list">
              {newestFirst(entries).map((entry) => (
                <EntryRow
                  key={`${entry.date}-${entry.weightKg}`}
                  entry={entry}
                  open={openDate === entry.date}
                  onToggle={() => setOpenDate(openDate === entry.date ? null : entry.date)}
                  onChanged={reload}
                />
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
