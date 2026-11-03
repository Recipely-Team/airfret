import { describe, expect, it } from 'vitest';
import { parseChordSymbol } from '@domain/music/chords/chord-symbol';

describe('parseChordSymbol', () => {
  it.each([
    ['C', 0, ''],
    ['F#m7', 6, 'm7'],
    ['Bb', 10, ''],
    ['Dsus4', 2, 'sus4'],
    ['D/F#', 2, ''],
  ])('splits %s into root and quality', (symbol, root, quality) => {
    expect(parseChordSymbol(symbol)).toEqual({ root, quality });
  });
});
