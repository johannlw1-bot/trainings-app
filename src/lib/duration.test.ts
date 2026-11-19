import { describe, expect, it } from 'vitest';
import { elapsedMs, formatDurationShort, formatTimer, resumedStart, workoutDuration } from './duration';

const MIN = 60_000;

describe('formatTimer', () => {
  it('zeigt unter einer Stunde Minuten und Sekunden', () => {
    expect(formatTimer(0)).toBe('0:00');
    expect(formatTimer(7_000)).toBe('0:07');
    expect(formatTimer(12 * MIN + 34_000)).toBe('12:34');
    expect(formatTimer(59 * MIN + 59_999)).toBe('59:59');
  });

  it('zeigt ab einer Stunde auch die Stunden', () => {
    expect(formatTimer(60 * MIN)).toBe('1:00:00');
    expect(formatTimer(65 * MIN)).toBe('1:05:00');
    expect(formatTimer(10 * 60 * MIN + 3_000)).toBe('10:00:03');
  });

  it('zeigt negative Werte als 0:00', () => {
    expect(formatTimer(-5_000)).toBe('0:00');
  });
});

describe('formatDurationShort', () => {
  it('rundet auf Minuten', () => {
    expect(formatDurationShort(20_000)).toBe('< 1 Min');
    expect(formatDurationShort(52 * MIN + 13_000)).toBe('52 Min');
    expect(formatDurationShort(59 * MIN + 40_000)).toBe('1 Std');
  });

  it('nennt ab einer Stunde Stunden und Minuten', () => {
    expect(formatDurationShort(65 * MIN)).toBe('1 Std 5 Min');
    expect(formatDurationShort(120 * MIN)).toBe('2 Std');
  });
});

describe('elapsedMs und workoutDuration', () => {
  const start = '2026-11-19T16:00:00.000Z';

  it('rechnet ab dem gespeicherten Start', () => {
    expect(elapsedMs(start, Date.parse('2026-11-19T17:05:00.000Z'))).toBe(65 * MIN);
  });

  it('wird nie negativ, auch wenn die Uhr zurückgestellt wurde', () => {
    expect(elapsedMs(start, Date.parse('2026-11-19T15:00:00.000Z'))).toBe(0);
  });

  it('liefert die Dauer nur für beendete Trainings', () => {
    expect(workoutDuration({ startedAt: start, finishedAt: '2026-11-19T16:52:00.000Z' })).toBe(52 * MIN);
    expect(workoutDuration({ startedAt: start })).toBeUndefined();
  });
});

describe('resumedStart', () => {
  it('lässt den Timer beim Wiederöffnen ab der gespeicherten Dauer weiterlaufen', () => {
    const now = Date.parse('2026-11-19T20:00:00.000Z');
    const start = resumedStart('2026-11-19T16:00:00.000Z', '2026-11-19T16:50:00.000Z', now);
    expect(elapsedMs(start, now)).toBe(50 * MIN);
  });
});
