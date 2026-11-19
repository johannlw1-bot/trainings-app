import { describe, expect, it } from 'vitest';
import { calendarMonths, trainedDaysIn, trainingsThisWeek, weekStart } from './overview';
import { TRAININGS_PER_WEEK } from './schedule';

describe('weekStart', () => {
  it('beginnt am Montag', () => {
    expect(weekStart('2026-11-19')).toBe('2026-11-16'); // Donnerstag
    expect(weekStart('2026-11-16')).toBe('2026-11-16'); // Montag
    expect(weekStart('2026-11-22')).toBe('2026-11-16'); // Sonntag gehört zur selben Woche
  });

  it('geht über Monats- und Jahresgrenzen', () => {
    expect(weekStart('2027-01-01')).toBe('2026-12-28');
  });
});

describe('trainingsThisWeek', () => {
  it('zählt Trainingstage von Montag bis Sonntag', () => {
    const dates = ['2026-11-15', '2026-11-16', '2026-11-17', '2026-11-19', '2026-11-23'];
    expect(trainingsThisWeek(dates, '2026-11-19')).toBe(3);
  });

  it('zählt einen Tag mit zwei Trainings einmal', () => {
    expect(trainingsThisWeek(['2026-11-16', '2026-11-16'], '2026-11-19')).toBe(1);
  });

  it('ist am Montag ohne Training 0', () => {
    expect(trainingsThisWeek(['2026-11-13'], '2026-11-16')).toBe(0);
  });

  it('der Plan sieht vier Trainings pro Woche vor', () => {
    expect(TRAININGS_PER_WEEK).toBe(4);
  });
});

describe('calendarMonths', () => {
  const months = calendarMonths(['2026-09-01', '2026-10-15', '2026-11-19', '2026-11-18', '2026-08-31'], '2026-11-19');

  it('zeigt die letzten drei Monate, ältester zuerst, mit Namen', () => {
    expect(months.map((m) => m.label)).toEqual(['September', 'Oktober', 'November']);
    expect(months.map((m) => m.days.length)).toEqual([30, 31, 30]);
  });

  it('rückt den Monatsersten in die richtige Wochentagsspalte (Mo = 0)', () => {
    expect(months[0].offset).toBe(1); // 1.9.2026 ist ein Dienstag
    expect(months[2].offset).toBe(6); // 1.11.2026 ist ein Sonntag
  });

  it('markiert Trainingstage, heute und die Zukunft', () => {
    const nov = months[2].days;
    expect(nov[17].state).toBe('trained'); // 18.11.
    expect(nov[18].state).toBe('trained-today'); // 19.11.
    expect(nov[19].state).toBe('future');
    expect(nov[0].state).toBe('rest');
    expect(calendarMonths([], '2026-11-19')[2].days[18].state).toBe('today');
  });

  it('zählt nur Trainingstage im angezeigten Zeitraum', () => {
    expect(trainedDaysIn(months)).toBe(4);
  });

  it('kommt mit dem Jahreswechsel zurecht', () => {
    expect(calendarMonths([], '2027-01-10').map((m) => m.key)).toEqual(['2026-11-01', '2026-12-01', '2027-01-01']);
  });
});
