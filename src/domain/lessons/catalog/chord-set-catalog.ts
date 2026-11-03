import type { ChordSet } from '@domain/lessons/catalog/chord-set';

/** Free-play chord palettes. */
export const CHORD_SETS: readonly ChordSet[] = [
  { id: 'pop', name: 'G · D · Em · C', chords: ['G', 'D', 'Em', 'C', 'Am', 'Bm', 'D7', 'Cadd9'] },
  { id: 'campfire', name: 'C · Am · F · G', chords: ['C', 'Am', 'F', 'G', 'Dm', 'Em', 'E', 'G7'] },
  { id: 'minor', name: 'Am · Dm · E', chords: ['Am', 'Dm', 'E', 'Am7', 'C', 'G', 'F', 'E7'] },
  { id: 'blues', name: 'A7 · D7 · E7', chords: ['A7', 'D7', 'E7', 'A', 'D', 'E'] },
  { id: 'rock', name: 'E5 · G5 · A5', chords: ['E5', 'G5', 'A5', 'D5', 'C5', 'B5', 'F5'] },
];

const FALLBACK = CHORD_SETS[0] as ChordSet;

/** Looks up a chord set, falling back to the first one. */
export function chordSetById(id: string): ChordSet {
  return CHORD_SETS.find((c) => c.id === id) ?? FALLBACK;
}
