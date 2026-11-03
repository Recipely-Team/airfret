import { describe, expect, it } from 'vitest';
import { computeLayout } from '@domain/fretboard/compute-layout';
import { strumStringYs } from '@domain/fretboard/neck-geometry';
import { pluckPosition, stringDistance } from '@domain/fretboard/pluck-position';
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

describe('pluck position (on the real string, not the screen)', () => {
  const at = (fret: number) => l.fretX[fret] ?? 0;

  it('is exactly the midpoint over the 12th fret of an open string (it used to read 0.41)', () => {
    expect(pluckPosition(l, at(12), 0)).toBeCloseTo(0.5, 3);
  });

  it('follows the real 2^(−n/12) fret spacing: over fret 7 the open string is struck at 2^(−7/12)', () => {
    expect(stringDistance(l, at(7))).toBeCloseTo(Math.pow(2, -7 / 12), 3);
    expect(stringDistance(l, at(0))).toBeCloseTo(1, 3);
  });

  it('is near 0 at the bridge and grows towards the neck', () => {
    expect(pluckPosition(l, l.strumX1 - 2, 0)).toBeLessThan(0.03);
    expect(pluckPosition(l, l.strumX0, 0)).toBeGreaterThan(pluckPosition(l, (l.strumX0 + l.strumX1) / 2, 0));
  });

  it('measures from the fretted fret: fret 12 held, struck halfway to the bridge → the new midpoint', () => {
    const x = l.strumX1 + (at(12) - l.strumX1) / 2;
    expect(pluckPosition(l, x, 12)).toBeCloseTo(0.5, 2);
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
