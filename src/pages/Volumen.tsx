import { useEffect, useState } from 'react';
import BarChart from '../components/BarChart';
import { SubpageHeader } from '../components/PageHeader';
import { useDataVersion } from '../components/useDataVersion';
import { addDays, formatDayMonth, isoWeek, toLocalDate } from '../lib/dates';
import { weekStart } from '../lib/overview';
import {
  exerciseVolumes,
  formatVolume,
  formatVolumeChange,
  formatVolumeShort,
  weeklyBuckets,
  weeklyVolume,
  type VolumeSet,
} from '../lib/volume';
import { loadExercises, loadVolumeSets } from '../lib/workoutDb';

const WEEKS = 8;

interface Loaded {
  sets: VolumeSet[];
  names: Map<string, string>;
}

/** Bewegtes Gewicht: letzte 7 Tage, die letzten 8 Kalenderwochen und die Übungen dieser Woche. */
export default function Volumen() {
  const [today] = useState(() => toLocalDate(new Date()));
  const [data, setData] = useState<Loaded | null>(null);
  const thisWeek = weekStart(today);
  // Weit genug zurück für 8 Kalenderwochen und den Vergleich der letzten 7 Tage mit den 7 davor.
  const since = addDays(thisWeek, -7 * (WEEKS - 1));
  const dataVersion = useDataVersion();

  useEffect(() => {
    (async () => {
      const sets = await loadVolumeSets(since);
      const ids = [...new Set(sets.map((set) => set.exerciseId).filter((id) => id !== undefined))];
      const exercises = await loadExercises(ids);
      setData({ sets, names: new Map(exercises.map((exercise) => [exercise.id, exercise.name])) });
    })();
  }, [since, dataVersion]);

  if (!data) return null;

  const volume = weeklyVolume(data.sets, today);
  const weeks = weeklyBuckets(data.sets, today, WEEKS);
  const perExercise = exerciseVolumes(data.sets, thisWeek, addDays(thisWeek, 6));

  return (
    <div className="vivid">
      <SubpageHeader label="Gewicht × Wiederholungen, ohne Aufwärmsätze" title="Bewegtes Gewicht" fallback="#/" />

      <div className="stack">
        <section className="volume-summary">
          <p className="label">Letzte 7 Tage</p>
          <p className="num num--xl">
            {formatVolume(volume.currentKg)}
            <span className="num__unit">kg</span>
          </p>
          <p className="muted">{formatVolumeChange(volume.changeKg)} zur Vorwoche</p>
        </section>

        <section className="section section--tight">
          <h2 className="heading">Letzte 8 Wochen</h2>
          <div className="chart-bleed">
            <BarChart
              label={`Bewegtes Gewicht pro Kalenderwoche, diese Woche ${formatVolume(weeks[weeks.length - 1].volumeKg)} kg`}
              bars={weeks.map((week) => ({
                key: week.weekStart,
                value: week.volumeKg,
                valueLabel: formatVolumeShort(week.volumeKg),
                label: `KW ${isoWeek(week.weekStart)}`,
                highlight: week.weekStart === thisWeek,
              }))}
            />
          </div>
        </section>

        <section className="section section--tight">
          <div>
            <h2 className="heading">Diese Woche</h2>
            <p className="label">Ab Montag, {formatDayMonth(thisWeek)}</p>
          </div>
          {perExercise.length === 0 ? (
            <p className="muted">In dieser Woche ist noch nichts eingetragen.</p>
          ) : (
            <ul className="item-list">
              {perExercise.map((entry) => (
                <li key={entry.exerciseId}>
                  <a className="item item--plain" href={`#/uebung/${encodeURIComponent(entry.exerciseId)}`}>
                    <span className="item__main">
                      <span className="item__title">{data.names.get(entry.exerciseId) ?? 'Übung'}</span>
                    </span>
                    <span className="num num--m">
                      {formatVolume(entry.volumeKg)}
                      <span className="num__unit">kg</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
