import { describe, expect, it } from 'vitest';
import { PlayMode } from '@domain/instruments/play-mode';
import { SONGS } from '@domain/lessons/catalog/song-catalog';
import { parseSong } from '@domain/lessons/chart/parse-song';
import { knownChord } from '@domain/music/chords/chord-voicing';
import { findPosition } from '@domain/music/find-position';
import { BASS_TUNING, GUITAR_TUNING } from '@domain/music/tunings';

describe('parseSong', () => {
  it('parses every song in the catalogue', () => {
    for (const song of SONGS) expect(parseSong(song, false).isOk, song.id).toBe(true);
  });

  it('only uses chords the instrument has shapes for', () => {
    for (const song of SONGS.filter((s) => s.mode === PlayMode.chord)) {
      const chart = parseSong(song, false);
      if (!chart.isOk) throw new Error(song.id);
      for (const seg of chart.value.segments) expect(knownChord(seg.chord), `${song.id}: ${seg.chord}`).toBe(true);
    }
  });

  it('only asks for notes the suggested instrument can reach', () => {
    for (const song of SONGS.filter((s) => s.mode === PlayMode.note)) {
      const tuning = song.instrument === 'bass' ? BASS_TUNING : GUITAR_TUNING;
      const chart = parseSong(song, false);
      if (!chart.isOk) throw new Error(song.id);
      for (const tg of chart.value.targets) expect(findPosition(tg.midi ?? -1, tuning, 12), `${song.id}: ${tg.midi}`).not.toBeNull();
    }
  });

  it('has one pattern slot per subdivision of the bar', () => {
    for (const s of SONGS.filter((x) => x.mode === PlayMode.chord)) expect(s.pattern?.length, s.id).toBe(s.beatsPerBar * (s.subdiv ?? 2));
  });

  it('keeps one downstroke per bar in easy mode', () => {
    const song = SONGS.find((s) => s.id === 'four-chords')!;
    const easy = parseSong(song, true);
    expect(easy.isOk && easy.value.targets.length).toBe(16);
  });

  it('fails with invalid-chart instead of throwing on a bad note', () => {
    const r = parseSong({ ...SONGS.find((s) => s.id === 'twinkle')!, notes: 'C4:1 X9:1' }, false);
    expect(r.isOk).toBe(false);
    if (!r.isOk) expect(r.failure.code).toBe('invalid-chart');
  });
});
