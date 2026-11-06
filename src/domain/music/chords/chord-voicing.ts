import { CHORD_SHAPES } from '@domain/music/chords/chord-shapes';
import { LETTER_SEMITONES, SEMITONES_PER_OCTAVE } from '@domain/music/note-names';
import { GUITAR_STRING_COUNT, isBassRange } from '@domain/music/tunings';

const ROOT_PATTERN = /^([A-G])([#b]?)/;
const MINOR_PATTERN = /^[A-G][#b]?m(?!aj)/;
const FIFTH = 7;
const MINOR_THIRD = 3;
const MAJOR_THIRD = 4;
/** Root, fifth, octave, tenth: one tone per string of a 4-string bass; longer basses have one string more below. */
const BASS_OUTLINE_STRINGS = 4;

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
 * - An instrument with its own shapes (`shapes`, a ukulele's) uses them.
 * - Guitars use the six-string shape table; a 7-string plays it on its upper six and keeps the low B quiet.
 * - A bass (by range, `isBassRange`) outlines the chord: root, fifth, octave, the third above it and, on a
 *   6-string's high C, the root two octaves up — starting on its E string: an extended bass's low B stays
 *   silent, as a player keeps it for the lowest notes.
 */
export function chordNotes(name: string, tuning: readonly number[], shapes?: Readonly<Record<string, readonly (number | null)[]>>): (number | null)[] {
  if (shapes) {
    // The instrument's own chord shapes (a ukulele): one fret per string, from its own tuning.
    const own = shapes[name];
    return tuning.map((open, i) => {
      const fret = own?.[i];
      return fret === null || fret === undefined ? null : open + fret;
    });
  }
  if (!isBassRange(tuning)) {
    const shape = CHORD_SHAPES[name];
    const extra = tuning.length - GUITAR_STRING_COUNT;
    if (!shape || extra < 0) return tuning.map(() => null);
    return tuning.map((open, i) => {
      const fret = i < extra ? null : shape[i - extra];
      return fret === null || fret === undefined ? null : open + fret;
    });
  }
  const pc = chordRoot(name);
  const skipped = tuning.length > BASS_OUTLINE_STRINGS ? 1 : 0;
  let root = tuning[skipped] ?? 0;
  while (((root % SEMITONES_PER_OCTAVE) + SEMITONES_PER_OCTAVE) % SEMITONES_PER_OCTAVE !== pc) root++;
  const third = MINOR_PATTERN.test(name) ? MINOR_THIRD : MAJOR_THIRD;
  const tones = [root, root + FIFTH, root + SEMITONES_PER_OCTAVE, root + SEMITONES_PER_OCTAVE + third, root + 2 * SEMITONES_PER_OCTAVE];
  return tuning.map((open, i) => {
    const tone = i < skipped ? undefined : tones[i - skipped];
    return tone === undefined || tone < open ? null : tone;
  });
}
