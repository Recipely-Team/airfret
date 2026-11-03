import { describe, expect, it } from 'vitest';
import { CHORD_SETS, chordSetById } from '@domain/lessons/catalog/chord-set-catalog';
import { knownChord } from '@domain/music/chords/chord-voicing';

describe('chord sets', () => {
  it('only contain chords that have guitar shapes', () => {
    for (const set of CHORD_SETS) for (const c of set.chords) expect(knownChord(c), `${set.id}: ${c}`).toBe(true);
  });

  it('fall back to the first set for an unknown id', () => {
    expect(chordSetById('rock').id).toBe('rock');
    expect(chordSetById('nope')).toBe(CHORD_SETS[0]);
  });
});
