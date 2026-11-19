import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Icon from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { useNow } from '../components/useNow';
import type { BodyWeight, Split, Workout } from '../db';
import { formatChange, formatKg1, weightSummary } from '../lib/bodyWeight';
import { loadBodyWeights } from '../lib/bodyWeightDb';
import { addDays, toLocalDate } from '../lib/dates';
import { elapsedMs, formatDurationShort, formatTimer, workoutDuration } from '../lib/duration';
import { greeting } from '../lib/greeting';
import { calendarMonths, trainedDaysIn, trainingsThisWeek, type CalendarMonth } from '../lib/overview';
import { loadPlan } from '../lib/planDb';
import { TRAININGS_PER_WEEK, nextTraining, splitForDate, splitLabel } from '../lib/schedule';
import { formatVolume, formatVolumeChange, weeklyVolume, type VolumeSet } from '../lib/volume';
import { getActiveWorkout, loadVolumeSets, loadWorkouts, startWorkout } from '../lib/workoutDb';

const dateFormat = new Intl.DateTimeFormat('de', { weekday: 'long', day: 'numeric', month: 'long' });
const weekdayFormat = new Intl.DateTimeFormat('de', { weekday: 'long' });

interface Loaded {
  active: Workout | undefined;
  workouts: Workout[];
  weights: BodyWeight[];
  volumeSets: VolumeSet[];
  planCount: number;
}

/** Laufende Gesamtzeit, jede halbe Sekunde neu aus dem gespeicherten Start berechnet. */
function RunningTime({ startedAt }: { startedAt: string }) {
  const now = useNow();
  return <span className="timer">{formatTimer(elapsedMs(startedAt, now))}</span>;
}

/** Kleiner Ring: Trainingstage dieser Woche von den geplanten. */
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

/**
 * Training-Karte: Inhalt je nach Zustand. Je nach Zustand ein Link, ein Button (startet sofort)
 * oder an Ruhetagen nur eine Anzeige.
 */
function TrainingTile({
  week,
  title,
  sub,
  href,
  onStart,
  label,
}: {
  week: number;
  title: string;
  sub: ReactNode;
  href?: string;
  onStart?: () => void;
  label?: string;
}) {
  const content = (
    <>
      <span className="tile__top">
        <WeekRing done={week} />
        <span className="tile__hint">
          {week} von {TRAININGS_PER_WEEK}
          <br />
          diese Woche
        </span>
      </span>
      <span className="tile__bottom">
        <span className="tile__title">{title}</span>
        <span className="tile__sub">{sub}</span>
      </span>
    </>
  );
  return (
    <div className="glow tile-glow">
      {href ? (
        <a className="tile card--glass" href={href} aria-label={label}>
          {content}
        </a>
      ) : onStart ? (
        <button type="button" className="tile card--glass" onClick={onStart} aria-label={label}>
          {content}
        </button>
      ) : (
        <div className="tile card--glass">{content}</div>
      )}
    </div>
  );
}

export default function Uebersicht() {
  const [now] = useState(() => new Date());
  const today = toLocalDate(now);
  const split = splitForDate(now);
  const [data, setData] = useState<Loaded | null>(null);

  const reload = useCallback(async () => {
    const [active, workouts, weights, volumeSets, plan] = await Promise.all([
      getActiveWorkout(),
      loadWorkouts(),
      loadBodyWeights(),
      loadVolumeSets(addDays(today, -13)),
      split ? loadPlan(split) : Promise.resolve([]),
    ]);
    setData({ active, workouts, weights, volumeSets, planCount: plan.length });
  }, [today, split]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!data) return null;

  const { active, workouts, weights } = data;
  const dates = workouts.map((workout) => workout.date);
  const week = trainingsThisWeek(dates, today);
  // Neuestes beendetes Training von heute
  const doneToday = active
    ? undefined
    : workouts
        .filter((workout) => workout.date === today && workout.finishedAt)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  const summary = weightSummary(weights);
  const months = calendarMonths(dates, today);
  const calendarCount = trainedDaysIn(months);
  const volume = weeklyVolume(data.volumeSets, today);
  const next = nextTraining(now);

  const start = async (which: Split) => {
    await startWorkout(which, today);
    window.location.hash = '#/einheit';
  };

  let tile: ReactNode;
  if (active) {
    tile = (
      <TrainingTile
        week={week}
        title={splitLabel(active.split)}
        sub={
          <>
            Läuft · <RunningTime startedAt={active.startedAt} />
          </>
        }
        href="#/einheit"
        label={`${splitLabel(active.split)} läuft, weiter zum Training`}
      />
    );
  } else if (doneToday) {
    const duration = workoutDuration(doneToday);
    tile = (
      <TrainingTile
        week={week}
        title="Erledigt"
        sub={`${splitLabel(doneToday.split)}${duration !== undefined ? ` · ${formatDurationShort(duration)}` : ''}`}
        href={`#/auswertung/${doneToday.id}`}
        label={`Heute erledigt, Auswertung öffnen`}
      />
    );
  } else if (split && data.planCount > 0) {
    tile = (
      <TrainingTile
        week={week}
        title={splitLabel(split)}
        sub="Tippen zum Starten"
        onStart={() => start(split)}
        label={`${splitLabel(split)} starten`}
      />
    );
  } else if (split) {
    tile = <TrainingTile week={week} title={splitLabel(split)} sub="Plan ist noch leer" href="#/plan" />;
  } else {
    tile = (
      <TrainingTile
        week={week}
        title="Ruhetag"
        sub={`${weekdayFormat.format(next.date)}: ${splitLabel(next.split)}`}
      />
    );
  }

  return (
    <div className="vivid home">
      <PageHeader label={dateFormat.format(now)} title={greeting(now)} />

      <div className="tiles">
        {tile}

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

      <a className="card volume-card" href="#/verlauf">
        <span className="item__main">
          <span className="item__title">Bewegtes Gewicht</span>
          <span className="item__sub">Letzte 7 Tage</span>
        </span>
        <span className="volume-card__value">
          <span className="num num--l">
            {formatVolume(volume.currentKg)}
            <span className="num__unit">kg</span>
          </span>
          <span className="item__sub">{formatVolumeChange(volume.changeKg)} zur Vorwoche</span>
        </span>
      </a>
    </div>
  );
}
