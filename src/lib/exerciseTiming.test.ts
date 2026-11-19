import { describe, expect, it } from 'vitest';
import {
  activeExerciseId,
  exerciseStatus,
  exerciseTimes,
  nextOpenExercise,
  planSwitch,
  previousExercise,
  segmentMs,
  setProgress,
} from './exerciseTiming';

const MIN = 60_000;
const at = (minute: number) => new Date(Date.UTC(2026, 10, 19, 17, minute)).toISOString();
const now = Date.parse(at(60));

const seg = (id: number, exerciseId: number, from: number, to?: number) => ({
  id,
  workoutId: 1,
  exerciseId,
  startedAt: at(from),
  endedAt: to === undefined ? undefined : at(to),
});

describe('segmentMs', () => {
  it('rechnet abgeschlossene Abschnitte von Start bis Ende', () => {
    expect(segmentMs(seg(1, 1, 0, 7), now)).toBe(7 * MIN);
  });

  it('lässt offene Abschnitte bis jetzt laufen', () => {
    expect(segmentMs(seg(1, 1, 50), now)).toBe(10 * MIN);
  });

  it('wird nie negativ', () => {
    expect(segmentMs(seg(1, 1, 70), now)).toBe(0);
  });
});

describe('exerciseTimes', () => {
  it('zählt mehrere Besuche derselben Übung zusammen', () => {
    // Brustpresse (1) 0–8, Rudern (2) 8–15, zurück zur Brustpresse 15–18, Rudern läuft seit 18
    const segments = [seg(1, 1, 0, 8), seg(2, 2, 8, 15), seg(3, 1, 15, 18), seg(4, 2, 18)];
    const times = exerciseTimes(segments, now);
    expect(times.get(1)).toBe(11 * MIN);
    expect(times.get(2)).toBe(7 * MIN + 42 * MIN);
    expect(times.get(3)).toBeUndefined();
  });

  it('liefert für alte Trainings ohne Abschnitte nichts', () => {
    expect(exerciseTimes([], now).size).toBe(0);
  });
});

describe('activeExerciseId', () => {
  it('ist die Übung mit dem offenen Abschnitt', () => {
    expect(activeExerciseId([seg(1, 1, 0, 8), seg(2, 2, 8)])).toBe(2);
  });

  it('ist ohne offenen Abschnitt die zuletzt begonnene', () => {
    expect(activeExerciseId([seg(1, 1, 0, 8), seg(2, 3, 20, 25), seg(3, 2, 8, 20)])).toBe(3);
  });

  it('ist ohne Abschnitte unbestimmt', () => {
    expect(activeExerciseId([])).toBeUndefined();
  });
});

describe('exerciseStatus', () => {
  const segments = [seg(1, 1, 0, 8), seg(2, 2, 8)];

  it('markiert die angezeigte Übung als aktuell', () => {
    expect(exerciseStatus(2, 2, segments, 0)).toBe('current');
  });

  it('braucht für erledigt einen Arbeitssatz und einen abgeschlossenen Besuch', () => {
    expect(exerciseStatus(1, 2, segments, 3)).toBe('done');
    expect(exerciseStatus(1, 2, segments, 0)).toBe('open');
    expect(exerciseStatus(3, 2, segments, 2)).toBe('open');
  });
});

describe('nextOpenExercise', () => {
  const order = [10, 20, 30, 40];
  const doneSet = (...ids: number[]) => (id: number) => ids.includes(id);

  it('nimmt die nächste offene Übung nach der aktuellen', () => {
    expect(nextOpenExercise(order, 10, doneSet())).toBe(20);
  });

  it('überspringt erledigte Übungen', () => {
    expect(nextOpenExercise(order, 10, doneSet(20, 30))).toBe(40);
  });

  it('fängt vorne wieder an, wenn danach nichts mehr offen ist', () => {
    // 20 war besetzt und wurde ausgelassen
    expect(nextOpenExercise(order, 40, doneSet(10, 30))).toBe(20);
  });

  it('meldet null, wenn alle anderen erledigt sind', () => {
    expect(nextOpenExercise(order, 30, doneSet(10, 20, 40))).toBeNull();
  });

  it('zählt die aktuelle Übung nie als Ziel', () => {
    expect(nextOpenExercise([10], 10, doneSet())).toBeNull();
  });

  it('beginnt ohne aktuelle Übung vorne', () => {
    expect(nextOpenExercise(order, undefined, doneSet(10))).toBe(20);
  });
});

describe('previousExercise', () => {
  it('geht eine Übung zurück, aber nicht über den Anfang hinaus', () => {
    expect(previousExercise([10, 20, 30], 30)).toBe(20);
    expect(previousExercise([10, 20, 30], 10)).toBeNull();
  });
});

describe('setProgress', () => {
  it('ist der Anteil der eingetragenen an den geplanten Arbeitssätzen', () => {
    expect(setProgress(0, 27)).toBe(0);
    expect(setProgress(9, 27)).toBeCloseTo(1 / 3);
  });

  it('bleibt bei Zusatzsätzen bei 100 Prozent', () => {
    expect(setProgress(30, 27)).toBe(1);
  });
});

describe('planSwitch', () => {
  it('schließt den offenen Abschnitt und öffnet einen neuen', () => {
    expect(planSwitch([seg(1, 1, 0, 8), seg(2, 2, 8)], 3)).toEqual({ close: [2], open: 3 });
  });

  it('tut nichts, wenn die Übung schon läuft', () => {
    expect(planSwitch([seg(2, 2, 8)], 2)).toEqual({ close: [], open: null });
  });

  it('öffnet beim ersten Mal nur', () => {
    expect(planSwitch([], 1)).toEqual({ close: [], open: 1 });
  });

  it('räumt mehrere offene Abschnitte auf', () => {
    expect(planSwitch([seg(1, 1, 0), seg(2, 2, 5)], 2)).toEqual({ close: [1, 2], open: 2 });
  });
});
