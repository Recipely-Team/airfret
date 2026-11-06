import { describe, expect, it } from 'vitest';
import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';
import { parseSong } from '@domain/lessons/chart/parse-song';
import { chartNotes, chordTones } from '@domain/performance/chart-notes';
import { fitNotes } from '@domain/performance/fit-notes';

const song = (over: Partial<Song>): Song => ({
  id: 't', title: 't', credit: 'c', level: 1, bpm: 120, beatsPerBar: 4, mode: PlayMode.note, instrument: 'acoustic', about: 'a', ...over,
});
const notesOf = (s: Song) => {
  const chart = parseSong(s, false);
  if (!chart.isOk) throw new Error('bad chart');
  return chartNotes(s, chart.value);
};

describe('A song as a keyboard or a wind plays it', () => {
  it('keeps the melody and lets the bass under it ring until the next bass note', () => {
    const notes = notesOf(song({ notes: 'E4+C3:1 G4:1 C5+F2:2' }));
    expect(notes.filter((n) => n.isMelody).map((n) => n.midi)).toEqual([64, 67, 72]);
    expect(notes.filter((n) => !n.isMelody).map((n) => [n.midi, n.dur])).toEqual([[48, 2], [41, 2]]);
  });

  it('turns a chord chart into a bass at each bar and the chord on every beat', () => {
    const notes = notesOf(song({ mode: PlayMode.chord, chords: 'Am:4' }));
    expect(notes.filter((n) => n.dur === 4).map((n) => n.midi)).toEqual([45]);
    expect(new Set(notes.filter((n) => n.beat === 1).map((n) => n.midi % 12))).toEqual(new Set([9, 0, 4]));
    expect(chordTones('G7')).toEqual([7, 11, 2, 5]);
    expect(chordTones('Bdim')).toEqual([11, 2, 5]);
  });

  it('moves a piece by octaves into the instrument, and folds in what still sticks out', () => {
    const notes = notesOf(song({ notes: 'C4+C2:1 E4:1 G4:1 C5:1' }));
    const glock = fitNotes(notes, 79, 108, false);
    expect(glock.filter((n) => n.isMelody).map((n) => n.midi)).toEqual([84, 88, 91, 96]);
    for (const n of glock) expect(n.midi).toBeGreaterThanOrEqual(79);
  });

  it('gives a one-voice instrument the melody alone, one note at a time', () => {
    const notes = notesOf(song({ notes: 'E4+C3+G3:2 D4:1 C4+F2:1' }));
    const clarinet = fitNotes(notes, 50, 91, true);
    expect(clarinet.map((n) => n.midi)).toEqual([64, 62, 60]);
    for (let i = 1; i < clarinet.length; i++) expect(clarinet[i - 1]!.beat + clarinet[i - 1]!.dur).toBeLessThanOrEqual(clarinet[i]!.beat);
  });
});
