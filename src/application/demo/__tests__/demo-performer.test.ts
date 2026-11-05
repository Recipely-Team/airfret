import { describe, expect, it } from 'vitest';
import { FakeSoundOutput } from '@application/__fixtures__/fake-sound-output';
import { DemoPerformer } from '@application/demo/demo-performer';
import { DEMO_SONG_BY_INSTRUMENT } from '@application/demo/demo-songs';
import { computeLayout } from '@domain/fretboard/compute-layout';
import { inStrumArea } from '@domain/fretboard/neck-geometry';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { SONGS } from '@domain/lessons/catalog/song-catalog';

const FRAME = 1 / 60;
/** Enough of each piece to cover chord changes and position shifts. */
const SECONDS = 20;

function perform(instrumentId: string) {
  const instrument = instrumentById(instrumentId);
  const song = SONGS.find((s) => s.id === DEMO_SONG_BY_INSTRUMENT[instrumentId]);
  if (!song) throw new Error(`no demo song for ${instrumentId}`);
  const l = computeLayout(1440, 900, instrument.tuning.length, false, instrument.maxFret);
  const sound = new FakeSoundOutput();
  const demo = new DemoPerformer(sound);
  expect(demo.start(song, instrument, 0).isOk).toBe(true);
  const frames = [];
  for (let t = 0; t < SECONDS && demo.isPlaying; t += FRAME) {
    sound.now = t;
    const f = demo.update(l, instrument, 0, t);
    if (f) frames.push({ t, ...f });
  }
  return { instrument, l, sound, frames };
}

describe('DemoPerformer — the instrument playing by itself', () => {
  for (const id of Object.keys(DEMO_SONG_BY_INSTRUMENT)) {
    it(`${id}: every note that sounds is the one the hand is holding down on that string`, () => {
      const { instrument, sound, frames } = perform(id);
      expect(sound.plucks.length).toBeGreaterThan(20);
      let checked = 0;
      for (const p of sound.plucks) {
        const f = frames.find((x) => x.t >= p.when);
        if (!f) continue;
        const fret = f.fretting.frets[p.string] ?? 0;
        expect(fret, `${id}: string ${p.string} at ${p.when.toFixed(2)} s`).toBe(p.midi - (instrument.tuning[p.string] ?? 0));
        checked++;
      }
      expect(checked).toBeGreaterThan(20);
    });
  }

  it('shows every pluck once, as a string set vibrating, when it sounds', () => {
    const { sound, frames } = perform('acoustic');
    const shown = frames.flatMap((f) => f.hits).length;
    const sounded = sound.plucks.filter((p) => p.when <= (frames.at(-1)?.t ?? 0)).length;
    expect(shown).toBe(sounded);
  });

  it('keeps the pick over the strings and moves it to each string as it plays', () => {
    const { l, frames } = perform('clean');
    expect(frames.every((f) => inStrumArea(l, f.pick))).toBe(true);
    expect(new Set(frames.map((f) => Math.round(f.pick.y))).size).toBeGreaterThan(5);
  });

  it('draws both hands with all 21 landmarks', () => {
    const { frames } = perform('drive');
    const f = frames[frames.length - 1];
    expect(f?.fretHand).toHaveLength(21);
    expect(f?.strumHand).toHaveLength(21);
  });

  it('stops, and reports nothing more, when stopped', () => {
    const instrument = instrumentById('acoustic');
    const song = SONGS.find((s) => s.id === 'four-chords');
    if (!song) throw new Error('no song');
    const demo = new DemoPerformer(new FakeSoundOutput());
    demo.start(song, instrument, 0);
    demo.stop();
    expect(demo.isPlaying).toBe(false);
    expect(demo.update(computeLayout(1440, 900, 6, false, 20), instrument, 0, 1)).toBeNull();
  });
});
