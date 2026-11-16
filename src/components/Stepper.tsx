/** Zahl mit Minus- und Plus-Button, für kleine Werte wie Sätze und Wiederholungen. */
export default function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="stepper">
      <span className="label">{label}</span>
      <div className="stepper__controls">
        <button
          type="button"
          className="icon-btn icon-btn--on-card"
          aria-label={`${label} verringern`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
        >
          <svg className="icon-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 12h12" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
          </svg>
        </button>
        <span className="num num--m stepper__value" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          className="icon-btn icon-btn--on-card"
          aria-label={`${label} erhöhen`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
        >
          <svg className="icon-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M6 12h12M12 6v12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
