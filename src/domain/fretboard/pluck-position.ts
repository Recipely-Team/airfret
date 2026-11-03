import { clamp } from '@core/math/clamp';
import type { FretboardLayout } from '@domain/fretboard/fretboard-layout';

const MIN_POSITION = 0.03;
const MAX_POSITION = 0.5;

/**
 * Where along the vibrating string a pluck at screen x lands, as a fraction from the bridge.
 *
 * @remarks
 * - The vibrating length runs from the fretted fret (the nut when open) to the bridge, so the
 *   same hand position is "nearer the middle" on a high fret — exactly as on a real guitar.
 */
export function pluckPosition(l: FretboardLayout, x: number, fret: number): number {
  const bridge = l.strumX1;
  const stop = l.fretX[Math.min(fret, l.maxFret)] ?? l.nutX;
  return clamp((bridge - x) / (bridge - stop), MIN_POSITION, MAX_POSITION);
}
