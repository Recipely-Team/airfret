import { describe, expect, it } from 'vitest';
import { chordNotes, chordRoot } from '@domain/music/chord-voicing';
import { findPosition } from '@domain/music/find-position';
import { midiToName, noteToMidi } from '@domain/music/pitch';
import { BASS_TUNING, GUITAR_TUNING } from '@domain/music/tunings';

describe('pitch', () => {
  it('reads note names with sharps, flats and octaves', () => {
    expect(noteToMidi('E2')).toBe(40);
    expect(noteToMidi('C#4')).toBe(61);
    expect(noteToMidi('Bb3')).toBe(58);
    expect(midiToName(64)).toBe('E4');
  });

  it('returns null instead of throwing on a malformed name', () => {
    expect(noteToMidi('H2')).toBeNull();
  });
});

describe('chord voicing', () => {
  it('voices an open C on guitar with the low E muted', () => {
    expect(chordNotes('C', GUITAR_TUNING)).toEqual([null, 48, 52, 55, 60, 64]);
  });

  it('outlines a minor chord on bass: root, fifth, octave, minor third', () => {
    expect(chordNotes('Am', BASS_TUNING)).toEqual([33, 40, 45, 48]);
  });

  it('finds the root of sharp and flat chords', () => {
    expect(chordRoot('F#m')).toBe(6);
    expect(chordRoot('Bb')).toBe(10);
  });

  it('prefers first position when placing a note', () => {
    expect(findPosition(64, GUITAR_TUNING, 12)).toEqual({ string: 5, fret: 0 });
    expect(findPosition(20, GUITAR_TUNING, 12)).toBeNull();
  });
});
