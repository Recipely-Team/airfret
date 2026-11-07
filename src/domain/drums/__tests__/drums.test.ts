import { describe, expect, it } from 'vitest';
import { computeKitLayout } from '@domain/drums/compute-kit-layout';
import { DrumPiece } from '@domain/drums/drum-piece';
import { HitDetector } from '@domain/drums/hit-detector';
import { stickFromHand } from '@domain/drums/stick-from-hand';
import type { Point } from '@domain/fretboard/point';
import { HandLandmark } from '@domain/tracking/hand-landmark';

const W = 1440;
const H = 900;
const pads = computeKitLayout(W, H, false);
const pad = (p: DrumPiece) => pads.find((x) => x.piece === p)!;

describe('stickFromHand', () => {
  it('extends the stick from the grip along the wrist→knuckle line, 2.3 hand spans long', () => {
    const hand: Point[] = Array.from({ length: 21 }, () => ({ x: 0, y: 0 }));
    hand[HandLandmark.wrist] = { x: 0, y: 0 };
    hand[HandLandmark.indexMcp] = { x: 100, y: -10 };
    hand[HandLandmark.middleMcp] = { x: 100, y: 10 };
    hand[HandLandmark.thumbIp] = { x: 80, y: -40 };
    const s = stickFromHand(hand)!;
    expect(s.grip).toEqual({ x: 90, y: -25 });
    expect(s.tip.x).toBeCloseTo(90 + 230);
    expect(s.tip.y).toBeCloseTo(-25);
  });
});

describe('HitDetector', () => {
  const snare = pad(DrumPiece.snare);

  it('hits the snare when the tip comes down through its head, louder when faster', () => {
    const slow = new HitDetector();
    slow.update({ x: snare.cx, y: snare.cy - 60 }, 0, pads, H);
    const soft = slow.update({ x: snare.cx, y: snare.cy + 10 }, 0.15, pads, H);
    const fast = new HitDetector();
    fast.update({ x: snare.cx, y: snare.cy - 60 }, 0, pads, H);
    const hard = fast.update({ x: snare.cx, y: snare.cy + 10 }, 0.02, pads, H);
    expect(soft.map((h) => h.piece)).toEqual([DrumPiece.snare]);
    expect(hard[0]!.velocity).toBeGreaterThan(soft[0]!.velocity);
  });

  it('does not hit on the way up, or twice without a rebound', () => {
    const d = new HitDetector();
    d.update({ x: snare.cx, y: snare.cy - 60 }, 0, pads, H);
    expect(d.update({ x: snare.cx, y: snare.cy + 10 }, 0.03, pads, H)).toHaveLength(1);
    // Wobbling just below the head: no second hit.
    d.update({ x: snare.cx, y: snare.cy - 2 }, 0.06, pads, H);
    expect(d.update({ x: snare.cx, y: snare.cy + 10 }, 0.09, pads, H)).toHaveLength(0);
    // Back up above the rebound line, then down again: hits.
    d.update({ x: snare.cx, y: snare.cy - 60 }, 0.2, pads, H);
    expect(d.update({ x: snare.cx, y: snare.cy + 10 }, 0.23, pads, H)).toHaveLength(1);
  });

  it('reports where on the head it landed: centre 0, rim 1', () => {
    const d = new HitDetector();
    d.update({ x: snare.cx + snare.rx * 0.9, y: snare.cy - 60 }, 0, pads, H);
    expect(d.update({ x: snare.cx + snare.rx * 0.9, y: snare.cy + 10 }, 0.03, pads, H)[0]!.radius).toBeCloseTo(0.9, 1);
  });

  it('misses outside the pad', () => {
    const d = new HitDetector();
    d.update({ x: 5, y: snare.cy - 60 }, 0, pads, H);
    expect(d.update({ x: 5, y: snare.cy + 10 }, 0.03, pads, H)).toEqual([]);
  });
});

describe('kit layout', () => {
  it('puts the hi-hat on the left and the ride on the right, mirrored for lefties', () => {
    expect(pad(DrumPiece.hihat).cx).toBeLessThan(pad(DrumPiece.ride).cx);
    const lefty = computeKitLayout(W, H, true);
    expect(lefty.find((p) => p.piece === DrumPiece.hihat)!.cx).toBeGreaterThan(lefty.find((p) => p.piece === DrumPiece.ride)!.cx);
  });
});

describe('HitDetector with fast strokes', () => {
  /** A frame drum filling most of the screen, the way the hand drums are drawn. */
  const head = [{ piece: 'head', cx: 640, cy: 420, rx: 300, ry: 280 }] as const;
  /** Fast small strokes: the hand bounces `amp` (share of the screen height) below `base`, `hz` times a second, seen at `fps`. */
  const bounce = (hz: number, amp: number, base: number, fps: number, seconds: number, drop = 0) => {
    const d = new HitDetector();
    let hits = 0;
    for (let i = 0; i * (1 / fps) < seconds; i++) {
      const t = i / fps;
      // Down fast, a sharp stop on the head, back up: |sin| gives the bounce of a hand on a skin.
      const y = base + amp * H * Math.abs(Math.sin(Math.PI * hz * t));
      const isLost = drop > 0 && i % drop === drop - 1;
      hits += d.update(isLost ? null : { x: 600, y }, t, head, H).length;
    }
    return hits;
  };

  it('hears every stroke of a fast roll that never crosses the head\'s middle or rises above it', () => {
    // Six strokes a second for two seconds, a tenth of the screen deep, all below the centre line.
    expect(bounce(6, 0.1, 450, 30, 2)).toBeGreaterThanOrEqual(11);
    // …and above it.
    expect(bounce(6, 0.1, 250, 30, 2)).toBeGreaterThanOrEqual(11);
  });

  it('keeps up at eight strokes a second, and when tracking drops a frame in four', () => {
    expect(bounce(8, 0.08, 300, 30, 2)).toBeGreaterThanOrEqual(15);
    expect(bounce(6, 0.1, 300, 30, 2, 4)).toBeGreaterThanOrEqual(10);
  });

  it('plays nothing for a hand resting on the head or drifting slowly over it', () => {
    expect(bounce(0.5, 0.05, 300, 30, 3)).toBe(0);
    expect(bounce(6, 0.008, 300, 30, 2)).toBe(0);
  });
});
