import type { Fretting } from '@domain/fretboard/fretting/fretting';
import { CHORD_FINGERS } from '@domain/music/chords/chord-fingers';
import { chordNotes } from '@domain/music/chords/chord-voicing';
import { isBassRange } from '@domain/music/tunings';

/** A hand spans about four frets: held notes further than this from the new position are let go. */
const HAND_SPAN_FRETS = 3;
const FINGERS = 4;

/** One stopped string, in frets above the capo (0 = open). */
interface Stop {
  readonly string: number;
  readonly fret: number;
}

/**
 * The fretting hand for a chord, exactly what sounds (`chordNotes`): on a guitar its standard shape and
 * recommended fingers (finger 1 over several strings on one fret is a barre) — on a 7-string the shape sits
 * on the upper six; on a bass the outline, fingered one finger per fret from the lowest. Frets are counted
 * from the nut, so a capo shifts them; `tuning` already includes the capo.
 */
export function chordFretting(chord: string, tuning: readonly number[], capo: number, shapes?: Readonly<Record<string, readonly (number | null)[]>>): Fretting {
  const strings = tuning.length;
  const notes = chord ? chordNotes(chord, tuning, shapes) : [];
  const shapeFingers = isBassRange(tuning) || shapes ? undefined : CHORD_FINGERS[chord];
  const offset = strings - (shapeFingers?.length ?? strings);
  const stops = notes.flatMap((note, string) => (note === null || note <= (tuning[string] ?? 0) ? [] : [{ string, fret: note - (tuning[string] ?? 0) }]));
  const lowest = Math.min(...stops.map((s) => s.fret));
  const frets = new Array<number>(strings).fill(capo);
  const presses = stops.map(({ string, fret }) => {
    frets[string] = fret + capo;
    return { string, fret: fret + capo, finger: shapeFingers?.[string - offset] ?? Math.min(FINGERS, fret - lowest + 1) };
  });
  return { frets, bends: new Array<number>(strings).fill(0), presses, barre: 0 };
}

/**
 * What the hand holds after a new onset: the onset's strings, plus earlier notes still ringing within a
 * hand's span of the new position (a guitarist lets notes ring while the hand stays put).
 */
export function holdNotes(held: readonly Stop[], onset: readonly Stop[]): Stop[] {
  const fretted = onset.filter((n) => n.fret > 0).map((n) => n.fret);
  const base = fretted.length ? Math.min(...fretted) : null;
  const kept = held.filter((h) => !onset.some((n) => n.string === h.string) && (h.fret === 0 || (base !== null && Math.abs(h.fret - base) <= HAND_SPAN_FRETS)));
  return [...kept, ...onset];
}

/**
 * The fretting hand for held single notes, one finger per fret from the lowest stopped fret (the index
 * there, the pinky three frets up). Two strings on the same fret under one finger is a small barre.
 */
export function noteFretting(held: readonly Stop[], strings: number, capo: number): Fretting {
  const frets = new Array<number>(strings).fill(capo);
  const stopped = held.filter((h) => h.fret > 0 && h.string < strings);
  const base = Math.min(...stopped.map((h) => h.fret));
  const presses = stopped.map((h) => ({ string: h.string, fret: h.fret + capo, finger: Math.min(FINGERS, 1 + h.fret - base) }));
  for (const p of presses) frets[p.string] = p.fret;
  return { frets, bends: new Array<number>(strings).fill(0), presses, barre: 0 };
}
