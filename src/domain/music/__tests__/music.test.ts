import { describe, expect, it } from 'vitest';
import { chordNotes, chordRoot } from '@domain/music/chords/chord-voicing';
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

describe('effectiveTuning', () => {
  it('drops the low string for Drop D and raises every string with a capo', async () => {
    const { effectiveTuning } = await import('@domain/music/tuning-catalog');
    expect(effectiveTuning(GUITAR_TUNING, 'dropD', 0)).toEqual([38, 45, 50, 55, 59, 64]);
    expect(effectiveTuning(GUITAR_TUNING, 'standard', 2)).toEqual([42, 47, 52, 57, 61, 66]);
  });
});

describe('tunings for bass', () => {
  it('offers bass tunings for a 4-string instrument and ignores an unknown tuning id', async () => {
    const { effectiveTuning, tuningsFor } = await import('@domain/music/tuning-catalog');
    expect(tuningsFor(4).map((t) => t.id)).toContain('dropD');
    expect(effectiveTuning(BASS_TUNING, 'nope', 0)).toEqual([...BASS_TUNING]);
  });
});

describe('5-string bass', () => {
  it('offers tunings whose offsets fit five strings, so drop A lowers the low B and nothing else', async () => {
    const { effectiveTuning, tuningsFor } = await import('@domain/music/tuning-catalog');
    const { BASS5_TUNING } = await import('@domain/music/tunings');
    for (const t of tuningsFor(5)) expect(t.offsets).toHaveLength(5);
    expect(tuningsFor(5).map((t) => t.id)).not.toContain('dropD');
    expect(effectiveTuning(BASS5_TUNING, 'dropA', 0)).toEqual([21, 28, 33, 38, 43]);
  });

  it('outlines a chord from its E string and leaves the low B silent', async () => {
    const { BASS5_TUNING } = await import('@domain/music/tunings');
    expect(chordNotes('Am', BASS5_TUNING)).toEqual([null, 33, 40, 45, 48]);
  });
});

describe('tunings for any other string count', () => {
  it('falls back to standard instead of handing out offsets for the wrong strings', async () => {
    const { tuningsFor } = await import('@domain/music/tuning-catalog');
    expect(tuningsFor(7).map((t) => t.id)).toEqual(['standard']);
  });
});
