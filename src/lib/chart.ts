// Geometrie für die Liniendiagramme (Körpergewicht, später Fortschritt pro Übung).

export interface Point {
  x: number;
  y: number;
}

/**
 * Geschwungene Linie durch alle Punkte (monotone kubische Interpolation nach Fritsch-Carlson).
 * Sie schwingt nie über die Punkte hinaus, es entstehen also keine erfundenen Spitzen oder Täler.
 * Die Punkte müssen nach x aufsteigend sortiert sein.
 */
export function smoothPath(points: Point[]): string {
  const n = points.length;
  if (n === 0) return '';
  const fmt = (v: number) => Math.round(v * 100) / 100;
  if (n === 1) return `M${fmt(points[0].x)},${fmt(points[0].y)}`;

  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1].x - points[i].x);
    slope.push(dx[i] === 0 ? 0 : (points[i + 1].y - points[i].y) / dx[i]);
  }

  // Tangenten: an den Enden die Steigung des Randstücks, innen 0 bei Richtungswechsel.
  const tangent: number[] = [slope[0]];
  for (let i = 1; i < n - 1; i++) {
    if (slope[i - 1] * slope[i] <= 0) {
      tangent.push(0);
    } else {
      const w1 = 2 * dx[i] + dx[i - 1];
      const w2 = dx[i] + 2 * dx[i - 1];
      tangent.push((w1 + w2) / (w1 / slope[i - 1] + w2 / slope[i]));
    }
  }
  tangent.push(slope[n - 2]);

  let d = `M${fmt(points[0].x)},${fmt(points[0].y)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const h = dx[i] / 3;
    d += `C${fmt(p0.x + h)},${fmt(p0.y + tangent[i] * h)} ${fmt(p1.x - h)},${fmt(p1.y - tangent[i + 1] * h)} ${fmt(p1.x)},${fmt(p1.y)}`;
  }
  return d;
}

/** Wertebereich mit etwas Luft oben und unten, mindestens `minSpan` breit. */
export function paddedDomain(values: number[], minSpan = 2): [number, number] {
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (max - min < minSpan) {
    const mid = (min + max) / 2;
    min = mid - minSpan / 2;
    max = mid + minSpan / 2;
  }
  const pad = (max - min) * 0.12;
  return [min - pad, max + pad];
}
