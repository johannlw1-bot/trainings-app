import { describe, expect, it } from 'vitest';
import { clamp, formatTarget, moveItem, normalizeName, sameName } from './plan';

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
    expect(sameName('Bankdrücken', 'Schrägbankdrücken')).toBe(false);
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

describe('formatTarget', () => {
  it('verwendet Einzahl und Mehrzahl richtig', () => {
    expect(formatTarget(1, 12)).toBe('1 Satz × 12 Wdh');
    expect(formatTarget(3, 10)).toBe('3 Sätze × 10 Wdh');
  });
});
