// Pitch helpers and chord voicings.

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** "E2", "C#4", "Bb3" → MIDI number. */
export function noteToMidi(name: string): number {
  const m = /^([A-Ga-g])([#b]?)(-?\d)$/.exec(name.trim());
  if (!m) throw new Error(`Bad note: ${name}`);
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1].toUpperCase() as 'C'];
  const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return (Number(m[3]) + 1) * 12 + base + acc;
}

export function midiToName(midi: number): string {
  return NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
}

/** Pitch class only, e.g. 64 → "E". */
export function pitchClass(midi: number): string {
  return NOTE_NAMES[((midi % 12) + 12) % 12];
}

/**
 * Six-string voicings, low E → high e. null = string not played.
 * Standard open shapes; barre chords where no open shape exists.
 */
const GUITAR_SHAPES: Record<string, (number | null)[]> = {
  C: [null, 3, 2, 0, 1, 0],
  Cmaj7: [null, 3, 2, 0, 0, 0],
  C7: [null, 3, 2, 3, 1, 0],
  Cadd9: [null, 3, 2, 0, 3, 0],
  D: [null, null, 0, 2, 3, 2],
  Dm: [null, null, 0, 2, 3, 1],
  D7: [null, null, 0, 2, 1, 2],
  Dsus4: [null, null, 0, 2, 3, 3],
  E: [0, 2, 2, 1, 0, 0],
  Em: [0, 2, 2, 0, 0, 0],
  E7: [0, 2, 0, 1, 0, 0],
  Em7: [0, 2, 0, 0, 0, 0],
  F: [1, 3, 3, 2, 1, 1],
  Fmaj7: [null, null, 3, 2, 1, 0],
  G: [3, 2, 0, 0, 0, 3],
  G7: [3, 2, 0, 0, 0, 1],
  A: [null, 0, 2, 2, 2, 0],
  Am: [null, 0, 2, 2, 1, 0],
  A7: [null, 0, 2, 0, 2, 0],
  Am7: [null, 0, 2, 0, 1, 0],
  Asus2: [null, 0, 2, 2, 0, 0],
  B7: [null, 2, 1, 2, 0, 2],
  Bm: [null, 2, 4, 4, 3, 2],
  'F#m': [2, 4, 4, 2, 2, 2],
  'C#m': [null, 4, 6, 6, 5, 4],
  Bb: [null, 1, 3, 3, 3, 1],
  // Power chords for distorted tones.
  E5: [0, 2, 2, null, null, null],
  A5: [null, 0, 2, 2, null, null],
  D5: [null, null, 0, 2, 3, null],
  G5: [3, 5, 5, null, null, null],
  C5: [null, 3, 5, 5, null, null],
  F5: [1, 3, 3, null, null, null],
  B5: [null, 2, 4, 4, null, null],
};

export const GUITAR_TUNING = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'].map(noteToMidi);
export const BASS_TUNING = ['E1', 'A1', 'D2', 'G2'].map(noteToMidi);

export function knownChord(name: string): boolean {
  return name in GUITAR_SHAPES;
}

/** Root pitch class (0–11) of a chord symbol such as "F#m" or "Bb". */
export function chordRoot(name: string): number {
  const m = /^([A-G])([#b]?)/.exec(name);
  if (!m) return 0;
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1] as 'C'];
  return (base + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12;
}

function isMinor(name: string): boolean {
  return /^[A-G][#b]?m(?!aj)/.test(name);
}

/**
 * MIDI notes per string for a chord on the given tuning (null = muted).
 * Guitars use the shape table; a 4-string bass gets root, fifth, octave,
 * and the third above that — the notes a bassist outlines a chord with.
 */
export function chordNotes(name: string, tuning: number[]): (number | null)[] {
  if (tuning.length === 6) {
    const shape = GUITAR_SHAPES[name];
    if (!shape) return tuning.map(() => null);
    return shape.map((f, i) => (f === null ? null : tuning[i] + f));
  }
  const pc = chordRoot(name);
  // Lowest root at or above the bass's low E.
  let root = tuning[0];
  while (((root % 12) + 12) % 12 !== pc) root++;
  const third = isMinor(name) ? 3 : 4;
  return [root, root + 7, root + 12, root + 12 + third].slice(0, tuning.length);
}

/**
 * Where to play a pitch on the instrument, preferring low frets and the
 * given string when there is a tie. Returns null if out of range.
 */
export function findPosition(
  midi: number,
  tuning: number[],
  maxFret: number,
): { string: number; fret: number } | null {
  let best: { string: number; fret: number } | null = null;
  for (let s = 0; s < tuning.length; s++) {
    const fret = midi - tuning[s];
    if (fret < 0 || fret > maxFret) continue;
    // Prefer frets 0–5 (first position); among those, the higher string.
    if (!best || score(fret) < score(best.fret) || (score(fret) === score(best.fret) && s > best.string)) {
      best = { string: s, fret };
    }
  }
  return best;
  function score(f: number) {
    return f <= 5 ? 0 : f;
  }
}
