import { describe, expect, it } from 'vitest';
import { FakeSoundOutput } from '@application/__fixtures__/fake-sound-output';
import { DemoPerformer } from '@application/demo/demo-performer';
import { DEMO_SONG_BY_INSTRUMENT } from '@application/demo/demo-songs';
import { computeLayout } from '@domain/fretboard/compute-layout';
import { inStrumArea } from '@domain/fretboard/neck-geometry';
import { instrumentById, INSTRUMENTS } from '@domain/instruments/instrument-catalog';
import { watchableSongs } from '@application/demo/watchable-songs';
import { SONGS } from '@domain/lessons/catalog/song-catalog';
import { DRUMS_ID } from '@domain/drums/drums-id';
import { effectiveTuning } from '@domain/music/tuning-catalog';

const FRAME = 1 / 60;
/** Enough of each piece to cover chord changes and position shifts. */
const SECONDS = 20;

function perform(instrumentId: string, songId = DEMO_SONG_BY_INSTRUMENT[instrumentId], seconds = SECONDS) {
  const song = SONGS.find((s) => s.id === songId);
  if (!song) throw new Error(`no song ${songId ?? ''} for ${instrumentId}`);
  const base = instrumentById(instrumentId);
  const instrument = { ...base, tuning: effectiveTuning(base.tuning, song.tuning ?? 'standard', 0) };
  const l = computeLayout(1440, 900, instrument.tuning.length, false, instrument.maxFret);
  const sound = new FakeSoundOutput();
  const demo = new DemoPerformer(sound);
  expect(demo.start(song, instrument, 0).isOk).toBe(true);
  const frames = [];
  for (let t = 0; t < seconds && demo.isPlaying; t += FRAME) {
    sound.now = t;
    const f = demo.update(l, instrument, 0, t);
    if (f) frames.push({ t, ...f });
  }
  return { instrument, l, sound, frames };
}

/** Every note that sounds is the fret the hand holds on that string; returns how many notes were checked. */
function expectHeldNotes(instrumentId: string, songId?: string, seconds = SECONDS): number {
  const { instrument, sound, frames } = perform(instrumentId, songId, seconds);
  let checked = 0;
  for (const p of sound.plucks) {
    const f = frames.find((x) => x.t >= p.when);
    if (!f) continue;
    const fret = f.fretting.frets[p.string] ?? 0;
    expect(fret, `${songId ?? instrumentId}: string ${p.string} at ${p.when.toFixed(2)} s`).toBe(p.midi - (instrument.tuning[p.string] ?? 0));
    checked++;
  }
  return checked;
}

/** Long enough for several chord changes or melody positions on every song; keeps ~150 runs quick. */
const LIST_SECONDS = 8;

describe('Watch it play mode: every song in each instrument\'s list plays on that instrument', () => {
  for (const inst of INSTRUMENTS.filter((i) => i.id !== DRUMS_ID)) {
    for (const song of watchableSongs(SONGS, inst.id)) {
      it(`${song.id} on ${inst.id}: every note the one the hand holds`, () => {
        expect(expectHeldNotes(inst.id, song.id, LIST_SECONDS)).toBeGreaterThan(2);
      });
    }
  }
});

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

  it('starts playing at once — no count-in bar of silence, even on the slow Prelude', () => {
    const { sound } = perform('acoustic');
    expect(Math.min(...sound.plucks.map((p) => p.when))).toBeLessThan(0.5);
  });

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
