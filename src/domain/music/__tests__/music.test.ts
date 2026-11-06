import { describe, expect, it } from 'vitest';
import { chordNotes, chordRoot } from '@domain/music/chords/chord-voicing';
import { findPosition } from '@domain/music/find-position';
import { midiToName, noteToMidi } from '@domain/music/pitch';
import { BASS5_TUNING, BASS6_TUNING, BASS_TUNING, GUITAR7_TUNING, GUITAR_TUNING, isBassRange } from '@domain/music/tunings';

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

  it('voices chords by family, not string count: a 6-string bass outlines, a 7-string guitar uses the shapes', () => {
    // The 6-string bass has as many strings as a guitar and used to get the guitar's shapes.
    expect(chordNotes('Am', BASS6_TUNING)).toEqual([null, 33, 40, 45, 48, 57]);
    expect(chordNotes('E', BASS6_TUNING)).toEqual([null, 28, 35, 40, 44, 52]);
    expect(chordNotes('C', GUITAR7_TUNING)).toEqual([null, null, 48, 52, 55, 60, 64]);
    expect(chordNotes('Am', BASS5_TUNING)).toEqual([null, 33, 40, 45, 48]);
  });

  it('offers tunings by family: bass tunings on a 6-string bass, drop A on a 7-string guitar', async () => {
    const { tuningsFor, effectiveTuning } = await import('@domain/music/tuning-catalog');
    expect(tuningsFor(BASS6_TUNING).map((t) => t.id)).not.toContain('dadgad');
    expect(effectiveTuning(GUITAR7_TUNING, 'dropA', 0)).toEqual([33, 40, 45, 50, 55, 59, 64]);
    expect(isBassRange(GUITAR7_TUNING)).toBe(false);
    expect(isBassRange(effectiveTuning(GUITAR7_TUNING, 'dropA', 0))).toBe(false);
    expect(isBassRange(effectiveTuning(BASS_TUNING, 'dropD', 0))).toBe(true);
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
    expect(tuningsFor(BASS_TUNING).map((t) => t.id)).toContain('dropD');
    expect(effectiveTuning(BASS_TUNING, 'nope', 0)).toEqual([...BASS_TUNING]);
  });
});

describe('5-string bass', () => {
  it('offers tunings whose offsets fit five strings, so drop A lowers the low B and nothing else', async () => {
    const { effectiveTuning, tuningsFor } = await import('@domain/music/tuning-catalog');
    const { BASS5_TUNING } = await import('@domain/music/tunings');
    for (const t of tuningsFor(BASS5_TUNING)) expect(t.offsets).toHaveLength(5);
    expect(tuningsFor(BASS5_TUNING).map((t) => t.id)).not.toContain('dropD');
    expect(effectiveTuning(BASS5_TUNING, 'dropA', 0)).toEqual([21, 28, 33, 38, 43]);
  });

  it('outlines a chord from its E string and leaves the low B silent', async () => {
    const { BASS5_TUNING } = await import('@domain/music/tunings');
    expect(chordNotes('Am', BASS5_TUNING)).toEqual([null, 33, 40, 45, 48]);
  });
});

describe('tunings for any other instrument', () => {
  it('falls back to standard instead of handing out offsets for the wrong strings', async () => {
    const { tuningsFor } = await import('@domain/music/tuning-catalog');
    // A four-string instrument in guitar range (a ukulele, G4 C4 E4 A4): no bass tunings for it.
    const fallback = tuningsFor([67, 60, 64, 69]);
    expect(fallback.map((t) => t.id)).toEqual(['standard']);
    expect(fallback[0]?.offsets).toEqual([0, 0, 0, 0]);
  });
});
