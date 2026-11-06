import { describe, expect, it } from 'vitest';
import { FakeSoundOutput } from '@application/__fixtures__/fake-sound-output';
import { DarbukaPlayer } from '@application/drums/darbuka-player';
import type { Point } from '@domain/fretboard/point';
import { DrumPiece } from '@domain/drums/drum-piece';
import { darbukaPad, darbukaStroke } from '@domain/drums/hand/darbuka-pad';
import { HandLandmark } from '@domain/tracking/hand-landmark';

const W = 1440;
const H = 900;

function setup() {
  const sound = new FakeSoundOutput();
  const d = new DarbukaPlayer(sound);
  d.configure(W, H);
  return { sound, d };
}

/** A hand with its wrist at `wristX`, all fingertips high above the head except the index at `tip`. */
function hand(wristX: number, tip: Point): Point[] {
  const pts: Point[] = Array.from({ length: 21 }, () => ({ x: wristX, y: 50 }));
  pts[HandLandmark.wrist] = { x: wristX, y: 40 };
  pts[HandLandmark.indexTip] = tip;
  return pts;
}

describe('The darbuka', () => {
  it('sounds düm in the middle of the head, tek on the edge with the right hand and ka with the left', () => {
    expect(darbukaStroke(0.1, true)).toBe(DrumPiece.doum);
    expect(darbukaStroke(0.1, false)).toBe(DrumPiece.doum);
    expect(darbukaStroke(0.9, true)).toBe(DrumPiece.tek);
    expect(darbukaStroke(0.9, false)).toBe(DrumPiece.ka);
  });

  it('strikes when a fingertip comes down through the head, the right hand on the edge playing tek', () => {
    const { sound, d } = setup();
    const pad = darbukaPad(W, H);
    const edge = { x: pad.cx + pad.rx * 0.85, y: pad.cy };
    const left = { x: pad.cx - pad.rx * 0.2, y: pad.cy - 200 };
    for (let i = 0; i <= 6; i++) {
      const y = pad.cy - 120 + 180 * (i / 6);
      d.updateHands([hand(pad.cx - 300, left), hand(pad.cx + 300, { x: edge.x, y })], i / 30, i / 30);
    }
    expect(sound.drumHits.map((h) => h.piece)).toEqual([DrumPiece.tek]);
  });

  it('a click or tap strikes where it lands: middle düm, left edge ka, right edge tek, outside nothing', () => {
    const { sound, d } = setup();
    const pad = darbukaPad(W, H);
    d.tap({ x: pad.cx, y: pad.cy }, 0, 0);
    d.tap({ x: pad.cx - pad.rx * 0.85, y: pad.cy }, 0, 0);
    d.tap({ x: pad.cx + pad.rx * 0.85, y: pad.cy }, 0, 0);
    d.tap({ x: 5, y: 5 }, 0, 0);
    expect(sound.drumHits.map((h) => h.piece)).toEqual([DrumPiece.doum, DrumPiece.ka, DrumPiece.tek]);
    expect(d.visibleRipples(0.1)).toHaveLength(3);
    expect(d.visibleRipples(5)).toHaveLength(0);
  });

  it('does not strike again while a fingertip rests on the head', () => {
    const { sound, d } = setup();
    const pad = darbukaPad(W, H);
    for (let i = 0; i <= 20; i++) {
      const y = Math.min(pad.cy + 20, pad.cy - 120 + 30 * i);
      d.updateHands([hand(pad.cx + 300, { x: pad.cx, y })], i / 30, i / 30);
    }
    expect(sound.drumHits).toHaveLength(1);
  });
});
