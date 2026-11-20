import { describe, expect, it } from 'vitest';
import type { BodyWeight } from '../db';
import {
  averageSeries,
  formatChange,
  newestFirst,
  parseBodyWeight,
  rangeStart,
  sevenDayAverage,
  stepWeight,
  weightSummary,
} from './bodyWeight';
import { addDays, addMonths, daysBetween } from './dates';

const w = (date: string, weightKg: number): BodyWeight => ({ id: `#${date}`, date, weightKg });

describe('sevenDayAverage', () => {
  it('nimmt alle Einträge der letzten 7 Kalendertage einschließlich des Tages', () => {
    const entries = [w('2026-11-13', 80), w('2026-11-16', 81), w('2026-11-19', 82)];
    expect(sevenDayAverage(entries, '2026-11-19')).toBeCloseTo(81);
  });

  it('lässt Tage außerhalb des Fensters weg (8 Tage zurück zählt nicht)', () => {
    const entries = [w('2026-11-12', 70), w('2026-11-19', 82)];
    expect(sevenDayAverage(entries, '2026-11-19')).toBe(82);
  });

  it('ignoriert Einträge nach dem Tag', () => {
    const entries = [w('2026-11-18', 80), w('2026-11-20', 90)];
    expect(sevenDayAverage(entries, '2026-11-19')).toBe(80);
  });

  it('füllt fehlende Tage nicht auf und gibt ohne Eintrag null', () => {
    expect(sevenDayAverage([w('2026-11-01', 80)], '2026-11-19')).toBeNull();
    expect(sevenDayAverage([], '2026-11-19')).toBeNull();
  });

  it('rechnet über Monats- und Jahreswechsel', () => {
    const entries = [w('2025-12-27', 80), w('2026-01-02', 82)];
    expect(sevenDayAverage(entries, '2026-01-02')).toBe(81);
  });
});

describe('averageSeries', () => {
  it('liefert einen Punkt pro Tag mit Eintrag, aufsteigend', () => {
    const entries = [w('2026-11-19', 82), w('2026-11-17', 80)];
    expect(averageSeries(entries)).toEqual([
      { date: '2026-11-17', averageKg: 80 },
      { date: '2026-11-19', averageKg: 81 },
    ]);
  });
});

describe('weightSummary', () => {
  it('bezieht sich auf den neuesten Eintrag und vergleicht mit 7 Tagen davor', () => {
    const entries = [w('2026-11-10', 80), w('2026-11-12', 80.4), w('2026-11-17', 80.6), w('2026-11-19', 81)];
    const summary = weightSummary(entries)!;
    expect(summary.date).toBe('2026-11-19');
    expect(summary.averageKg).toBeCloseTo(80.8);
    expect(summary.changeKg).toBeCloseTo(0.6);
  });

  it('hat keine Veränderung, wenn es in der Vorwoche keinen Eintrag gab', () => {
    expect(weightSummary([w('2026-11-19', 81)])!.changeKg).toBeNull();
  });

  it('gibt ohne Einträge null', () => {
    expect(weightSummary([])).toBeNull();
  });
});

describe('Eingabe', () => {
  it('liest Komma und Punkt und rundet auf 0,1', () => {
    expect(parseBodyWeight('82,4')).toBe(82.4);
    expect(parseBodyWeight('82.46')).toBe(82.5);
    expect(parseBodyWeight(' 80 ')).toBe(80);
  });

  it('lehnt Unsinn und unrealistische Werte ab', () => {
    expect(parseBodyWeight('')).toBeNull();
    expect(parseBodyWeight('abc')).toBeNull();
    expect(parseBodyWeight('8')).toBeNull();
    expect(parseBodyWeight('500')).toBeNull();
  });

  it('schaltet in 0,1-Schritten ohne Rundungsfehler', () => {
    expect(stepWeight(82.2, 0.1)).toBe(82.3);
    expect(stepWeight(82.3, -0.1)).toBe(82.2);
    expect(stepWeight(0.3, -0.1)).toBe(20);
  });
});

describe('Zeitraum und Datum', () => {
  it('4 Wochen sind 28 Tage einschließlich des letzten', () => {
    expect(rangeStart('4w', '2026-11-19')).toBe('2026-10-23');
  });

  it('3 Monate zählen Kalendermonate', () => {
    expect(rangeStart('3m', '2026-11-19')).toBe('2026-08-20');
    expect(rangeStart('all', '2026-11-19')).toBeNull();
  });

  it('addMonths nimmt den letzten Tag, wenn es den Tag nicht gibt', () => {
    expect(addMonths('2026-05-31', -3)).toBe('2026-02-28');
  });

  it('addDays und daysBetween überstehen die Zeitumstellung', () => {
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30');
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
  });
});

describe('Anzeige', () => {
  it('zeigt die Veränderung mit Vorzeichen und Komma', () => {
    expect(formatChange(0.34)).toBe('+0,3 kg');
    expect(formatChange(-0.2)).toBe('−0,2 kg');
    expect(formatChange(0.02)).toBe('±0,0 kg');
  });

  it('sortiert die Liste neueste zuerst', () => {
    expect(newestFirst([w('2026-11-01', 1), w('2026-11-19', 2)]).map((e) => e.date)).toEqual([
      '2026-11-19',
      '2026-11-01',
    ]);
  });
});
