import { describe, expect, it } from 'vitest';
import { chordNotes } from '@domain/music/chords/chord-voicing';
import { recognizeChord } from '@domain/music/chords/recognize-chord';
import { GUITAR_TUNING } from '@domain/music/tunings';

const voiced = (name: string) => chordNotes(name, GUITAR_TUNING).filter((m): m is number => m !== null);

describe('recognizeChord', () => {
  it.each(['C', 'G', 'D', 'Em', 'Am', 'E7', 'A7', 'Cmaj7', 'Am7', 'Dsus4', 'Asus2', 'E5', 'F#m', 'Bb'])('names the open/barre voicing of %s', (name) => {
    expect(recognizeChord(voiced(name))?.name).toBe(name === 'Bb' ? 'Bb' : name);
  });

  it('writes a slash chord when the bass is not the root', () => {
    // D shape with the open A string ringing underneath.
    expect(recognizeChord([45, 50, 57, 62, 66])?.name).toBe('D/A');
  });

  it('returns null for a single pitch class', () => {
    expect(recognizeChord([40, 52, 64])).toBeNull();
  });
});
