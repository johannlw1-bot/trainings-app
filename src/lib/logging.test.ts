import { describe, expect, it } from 'vitest';
import type { Workout, WorkoutSet } from '../db';
import { formatShortDate, fromLocalDate, toLocalDate } from './dates';
import { formatSets, increaseHint, pickLastTime, reachedTop, suggestSet } from './lastTime';
import { formatKg, parseReps, parseWeight } from './numbers';

describe('toLocalDate', () => {
  it('nimmt den lokalen Kalendertag, auch kurz vor und nach Mitternacht', () => {
    expect(toLocalDate(new Date(2026, 10, 16, 23, 59))).toBe('2026-11-16');
    expect(toLocalDate(new Date(2026, 10, 17, 0, 1))).toBe('2026-11-17');
    expect(toLocalDate(new Date(2026, 0, 5, 12))).toBe('2026-01-05');
  });

  it('lässt sich verlustfrei zurückwandeln', () => {
    expect(toLocalDate(fromLocalDate('2026-03-01'))).toBe('2026-03-01');
  });

  it('formatiert kurz mit Wochentag', () => {
    expect(formatShortDate('2026-11-12')).toBe('Do., 12.11.');
  });
});

describe('parseWeight', () => {
  it('akzeptiert Komma und Punkt', () => {
    expect(parseWeight('82,5')).toBe(82.5);
    expect(parseWeight('82.5')).toBe(82.5);
    expect(parseWeight(' 80 ')).toBe(80);
  });

  it('akzeptiert halb getippte Zahlen und 0', () => {
    expect(parseWeight('82,')).toBe(82);
    expect(parseWeight('0')).toBe(0);
  });

  it('rundet auf zwei Nachkommastellen', () => {
    expect(parseWeight('1,256')).toBe(1.26);
    expect(parseWeight('82,504')).toBe(82.5);
  });

  it('lehnt Unsinn ab', () => {
    expect(parseWeight('')).toBeNull();
    expect(parseWeight(',')).toBeNull();
    expect(parseWeight('8,2,5')).toBeNull();
    expect(parseWeight('-5')).toBeNull();
    expect(parseWeight('abc')).toBeNull();
    expect(parseWeight('1000')).toBeNull();
  });
});

describe('parseReps', () => {
  it('akzeptiert ganze Zahlen ab 1', () => {
    expect(parseReps('8')).toBe(8);
    expect(parseReps('12')).toBe(12);
  });

  it('lehnt 0, Kommazahlen und Leeres ab', () => {
    expect(parseReps('0')).toBeNull();
    expect(parseReps('8,5')).toBeNull();
    expect(parseReps('')).toBeNull();
  });
});

describe('formatKg', () => {
  it('nutzt das Komma und lässt überflüssige Nullen weg', () => {
    expect(formatKg(82.5)).toBe('82,5');
    expect(formatKg(80)).toBe('80');
    expect(formatKg(1.25)).toBe('1,25');
    expect(formatKg(1000)).toBe('1000');
  });
});

const workout = (id: number, date: string, finished = true): Workout => ({
  id,
  date,
  split: 'upper',
  startedAt: `${date}T17:00:00.000Z`,
  finishedAt: finished ? `${date}T18:00:00.000Z` : undefined,
});

const set = (
  workoutId: number,
  setNumber: number,
  weightKg: number,
  reps: number,
  warmup = false,
): WorkoutSet => ({
  id: workoutId * 100 + setNumber + (warmup ? 50 : 0),
  workoutId,
  exerciseId: 1,
  warmup,
  setNumber,
  weightKg,
  reps,
});

describe('pickLastTime', () => {
  const workouts = [workout(1, '2026-11-09'), workout(2, '2026-11-12'), workout(3, '2026-11-16', false)];
  const sets = [set(1, 1, 75, 8), set(2, 2, 80, 7), set(2, 1, 80, 8), set(3, 1, 82.5, 8)];

  it('nimmt das jüngste abgeschlossene Training und sortiert die Sätze', () => {
    expect(pickLastTime(sets, workouts, 3)).toEqual({
      date: '2026-11-12',
      sets: [
        { setNumber: 1, weightKg: 80, reps: 8 },
        { setNumber: 2, weightKg: 80, reps: 7 },
      ],
      warmups: [],
    });
  });

  it('trennt Aufwärmsätze von den Arbeitssätzen', () => {
    const mixed = [set(2, 1, 40, 12, true), set(2, 1, 80, 8), set(2, 2, 80, 7)];
    const last = pickLastTime(mixed, workouts);
    expect(last?.sets.map((s) => s.weightKg)).toEqual([80, 80]);
    expect(last?.warmups).toEqual([{ setNumber: 1, weightKg: 40, reps: 12 }]);
  });

  it('zählt ein Training nur mit Aufwärmsatz nicht als letztes Mal', () => {
    const onlyWarmup = [set(1, 1, 75, 8), set(2, 1, 40, 12, true)];
    expect(pickLastTime(onlyWarmup, workouts)?.date).toBe('2026-11-09');
  });

  it('ignoriert nicht abgeschlossene Trainings', () => {
    expect(pickLastTime([set(3, 1, 82.5, 8)], workouts)).toBeUndefined();
  });

  it('überspringt Trainings, in denen die Übung nicht vorkam', () => {
    expect(pickLastTime([set(1, 1, 75, 8)], workouts)?.date).toBe('2026-11-09');
  });

  it('gibt ohne Vorgeschichte nichts zurück', () => {
    expect(pickLastTime([], workouts)).toBeUndefined();
  });
});

