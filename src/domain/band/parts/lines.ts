import type { ChordSpan } from '@domain/band/harmony/chord-span';
import { isStrong } from '@domain/band/harmony/comping';
import type { PartEvent } from '@domain/band/parts/part-event';
import { BandPattern } from '@domain/band/seating/band-pattern';

const EPS = 1e-6;
const OCTAVE = 12;
const FIFTH = 7;
/** A bass's fifth goes below its root when above it would reach the chords' lane (from D3 up). */
const FIFTH_BELOW_FROM = 50;
/** An inner part keeps between E3 and a minor third under the tune: above the bass, under the melody. */
const INNER_FLOOR = 52;
const UNDER_TUNE = 3;
/** An inner line moves when the tune holds a note this long, or rests this long, one beat into it. */
const TUNE_HOLDS = 1.5;
const TUNE_RESTS = 1;
/** Plucked heterophony re-strikes a note this long, every half beat (a beat at the lower levels). */
const RESTRIKE_FROM = 1;

/**
 * One chord's bass (the research report's bass patterns): **root** on the chord and every strong beat; **rootFifth**
 * the root, then the fifth on the next strong beat (the march's "oom"); **walk**, in four, root, third, fifth and a
 * half-step into the next chord's root; **octave**, root and its octave in eighths.
 */
/** The highest note a chord's bass plays in its patterns (its root, or the fifth above a low root). */
export function bassTop(span: ChordSpan): number {
  return span.bass + FIFTH > FIFTH_BELOW_FROM ? span.bass : span.bass + FIFTH;
}

export function bassLine(span: ChordSpan, pattern: BandPattern, beatsPerBar: number, nextBass: number | null): PartEvent[] {
  const root = span.bass;
  const tones = span.tones;
  if (pattern === BandPattern.octave) return steps(span, 0.5).map((beat, i) => ({ beat, dur: Math.min(0.5, span.end - beat), midis: [i % 2 === 0 ? root : root + OCTAVE] }));
  if (pattern === BandPattern.walk && beatsPerBar === 4) {
    const third = root + ((((tones[1] ?? root) - root) % OCTAVE) + OCTAVE) % OCTAVE;
    const fifth = root + FIFTH > FIFTH_BELOW_FROM ? root + FIFTH - OCTAVE : root + FIFTH;
    return steps(span, 1).map((beat, i, all) => {
      const isLast = i === all.length - 1 && nextBass !== null && span.end - beat <= 1 + EPS;
      const approach = nextBass === null ? fifth : nextBass > root ? nextBass - 1 : nextBass + 1;
      const midi = isLast ? approach : [root, third, fifth, third][i % 4] ?? root;
      return { beat, dur: Math.min(1, span.end - beat), midis: [midi] };
    });
  }
  const pulse = beatsPerBar % 2 === 0 ? beatsPerBar / 2 : beatsPerBar;
  const fifth = root + FIFTH > FIFTH_BELOW_FROM ? root + FIFTH - OCTAVE : root + FIFTH;
  const strikes = [span.beat, ...steps(span, 1).filter((b) => b > span.beat + EPS && isStrong(b, beatsPerBar))];
  return strikes.map((beat, i) => ({
    beat, dur: Math.min(strikes[i + 1] ?? span.end, beat + pulse) - beat,
    midis: [pattern === BandPattern.rootFifth && i % 2 === 1 ? fifth : root],
  }));
}

/**
 * One chord's inner line: a chord tone (the seat's voice) nearest the line's last note — a held line moves by step —
 * kept under the tune; where the tune holds a long note or rests, the line moves to the nearest other chord tone, one
 * beat in (the countermelody's rule: move where the tune holds). `isMoving` false: a held pad tone, no motion.
 */
