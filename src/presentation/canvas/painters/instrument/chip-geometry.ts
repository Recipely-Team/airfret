import { chordGrid, chordSlots } from '@domain/fretboard/chord-grid';
import type { FretboardLayout } from '@domain/fretboard/fretboard-layout';

export const CHIP = { h: 30, padX: 14, gap: 14, radius: 15 } as const;

/** Centre x, top y and whether each chord chip sits below the neck. */
export function chipPlacements(l: FretboardLayout, count: number): { index: number; cx: number; y: number; isBelow: boolean; x0: number; x1: number }[] {
  const isTwoRows = chordGrid(count).rows === 2;
  return chordSlots(l, count).map((s) => {
    const isBelow = isTwoRows && s.y0 >= l.centerY - 1;
    return { index: s.index, cx: (s.x0 + s.x1) / 2, y: isBelow ? s.y1 + CHIP.gap : s.y0 - CHIP.gap - CHIP.h, isBelow, x0: s.x0, x1: s.x1 };
  });
}
