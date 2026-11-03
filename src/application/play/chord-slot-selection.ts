import { slotAt } from '@domain/fretboard/chord-grid';
import type { FretboardLayout } from '@domain/fretboard/fretboard-layout';
import type { Point } from '@domain/fretboard/point';

/** The chord box under the fingertip, or the current one when the tip is between boxes or off the neck. */
export function chordSlotSelection(l: FretboardLayout, count: number, tip: Point, current: number): number {
  const slot = slotAt(l, count, tip);
  return slot >= 0 ? slot : current;
}
