import type { ChordSpan } from '@domain/band/harmony/chord-span';
import { voiceChord } from '@domain/band/harmony/voicing';
import type { PartEvent } from '@domain/band/parts/part-event';

const OCTAVE = 12;
const FIFTH = 7;
const EPS = 1e-6;
/** A drone sits no lower than G2 (a fifth above it is still clear) and its top a minor third under the tune. */
const DRONE_FLOOR = 43;
const UNDER_TUNE = 3;
/** A held drone (a bow, a breath) is taken again every this many bars; a plucked one every bar, as its note fades. */
const BREATH_BARS = 2;
/** The tune leaves a gap — holds or rests — this many beats at least after a note starts, for a fill to go in. */
const GAP = 2;
/** The fill waits this long after the tune's note (it lets the note speak), then runs in eighths, four at most. */
const SPEAK = 1;
const STEP = 0.5;
const MAX_RUN = 4;
const DETACH = 0.85;
/** A stab is voiced in the comping lane; a run reaches down this far under the tune at most. */
const STAB_LANE = { low: 52, high: 69 } as const;
const RUN_DEPTH = 15;
/** A run this far under an instrument's middle is out of its reach: it goes an octave up (over a held note, a descant). */
const OUT_OF_REACH = 18;

/** The song's home note (pitch class): its tune's last note — its karar — else its last chord's root. */
export function homeOf(tune: readonly PartEvent[], chords: readonly ChordSpan[]): number {
  const last = tune[tune.length - 1]?.midis[0] ?? chords[chords.length - 1]?.tones[0] ?? 0;
  return ((last % OCTAVE) + OCTAVE) % OCTAVE;
}

/**
 * The drone (the research report's role table: the karar held, with its fifth): the home note under the tune — its
 * fifth too on an instrument that plays two notes — in the octave nearest the instrument's lower register, over the
 * whole song: a held instrument takes it again every two bars, a plucked one every bar.
 */
export function drone(home: number, tuneLow: number | null, centre: number, length: number, beatsPerBar: number, isHeld: boolean, hasFifth: boolean): PartEvent[] {
  const width = hasFifth ? FIFTH : 0;
  const ceiling = (tuneLow ?? Infinity) - UNDER_TUNE;
  const roots = Array.from({ length: 6 }, (_, k) => home + (k + 3) * OCTAVE).filter((r) => r >= DRONE_FLOOR);
  const fits = roots.filter((r) => r + width <= ceiling);
  const wanted = centre - OCTAVE;
  const root = [...(fits.length ? fits : roots.slice(0, 1))].sort((a, b) => Math.abs(a - wanted) - Math.abs(b - wanted))[0] ?? DRONE_FLOOR;
  const midis = hasFifth ? [root + FIFTH, root] : [root];
  const every = beatsPerBar * (isHeld ? BREATH_BARS : 1);
  const out: PartEvent[] = [];
  for (let beat = 0; beat < length - EPS; beat += every) out.push({ beat, dur: Math.min(every, length - beat), midis });
  return out;
}

/**
 * Fills (the research report's punctuation: only in the tune's holds and rests, a beat after its note, one or two a
 * bar): where the tune leaves two beats or more, a run of the chord's tones rising into its next note, under it — or,
 * on a chord instrument, one stab on the off-beat.
 */
export function fills(tune: readonly PartEvent[], chords: readonly ChordSpan[], centre: number, isChordal: boolean): PartEvent[] {
  const chordAt = (beat: number) => chords.find((c) => beat >= c.beat - EPS && beat < c.end - EPS);
  return tune.flatMap((n, i) => {
    const next = tune[i + 1];
    const now = n.midis[0];
    const then = next?.midis[0];
    if (!next || now === undefined || then === undefined || next.beat - n.beat < GAP - EPS) return [];
    const from = n.beat + SPEAK;
    const top = Math.min(now, then) - 1;
    if (isChordal) {
      const at = from + STEP;
      const c = chordAt(at);
      return c && at < next.beat - EPS ? [{ beat: at, dur: STEP * DETACH, midis: voiceChord(c.tones, STAB_LANE, top + 1, null).reverse() }] : [];
    }
    const steps = Math.min(MAX_RUN, Math.floor((next.beat - from) / STEP + EPS));
    const start = next.beat - steps * STEP;
    const c = chordAt(start);
    if (!c || steps < 1) return [];
    const isTone = (m: number) => c.tones.includes(((m % OCTAVE) + OCTAVE) % OCTAVE);
    const run = Array.from({ length: RUN_DEPTH }, (_, k) => top - k).filter(isTone).slice(0, steps).reverse();
    const mean = run.reduce((s, m) => s + m, 0) / Math.max(1, run.length);
    const lift = mean < centre - OUT_OF_REACH ? OCTAVE : 0;
    return run.map((m, k) => ({ beat: start + (steps - run.length + k) * STEP, dur: STEP, midis: [m + lift] }));
  });
}
