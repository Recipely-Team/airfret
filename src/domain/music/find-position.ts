import type { FretPosition } from '@domain/music/fret-position';

const FIRST_POSITION_MAX_FRET = 5;

/**
 * Where to play a pitch, or null if it is out of range.
 *
 * @remarks
 * - Prefers first position (frets 0–5), then the higher string on a tie.
 */
export function findPosition(midi: number, tuning: readonly number[], maxFret: number): FretPosition | null {
  let best: FretPosition | null = null;
  tuning.forEach((open, string) => {
    const fret = midi - open;
    if (fret < 0 || fret > maxFret) return;
    if (!best || cost(fret) < cost(best.fret) || (cost(fret) === cost(best.fret) && string > best.string)) {
      best = { string, fret };
    }
  });
  return best;
}

function cost(fret: number): number {
  return fret <= FIRST_POSITION_MAX_FRET ? 0 : fret;
}
