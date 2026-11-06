import { describe, expect, it } from 'vitest';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';
import { fretForSemitones, playableRange, semitoneSpan } from '@domain/music/fretted-range';
import { fitSong } from '@domain/performance/fit-song';

const tune: Song = {
  id: 't', title: 't', credit: 'c', level: 1, bpm: 100, beatsPerBar: 4, mode: PlayMode.note, instrument: 'acoustic', about: 'a',
  notes: 'E3+A2:1 G3:1 r:1 C4+C3:1',
};

describe('A melody fitted to a short-necked instrument', () => {
  it('moves up an octave onto a ukulele, leaving out the bass it cannot reach', () => {
    const uke = playableRange(instrumentById('ukulele'));
    expect(uke.low).toBe(60);
    expect(fitSong(tune, uke.low, uke.high).notes).toBe('E4:1 G4:1 r:1 C5+C4:1');
  });

  it('stays as written where it already fits', () => {
    const guitar = playableRange(instrumentById('acoustic'));
    expect(fitSong(tune, guitar.low, guitar.high)).toBe(tune);
  });

  it('finds each semitone on the nearest of the 17 saz frets an octave', () => {
    const saz = instrumentById('saz');
    expect([0, 1, 2, 5, 7, 12, 14].map((s) => fretForSemitones(saz, s))).toEqual([0, 1, 3, 7, 10, 17, 20]);
    expect(semitoneSpan(saz)).toBeGreaterThanOrEqual(15);
    expect(semitoneSpan(instrumentById('mandolin'))).toBe(20);
  });
});
