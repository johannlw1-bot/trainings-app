import { describe, expect, it } from 'vitest';
import { greeting } from './greeting';
import { isoWeek } from './dates';
import {
  exerciseVolumes,
  formatVolume,
  formatVolumeChange,
  formatVolumeShort,
  volumeBetween,
  weeklyBuckets,
  weeklyVolume,
  type VolumeSet,
} from './volume';

const set = (date: string, weightKg: number, reps: number, warmup = false, exerciseId?: number): VolumeSet => ({
  date,
  weightKg,
  reps,
  warmup,
  exerciseId,
});

describe('weeklyVolume', () => {
  const today = '2026-11-19';

  it('rechnet Gewicht × Wiederholungen der letzten 7 Tage einschließlich heute', () => {
    const sets = [set('2026-11-19', 60, 10), set('2026-11-13', 50, 8), set('2026-11-12', 100, 10)];
    expect(weeklyVolume(sets, today).currentKg).toBe(600 + 400);
  });

  it('lässt Aufwärmsätze weg', () => {
    const sets = [set('2026-11-19', 40, 12, true), set('2026-11-19', 60, 10)];
    expect(weeklyVolume(sets, today).currentKg).toBe(600);
  });

  it('vergleicht mit den 7 Tagen davor', () => {
    const sets = [set('2026-11-18', 50, 10), set('2026-11-12', 40, 10), set('2026-11-06', 40, 5), set('2026-11-05', 99, 99)];
    expect(weeklyVolume(sets, today)).toEqual({ currentKg: 500, previousKg: 600, changeKg: -100 });
  });

  it('ist ohne Sätze 0', () => {
    expect(weeklyVolume([], today)).toEqual({ currentKg: 0, previousKg: 0, changeKg: 0 });
  });

  it('zählt Übungen mit dem eigenen Körpergewicht (0 kg) als 0', () => {
    expect(volumeBetween([set('2026-11-19', 0, 15)], '2026-11-13', today)).toBe(0);
  });
});

describe('Anzeige des Volumens', () => {
  it('ganze Kilo mit Tausenderpunkt', () => {
    expect(formatVolume(3200.4)).toBe('3.200');
    expect(formatVolume(950)).toBe('950');
  });

  it('Vergleich mit Vorzeichen, ohne Bewertung', () => {
    expect(formatVolumeChange(450)).toBe('+450 kg');
    expect(formatVolumeChange(-1200)).toBe('−1.200 kg');
    expect(formatVolumeChange(0.3)).toBe('±0 kg');
  });

  it('kurz über den Balken: Tonnen ab 1000 kg', () => {
    expect(formatVolumeShort(0)).toBe('0');
    expect(formatVolumeShort(950)).toBe('950');
    expect(formatVolumeShort(32_400)).toBe('32,4 t');
    expect(formatVolumeShort(1_000)).toBe('1,0 t');
  });
});

describe('greeting', () => {
  const at = (hour: number) => new Date(2026, 10, 19, hour, 30);

  it('passt zur Tageszeit', () => {
    expect(greeting(at(4), 'Alex')).toBe('Guten Abend, Alex');
    expect(greeting(new Date(2026, 10, 19, 5, 0), 'Alex')).toBe('Guten Morgen, Alex');
    expect(greeting(at(10), 'Alex')).toBe('Guten Morgen, Alex');
    expect(greeting(new Date(2026, 10, 19, 11, 0), 'Alex')).toBe('Hallo, Alex');
    expect(greeting(at(17), 'Alex')).toBe('Hallo, Alex');
    expect(greeting(new Date(2026, 10, 19, 18, 0), 'Alex')).toBe('Guten Abend, Alex');
    expect(greeting(at(23), 'Alex')).toBe('Guten Abend, Alex');
  });
});

describe('weeklyBuckets', () => {
  it('liefert 8 Kalenderwochen ab Montag, die aktuelle zuletzt', () => {
    const buckets = weeklyBuckets([], '2026-11-19');
    expect(buckets).toHaveLength(8);
    expect(buckets[7].weekStart).toBe('2026-11-16');
    expect(buckets[0].weekStart).toBe('2026-09-28');
  });

  it('ordnet Sätze ihrer Kalenderwoche zu, ohne Aufwärmsätze', () => {
    const sets = [
      set('2026-11-16', 50, 10),
      set('2026-11-22', 50, 10),
      set('2026-11-15', 40, 10),
      set('2026-11-17', 20, 10, true),
      set('2026-09-27', 99, 99),
    ];
    const buckets = weeklyBuckets(sets, '2026-11-19');
    expect(buckets[7].volumeKg).toBe(1000);
    expect(buckets[6].volumeKg).toBe(400);
    expect(buckets.reduce((sum, b) => sum + b.volumeKg, 0)).toBe(1400);
  });
});

describe('exerciseVolumes', () => {
  it('summiert pro Übung im Zeitraum und sortiert absteigend', () => {
    const sets = [
      set('2026-11-16', 40, 10, false, 1),
      set('2026-11-17', 100, 10, false, 2),
      set('2026-11-18', 40, 10, false, 1),
      set('2026-11-18', 20, 10, true, 3),
      set('2026-11-12', 500, 10, false, 1),
    ];
    expect(exerciseVolumes(sets, '2026-11-16', '2026-11-22')).toEqual([
      { exerciseId: 2, volumeKg: 1000 },
      { exerciseId: 1, volumeKg: 800 },
    ]);
  });
});

describe('isoWeek', () => {
  it('rechnet Kalenderwochen nach ISO 8601', () => {
    expect(isoWeek('2026-11-19')).toBe(47);
    expect(isoWeek('2026-01-01')).toBe(1);
    expect(isoWeek('2027-01-01')).toBe(53);
    expect(isoWeek('2025-12-29')).toBe(1);
  });
});
