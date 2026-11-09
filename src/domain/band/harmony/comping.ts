import type { ChordSpan } from '@domain/band/harmony/chord-span';
import type { PartEvent } from '@domain/band/parts/part-event';
import { BandPattern } from '@domain/band/seating/band-pattern';

const EPS = 1e-6;
const OCTAVE = 12;
/** A stab on the afterbeat lasts half a beat; repeated chords are let go a little before the next. */
const STAB = 0.5;
const DETACH = 0.85;
/** Broken chords, by chord voice (0 the lowest): rising and falling — within the voicing, so never over the tune; Alberti low–high–mid–high. */
const ARPEGGIO = [0, 1, 2, 1] as const;
const ALBERTI = [0, 2, 1, 2] as const;

/** How busy a part plays: 0 at the low levels, 1 in the middle, 2 in the full sections. */
export type Busyness = 0 | 1 | 2;

/**
 * One chord's comping in a pattern (the research report's pattern table), its voicing given, on the bar's grid:
 * - **held**: once, for the whole chord;
 * - **afterbeat**: on the weak beats, answering a bass on the strong ones (in two, on the "and"s; with no bass, every beat);
 * - **block**: repeated chords — half notes, quarters, then eighths as the song builds;
 * - **strum**: down on every beat, then the up-strums between (2& and 4&), then every eighth; with no bass, the
 *   strong beats play the chord's root alone (folk backup: bass, strum, bass, strum);
 * - **arpeggio**: broken low to high and back, in quarters, then eighths;
 * - **alberti**: low–high–mid–high in eighths.
 */
export function comp(span: ChordSpan, chord: readonly number[], pattern: BandPattern, busy: Busyness, beatsPerBar: number, hasBass: boolean): PartEvent[] {
  const top = [...chord].reverse();
  const len = span.end - span.beat;
  if (pattern === BandPattern.held || len < EPS) return [{ beat: span.beat, dur: len, midis: top }];
  if (pattern === BandPattern.afterbeat) {
    // With no bass to answer, every beat; in two, the "and"s; else the weak beats (2 and 4; 2 and 3 in a waltz).
    const beats = !hasBass ? grid(span, 1, false) : beatsPerBar === 2 ? grid(span, STAB, true).filter((b) => !isOnBeat(b)) : grid(span, 1, true).filter((b) => !isStrong(b, beatsPerBar));
    return beats.map((beat) => ({ beat, dur: Math.min(STAB, span.end - beat), midis: top }));
  }
  if (pattern === BandPattern.block) {
    const step = busy === 0 ? (beatsPerBar % 2 === 0 ? 2 : beatsPerBar) : busy === 1 ? 1 : STAB;
    return grid(span, step, false).map((beat) => ({ beat, dur: Math.min(step * DETACH, span.end - beat), midis: top }));
  }
  if (pattern === BandPattern.strum) {
    const beats = grid(span, busy === 2 ? STAB : 1, false);
    // The up-strums between beats 2 and 3, and after 4 (D D U U D U); in other meters after the last beat.
    const ups = busy === 1 ? grid(span, STAB, false).filter((b) => !isOnBeat(b) && upStrum(b, beatsPerBar)) : [];
    const strums = [...new Set([...beats, ...ups])].sort((a, b) => a - b);
    return strums.map((beat, i) => {
      const next = strums[i + 1] ?? span.end;
      const isBassBeat = !hasBass && isOnBeat(beat) && isStrong(beat, beatsPerBar);
      return { beat, dur: Math.min(next, span.end) - beat, midis: isBassBeat ? [(chord[0] ?? 0) - OCTAVE] : top };
    });
  }
  const order = pattern === BandPattern.alberti ? ALBERTI : ARPEGGIO;
  const step = busy === 0 ? 1 : STAB;
  const notes = chord;
  return grid(span, step, false).map((beat, i) => ({ beat, dur: Math.min(step, span.end - beat), midis: [notes[order[i % order.length] ?? 0] ?? notes[0] ?? 0] }));
}

/** The grid points inside a chord, `step` beats apart from the bar line; its own start too unless `isOffbeatOnly`. */
function grid(span: ChordSpan, step: number, isOffbeatOnly: boolean): number[] {
  const out: number[] = [];
  const first = Math.ceil(span.beat / step - EPS) * step || 0;
  if (!isOffbeatOnly && first > span.beat + EPS) out.push(span.beat);
  for (let b = first; b < span.end - EPS; b += step) out.push(b);
  return out;
}

/** The strong beats: the bar's first, and its middle in an even meter of four or more. */
export function isStrong(beat: number, beatsPerBar: number): boolean {
  const pos = ((beat % beatsPerBar) + beatsPerBar) % beatsPerBar;
  return pos < EPS || (beatsPerBar % 2 === 0 && beatsPerBar > 2 && Math.abs(pos - beatsPerBar / 2) < EPS);
}

function isOnBeat(beat: number): boolean {
  return Math.abs(beat - Math.round(beat)) < EPS;
}

/** Up-strums of the folk pattern D D U U D U: after the second beat and after the last. */
function upStrum(beat: number, beatsPerBar: number): boolean {
  const pos = ((beat % beatsPerBar) + beatsPerBar) % beatsPerBar;
  return Math.abs(pos - 1.5) < EPS || Math.abs(pos - (beatsPerBar - 0.5)) < EPS;
}
