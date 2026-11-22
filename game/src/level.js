// The Sunspire Job — the vault hall: walls, pedestals, the diamond case, the vent.
// One job: where everything solid is, and the geometry helpers (collision, sight lines).

import { ROOM } from './config.js';

/** The diamond case at the top of the hall — the loot target. */
export const VAULT_CASE = { x: 590, y: 88, w: 100, h: 64 };

/** The service vent in the bottom wall — the getaway. */
export const EXIT_VENT = { x: 610, y: 676, w: 60, h: 28 };

/** Where the thief slips in. */
export const PLAYER_START = { x: 640, y: 630 };

/** Pedestals and the centre statue: solid cover that blocks movement and sight. */
export const PEDESTALS = [
  { x: 300, y: 200, w: 90, h: 60, label: 'VASE' },
  { x: 890, y: 200, w: 90, h: 60, label: 'BUST' },
  { x: 180, y: 400, w: 90, h: 60, label: 'URN' },
  { x: 1010, y: 400, w: 90, h: 60, label: 'MASK' },
  { x: 520, y: 360, w: 140, h: 70, label: 'STATUE' },
  { x: 380, y: 520, w: 90, h: 60, label: 'COINS' },
  { x: 810, y: 520, w: 90, h: 60, label: 'GEMS' },
];

/** Velvet rope runs (decoration only — the thief ducks under them). */
export const ROPES = [
  { x1: 300, y1: 200, x2: 520, y2: 360 },
  { x1: 890, y1: 200, x2: 660, y2: 360 },
  { x1: 180, y1: 400, x2: 380, y2: 520 },
  { x1: 1010, y1: 400, x2: 810, y2: 520 },
];

/** Every solid rectangle: the four outer walls plus the pedestals and the case. */
export function solidRects() {
  const walls = [
    { x: ROOM.x, y: ROOM.y, w: ROOM.w, h: 14 }, // top
    { x: ROOM.x, y: ROOM.y + ROOM.h - 14, w: ROOM.w, h: 14 }, // bottom
    { x: ROOM.x, y: ROOM.y, w: 14, h: ROOM.h }, // left
    { x: ROOM.x + ROOM.w - 14, y: ROOM.y, w: 14, h: ROOM.h }, // right
  ];
  return [...walls, ...PEDESTALS, VAULT_CASE];
}

/** True when the circle (x, y, r) overlaps any solid rectangle. */
export function hitsSolid(x, y, r) {
  for (const s of solidRects()) {
    const cx = Math.max(s.x, Math.min(x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(y, s.y + s.h));
    const dx = x - cx;
    const dy = y - cy;
    if (dx * dx + dy * dy < r * r) return true;
  }
  return false;
}

/** Move the circle, sliding along walls: try x then y so corners do not stick. */
export function moveCircle(pos, dx, dy, r) {
  if (!hitsSolid(pos.x + dx, pos.y, r)) pos.x += dx;
  if (!hitsSolid(pos.x, pos.y + dy, r)) pos.y += dy;
}

/** Do two points see each other, or does a solid rectangle block the line? */
function segmentHitsRect(x1, y1, x2, y2, r) {
  // Liang–Barsky clip of the segment against the rectangle.
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  const edges = [
    [-dx, x1 - r.x],
    [dx, r.x + r.w - x1],
    [-dy, y1 - r.y],
    [dy, r.y + r.h - y1],
  ];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }
    const t = q / p;
    if (p < 0) {
      if (t > t1) return false;
      if (t > t0) t0 = t;
    } else {
      if (t < t0) return false;
      if (t < t1) t1 = t;
    }
  }
  return t0 <= t1;
}

/** True when no pedestal, case or wall stands between the two points. */
export function lineOfSight(x1, y1, x2, y2) {
  for (const s of solidRects()) {
    if (segmentHitsRect(x1, y1, x2, y2, s)) return false;
  }
  return true;
}

/** Centre of a rectangle. */
export function rectCenter(r) {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}
