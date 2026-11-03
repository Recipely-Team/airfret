import type { FretboardLayout } from '@domain/fretboard/fretboard-layout';

/** Successive fret gaps shrink by 2^(−1/12) on a real fingerboard. */
const FRET_RATIO = Math.pow(2, -1 / 12);

/** Fret wire positions from the nut to `boardEnd`, continuing past the layout's last fret at the real ratio. */
export function allFretX(l: FretboardLayout, boardEnd: number): number[] {
  const xs = [...l.fretX];
  const dir = Math.sign(l.neckEndX - l.nutX) || 1;
  let gap = Math.abs((xs[xs.length - 1] ?? 0) - (xs[xs.length - 2] ?? 0));
  let x = xs[xs.length - 1] ?? l.neckEndX;
  for (;;) {
    gap *= FRET_RATIO;
    x += gap * dir;
    if ((x - boardEnd) * dir > -gap * 0.3) break;
    xs.push(x);
  }
  return xs;
}
