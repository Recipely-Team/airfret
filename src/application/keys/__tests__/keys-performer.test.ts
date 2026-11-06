import { describe, expect, it } from 'vitest';
import { FakeSoundOutput } from '@application/__fixtures__/fake-sound-output';
import { keyboardSongs } from '@application/demo/watchable-songs';
import { KeysPerformer } from '@application/keys/keys-performer';
import { PlayMode } from '@domain/instruments/play-mode';
import { keyboardFor } from '@domain/keys/keyboard-instruments';
import type { Song } from '@domain/lessons/catalog/song';
import { SONGS } from '@domain/lessons/catalog/song-catalog';

const tune: Song = {
  id: 'tune', title: 'Tune', credit: 'c', level: 1, bpm: 120, beatsPerBar: 4, mode: PlayMode.note, instrument: 'acoustic', about: 'a',
  notes: 'C4+C3:1 D4:1 E4:1 F4:1',
};
/** Runs a piece to its end at 60 frames a second; the frames it showed. */
const playThrough = (p: KeysPerformer) => {
  const frames = [];
  for (let t = 0; t < 30; t += 1 / 60) {
    const f = p.update(t);
    if (!f) break;
    frames.push(f);
  }
  return frames;
};

describe('A keyboard or wind playing by itself', () => {
  it('sounds every note of the piece on the clock and lets each go on a piano', () => {
    const sound = new FakeSoundOutput();
    const p = new KeysPerformer(sound);
    expect(p.start(tune, keyboardFor('piano')!, 0)).toBe(true);
    const frames = playThrough(p);
    expect(sound.plucks.map((x) => x.midi).sort()).toEqual([48, 60, 62, 64, 65]);
    expect(sound.plucks.filter((x) => x.midi === 62)[0]!.when).toBeCloseTo(0.3 + 0.5, 3);
    expect(sound.damps.length).toBe(5);
    expect(frames.some((f) => f.down.includes(64))).toBe(true);
    expect(p.isPlaying).toBe(false);
  });

  it('plays the melody alone on a clarinet, and lets a marimba ring', () => {
    const clar = new FakeSoundOutput();
    const p = new KeysPerformer(clar);
    p.start(tune, keyboardFor('clarinet')!, 0);
    playThrough(p);
    expect(clar.plucks.map((x) => x.midi)).toEqual([60, 62, 64, 65]);
    const mar = new FakeSoundOutput();
    const m = new KeysPerformer(mar);
    m.start(tune, keyboardFor('marimba')!, 0);
    playThrough(m);
    expect(mar.plucks.length).toBe(5);
    expect(mar.damps.length).toBe(0);
  });

  it('offers every melody on every keyboard and wind, chord songs only where chords can be played, its own piece first', () => {
    for (const id of ['piano', 'harpsichord', 'marimba', 'glockenspiel', 'clarinet', 'tuba']) {
      const list = keyboardSongs(SONGS, id);
      expect(list.length, id).toBeGreaterThan(5);
      const hasChords = list.some((s) => s.mode === PlayMode.chord);
      expect(hasChords, id).toBe(!keyboardFor(id)!.isMonophonic);
    }
    expect(keyboardSongs(SONGS, 'piano')[0]!.id).toBe('fur-elise');
    expect(keyboardSongs(SONGS, 'acoustic')).toEqual([]);
  });
});
