import { describe, expect, it } from 'vitest';
import { EnsemblePerformer } from '@application/demo/ensemble-performer';
import type { EnsembleOutputInterface } from '@domain/audio/ensemble-output-interface';
import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';
import { FakeSoundOutput } from '@application/__fixtures__/fake-sound-output';

/** An ensemble that records what it is asked to play. */
class FakeEnsemble implements EnsembleOutputInterface {
  readonly played: { id: string; midi: number; when: number; dur: number }[] = [];
  silenced = 0;
  prepared: readonly string[] = [];
  prepare(ids: readonly string[]): void {
    this.prepared = ids;
  }
  canPlay(id: string): boolean {
    return id !== 'ukulele';
  }
  play(id: string, midi: number, _velocity: number, when: number, dur: number): void {
    this.played.push({ id, midi, when, dur });
  }
  release(): void {}
  silence(): void {
    this.silenced++;
  }
}

const tune: Song = {
  id: 't', title: 't', credit: 'c', level: 1, bpm: 120, beatsPerBar: 4, mode: PlayMode.note, instrument: 'acoustic', about: 'a',
  notes: 'r:1 C4+C3:1 D4:1 E4:1',
};
const playThrough = (p: EnsemblePerformer) => {
  for (let t = 0; t < 5; t += 1 / 60) p.update(t);
};

describe('Instruments joining one that plays by itself', () => {
  it('play the same song together from the same first beat, each in its own range; a wind plays the tune alone', () => {
    const out = new FakeEnsemble();
    const p = new EnsemblePerformer(out);
    p.start(tune, ['clarinet', 'glockenspiel', 'ukulele'], 0);
    playThrough(p);
    const clarinet = out.played.filter((n) => n.id === 'clarinet');
    expect(clarinet.map((n) => n.midi)).toEqual([60, 62, 64]);
    expect(clarinet[0]!.when).toBeCloseTo(0.3, 5);
    expect(clarinet[1]!.when).toBeCloseTo(0.8, 5);
    const glock = out.played.filter((n) => n.id === 'glockenspiel');
    for (const n of glock) expect(n.midi).toBeGreaterThanOrEqual(79);
    expect(out.played.some((n) => n.id === 'ukulele')).toBe(false);
  });

  it('stops together, and has nothing to add to a drum rhythm', () => {
    const out = new FakeEnsemble();
    const p = new EnsemblePerformer(out);
    p.start(tune, ['clarinet'], 0);
    p.update(0.2);
    p.stop();
    expect(out.silenced).toBe(1);
    expect(p.isPlaying).toBe(false);
    p.start({ ...tune, mode: PlayMode.free }, ['clarinet'], 0);
    playThrough(p);
    expect(out.played.length).toBe(1);
  });

  it('lets drums join: the kit keeps the beat and a hand drum plays its rhythm, from the first full bar', () => {
    const drums = new FakeSoundOutput();
    const p = new EnsemblePerformer(new FakeEnsemble(), drums);
    p.start({ ...tune, notes: 'r:1 C4:1 D4:1 E4:1 F4:1 G4:1 A4:1 B4:1 C5:4' }, ['drums', 'davul', 'nowhere'], 0);
    playThrough(p);
    // The tune starts on beat 1 (0.3 s); the bar starts on beat 4, 1.5 s after it.
    expect(drums.drumHits.length).toBeGreaterThan(0);
    expect(Math.min(...drums.drumHits.map((h) => h.when))).toBeCloseTo(1.8, 5);
    expect(drums.handStrokes.length).toBeGreaterThan(0);
    expect(Math.min(...drums.handStrokes.map((h) => h.when))).toBeCloseTo(1.8, 5);
  });

  it('leaves the drums out when it has no drum voices', () => {
    const out = new FakeEnsemble();
    const p = new EnsemblePerformer(out);
    p.start(tune, ['drums'], 0);
    playThrough(p);
    expect(out.played.length).toBe(0);
  });
});
