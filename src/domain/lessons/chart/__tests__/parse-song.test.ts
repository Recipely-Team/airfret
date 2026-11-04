import { describe, expect, it } from 'vitest';
import { PlayMode } from '@domain/instruments/play-mode';
import { SONGS } from '@domain/lessons/catalog/song-catalog';
import { parseSong } from '@domain/lessons/chart/parse-song';
import { knownChord } from '@domain/music/chords/chord-voicing';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { planFingering } from '@domain/music/fingering/plan-fingering';
import { effectiveTuning } from '@domain/music/tuning-catalog';

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

  it('only asks for notes the suggested instrument can reach — every voice, on its real neck and tuning', () => {
    for (const song of SONGS.filter((s) => s.mode === PlayMode.note)) {
      const inst = instrumentById(song.instrument);
      const chart = parseSong(song, false);
      if (!chart.isOk) throw new Error(song.id);
      const onsets = chart.value.targets.map((t) => [t.midi ?? -1, ...(t.harmony ?? [])]);
      const plan = planFingering(onsets, effectiveTuning(inst.tuning, song.tuning ?? 'standard', 0), inst.frets);
      plan.forEach((shape, i) => expect(shape.length, `${song.id} onset ${i}: ${onsets[i]?.join('+')}`).toBe(onsets[i]?.length));
    }
  });

  it('reads chords of notes, melody first, and exact triplet lengths', () => {
    const r = parseSong({ ...SONGS.find((s) => s.id === 'twinkle')!, notes: 'A3+D3:1/3 D4:1/3 F4:1/3 r:0.5 E4:2' }, false);
    if (!r.isOk) throw new Error('chart');
    expect(r.value.targets.map((t) => [t.beat, t.midi, t.harmony])).toEqual([[0, 57, [50]], [1 / 3, 62, undefined], [2 / 3, 65, undefined], [1.5, 64, undefined]]);
    expect(r.value.length).toBeCloseTo(3.5, 9);
  });

  it('fails on a malformed fraction instead of guessing', () => {
    for (const len of ['1/0', '1/', 'x/3']) expect(parseSong({ ...SONGS.find((s) => s.id === 'twinkle')!, notes: `C4:${len}` }, false).isOk, len).toBe(false);
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
