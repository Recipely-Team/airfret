import { describe, expect, it } from 'vitest';
import { FakeSoundOutput } from '@application/__fixtures__/fake-sound-output';
import { HandDrumPlayer } from '@application/drums/hand-drum-player';
import type { Point } from '@domain/fretboard/point';
import { HAND_DRUMS, handDrumFor } from '@domain/drums/hand/hand-drum-catalog';
import { headPads, strokeAt } from '@domain/drums/hand/hand-drum-pads';
import { midiToFreq } from '@domain/music/pitch';
import { HandLandmark } from '@domain/tracking/hand-landmark';

const W = 1440;
const H = 900;

function setup(id: string) {
  const sound = new FakeSoundOutput();
  const d = new HandDrumPlayer(sound);
  d.configure(id, W, H);
  return { sound, d };
}

/** A hand with its wrist at `wristX`, all fingertips high above except the index at `tip`. */
function hand(wristX: number, tip: Point): Point[] {
  const pts: Point[] = Array.from({ length: 21 }, () => ({ x: wristX, y: 20 }));
  pts[HandLandmark.wrist] = { x: wristX, y: 10 };
  pts[HandLandmark.indexTip] = tip;
  return pts;
}

describe('Hand drums', () => {
  it('darbuka: düm in the middle, tek on the edge with the right hand, ka with the left', () => {
    const head = handDrumFor('darbuka')!.heads[0]!;
    expect(strokeAt(head, 0.1, true).label).toBe('stroke.doum');
    expect(strokeAt(head, 0.9, true).label).toBe('stroke.tek');
    expect(strokeAt(head, 0.9, false).label).toBe('stroke.ka');
  });

  it('strikes when a fingertip comes down through a head — the right hand on the darbuka’s edge plays tek', () => {
    const { sound, d } = setup('darbuka');
    const pad = d.pads[0]!;
    const edgeX = pad.cx + pad.rx * 0.85;
    for (let i = 0; i <= 6; i++) d.updateHands([hand(pad.cx - 300, { x: pad.cx, y: 20 }), hand(pad.cx + 300, { x: edgeX, y: pad.cy - 120 + 180 * (i / 6) })], i / 30, i / 30);
    expect(sound.handStrokes.map((s) => s.stroke.label)).toEqual(['stroke.tek']);
  });

  it('does not strike again while a fingertip rests on the head', () => {
    const { sound, d } = setup('djembe');
    const pad = d.pads[0]!;
    for (let i = 0; i <= 20; i++) d.updateHands([hand(pad.cx + 300, { x: pad.cx, y: Math.min(pad.cy + 20, pad.cy - 120 + 30 * i) })], i / 30, i / 30);
    expect(sound.handStrokes).toHaveLength(1);
  });

  it('every head of every drum plays when tapped in its middle, with a ripple', () => {
    for (const drum of HAND_DRUMS) {
      const { sound, d } = setup(drum.id);
      d.pads.forEach((p) => d.tap({ x: p.cx, y: p.cy }, 0, 0));
      expect(sound.handStrokes.length, drum.id).toBe(drum.heads.length);
      expect(d.visibleRipples(0.1).length, drum.id).toBe(drum.heads.length);
    }
  });

  it('keeps every head on screen and apart from the others, on a desktop and an upright phone', () => {
    for (const [w, h] of [[W, H], [390, 844]] as const) {
      for (const drum of HAND_DRUMS) {
        const pads = headPads(drum, w, h);
        for (const p of pads) {
          expect(p.cx - p.rx, `${drum.id} ${w}`).toBeGreaterThanOrEqual(0);
          expect(p.cx + p.rx, `${drum.id} ${w}`).toBeLessThanOrEqual(w);
        }
        pads.forEach((a, i) => pads.slice(i + 1).forEach((b) => {
          const overlap = Math.hypot((a.cx - b.cx) / (a.rx + b.rx), (a.cy - b.cy) / (a.ry + b.ry)) < 0.95;
          expect(overlap, `${drum.id}: heads ${a.piece} and ${b.piece} overlap at ${w}px`).toBe(false);
        }));
      }
    }
  });

  it('tunes the handpan to D Kurd: D3 in the middle, A3 B♭3 C4 D4 E4 F4 G4 A4 round it', () => {
    const heads = handDrumFor('handpan')!.heads;
    expect(heads.map((x) => x.center.label)).toEqual([50, 57, 58, 60, 62, 64, 65, 67, 69].map((m) => `note.${m}`));
    expect(heads[0]!.center.modes[0]!.hz).toBeCloseTo(midiToFreq(50), 3);
  });
});
