const W = 390;
const H = 200;
const PAD_X = 12;
const TOP = 26;
const BOTTOM = 28;
const MIN_BAR = 3;

export interface Bar {
  key: string;
  value: number;
  /** Wert über dem Balken */
  valueLabel: string;
  /** Beschriftung unter dem Balken */
  label: string;
  /** Hervorgehoben (gelb), z. B. die aktuelle Woche */
  highlight?: boolean;
}

/**
 * Balkendiagramm nach DESIGN.md: graue Balken, einer gelb hervorgehoben, Wert über jedem Balken.
 * Ohne eigene Karte, ohne Achsen. Auch ein Wert von 0 bleibt als flacher Strich sichtbar.
 */
export default function BarChart({ bars, label }: { bars: Bar[]; label: string }) {
  const max = Math.max(1, ...bars.map((bar) => bar.value));
  const slot = (W - 2 * PAD_X) / bars.length;
  const barWidth = Math.min(30, slot * 0.58);
  const plot = H - TOP - BOTTOM;

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {bars.map((bar, index) => {
        const height = Math.max(MIN_BAR, (bar.value / max) * plot);
        const cx = PAD_X + slot * (index + 0.5);
        const y = TOP + plot - height;
        return (
          <g key={bar.key}>
            <rect
              className={bar.highlight ? 'bar bar--highlight' : 'bar'}
              x={cx - barWidth / 2}
              y={y}
              width={barWidth}
              height={height}
              rx={Math.min(8, barWidth / 2)}
            />
            <text className={bar.highlight ? 'bar__value bar__value--highlight' : 'bar__value'} x={cx} y={y - 8} textAnchor="middle">
              {bar.valueLabel}
            </text>
            <text className="chart__axis" x={cx} y={H - 8} textAnchor="middle">
              {bar.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
