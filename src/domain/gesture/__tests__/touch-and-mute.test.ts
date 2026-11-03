import { describe, expect, it } from 'vitest';
import { computeLayout } from '@domain/fretboard/compute-layout';
import { strumStringYs } from '@domain/fretboard/neck-geometry';
import { pluckPosition } from '@domain/fretboard/pluck-position';
import type { Point } from '@domain/fretboard/point';
import { isPalmMuting } from '@domain/gesture/palm-mute';
import { StrumDetector } from '@domain/gesture/strum-detector';
import { HandLandmark } from '@domain/tracking/hand-landmark';

const l = computeLayout(1440, 900, 6, false, 12);
const ys = strumStringYs(l);

describe('string contact', () => {
  it('reports a string as pressed once the fingertip crosses it, until it slips past the release band', () => {
    const d = new StrumDetector();
    const line = ys[2]!;
    d.update({ x: 1000, y: line - 30 }, 0, ys, l.h);
    const band = d.releaseBand(l.h);
    expect(d.touching({ x: 1000, y: line + band * 0.5 }, ys, l.h)).toEqual([2]);
    expect(d.touching({ x: 1000, y: line - band * 0.5 }, ys, l.h)).toEqual([]);
    expect(d.touching(null, ys, l.h)).toEqual([]);
  });
});

describe('pluck position', () => {
  it('is near 0 at the bridge, larger towards the neck, and measured from the fretted fret', () => {
    const nearBridge = pluckPosition(l, l.strumX1 - 5, 0);
    const overHole = pluckPosition(l, l.strumX0, 0);
    expect(nearBridge).toBeLessThan(0.05);
    expect(overHole).toBeGreaterThan(nearBridge);
    // Fretting shortens the vibrating string, so the same spot is relatively further from the bridge.
    expect(pluckPosition(l, l.strumX0, 7)).toBeGreaterThan(overHole);
  });
});

describe('palm mute', () => {
  const hand = (edge: Point): Point[] => {
    const pts: Point[] = Array.from({ length: 21 }, () => edge);
    pts[HandLandmark.wrist] = edge;
    pts[HandLandmark.pinkyMcp] = edge;
    return pts;
  };

  it('is on when the palm edge rests on the strings by the bridge', () => {
    expect(isPalmMuting(l, hand({ x: l.strumX1, y: l.centerY }))).toBe(true);
  });

  it('is off over the soundhole, away from the strings, or without a hand', () => {
    expect(isPalmMuting(l, hand({ x: l.strumX0, y: l.centerY }))).toBe(false);
    expect(isPalmMuting(l, hand({ x: l.strumX1, y: l.centerY + l.h * 0.4 }))).toBe(false);
    expect(isPalmMuting(l, null)).toBe(false);
  });
});
