import { describe, expect, it } from 'vitest';
import { greeting } from './greeting';

const at = (hour: number, minute = 0) => new Date(2026, 10, 20, hour, minute);

describe('greeting', () => {
  it('grüßt nach Tageszeit, ohne Name und Komma', () => {
    expect(greeting(at(5))).toBe('Guten Morgen');
    expect(greeting(at(10, 59))).toBe('Guten Morgen');
    expect(greeting(at(11))).toBe('Hallo');
    expect(greeting(at(17, 59))).toBe('Hallo');
    expect(greeting(at(18))).toBe('Guten Abend');
    expect(greeting(at(0))).toBe('Guten Abend');
    expect(greeting(at(4, 59))).toBe('Guten Abend');
  });
});
