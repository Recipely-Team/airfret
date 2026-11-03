import { describe, expect, it } from 'vitest';
import { FakeSoundOutput } from '@application/__fixtures__/fake-sound-output';
import type { PlayEvent } from '@application/play/play-event';
import { Player } from '@application/play/player';
import { computeLayout } from '@domain/fretboard/compute-layout';
import { strumStringYs } from '@domain/fretboard/neck-geometry';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { PlayMode } from '@domain/instruments/play-mode';
import { StrumFilter } from '@domain/settings/strum-filter';

const W = 1440;
const H = 900;

function setup(mode: PlayMode, strumFilter: StrumFilter = StrumFilter.both, instrument = 'acoustic') {
  const sound = new FakeSoundOutput();
  const player = new Player(sound);
  const inst = instrumentById(instrument);
  const layout = computeLayout(W, H, inst.tuning.length, false, inst.maxFret);
  player.configure({ layout, instrument: inst, mode, chords: ['G', 'C', 'D', 'Em'], strumFilter, capo: 0 });
  const events: PlayEvent[] = [];
  player.onEvent = (e) => events.push(e);
  const ys = strumStringYs(layout);
  const x = (layout.strumX0 + layout.strumX1) / 2;
  const sweep = (from: number, to: number, t: number) => {
    player.pointer({ x, y: from }, t, 0);
    player.pointer({ x, y: to }, t + 0.03, 0);
  };
  return { sound, player, events, sweep, top: (ys[0] ?? 0) - 40, bottom: (ys[ys.length - 1] ?? 0) + 40 };
}

describe('Player', () => {
  it('strums the selected chord, one strum event per gesture', () => {
    const { sound, events, sweep, top, bottom } = setup(PlayMode.chord);
    sweep(top, bottom, 1);
    expect(sound.plucks.map((p) => p.midi)).toEqual([43, 47, 50, 55, 59, 67]);
    expect(events).toEqual([expect.objectContaining({ chord: 'G' })]);
  });

  it('skips strings the chord shape mutes', () => {
    const { sound, player, sweep, top, bottom } = setup(PlayMode.chord);
    player.select(1);
    sweep(top, bottom, 1);
    expect(sound.plucks.map((p) => p.string)).toEqual([1, 2, 3, 4, 5]);
  });

  it('ignores upstrokes when the strum filter is down-only', () => {
    const { sound, sweep, top, bottom } = setup(PlayMode.chord, StrumFilter.down);
    sweep(bottom, top, 1);
    expect(sound.plucks).toEqual([]);
    sweep(top, bottom, 2);
    expect(sound.plucks).toHaveLength(6);
  });

  it('plays the held fret on every string in note mode and reports each note', () => {
    const { sound, player, events, sweep, top, bottom } = setup(PlayMode.note, StrumFilter.both, 'bass');
    player.select(3);
    sweep(top, bottom, 1);
    expect(sound.plucks.map((p) => p.midi)).toEqual([31, 36, 41, 46]);
    expect(events.map((e) => e.midi)).toEqual([31, 36, 41, 46]);
  });

  it('plays louder for a faster strum', () => {
    const slow = setup(PlayMode.chord);
    slow.player.pointer({ x: 1200, y: slow.top }, 1, 0);
    slow.player.pointer({ x: 1200, y: slow.bottom }, 1.4, 0);
    const fast = setup(PlayMode.chord);
    fast.sweep(fast.top, fast.bottom, 1);
    expect(fast.sound.plucks[0]!.amp).toBeGreaterThan(slow.sound.plucks[0]!.amp);
  });
});

describe('Player — natural contact with the strings', () => {
  it('does not stop strings the strumming hand passes over on its way (they used to be cut)', () => {
    const { sound, player } = setup(PlayMode.chord);
    const ys = strumStringYs(player.layout);
    const x = (player.layout.strumX0 + player.layout.strumX1) / 2;
    const line = ys[2] ?? 0;
    // One frame lands inside the string's contact band, the next is past it — a normal strum.
    player.pointer({ x, y: line - 30 }, 1, 0);
    player.pointer({ x, y: line + 3 }, 1.03, 0);
    player.pointer({ x, y: line + 40 }, 1.06, 0);
    expect(sound.touches).toEqual([]);
  });

  it('stops a string the fingertip rests on', () => {
    const { sound, player } = setup(PlayMode.chord);
    const ys = strumStringYs(player.layout);
    const x = (player.layout.strumX0 + player.layout.strumX1) / 2;
    const line = ys[2] ?? 0;
    player.pointer({ x, y: line - 30 }, 1, 0);
    player.pointer({ x, y: line + 3 }, 1.05, 0);
    player.pointer({ x, y: line + 3 }, 1.3, 0);
    expect(sound.touches).toEqual([2]);
  });
});
