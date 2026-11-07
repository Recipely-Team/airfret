import { describe, expect, it } from 'vitest';
import { grooveForSong, rhythmForSong, songDrumSpan } from '@domain/drums/song-drums';
import { parseGroove } from '@domain/drums/grooves/parse-groove';
import { parseRhythm } from '@domain/drums/hand/rhythms/parse-rhythm';
import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';

const song = (over: Partial<Song>): Song => ({
  id: 's', title: 'Song', credit: 'c', level: 1, bpm: 100, beatsPerBar: 4, mode: PlayMode.note, instrument: 'acoustic', about: 'a', notes: 'C4:1', ...over,
});

describe('Drums for any song', () => {
  it('start on the first bar line after a pickup and run to the end', () => {
    const span = songDrumSpan(song({}), { targets: [{ beat: 3 }, { beat: 9 }], length: 12 } as never);
    expect(span).toEqual({ first: 3, start: 4, bars: 2 });
    expect(songDrumSpan(song({}), { targets: [], length: 0 } as never).bars).toBe(1);
  });

  it('give a march a march beat and every meter a beat of its own, even an unusual one', () => {
    expect(grooveForSong(song({ title: '\u0130zmir Mar\u015f\u0131' }), 2).lanes.snare).toBe('X.x.X.x.');
    expect(grooveForSong(song({}), 2).lanes.snare).toBe('..X...X.');
    for (const n of [2, 3, 4, 5, 6, 7, 9]) {
      const g = grooveForSong(song({ beatsPerBar: n }), 3);
      expect(parseGroove(g).length).toBeGreaterThan(0);
    }
  });

  it('give a hand drum its own rhythm in the meter, else a doum-tek phrase that reads', () => {
    for (const n of [2, 3, 4, 5, 6, 7, 9]) {
      for (const id of ['darbuka', 'davul', 'bendir', 'no-such-drum']) {
        const r = rhythmForSong(song({ beatsPerBar: n }), id, 2);
        expect(parseRhythm(r.phrase, r.subdiv, r.beatsPerBar, r.bars)?.length ?? 0).toBeGreaterThan(0);
      }
    }
  });
});
