import { describe, expect, it } from 'vitest';
import { adjustRepRange, clamp, formatReps, formatTarget, moveItem, normalizeName, sameName } from './plan';
import { DEFAULT_PLAN } from './seed';

describe('normalizeName', () => {
  it('entfernt Leerzeichen am Rand und doppelte Leerzeichen', () => {
    expect(normalizeName('  Bankdrücken   Kurzhantel ')).toBe('Bankdrücken Kurzhantel');
  });

  it('macht aus reinen Leerzeichen einen leeren Namen', () => {
    expect(normalizeName('   ')).toBe('');
  });
});

describe('sameName', () => {
  it('ignoriert Groß- und Kleinschreibung und Leerzeichen', () => {
    expect(sameName('Bankdrücken', ' bankDRÜCKEN ')).toBe(true);
  });

  it('unterscheidet verschiedene Übungen', () => {
    expect(sameName('Butterfly', 'Reverse Butterfly')).toBe(false);
  });
});

describe('moveItem', () => {
  it('verschiebt nach oben und unten, ohne die Ausgangsliste zu ändern', () => {
    const items = ['a', 'b', 'c'];
    expect(moveItem(items, 1, -1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(items, 1, 1)).toEqual(['a', 'c', 'b']);
    expect(items).toEqual(['a', 'b', 'c']);
  });

  it('tut am Rand nichts', () => {
    expect(moveItem(['a', 'b'], 0, -1)).toBeNull();
    expect(moveItem(['a', 'b'], 1, 1)).toBeNull();
    expect(moveItem(['a', 'b'], 5, 1)).toBeNull();
  });
});

describe('clamp', () => {
  it('hält den Wert im Bereich', () => {
    expect(clamp(0, 1, 10)).toBe(1);
    expect(clamp(11, 1, 10)).toBe(10);
    expect(clamp(5, 1, 10)).toBe(5);
  });
});

describe('adjustRepRange', () => {
  it('lässt einen gültigen Bereich unverändert', () => {
    expect(adjustRepRange(8, 12, 'min')).toEqual({ min: 8, max: 12 });
  });

  it('zieht das obere Ende mit, wenn das untere darüber hinausgeht', () => {
    expect(adjustRepRange(13, 12, 'min')).toEqual({ min: 13, max: 13 });
  });

  it('zieht das untere Ende mit, wenn das obere darunter fällt', () => {
    expect(adjustRepRange(8, 7, 'max')).toEqual({ min: 7, max: 7 });
  });

  it('bleibt innerhalb der erlaubten Grenzen', () => {
    expect(adjustRepRange(0, 60, 'max')).toEqual({ min: 1, max: 50 });
  });
});

describe('formatReps und formatTarget', () => {
  it('schreibt den Bereich mit Halbgeviertstrich', () => {
    expect(formatReps(8, 12)).toBe('8–12');
    expect(formatReps(10, 10)).toBe('10');
  });

  it('nennt Aufwärmsätze nur, wenn es welche gibt', () => {
    const base = { targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 };
    expect(formatTarget({ ...base, warmupSets: 0 })).toBe('3 × 8–12');
    expect(formatTarget({ ...base, warmupSets: 1 })).toBe('1 Aufwärmsatz + 3 × 8–12');
    expect(formatTarget({ ...base, warmupSets: 2 })).toBe('2 Aufwärmsätze + 3 × 8–12');
  });
});

describe('DEFAULT_PLAN', () => {
  it('enthält 9 Übungen für den Oberkörper und 7 für den Unterkörper', () => {
    expect(DEFAULT_PLAN.upper).toHaveLength(9);
    expect(DEFAULT_PLAN.lower).toHaveLength(7);
  });

  it('beginnt mit den Übungen mit Aufwärmsatz', () => {
    expect(DEFAULT_PLAN.upper.filter((e) => e.warmupSets > 0).map((e) => e.name)).toEqual([
      'Brustpresse',
      'Rudern (Maschine)',
    ]);
    expect(DEFAULT_PLAN.lower.filter((e) => e.warmupSets > 0).map((e) => e.name)).toEqual([
      'Beinpresse',
      'Beinbeuger',
    ]);
  });

  it('hat keine doppelten Namen und nur gültige Bereiche', () => {
    const all = [...DEFAULT_PLAN.upper, ...DEFAULT_PLAN.lower];
    expect(new Set(all.map((e) => e.name.toLowerCase())).size).toBe(all.length);
    for (const exercise of all) {
      expect(exercise.sets).toBe(3);
      expect(exercise.reps[0]).toBeLessThan(exercise.reps[1]);
    }
  });
});
