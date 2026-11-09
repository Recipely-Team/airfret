import type { Lane } from '@domain/band/harmony/voicing';

const OCTAVE = 12;
const FOURTH = 5;
const FIFTH = 7;
/** Under the tune, best first: a fourth, a fifth, then the scale's thirds and sixths (Ilerici's consonances after them). */
const UNDER = [FOURTH, FIFTH, 3, 4, 8, 9] as const;
/**
 * Cadences: the final on a fourth (else a fifth or the octave), a half cadence on a fifth (else a fourth or the
 * octave) — whichever the scale has.
 */
const FINAL = [FOURTH, FIFTH, OCTAVE] as const;
const HALF = [FIFTH, FOURTH, OCTAVE] as const;
/** Each voice under the next: a fourth, else the third the scale has there. */
const STACK = [FOURTH, 4, 3] as const;
/** Ilerici: no more than two perfect fourths or fifths in a row. */
const MAX_PERFECT_RUN = 2;
/** No voice under C3: fourths close there still sound clear. */
const FLOOR = 48;

/** Where a chord falls in its phrase: mid-phrase, a half cadence (asma karar, on a fifth) or the final one (on a fourth). */
export type Cadence = 'none' | 'half' | 'final';

/**
 * A chord in Ilerici's quartal harmony ("dörtlü armoni", the research report's rules from Kinik 2011): voices stacked
 * in fourths from the tune's own scale under its lowest note over the chord — the top voice a fourth or fifth under
 * it, the next a fourth under that, as the lane allows — with no more than two perfect fourths or fifths in a row
 * under the tune (`perfectRun`: how many came just before), half cadences on a fifth and the final one on a fourth
 * (each falling back as the scale allows).
 * Notes low to high.
 */
export function quartalChord(tuneLow: number, scale: ReadonlySet<number>, lane: Lane, size: number, cadence: Cadence, perfectRun: number): number[] {
  const inScale = (m: number) => scale.has(((m % OCTAVE) + OCTAVE) % OCTAVE);
  const wanted = cadence === 'final' ? FINAL : cadence === 'half' ? HALF : UNDER.filter((i) => perfectRun < MAX_PERFECT_RUN || (i !== FOURTH && i !== FIFTH));
  let first = wanted.map((i) => tuneLow - i).find(inScale) ?? tuneLow - OCTAVE;
  // Over the lane: an octave down — the interval to the tune keeps its kind (a fourth an octave wider).
  while (first > lane.high && first - OCTAVE >= Math.max(FLOOR, lane.low)) first -= OCTAVE;
  const voices = [first];
  while (voices.length < size) {
    const last = voices[voices.length - 1] ?? first;
    const next = STACK.map((i) => last - i).find(inScale);
    if (next === undefined || next < Math.max(FLOOR, lane.low)) break;
    voices.push(next);
  }
  return voices.sort((a, b) => a - b);
}

/** Whether the chord's top voice lies a perfect fourth or fifth (or one an octave wider) under the tune: it counts towards Ilerici's run. */
export function isPerfectUnder(tuneLow: number, chord: readonly number[]): boolean {
  const gap = (tuneLow - (chord[chord.length - 1] ?? tuneLow)) % OCTAVE;
  return gap === FOURTH || gap === FIFTH;
}
