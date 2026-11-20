// Erzeugt das App-Icon (Hantel in Neongelb auf Schwarz, siehe DESIGN.md) als SVG und PNG
// in public/. Ohne Abhängigkeiten: Die Hantel besteht nur aus abgerundeten Rechtecken, die hier
// mit Kantenglättung gerastert und als PNG geschrieben werden.
// Aufruf: node scripts/make-icons.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const BG = [0x0a, 0x0a, 0x0b]; // --bg
const ACCENT = [0xdc, 0xff, 0x1a]; // --accent

// Abgerundete Rechtecke im 512er Raster, linke Hälfte, wird gespiegelt.
// Die Hantel bleibt innerhalb der sicheren Zone für maskierbare Icons (Kreis mit 80 % Durchmesser).
const HALF = [
  { x: 76, y: 238, w: 26, h: 36, r: 8 }, // Endstück
  { x: 100, y: 188, w: 32, h: 136, r: 12 }, // äußere Scheibe
  { x: 138, y: 154, w: 38, h: 204, r: 14 }, // innere Scheibe
];
const BAR = { x: 176, y: 242, w: 160, h: 28, r: 8 }; // Griff
const SHAPES = [
  ...HALF,
  ...HALF.map((s) => ({ ...s, x: 512 - s.x - s.w })),
  BAR,
];

function inRoundedRect(px, py, { x, y, w, h, r }) {
  if (px < x || px > x + w || py < y || py > y + h) return false;
  const cx = Math.min(Math.max(px, x + r), x + w - r);
  const cy = Math.min(Math.max(py, y + r), y + h - r);
  return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
}

function render(size) {
  const scale = 512 / size;
  const samples = 4;
  const rows = [];
  for (let j = 0; j < size; j++) {
    const row = Buffer.alloc(1 + size * 3); // Filter-Byte 0 + RGB
    for (let i = 0; i < size; i++) {
      let hits = 0;
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const px = (i + (sx + 0.5) / samples) * scale;
          const py = (j + (sy + 0.5) / samples) * scale;
          if (SHAPES.some((shape) => inRoundedRect(px, py, shape))) hits++;
        }
      }
      const a = hits / (samples * samples);
      for (let c = 0; c < 3; c++) {
        row[1 + i * 3 + c] = Math.round(BG[c] + (ACCENT[c] - BG[c]) * a);
      }
    }
    rows.push(row);
  }
  return png(size, Buffer.concat(rows));
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function png(size, raw) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // Bittiefe
  header[9] = 2; // RGB, ohne Transparenz (iOS füllt transparente Flächen sonst schwarz oder weiß)
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function svg() {
  const hex = (rgb) => `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  const rects = SHAPES.map(
    ({ x, y, w, h, r }) => `  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`,
  ).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="${hex(BG)}"/>
  <g fill="${hex(ACCENT)}">
${rects}
  </g>
</svg>
`;
}

const out = new URL('../public/', import.meta.url);
mkdirSync(new URL('icons/', out), { recursive: true });
writeFileSync(new URL('favicon.svg', out), svg());
writeFileSync(new URL('apple-touch-icon.png', out), render(180));
writeFileSync(new URL('icons/icon-192.png', out), render(192));
writeFileSync(new URL('icons/icon-512.png', out), render(512));
console.log('Icons geschrieben nach public/');
