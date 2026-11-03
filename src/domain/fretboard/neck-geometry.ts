import { clamp } from '@core/math/clamp';
import type { FretboardLayout } from '@domain/fretboard/fretboard-layout';
import type { Point } from '@domain/fretboard/point';

const NECK_MARGIN_OF_HEIGHT = 0.1;
const NECK_T_MIN = -0.04;
const NECK_T_MAX = 1.03;
const STRUM_PAD_OF_WIDTH = 0.06;
const STRUM_PAD_OF_HEIGHT = 0.25;

/** 0 at the nut, 1 at the end of the neck, regardless of handedness. */
export function neckT(l: FretboardLayout, x: number): number {
  return (x - l.nutX) / (l.neckEndX - l.nutX);
}

/** Half-spread of the strings at screen x (constant past the neck). */
export function spreadAt(l: FretboardLayout, x: number): number {
  return l.spreadNut + (l.spreadBody - l.spreadNut) * clamp(neckT(l, x), 0, 1);
}

/** y of string `i` (0 = lowest-pitched, drawn on top) at screen x. */
export function stringY(l: FretboardLayout, i: number, x: number): number {
  const s = spreadAt(l, x);
  return l.centerY - s + (2 * s * i) / (l.strings - 1);
}

/** y of each string inside the strum area. */
export function strumStringYs(l: FretboardLayout): number[] {
  return Array.from({ length: l.strings }, (_, i) => stringY(l, i, l.strumX0));
}

/** Is the point over the neck, with some forgiveness around it? */
export function onNeck(l: FretboardLayout, p: Point): boolean {
  const t = neckT(l, p.x);
  if (t < NECK_T_MIN || t > NECK_T_MAX) return false;
  return Math.abs(p.y - l.centerY) <= spreadAt(l, p.x) + l.h * NECK_MARGIN_OF_HEIGHT;
}

/** Fret under the point: 1..maxFret, or 0 when not on the neck. */
export function fretAt(l: FretboardLayout, p: Point): number {
  if (!onNeck(l, p)) return 0;
  const t = neckT(l, p.x);
  for (let n = 1; n <= l.maxFret; n++) {
    if (t <= neckT(l, l.fretX[n] ?? l.neckEndX)) return n;
  }
  return l.maxFret;
}

/** True when the point is on the strumming side of the screen. */
export function onStrumSide(l: FretboardLayout, p: Point): boolean {
  const split = (l.neckEndX + l.strumX0) / 2;
  return l.isLefty ? p.x < split : p.x > split;
}

/** True when a strumming fingertip is close enough to the strings to play them. */
export function inStrumArea(l: FretboardLayout, p: Point): boolean {
  const x0 = Math.min(l.strumX0, l.strumX1) - l.w * STRUM_PAD_OF_WIDTH;
  const x1 = Math.max(l.strumX0, l.strumX1) + l.w * STRUM_PAD_OF_WIDTH;
  return p.x >= x0 && p.x <= x1 && Math.abs(p.y - l.centerY) < l.spreadBody + l.h * STRUM_PAD_OF_HEIGHT;
}
