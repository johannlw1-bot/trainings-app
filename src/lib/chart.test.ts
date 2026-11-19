import { describe, expect, it } from 'vitest';
import { paddedDomain, smoothPath } from './chart';

describe('smoothPath', () => {
  it('beginnt am ersten und endet am letzten Punkt', () => {
    const d = smoothPath([
      { x: 0, y: 10 },
      { x: 10, y: 5 },
      { x: 20, y: 8 },
    ]);
    expect(d.startsWith('M0,10C')).toBe(true);
    expect(d.endsWith(' 20,8')).toBe(true);
    expect(d.match(/C/g)).toHaveLength(2);
  });

  it('schwingt bei einer Spitze nicht über den Punkt hinaus (waagrechte Tangente)', () => {
    const d = smoothPath([
      { x: 0, y: 10 },
      { x: 10, y: 0 },
      { x: 20, y: 10 },
    ]);
    // Kontrollpunkte rund um die Spitze liegen auf ihrer Höhe.
    expect(d).toContain('6.67,0 10,0');
    expect(d).toContain('C13.33,0');
  });

  it('kommt mit keinem und einem Punkt zurecht', () => {
    expect(smoothPath([])).toBe('');
    expect(smoothPath([{ x: 5, y: 6 }])).toBe('M5,6');
  });
});

describe('paddedDomain', () => {
  it('gibt Luft und hält eine Mindestspanne ein', () => {
    const [min, max] = paddedDomain([80, 80.2]);
    expect(min).toBeLessThan(79.2);
    expect(max).toBeGreaterThan(81);
  });
});