export function innerLine(span: ChordSpan, voice: number, last: number, tune: readonly PartEvent[], isMoving: boolean): { events: PartEvent[]; last: number } {
  const over = tune.filter((n) => n.beat < span.end - EPS && n.beat + n.dur > span.beat + EPS);
  const tuneLow = over.length ? Math.min(...over.map((n) => n.midis[0] ?? 0)) : null;
  const ceiling = tuneLow === null ? Infinity : tuneLow - UNDER_TUNE;
  const preferred = span.tones[(voice + 1) % span.tones.length] ?? span.tones[0] ?? 0;
  const first = place([preferred], last, ceiling) ?? place(span.tones, last, ceiling) ?? nearest(preferred, last);
  const hold = isMoving ? moveAt(span, over) : null;
  if (hold === null) return { events: [{ beat: span.beat, dur: span.end - span.beat, midis: [first] }], last: first };
  const second = place(span.tones.filter((pc) => ((pc - first) % OCTAVE + OCTAVE) % OCTAVE !== 0), first, ceiling) ?? first;
  return { events: [{ beat: span.beat, dur: hold - span.beat, midis: [first] }, { beat: hold, dur: span.end - hold, midis: [second] }], last: second };
}

/** The placement of one of these pitch classes nearest `to`, between E3 and `ceiling`; null if none fits. */
function place(pcs: readonly number[], to: number, ceiling: number): number | null {
  const options = pcs.flatMap((pc) => [-1, 0, 1].map((k) => nearest(pc, to) + k * OCTAVE)).filter((n) => n >= INNER_FLOOR && n <= ceiling);
  return options.sort((a, b) => Math.abs(a - to) - Math.abs(b - to))[0] ?? null;
}

/** The note of pitch class `pc` nearest `to`. */
function nearest(pc: number, to: number): number {
  return to + ((((pc - to) % OCTAVE) + OCTAVE + OCTAVE / 2) % OCTAVE) - OCTAVE / 2;
}

/** Where an inner line moves in a chord: one beat into the tune's first long note or rest there, if there is room. */
function moveAt(span: ChordSpan, over: readonly PartEvent[]): number | null {
  for (let i = 0; i < over.length; i++) {
    const n = over[i];
    if (!n) continue;
    const next = over[i + 1]?.beat ?? span.end;
    const rest = next - (n.beat + n.dur);
    const at = n.dur >= TUNE_HOLDS ? n.beat + 1 : rest >= TUNE_RESTS ? n.beat + n.dur : null;
    if (at !== null && at > span.beat + EPS && at < span.end - 0.5) return at;
  }
  return null;
}

/**
 * The tune in an instrument's own idiom (heterophony): in its own octave (the one nearest its range), a plucked
 * instrument re-striking long notes (tremolo), a wind or a bow joining repeated notes into one (legato).
 */
export function heterophony(tune: readonly PartEvent[], pattern: BandPattern, centre: number, busy: 0 | 1 | 2): PartEvent[] {
  const pitches = tune.flatMap((n) => n.midis.slice(0, 1));
  const middle = pitches.length ? (Math.min(...pitches) + Math.max(...pitches)) / 2 : centre;
  const shift = Math.round((centre - middle) / OCTAVE) * OCTAVE;
  const moved = tune.map((n) => ({ ...n, midis: n.midis.slice(0, 1).map((m) => m + shift) }));
  if (pattern === BandPattern.tremolo) {
    const step = busy >= 1 ? 0.5 : 1;
    return moved.flatMap((n) => (n.dur < RESTRIKE_FROM - EPS ? [n] : Array.from({ length: Math.max(1, Math.round(n.dur / step)) }, (_, k) => ({ beat: n.beat + k * step, dur: Math.min(step, n.dur - k * step), midis: n.midis }))));
  }
  const joined: PartEvent[] = [];
  for (const n of moved) {
    const prev = joined[joined.length - 1];
    if (prev && prev.midis[0] === n.midis[0] && Math.abs(prev.beat + prev.dur - n.beat) < EPS) joined[joined.length - 1] = { ...prev, dur: prev.dur + n.dur };
    else joined.push(n);
  }
  return joined;
}

/** The beats of a chord on the bar's grid, `step` apart, its own start included. */
function steps(span: ChordSpan, step: number): number[] {
  const out = [span.beat];
  for (let b = Math.ceil(span.beat / step + EPS) * step; b < span.end - EPS; b += step) if (b > span.beat + EPS) out.push(b);
  return out;
}
