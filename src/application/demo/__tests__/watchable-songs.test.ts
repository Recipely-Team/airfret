import { describe, expect, it } from 'vitest';
import { DEMO_SONG_BY_INSTRUMENT } from '@application/demo/demo-songs';
import { keyboardSongs, watchableSongs } from '@application/demo/watchable-songs';
import { isKeyboard } from '@domain/keys/keyboard-instruments';
import { DRUMS_ID } from '@domain/drums/drums-id';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import type { Song } from '@domain/lessons/catalog/song';
import { SONGS } from '@domain/lessons/catalog/song-catalog';
import { PlayMode } from '@domain/instruments/play-mode';

const isBass = (id: string) => instrumentById(id).chain === 'bass';

describe('The songs the Watch it play mode offers', () => {
  it("lists the instrument's showcase piece first", () => {
    for (const [inst, id] of Object.entries(DEMO_SONG_BY_INSTRUMENT)) {
      const list = isKeyboard(inst) ? keyboardSongs(SONGS, inst) : watchableSongs(SONGS, inst);
      expect(list[0]?.id, inst).toBe(id);
    }
  });

  it('offers guitar songs on guitars and bass songs on basses, never drum grooves', () => {
    for (const inst of ['acoustic', 'nylon', 'drive', 'banjo', 'bass', 'bass5']) {
      const songs = watchableSongs(SONGS, inst);
      expect(songs.length).toBeGreaterThan(1);
      for (const s of songs) {
        expect(s.instrument).not.toBe(DRUMS_ID);
        expect(isBass(s.instrument)).toBe(isBass(inst));
      }
    }
  });

  it('offers the birthday tune and the player’s own songs', () => {
    const mine: Song = { id: 'custom-1', title: 'Mine', credit: 'credit.custom', level: 1, bpm: 90, beatsPerBar: 4, mode: PlayMode.chord, instrument: 'acoustic', chords: 'G:4 C:4', about: '' };
    const ids = watchableSongs([...SONGS, mine], 'clean').map((s) => s.id);
    expect(ids).toContain('happy-birthday-melody');
    expect(ids).toContain('custom-1');
  });

  it('offers nothing on the drums', () => {
    expect(watchableSongs(SONGS, DRUMS_ID)).toEqual([]);
  });
});
