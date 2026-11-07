import { describe, expect, it } from 'vitest';
import { FakeSoundOutput } from '@application/__fixtures__/fake-sound-output';
import { HandDrumPlayer } from '@application/drums/hand-drum-player';
import { HandLandmark } from '@domain/tracking/hand-landmark';

const W = 1280;
const H = 800;
const FPS = 30;

/** A flat hand over the drum, its fingertips `dip` px below its knuckles, at height `y`. */
const hand = (x: number, y: number) => {
  const pts = Array.from({ length: 21 }, () => ({ x, y: y - 40 }));
  pts[HandLandmark.wrist] = { x, y: y - 120 };
  for (const [tip, dx] of [[HandLandmark.indexTip, -18], [HandLandmark.middleTip, 0], [HandLandmark.ringTip, 18]] as const) pts[tip] = { x: x + dx, y };
  return pts;
};

describe('Fast strokes on a hand drum', () => {
  it('a slap with three fingers is one stroke, not three', () => {
    const sound = new FakeSoundOutput();
    const p = new HandDrumPlayer(sound);
    p.configure('bendir', W, H);
    const pad = p.pads[0]!;
    for (let i = 0; i < 8; i++) p.updateHands([hand(pad.cx - 60, pad.cy - 140 + i * 20)], i / FPS, i / FPS);
    for (let i = 8; i < 14; i++) p.updateHands([hand(pad.cx - 60, pad.cy + 20)], i / FPS, i / FPS);
    expect(sound.handStrokes.length).toBe(1);
  });

  it('every stroke of a fast roll sounds — seven a second, small and below the middle', () => {
    const sound = new FakeSoundOutput();
    const p = new HandDrumPlayer(sound);
    p.configure('def', W, H);
    const pad = p.pads[0]!;
    for (let i = 0; i < 2 * FPS; i++) {
      const t = i / FPS;
      const y = pad.cy + 30 + 0.09 * H * Math.abs(Math.sin(Math.PI * 7 * t));
      p.updateHands([hand(pad.cx - 80, y)], t, t);
    }
    expect(sound.handStrokes.length).toBeGreaterThanOrEqual(12);
  });
});
