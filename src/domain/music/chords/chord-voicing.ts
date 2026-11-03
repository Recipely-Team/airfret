import { CHORD_SHAPES } from '@domain/music/chords/chord-shapes';
import { LETTER_SEMITONES, SEMITONES_PER_OCTAVE } from '@domain/music/note-names';
import { GUITAR_STRING_COUNT } from '@domain/music/tunings';

const ROOT_PATTERN = /^([A-G])([#b]?)/;
const MINOR_PATTERN = /^[A-G][#b]?m(?!aj)/;
const FIFTH = 7;
const MINOR_THIRD = 3;
const MAJOR_THIRD = 4;

/** True when the chord has a guitar shape. */
export function knownChord(name: string): boolean {
  return name in CHORD_SHAPES;
}

/** Root pitch class (0–11) of a chord symbol such as "F#m" or "Bb". */
export function chordRoot(name: string): number {
  const m = ROOT_PATTERN.exec(name);
  const base = m?.[1] === undefined ? undefined : LETTER_SEMITONES[m[1]];
  if (!m || base === undefined) return 0;
  const accidental = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return (base + accidental + SEMITONES_PER_OCTAVE) % SEMITONES_PER_OCTAVE;
}

/**
 * MIDI notes per string for a chord on the given tuning (null = muted).
 *
 * @remarks
 * - Six strings use the shape table.
 * - A bass outlines the chord: root, fifth, octave, and the third above it.
 */
export function chordNotes(name: string, tuning: readonly number[]): (number | null)[] {
  if (tuning.length === GUITAR_STRING_COUNT) {
    const shape = CHORD_SHAPES[name];
    if (!shape) return tuning.map(() => null);
    return tuning.map((open, i) => {
      const fret = shape[i];
      return fret === null || fret === undefined ? null : open + fret;
    });
  }
  const pc = chordRoot(name);
  let root = tuning[0] ?? 0;
  while (((root % SEMITONES_PER_OCTAVE) + SEMITONES_PER_OCTAVE) % SEMITONES_PER_OCTAVE !== pc) root++;
  const third = MINOR_PATTERN.test(name) ? MINOR_THIRD : MAJOR_THIRD;
  const tones = [root, root + FIFTH, root + SEMITONES_PER_OCTAVE, root + SEMITONES_PER_OCTAVE + third];
  return tones.slice(0, tuning.length);
}
