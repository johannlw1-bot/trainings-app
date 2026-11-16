import { describe, expect, it } from 'vitest';
import { nextTraining, splitForDate } from './schedule';

// 16.11.2026 ist ein Montag.
const day = (d: number) => new Date(2026, 10, d);

describe('splitForDate', () => {
  it('ordnet Montag und Donnerstag dem Oberkörper zu', () => {
    expect(splitForDate(day(16))).toBe('upper');
    expect(splitForDate(day(19))).toBe('upper');
  });

  it('ordnet Dienstag und Freitag dem Unterkörper zu', () => {
    expect(splitForDate(day(17))).toBe('lower');
    expect(splitForDate(day(20))).toBe('lower');
  });

  it('kennt Mittwoch, Samstag und Sonntag als Ruhetage', () => {
    expect(splitForDate(day(18))).toBeNull();
    expect(splitForDate(day(21))).toBeNull();
    expect(splitForDate(day(22))).toBeNull();
  });

  it('wechselt auch kurz vor Mitternacht nicht den Tag', () => {
    expect(splitForDate(new Date(2026, 10, 16, 23, 59))).toBe('upper');
  });
});

describe('nextTraining', () => {
  it('findet vom Mittwoch aus den Donnerstag', () => {
    const next = nextTraining(day(18));
    expect(next.split).toBe('upper');
    expect(next.date.getDate()).toBe(19);
  });

  it('überspringt das Wochenende', () => {
    const next = nextTraining(day(20));
    expect(next.split).toBe('upper');
    expect(next.date.getDate()).toBe(23);
  });

  it('zählt den Ausgangstag nicht mit', () => {
    const next = nextTraining(day(16));
    expect(next.split).toBe('lower');
    expect(next.date.getDate()).toBe(17);
  });
});
