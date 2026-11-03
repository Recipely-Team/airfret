import { describe, expect, it } from 'vitest';
import { FakeSoundOutput } from '@application/__fixtures__/fake-sound-output';
import { DrumPlayer } from '@application/drums/drum-player';
import { computeKitLayout } from '@domain/drums/compute-kit-layout';
import { DrumPiece } from '@domain/drums/drum-piece';
import type { Point } from '@domain/fretboard/point';
import { HiHatPedalMode } from '@domain/input/hihat-pedal-mode';
import { PedalAction } from '@domain/input/pedal-action';
import { HandLandmark } from '@domain/tracking/hand-landmark';

const H = 900;
const pads = computeKitLayout(1440, H, false);
const pad = (p: DrumPiece) => pads.find((x) => x.piece === p)!;

/** A fist whose stick tip lands on `tip`: knuckles point straight down at it. */
function fist(tip: Point): Point[] {
  const span = 60;
  const len = span * 2.3;
  const grip = { x: tip.x, y: tip.y - len };
  const pts: Point[] = Array.from({ length: 21 }, () => grip);
  pts[HandLandmark.wrist] = { x: grip.x, y: grip.y - span };
  pts[HandLandmark.indexMcp] = grip;
  pts[HandLandmark.middleMcp] = grip;
  pts[HandLandmark.thumbIp] = grip;
  return pts;
}

function setup(mode: HiHatPedalMode = HiHatPedalMode.holdToOpen) {
  const sound = new FakeSoundOutput();
  const drums = new DrumPlayer(sound);
  drums.configure(pads, 1440, H, mode);
  return { sound, drums };
}

describe('DrumPlayer', () => {
  it('plays the pad a stick comes down on', () => {
    const { sound, drums } = setup();
    const s = pad(DrumPiece.snare);
    drums.updateHands([fist({ x: s.cx, y: s.cy - 50 })], 0, 0, 0);
    drums.updateHands([fist({ x: s.cx, y: s.cy + 10 })], 0.03, 0, 0);
    expect(sound.drumHits.map((h) => h.piece)).toEqual([DrumPiece.snare]);
  });

  it('plays a rimshot at the snare edge and the bell at the ride centre', () => {
    const { sound, drums } = setup();
    const s = pad(DrumPiece.snare);
    const r = pad(DrumPiece.ride);
    drums.updateHands([fist({ x: s.cx + s.rx * 0.95, y: s.cy - 50 }), fist({ x: r.cx, y: r.cy - 50 })], 0, 0, 0);
    drums.updateHands([fist({ x: s.cx + s.rx * 0.95, y: s.cy + 10 }), fist({ x: r.cx, y: r.cy + 10 })], 0.03, 0, 0);
    expect(sound.drumHits.map((h) => h.articulation).sort()).toEqual(['bell', 'rim']);
  });

  it('kicks on the kick pedal', () => {
    const { sound, drums } = setup();
    drums.pedal(PedalAction.kick, true, 0.9, 0, 0);
    expect(sound.drumHits).toEqual([expect.objectContaining({ piece: DrumPiece.kick, velocity: 0.9 })]);
  });

  it('real-kit hi-hat: open with the foot up, closed and choked when the foot goes down', () => {
    const { sound, drums } = setup(HiHatPedalMode.holdToClose);
    expect(drums.isHatOpen).toBe(true);
    drums.pedal(PedalAction.hihatPedal, true, 1, 0, 0);
    expect(drums.isHatOpen).toBe(false);
    expect(sound.chokes).toBe(1);
    expect(sound.drumHits.at(-1)?.articulation).toBe('hatPedal');
  });

  it('easy hi-hat: closed until the pedal is held', () => {
    const { drums } = setup(HiHatPedalMode.holdToOpen);
    expect(drums.isHatOpen).toBe(false);
    drums.pedal(PedalAction.hihatPedal, true, 1, 0, 0);
    expect(drums.isHatOpen).toBe(true);
  });

  it('hits the pad under a mouse click', () => {
    const { sound, drums } = setup();
    const t = pad(DrumPiece.tom2);
    drums.click({ x: t.cx, y: t.cy }, 0, 0);
    expect(sound.drumHits.map((h) => h.piece)).toEqual([DrumPiece.tom2]);
  });
});
