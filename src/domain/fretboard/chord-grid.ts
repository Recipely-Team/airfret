import type { FretboardLayout } from '@domain/fretboard/fretboard-layout';
import { neckT, onNeck } from '@domain/fretboard/neck-geometry';
import type { Point } from '@domain/fretboard/point';
import type { SlotRect } from '@domain/fretboard/slot-rect';

const SINGLE_ROW_MAX = 4;
/** Fraction of the neck at the headstock end left free of chord boxes. */
const HEAD_GAP = 0.04;
const BOX_PAD_OF_HEIGHT = 0.03;

/** Chord boxes are columns along the neck, in one row up to four chords, two rows beyond. */
export function chordGrid(count: number): { cols: number; rows: number } {
  if (count <= SINGLE_ROW_MAX) return { cols: Math.max(1, count), rows: 1 };
  return { cols: Math.ceil(count / 2), rows: 2 };
}

/** Screen rectangles of every chord box. */
export function chordSlots(l: FretboardLayout, count: number): SlotRect[] {
  const { cols, rows } = chordGrid(count);
  const top = l.centerY - l.spreadBody - l.h * BOX_PAD_OF_HEIGHT;
  const bottom = l.centerY + l.spreadBody + l.h * BOX_PAD_OF_HEIGHT;
  const xAt = (t: number) => l.nutX + (l.neckEndX - l.nutX) * t;
  return Array.from({ length: count }, (_, index) => {
    const row = rows === 2 ? Math.floor(index / cols) : 0;
    const col = rows === 2 ? index % cols : index;
    const xa = xAt(HEAD_GAP + ((1 - HEAD_GAP) * col) / cols);
    const xb = xAt(HEAD_GAP + ((1 - HEAD_GAP) * (col + 1)) / cols);
    const y0 = rows === 2 && row === 1 ? l.centerY : top;
    const y1 = rows === 2 && row === 0 ? l.centerY : bottom;
    return { index, x0: Math.min(xa, xb), x1: Math.max(xa, xb), y0, y1 };
  });
}

/** Chord box under the point, or -1. Generous vertically, exact along the neck. */
export function slotAt(l: FretboardLayout, count: number, p: Point): number {
  if (count === 0 || !onNeck(l, p)) return -1;
  const { cols, rows } = chordGrid(count);
  const t = (neckT(l, p.x) - HEAD_GAP) / (1 - HEAD_GAP);
  const col = Math.min(cols - 1, Math.max(0, Math.floor(t * cols)));
  const row = rows === 2 && p.y >= l.centerY ? 1 : 0;
  const idx = row * cols + col;
  return idx < count ? idx : -1;
}
