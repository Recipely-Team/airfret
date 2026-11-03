import { LETTER_SEMITONES, NOTE_NAMES, SEMITONES_PER_OCTAVE } from '@domain/music/note-names';

const A4_MIDI = 69;
const A4_HZ = 440;
const NOTE_PATTERN = /^([A-Ga-g])([#b]?)(-?\d)$/;

/** MIDI note number → frequency in Hz (equal temperament, A4 = 440 Hz). */
export function midiToFreq(midi: number): number {
  return A4_HZ * Math.pow(2, (midi - A4_MIDI) / SEMITONES_PER_OCTAVE);
}

/** "E2", "C#4", "Bb3" → MIDI number, or null when the name is malformed. */
export function noteToMidi(name: string): number | null {
  const m = NOTE_PATTERN.exec(name.trim());
  const letter = m?.[1]?.toUpperCase();
  const base = letter === undefined ? undefined : LETTER_SEMITONES[letter];
  if (!m || base === undefined) return null;
  const accidental = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return (Number(m[3]) + 1) * SEMITONES_PER_OCTAVE + base + accidental;
}

/** Pitch class only, e.g. 64 → "E". */
export function pitchClass(midi: number): string {
  const idx = ((midi % SEMITONES_PER_OCTAVE) + SEMITONES_PER_OCTAVE) % SEMITONES_PER_OCTAVE;
  return NOTE_NAMES[idx] ?? NOTE_NAMES[0];
}

/** MIDI number → name with octave, e.g. 64 → "E4". */
export function midiToName(midi: number): string {
  return `${pitchClass(midi)}${Math.floor(midi / SEMITONES_PER_OCTAVE) - 1}`;
}
