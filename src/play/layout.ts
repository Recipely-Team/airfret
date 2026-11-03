// Screen geometry of the virtual instrument.
//
// Right-handed players see themselves in a mirror: the fretting (left) hand is
// on the left of the screen, so the neck runs from the left edge towards the
// centre and the strumming area sits on the right. Lefty mode mirrors it.

import type { Point } from '../tracking';

export interface Layout {
  w: number;
  h: number;
  lefty: boolean;
  strings: number;
  /** Neck span along x (in screen px, already mirrored for lefty). */
  nutX: number;
  neckEndX: number;
  /** Strum area span along x. */
  strumX0: number;
  strumX1: number;
  centerY: number;
  /** Half the distance between the outer strings at the nut and at the body. */
  spreadNut: number;
  spreadBody: number;
  /** x of each fret wire, index 0 = nut, up to maxFret. */
  fretX: number[];
  maxFret: number;
}

export function computeLayout(w: number, h: number, strings: number, lefty: boolean, maxFret = 12): Layout {
  const centerY = h * 0.6;
  const spreadBody = Math.min(h * 0.17, w * 0.12);
  const spreadNut = spreadBody * 0.82;
  const mx = (x: number) => (lefty ? w - x : x);
  const nut = w * 0.05;
  const end = w * 0.57;
  // Blend real fret spacing (12-TET) with even spacing: authentic look, but
  // the high frets stay wide enough to hit with a tracked fingertip.
  const real = (n: number) => (1 - Math.pow(2, -n / 12)) / (1 - Math.pow(2, -maxFret / 12));
  const fretX: number[] = [];
  for (let n = 0; n <= maxFret; n++) {
    const t = 0.55 * real(n) + 0.45 * (n / maxFret);
    fretX.push(mx(nut + (end - nut) * t));
  }
  return {
    w,
    h,
    lefty,
    strings,
    nutX: mx(nut),
    neckEndX: mx(end),
    strumX0: mx(w * 0.62),
    strumX1: mx(w * 0.95),
    centerY,
    spreadNut,
    spreadBody,
    fretX,
    maxFret,
  };
}

/** 0 at the nut, 1 at the end of the neck, regardless of handedness. */
export function neckT(l: Layout, x: number): number {
  return (x - l.nutX) / (l.neckEndX - l.nutX);
}

/** Half-spread of the strings at a given screen x. */
export function spreadAt(l: Layout, x: number): number {
  const t = Math.min(1, Math.max(0, neckT(l, x)));
  return l.spreadNut + (l.spreadBody - l.spreadNut) * t;
}

/** y of string `i` (0 = lowest-pitched, drawn on top) at screen x. */
export function stringY(l: Layout, i: number, x: number): number {
  const s = spreadAt(l, x);
  return l.centerY - s + (2 * s * i) / (l.strings - 1);
}

/** y of each string inside the strum area (constant across x). */
export function strumStringYs(l: Layout): number[] {
  return Array.from({ length: l.strings }, (_, i) => l.centerY - l.spreadBody + (2 * l.spreadBody * i) / (l.strings - 1));
}

/** Is the point over the neck (with some forgiveness around it)? */
export function onNeck(l: Layout, p: Point): boolean {
  const t = neckT(l, p.x);
  if (t < -0.04 || t > 1.03) return false;
  const margin = l.h * 0.1;
  return Math.abs(p.y - l.centerY) <= spreadAt(l, p.x) + margin;
}

/** Fret under the point: 1..maxFret, or 0 when not on the neck. */
export function fretAt(l: Layout, p: Point): number {
  if (!onNeck(l, p)) return 0;
  const t = neckT(l, p.x);
  for (let n = 1; n <= l.maxFret; n++) {
    if (t <= neckT(l, l.fretX[n])) return n;
  }
  return l.maxFret;
}

/** Arrangement of chord slots on the neck: columns along x, 1 or 2 rows. */
export function chordGrid(count: number): { cols: number; rows: number } {
  if (count <= 4) return { cols: Math.max(1, count), rows: 1 };
  return { cols: Math.ceil(count / 2), rows: 2 };
}

export interface SlotRect {
  index: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export function chordSlots(l: Layout, count: number): SlotRect[] {
  const { cols, rows } = chordGrid(count);
  const slots: SlotRect[] = [];
  const top = l.centerY - l.spreadBody - l.h * 0.03;
  const bottom = l.centerY + l.spreadBody + l.h * 0.03;
  // Leave the first sliver of the neck (headstock side) free.
  const tStart = 0.04;
  for (let i = 0; i < count; i++) {
    const r = rows === 2 ? Math.floor(i / cols) : 0;
    const c = rows === 2 ? i % cols : i;
    const ta = tStart + ((1 - tStart) * c) / cols;
    const tb = tStart + ((1 - tStart) * (c + 1)) / cols;
    const xa = l.nutX + (l.neckEndX - l.nutX) * ta;
    const xb = l.nutX + (l.neckEndX - l.nutX) * tb;
    const ya = rows === 2 ? (r === 0 ? top : l.centerY) : top;
    const yb = rows === 2 ? (r === 0 ? l.centerY : bottom) : bottom;
    slots.push({ index: i, x0: Math.min(xa, xb), x1: Math.max(xa, xb), y0: ya, y1: yb });
  }
  return slots;
}

/** Chord slot under the point, or -1. Generous vertically, exact along the neck. */
export function slotAt(l: Layout, count: number, p: Point): number {
  if (count === 0 || !onNeck(l, p)) return -1;
  const { cols, rows } = chordGrid(count);
  const t = (neckT(l, p.x) - 0.04) / 0.96;
  const c = Math.min(cols - 1, Math.max(0, Math.floor(t * cols)));
  const r = rows === 2 ? (p.y < l.centerY ? 0 : 1) : 0;
  const idx = r * cols + c;
  return idx < count ? idx : -1;
}

/** True when the point is on the strumming side of the screen. */
export function onStrumSide(l: Layout, p: Point): boolean {
  const split = (l.neckEndX + l.strumX0) / 2;
  return l.lefty ? p.x < split : p.x > split;
}

export function inStrumArea(l: Layout, p: Point): boolean {
  const x0 = Math.min(l.strumX0, l.strumX1);
  const x1 = Math.max(l.strumX0, l.strumX1);
  const padX = l.w * 0.06;
  return p.x >= x0 - padX && p.x <= x1 + padX && Math.abs(p.y - l.centerY) < l.spreadBody + l.h * 0.25;
}
