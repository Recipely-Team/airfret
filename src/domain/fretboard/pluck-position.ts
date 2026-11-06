import { clamp } from '@core/math/clamp';
import type { FretboardLayout } from '@domain/fretboard/fretboard-layout';
import { SEMITONES_PER_OCTAVE } from '@domain/music/note-names';

const MIN_POSITION = 0.02;
const MAX_POSITION = 0.5;

/**
 * Where along the vibrating string a pluck at screen x lands, as a fraction β from the bridge.
 *
 * @remarks
 * - The screen neck is stretched for playability, so screen distance is not string distance. x is
 *   first mapped onto the real string: fret n sits at L·2^(−s/12) from the bridge, s its pitch in semitones
 *   (`fretSemis`: n on a guitar) (the nut at L, the
 *   12th fret at L/2); between frets, and from the last fret to the bridge, the map is linear.
 * - β = distance(x → bridge) / distance(fretted fret → bridge). Plucking over the 12th fret of an
 *   open string gives exactly 0.5 — the midpoint, where every even harmonic vanishes.
 * - β > 0.5 mirrors (plucking past the middle sounds like plucking the same distance from the other end).
 */
export function pluckPosition(l: FretboardLayout, x: number, fret: number): number {
  const stopped = Math.pow(2, -semis(l, Math.min(fret, l.maxFret)) / SEMITONES_PER_OCTAVE);
  const beta = stringDistance(l, x) / stopped;
  return clamp(beta > MAX_POSITION ? 1 - beta : beta, MIN_POSITION, MAX_POSITION);
}

/** Physical distance from the bridge, as a fraction of the open scale length, for screen x. */
export function stringDistance(l: FretboardLayout, x: number): number {
  const t = (p: number) => (p - l.strumX1) / (l.nutX - l.strumX1);
  const u = t(x);
  if (u <= 0) return 0;
  const last = l.fretX[l.maxFret] ?? l.neckEndX;
  const uLast = t(last);
  const dLast = Math.pow(2, -semis(l, l.maxFret) / SEMITONES_PER_OCTAVE);
  if (u <= uLast) return (u / uLast) * dLast;
  for (let n = l.maxFret; n > 0; n--) {
    const u0 = t(l.fretX[n] ?? last);
    const u1 = t(l.fretX[n - 1] ?? l.nutX);
    if (u <= u1) {
      const d0 = Math.pow(2, -semis(l, n) / SEMITONES_PER_OCTAVE);
      const d1 = Math.pow(2, -semis(l, n - 1) / SEMITONES_PER_OCTAVE);
      return d0 + ((u - u0) / (u1 - u0 || 1)) * (d1 - d0);
    }
  }
  return 1;
}

/** A fret's pitch above the open string, in semitones. */
function semis(l: FretboardLayout, fret: number): number {
  return l.fretSemis[fret] ?? fret;
}
