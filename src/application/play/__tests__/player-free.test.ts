import { describe, expect, it } from 'vitest';
import { FakeSoundOutput } from '@application/__fixtures__/fake-sound-output';
import type { PlayEvent } from '@application/play/play-event';
import { Player } from '@application/play/player';
import { computeLayout } from '@domain/fretboard/compute-layout';
import { stringY } from '@domain/fretboard/neck-geometry';
import type { Point } from '@domain/fretboard/point';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { PlayMode } from '@domain/instruments/play-mode';
import { StrumFilter } from '@domain/settings/strum-filter';
import { HandLandmark } from '@domain/tracking/hand-landmark';

const inst = instrumentById('acoustic');
const layout = computeLayout(1440, 900, 6, false, 12);
const fretMid = (n: number) => ((layout.fretX[n - 1] ?? 0) + (layout.fretX[n] ?? 0)) / 2;
const at = (string: number, fret: number): Point => ({ x: fretMid(fret), y: stringY(layout, string, fretMid(fret)) });
const away: Point = { x: 2000, y: 2000 };

/** Fretting hand with the given fingertips placed; palm on the neck so it counts as the fretting hand. */
function fretHand(tips: Partial<Record<number, Point>>): Point[] {
  const pts: Point[] = Array.from({ length: 21 }, () => away);
  pts[HandLandmark.middleMcp] = { x: fretMid(3), y: layout.centerY - layout.spreadBody - 60 };
  pts[HandLandmark.wrist] = { x: fretMid(3), y: layout.centerY - layout.spreadBody - 140 };
  // Middle joints near the knuckles, so placed fingertips read as extended (not a fist).
  for (const pip of [HandLandmark.indexPip, HandLandmark.middlePip, HandLandmark.ringPip, HandLandmark.pinkyPip]) pts[pip] = pts[HandLandmark.middleMcp]!;
  for (const [idx, p] of Object.entries(tips)) if (p) pts[Number(idx)] = p;
  return pts;
}

function setup() {
  const sound = new FakeSoundOutput();
  const player = new Player(sound);
  player.configure({ layout, instrument: inst, mode: PlayMode.free, chords: [], strumFilter: StrumFilter.both, capo: 0 });
  const events: PlayEvent[] = [];
  player.onEvent = (e) => events.push(e);
  const x = (layout.strumX0 + layout.strumX1) / 2;
  const strum = (t: number) => {
    player.pointer({ x, y: layout.centerY - layout.spreadBody - 40 }, t, 0);
    player.pointer({ x, y: layout.centerY + layout.spreadBody + 40 }, t + 0.03, 0);
    player.pointer(null, t + 0.2, 0);
  };
  return { sound, player, events, strum };
}

const G_SHAPE = { [HandLandmark.indexTip]: at(1, 2), [HandLandmark.middleTip]: at(0, 3), [HandLandmark.ringTip]: at(5, 3) };

describe('Player — free mode', () => {
  it('plays exactly the notes the fingertips hold, and names the chord they form', () => {
    const { sound, player, events, strum } = setup();
    player.updateHands([fretHand(G_SHAPE)], 0, 0, true);
    strum(1);
    expect(sound.plucks.map((p) => p.midi)).toEqual([43, 47, 50, 55, 59, 67]);
    expect(events.at(-1)?.chord).toBe('G');
    expect(player.lastChordName).toBe('G');
  });

  it('hammers on: a finger landing on a ringing string changes its pitch without a new pluck', () => {
    const { sound, player, strum } = setup();
    player.updateHands([fretHand({})], 0, 0, true);
    strum(1);
    const plucks = sound.plucks.length;
    player.updateHands([fretHand({ [HandLandmark.indexTip]: at(3, 2) })], 1.25, 0, true);
    expect(sound.plucks.length).toBe(plucks);
    expect(sound.retunes).toEqual([expect.objectContaining({ string: 3, midi: 57 })]);
    expect(sound.retunes[0]!.excite).toBeGreaterThan(0);
  });

  it('slides: the same finger moving up the same string glides with no new attack', () => {
    const { sound, player, strum } = setup();
    player.updateHands([fretHand({ [HandLandmark.ringTip]: at(3, 5) })], 0, 0, true);
    strum(1);
    player.updateHands([fretHand({ [HandLandmark.ringTip]: at(3, 7) })], 1.25, 0, true);
    expect(sound.retunes).toEqual([expect.objectContaining({ string: 3, midi: 62, excite: 0 })]);
  });
});
