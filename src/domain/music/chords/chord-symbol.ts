import { chordRoot } from '@domain/music/chords/chord-voicing';

const ROOT = /^[A-G][#b]?/;

/** Splits a chord symbol into root pitch class and quality suffix: "F#m7" → { root: 6, quality: 'm7' }. */
export function parseChordSymbol(symbol: string): { root: number; quality: string } {
  return { root: chordRoot(symbol), quality: symbol.replace(ROOT, '').split('/')[0] ?? '' };
}
