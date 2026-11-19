import { useId } from 'react';
import { paddedDomain, smoothPath, type Point } from '../lib/chart';

const W = 390;
const H = 230;
const PAD_X = 20;
const TOP = 40;
const BOTTOM = 30;

export interface ChartLabel {
  x: number;
  text: string;
}

/**
 * Liniendiagramm nach DESIGN.md: geschwungene gelbe Linie mit Verlauf darunter, Einzelwerte als
 * kleine graue Punkte, der letzte Punkt der Linie hervorgehoben mit Schildchen. Ohne eigene Karte.
 * x ist eine fortlaufende Zahl (z. B. Tage), y der Wert.
 */
export default function LineChart({
  line,
  marks = [],
  xDomain,
  xLabels = [],
  yFormat,
  tag,
  label,
}: {
  line: Point[];
  marks?: Point[];
  xDomain: [number, number];
  xLabels?: ChartLabel[];
  yFormat: (value: number) => string;
  /** Text im Schildchen am hervorgehobenen Punkt */
  tag: string;
  /** Beschreibung für Bildschirmleser */
  label: string;
}) {
  const gradientId = useId();
  const [yMin, yMax] = paddedDomain([...line, ...marks].map((p) => p.y));
  const [x0, x1] = xDomain;

  const sx = (x: number) => (x1 === x0 ? W / 2 : PAD_X + ((x - x0) / (x1 - x0)) * (W - 2 * PAD_X));
  const sy = (y: number) => TOP + (1 - (y - yMin) / (yMax - yMin)) * (H - TOP - BOTTOM);

  const scaled = line.map((p) => ({ x: sx(p.x), y: sy(p.y) }));
  const path = smoothPath(scaled);
  const first = scaled[0];
  const last = scaled[scaled.length - 1];
  const baseline = H - BOTTOM;
  const area = scaled.length > 1 ? `${path}L${last.x},${baseline}L${first.x},${baseline}Z` : '';

  // Zwei Hilfslinien mit Wert, kaum sichtbar
  const gridValues = [yMin + (yMax - yMin) * 0.25, yMin + (yMax - yMin) * 0.75];

  const tagWidth = tag.length * 7.6 + 22;
  const tagHeight = 28;
  const tagX = last ? Math.min(W - 6 - tagWidth, Math.max(6, last.x - tagWidth / 2)) : 0;
  const tagY = last ? Math.max(4, last.y - tagHeight - 16) : 0;

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className="chart__area-top" />
          <stop offset="100%" className="chart__area-bottom" />
        </linearGradient>
      </defs>

      {gridValues.map((value) => (
        <g key={value}>
          <line className="chart__grid" x1={0} x2={W} y1={sy(value)} y2={sy(value)} />
          <text className="chart__axis" x={W - PAD_X} y={sy(value) - 6} textAnchor="end">
            {yFormat(value)}
          </text>
        </g>
      ))}

      {area && <path d={area} fill={`url(#${gradientId})`} />}

      {marks.map((p) => (
        <circle key={`${p.x}-${p.y}`} className="chart__mark" cx={sx(p.x)} cy={sy(p.y)} r={3} />
      ))}

      {scaled.length > 1 && <path className="chart__line" d={path} />}

      {last && (
        <>
          <rect className="chart__tag" x={tagX} y={tagY} width={tagWidth} height={tagHeight} rx={14} />
          <text
            className="chart__tag-text"
            x={tagX + tagWidth / 2}
            y={tagY + tagHeight / 2}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {tag}
          </text>
          <circle className="chart__highlight" cx={last.x} cy={last.y} r={7} />
        </>
      )}

      {xLabels.map((item, index) => (
        <text
          key={item.x}
          className="chart__axis"
          x={sx(item.x)}
          y={H - 8}
          textAnchor={index === 0 && xLabels.length > 1 ? 'start' : index === xLabels.length - 1 && xLabels.length > 1 ? 'end' : 'middle'}
        >
          {item.text}
        </text>
      ))}
    </svg>
  );
}
