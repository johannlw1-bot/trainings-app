import { useCallback, useEffect, useState } from 'react';
import Icon from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { useNow } from '../components/useNow';
import type { BodyWeight, Split, Workout } from '../db';
import { formatChange, formatKg1, weightSummary } from '../lib/bodyWeight';
import { loadBodyWeights } from '../lib/bodyWeightDb';
import { toLocalDate } from '../lib/dates';
import { elapsedMs, formatTimer } from '../lib/duration';
import { calendarMonths, trainedDaysIn, trainingsThisWeek, type CalendarMonth } from '../lib/overview';
import { loadPlan } from '../lib/planDb';
import { TRAININGS_PER_WEEK, nextTraining, splitForDate, splitLabel } from '../lib/schedule';
import { getActiveWorkout, loadWorkoutDates, startWorkout } from '../lib/workoutDb';

const dateFormat = new Intl.DateTimeFormat('de', { weekday: 'long', day: 'numeric', month: 'long' });
const weekdayFormat = new Intl.DateTimeFormat('de', { weekday: 'long' });

interface Loaded {
  active: Workout | undefined;
  dates: string[];
  weights: BodyWeight[];
  planCount: number;
}

/** Laufende Gesamtzeit, jede Sekunde neu aus dem gespeicherten Start berechnet. */
function RunningTime({ startedAt }: { startedAt: string }) {
  const now = useNow();
  return <span className="timer">{formatTimer(elapsedMs(startedAt, now))}</span>;
}

/** Kleiner Ring: Trainings dieser Woche von den geplanten. */
function WeekRing({ done }: { done: number }) {
  const r = 19;
  const c = 2 * Math.PI * r;
  const share = Math.min(1, done / TRAININGS_PER_WEEK);
  return (
    <svg className="week-ring" viewBox="0 0 48 48" aria-hidden="true">
      <circle className="week-ring__track" cx={24} cy={24} r={r} />
      {share > 0 && (
        <circle
          className="week-ring__progress"
          cx={24}
          cy={24}
          r={r}
          strokeDasharray={`${share * c} ${c}`}
          transform="rotate(-90 24 24)"
        />
      )}
      <text className="week-ring__text" x={24} y={24} textAnchor="middle" dominantBaseline="central">
        {done}
      </text>
    </svg>
  );
}

/** Punkte-Raster der letzten drei Monate, ein Punkt pro Tag. */
function CalendarGrid({ months }: { months: CalendarMonth[] }) {
  return (
    <div className="calendar" aria-hidden="true">
      {months.map((month) => (
        <div key={month.key} className="calendar__month">
          <span className="calendar__label">{month.label}</span>
          <span className="calendar__grid">
            {Array.from({ length: month.offset }, (_, i) => (
              <span key={`leer-${i}`} />
            ))}
            {month.days.map((day) => (
              <span key={day.date} className={`calendar__dot calendar__dot--${day.state}`} />
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Uebersicht() {
  const [today] = useState(() => new Date());
  const todayDate = toLocalDate(today);
  const split = splitForDate(today);
  const [data, setData] = useState<Loaded | null>(null);

  const reload = useCallback(async () => {
    const [active, dates, weights] = await Promise.all([getActiveWorkout(), loadWorkoutDates(), loadBodyWeights()]);
    const planCount = split ? (await loadPlan(split)).length : 0;
    setData({ active, dates, weights, planCount });
  }, [split]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!data) return null;

  const { active, dates, weights } = data;
  const week = trainingsThisWeek(dates, todayDate);
  const doneToday = !active && dates.includes(todayDate);
  const summary = weightSummary(weights);
  const months = calendarMonths(dates, todayDate);
  const calendarCount = trainedDaysIn(months);
  const next = nextTraining(today);

  const start = async (which: Split) => {
    await startWorkout(which, todayDate);
    window.location.hash = '#/einheit';
  };

  const showStart = !active && !doneToday && split !== null && data.planCount > 0;

  return (
    <div className={active || showStart ? 'vivid home home--with-action' : 'vivid home'}>
      <PageHeader label={dateFormat.format(today)} title="Übersicht" />

      <div className="tiles">
        <div className="glow tile-glow">
          <a className="tile card--glass" href="#/training">
            <span className="tile__top">
              <WeekRing done={week} />
              <span className="tile__hint">
                {week} von {TRAININGS_PER_WEEK}
                <br />
                diese Woche
              </span>
            </span>
            <span className="tile__bottom">
              <span className="tile__title">
                {active ? splitLabel(active.split) : split ? splitLabel(split) : 'Ruhetag'}
              </span>
              <span className="tile__sub">
                {active ? (
                  <>
                    Läuft · <RunningTime startedAt={active.startedAt} />
                  </>
                ) : doneToday ? (
                  'Heute erledigt'
                ) : split ? (
                  'Heute'
                ) : (
                  `${weekdayFormat.format(next.date)}: ${splitLabel(next.split)}`
                )}
              </span>
            </span>
          </a>
        </div>

        <a className="tile" href="#/gewicht">
          <span className="tile__top">
            {summary ? (
              <span className="num num--l">
                {formatKg1(summary.averageKg)}
                <span className="num__unit">kg</span>
              </span>
            ) : (
              <span className="tile__icon">
                <Icon name="plus" />
              </span>
            )}
          </span>
          <span className="tile__bottom">
            <span className="tile__title">{summary ? 'Gewicht' : 'Gewicht eintragen'}</span>
            <span className="tile__sub">
              {summary
                ? summary.changeKg === null
                  ? '7-Tage-Schnitt'
                  : `${formatChange(summary.changeKg)} zur Vorwoche`
                : 'Noch kein Eintrag'}
            </span>
          </span>
        </a>
      </div>

      <a className="card calendar-card" href="#/verlauf">
        <CalendarGrid months={months} />
        <span className="calendar-card__foot">
          <span className="item__main">
            <span className="item__title">Trainingskalender</span>
            <span className="item__sub">
              {calendarCount === 1 ? '1 Trainingstag' : `${calendarCount} Trainingstage`} in drei Monaten
            </span>
          </span>
          <Icon name="chevron" className="item__chevron" />
        </span>
      </a>

      {(active || showStart) && (
        <div className="home-action">
          {active ? (
            <a className="btn btn--primary btn--block home-action__btn" href="#/einheit">
              Training fortsetzen · <RunningTime startedAt={active.startedAt} />
            </a>
          ) : (
            split && (
              <button type="button" className="btn btn--primary btn--block home-action__btn" onClick={() => start(split)}>
                {splitLabel(split)} starten
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
