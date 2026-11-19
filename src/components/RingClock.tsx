import { useEffect, useRef, useState } from 'react';
import { formatTimer } from '../lib/duration';
import type { ExerciseStatus } from '../lib/exerciseTiming';

const SIZE = 240;
const CENTER = SIZE / 2;
const TRACK_R = 86;
const DOT_R = 104;
const CIRCUMFERENCE = 2 * Math.PI * TRACK_R;

/** Unterhalb dieser Höhe wird statt des Rings die schmale Zeile gezeigt. */
const MIN_RING_HEIGHT = 150;

function dotPosition(index: number, count: number) {
  const angle = -Math.PI / 2 + (index / count) * 2 * Math.PI;
  return { x: CENTER + DOT_R * Math.cos(angle), y: CENTER + DOT_R * Math.sin(angle) };
}

/**
 * Ring-Uhr: groß die Zeit der aktuellen Übung, klein die Gesamtzeit. Um den Ring ein Punkt pro Übung
 * (erledigt gefüllt, aktuell umrandet, offen gedämpft), der Bogen zeigt den Fortschritt der Sätze.
 * Sie füllt den freien Platz. Ist zu wenig da, wird sie zur schmalen Zeile.
 */
export default function RingClock({
  exerciseMs,
  totalMs,
  statuses,
  progress,
}: {
  exerciseMs: number;
  totalMs: number;
  /** Status jeder Übung in Planreihenfolge */
  statuses: ExerciseStatus[];
  /** Fortschritt von 0 bis 1 */
  progress: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setCompact(entry.contentRect.height < MIN_RING_HEIGHT);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const exerciseTime = formatTimer(exerciseMs);
  const totalTime = formatTimer(totalMs);
  const label = `Übung ${exerciseTime}, gesamt ${totalTime}`;

  return (
    <div ref={box} className={compact ? 'ring ring--compact' : 'ring'} role="timer" aria-label={label}>
      {compact ? (
        <div className="ring__line" aria-hidden="true">
          <span className="num num--l">{exerciseTime}</span>
          <span className="ring__line-side">
            <span className="ring__dots">
              {statuses.map((status, index) => (
                <span key={index} className={`ring__dot ring__dot--${status}`} />
              ))}
            </span>
            <span className="muted small">Gesamt {totalTime}</span>
          </span>
        </div>
      ) : (
        <svg className="ring__svg" viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
          <circle className="ring__track" cx={CENTER} cy={CENTER} r={TRACK_R} />
          {progress > 0 && (
            <circle
              className="ring__progress"
              cx={CENTER}
              cy={CENTER}
              r={TRACK_R}
              strokeDasharray={`${progress * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
            />
          )}
          {statuses.map((status, index) => {
            const { x, y } = dotPosition(index, statuses.length);
            return <circle key={index} className={`ring__dot-svg ring__dot-svg--${status}`} cx={x} cy={y} r={5.5} />;
          })}
          <text className="ring__caption" x={CENTER} y={CENTER - 34} textAnchor="middle">
            DIESE ÜBUNG
          </text>
          <text
            className="ring__time"
            x={CENTER}
            y={CENTER + 4}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={exerciseTime.length > 5 ? 32 : 42}
          >
            {exerciseTime}
          </text>
          <text className="ring__total" x={CENTER} y={CENTER + 42} textAnchor="middle">
            Gesamt {totalTime}
          </text>
        </svg>
      )}
    </div>
  );
}
