import { describe, expect, it } from 'vitest';
import { BandRole } from '@domain/band/band-role';
import { chordTimeline } from '@domain/band/chord-timeline';
import { CompPattern } from '@domain/band/comp-pattern';
import type { InstrumentProfile } from '@domain/band/instrument-profile';
import { profileOf } from '@domain/band/profile-of';
import { seatBand } from '@domain/band/seat-band';
import { writePart } from '@domain/band/write-part';
import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';
import { SONGS } from '@domain/lessons/catalog/song-catalog';
import { parseSong } from '@domain/lessons/chart/parse-song';

const chartOf = (song: Song) => {
  const c = parseSong(song, false);
  if (!c.isOk) throw new Error(song.id);
  return c.value;
};
const izmir = SONGS.find((s) => s.id === 'izmir-marsi') as Song;
const tune = { low: 68, high: 81 };
const seatsOf = (ids: string[]) => Object.fromEntries(seatBand(ids.map(profileOf), tune).map((s) => [s.id, s.pattern ? `${s.role}/${s.pattern}` : s.role]));
const notesOf = (song: Song) => chartOf(song).targets.map((t) => [t.beat, t.midi, ...(t.harmony ?? [])]);

describe('Seating a band from what its instruments are', () => {
  it('reads each instrument from its catalogue: a wind holds one note, a neck plays chords, a drum has none', () => {
    expect(profileOf('clarinet')).toMatchObject({ isMonophonic: true, isSustained: true, isDrum: false });
    expect(profileOf('acoustic')).toMatchObject({ isMonophonic: false, isSustained: false });
    expect(profileOf('bass').low).toBeLessThanOrEqual(40);
    expect(profileOf('davul').isDrum).toBe(true);
  });

  it('gives a march band its jobs: the clarinet the tune, the chords in turns of pattern, the bass, the beat', () => {
    expect(seatsOf(['acoustic', 'piano', 'clarinet', 'bass', 'davul', 'kanun'])).toEqual({
      clarinet: 'melody', acoustic: 'harmony/afterbeat', piano: 'harmony/arpeggio', kanun: 'harmony/held', bass: 'bass', davul: 'rhythm',
    });
  });

  it('puts a second wind on an inner line when there are chords, the glockenspiel an octave above, a tuba with the bass', () => {
    const seats = seatsOf(['flute', 'clarinet', 'glockenspiel', 'tuba', 'bass', 'bassoon', 'acoustic']);
    expect(Object.values(seats).filter((r) => r === 'melody')).toHaveLength(1);
    expect(Object.values(seats).filter((r) => r === 'counter').length).toBeGreaterThan(0);
    expect(seats['glockenspiel']).toBe('double');
    expect(Object.values(seats).filter((r) => r === 'bass')).toHaveLength(2);
  });

  it('lets a folk ensemble with no chords play the tune together, and always has someone on it', () => {
    expect(seatsOf(['ney', 'kemence', 'darbuka'])).toEqual({ ney: 'melody', kemence: 'double', darbuka: 'rhythm' });
    expect(seatsOf(['bass'])).toEqual({ bass: 'melody' });
    const odd: InstrumentProfile = { id: 'x', low: 80, high: 100, isMonophonic: true, isSustained: false, isDrum: false };
    expect(seatBand([odd], tune)[0]?.role).toBe(BandRole.melody);
  });
});

describe('Writing each seat its part', () => {
  const chart = chartOf(izmir);
  const seat = (role: BandRole, pattern?: CompPattern, voice?: number) => ({ id: 'x', role, centre: 66, gain: 1, ...(pattern ? { pattern } : {}), ...(voice !== undefined ? { voice } : {}) });

  it('reads the chords under the Izmir March from its bass: A minor, D minor', () => {
    const chords = chordTimeline(izmir, chart);
    expect(chords[0]).toMatchObject({ beat: 0, bass: 45, tones: [9, 0, 4] });
    expect(chords[1]).toMatchObject({ beat: 4, bass: 50, tones: [2, 5, 9] });
  });

  it('plays the tune alone over a bass, the bass root then fifth on the strong beats, chords on the afterbeats', () => {
    expect(notesOf(writePart(izmir, chart, seat(BandRole.melody), true)).slice(0, 2)).toEqual([[0, 69], [1, 76]]);
    expect(writePart(izmir, chart, seat(BandRole.melody), false)).toBe(izmir);
    expect(notesOf(writePart(izmir, chart, seat(BandRole.bass), true)).slice(0, 3)).toEqual([[0, 45], [2, 52], [4, 50]]);
    const after = notesOf(writePart(izmir, chart, seat(BandRole.harmony, CompPattern.afterbeat), true));
    expect(after.slice(0, 2)).toEqual([[1, 64, 60, 57], [3, 64, 60, 57]]);
    expect(notesOf(writePart(izmir, chart, seat(BandRole.harmony, CompPattern.afterbeat), false))[0]?.[0]).toBe(0);
    const arp = notesOf(writePart(izmir, chart, seat(BandRole.harmony, CompPattern.arpeggio), true));
    expect(arp.slice(0, 4).map((n) => n[1])).toEqual([64, 69, 72, 69]);
    expect(notesOf(writePart(izmir, chart, seat(BandRole.harmony, CompPattern.held), true))[0]).toEqual([0, 69, 64, 60]);
  });

  it('moves an inner line to the nearest tone of each chord, and lasts as long as the song', () => {
    const line = notesOf(writePart(izmir, chart, seat(BandRole.counter, undefined, 0), true));
    for (let i = 1; i < line.length; i++) expect(Math.abs((line[i]?.[1] ?? 0) - (line[i - 1]?.[1] ?? 0))).toBeLessThanOrEqual(6);
    for (const r of [BandRole.melody, BandRole.bass, BandRole.counter, BandRole.double]) expect(chartOf(writePart(izmir, chart, seat(r), true)).length).toBeCloseTo(chart.length, 4);
    expect(writePart(izmir, chart, seat(BandRole.rhythm), true)).toBe(izmir);
  });

  it('gives every part the tune when no bass is written to read chords from, and a chord song a bass of its roots', () => {
    const plain: Song = { ...izmir, notes: 'r:1 C4:1 D4:1' };
    expect(notesOf(writePart(plain, chartOf(plain), seat(BandRole.harmony, CompPattern.held), true))).toEqual([[1, 60], [2, 62]]);
    const strum: Song = { ...izmir, mode: PlayMode.chord, chords: 'Am:4 E:4' };
    expect(notesOf(writePart(strum, chartOf(strum), seat(BandRole.bass), true))).toEqual([[0, 45], [2, 52], [4, 52], [6, 59]]);
    expect(writePart(strum, chartOf(strum), seat(BandRole.melody), true)).toBe(strum);
    expect(writePart(strum, chartOf(strum), seat(BandRole.double), true)).toBe(strum);
  });
});