describe('formatSets', () => {
  it('fasst gleiche Gewichte zusammen', () => {
    expect(formatSets([set(1, 1, 80, 8), set(1, 2, 80, 8), set(1, 3, 80, 7)])).toBe('80 kg × 8, 8, 7');
  });

  it('trennt wechselnde Gewichte', () => {
    expect(formatSets([set(1, 1, 80, 8), set(1, 2, 82.5, 6)])).toBe('80 kg × 8 · 82,5 kg × 6');
  });
});

describe('suggestSet', () => {
  const last = [
    { setNumber: 1, weightKg: 80, reps: 8 },
    { setNumber: 2, weightKg: 80, reps: 7 },
  ];

  it('schlägt denselben Satz vom letzten Mal vor', () => {
    expect(suggestSet(1, last, undefined, 10)).toEqual({ weightKg: 80, reps: 7 });
  });

  it('nimmt für zusätzliche Sätze den letzten Satz vom letzten Mal', () => {
    expect(suggestSet(3, last, undefined, 10)).toEqual({ weightKg: 80, reps: 7 });
  });

  it('nimmt beim ersten Mal das Ziel aus dem Plan und kein Gewicht', () => {
    expect(suggestSet(0, undefined, undefined, 10)).toEqual({ weightKg: null, reps: 10 });
  });

  it('übernimmt ein heute geändertes Gewicht für den nächsten Satz', () => {
    const today = { setNumber: 1, weightKg: 82.5, reps: 8 };
    expect(suggestSet(1, last, today, 10)).toEqual({ weightKg: 82.5, reps: 7 });
  });

  it('bleibt beim Wert vom letzten Mal, wenn das Gewicht heute gleich war', () => {
    const pyramid = [
      { setNumber: 1, weightKg: 60, reps: 10 },
      { setNumber: 2, weightKg: 80, reps: 6 },
    ];
    const today = { setNumber: 1, weightKg: 60, reps: 10 };
    expect(suggestSet(1, pyramid, today, 10)).toEqual({ weightKg: 80, reps: 6 });
  });

  it('greift auf den letzten eingetragenen Satz zurück, auch wenn dazwischen einer fehlt', () => {
    const today = { setNumber: 1, weightKg: 40, reps: 10 };
    expect(suggestSet(2, undefined, today, 10)).toEqual({ weightKg: 40, reps: 10 });
  });

  it('übernimmt beim ersten Mal auch die Wiederholungen des Satzes davor', () => {
    const today = { setNumber: 1, weightKg: 50, reps: 12 };
    expect(suggestSet(1, undefined, today, 8)).toEqual({ weightKg: 50, reps: 12 });
  });

  it('übernimmt beim ersten Mal das Gewicht des Satzes davor', () => {
    const today = { setNumber: 1, weightKg: 40, reps: 10 };
    expect(suggestSet(1, undefined, today, 10)).toEqual({ weightKg: 40, reps: 10 });
  });
});

describe('reachedTop', () => {
  const sets = (...reps: number[]) => reps.map((r, i) => ({ setNumber: i + 1, weightKg: 50, reps: r }));

  it('ist erfüllt, wenn alle Arbeitssätze das obere Ende erreichen', () => {
    expect(reachedTop(sets(12, 12, 12), 3, 12)).toBe(true);
    expect(reachedTop(sets(13, 12, 14), 3, 12)).toBe(true);
  });

  it('ist nicht erfüllt, wenn ein Satz darunter bleibt', () => {
    expect(reachedTop(sets(12, 12, 11), 3, 12)).toBe(false);
  });

  it('ist nicht erfüllt, wenn Sätze fehlen', () => {
    expect(reachedTop(sets(12, 12), 3, 12)).toBe(false);
    expect(reachedTop([], 3, 12)).toBe(false);
  });
});

describe('increaseHint', () => {
  const sets = (weightKg: number, ...reps: number[]) =>
    reps.map((r, i) => ({ setNumber: i + 1, weightKg, reps: r }));

  it('rät zum Erhöhen, wenn letztes Mal alles am oberen Ende war', () => {
    expect(increaseHint(sets(50, 12, 12, 12), [], 3, 12)).toBe('now');
  });

  it('schweigt, wenn letztes Mal ein Satz fehlte oder zu kurz war', () => {
    expect(increaseHint(sets(50, 12, 12, 10), [], 3, 12)).toBeNull();
    expect(increaseHint(undefined, [], 3, 12)).toBeNull();
  });

  it('verschwindet, sobald heute schwerer trainiert wird', () => {
    expect(increaseHint(sets(50, 12, 12, 12), sets(52.5, 9), 3, 12)).toBeNull();
  });

  it('bleibt stehen, solange heute mit dem alten Gewicht trainiert wird', () => {
    expect(increaseHint(sets(50, 12, 12, 12), sets(50, 12), 3, 12)).toBe('now');
  });

  it('meldet fürs nächste Mal, wenn heute alles am oberen Ende ist', () => {
    expect(increaseHint(sets(50, 10, 10, 9), sets(50, 12, 12, 12), 3, 12)).toBe('next-time');
  });
});
