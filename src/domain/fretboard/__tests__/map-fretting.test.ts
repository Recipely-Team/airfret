import { describe, expect, it } from 'vitest';
import { computeLayout } from '@domain/fretboard/compute-layout';
import { mapFretting } from '@domain/fretboard/map-fretting';
import { stringY, spreadAt } from '@domain/fretboard/neck-geometry';
import type { Point } from '@domain/fretboard/point';
import { HandLandmark } from '@domain/tracking/hand-landmark';

const l = computeLayout(1440, 900, 6, false, 12);
const fretMid = (n: number) => ((l.fretX[n - 1] ?? 0) + (l.fretX[n] ?? 0)) / 2;
const at = (string: number, fret: number, dy = 0): Point => ({ x: fretMid(fret), y: stringY(l, string, fretMid(fret)) + dy });
const away: Point = { x: 2000, y: 2000 };

function hand(tips: Partial<Record<number, Point>>, indexPip: Point = away, indexDip: Point = away): Point[] {
  const pts: Point[] = Array.from({ length: 21 }, () => away);
  pts[HandLandmark.indexPip] = indexPip;
  pts[HandLandmark.indexDip] = indexDip;
  for (const [idx, p] of Object.entries(tips)) if (p) pts[Number(idx)] = p;
  return pts;
}

describe('mapFretting', () => {
  it('reads a G chord from three fingertips on their strings and frets', () => {
    const f = mapFretting(l, hand({ [HandLandmark.indexTip]: at(1, 2), [HandLandmark.middleTip]: at(0, 3), [HandLandmark.ringTip]: at(5, 3) }), null);
    expect(f.frets).toEqual([3, 2, 0, 0, 0, 3]);
  });

  it('lets the fret nearer the bridge win when two fingers share a string', () => {
    const f = mapFretting(l, hand({ [HandLandmark.indexTip]: at(4, 1), [HandLandmark.ringTip]: at(4, 3) }), null);
    expect(f.frets[4]).toBe(3);
  });

  it('reads a flat index finger laid along the fret across all strings as a barre', () => {
    const tip = at(0, 1);
    const pip = { x: tip.x, y: stringY(l, 5, tip.x) + 4 };
    const dip = { x: tip.x, y: (tip.y + pip.y) / 2 };
    const f = mapFretting(l, hand({ [HandLandmark.indexTip]: tip }, pip, dip), null);
    expect(f.barre).toBe(1);
    expect(f.frets.every((x) => x >= 1)).toBe(true);
  });

  it('does not mistake an arched finger reaching one string for a barre', () => {
    // Fingers come from below the neck: the middle joint sits outside the strings.
    const tip = at(3, 2);
    const pip = { x: tip.x + 10, y: stringY(l, 5, tip.x) + 70 };
    const dip = { x: tip.x + 4, y: stringY(l, 5, tip.x) + 20 };
    const f = mapFretting(l, hand({ [HandLandmark.indexTip]: tip }, pip, dip), null);
    expect(f.barre).toBe(0);
    expect(f.frets).toEqual([0, 0, 0, 2, 0, 0]);
  });

  it('bends quadratically: no bend inside the dead zone, more than a semitone near a full push', () => {
    const spacing = (2 * spreadAt(l, fretMid(7))) / 5;
    const small = mapFretting(l, hand({ [HandLandmark.ringTip]: at(3, 7, spacing * 0.2) }), null);
    const big = mapFretting(l, hand({ [HandLandmark.ringTip]: at(3, 7, spacing * 0.48) }), { frets: [], bends: [], presses: [{ string: 3, fret: 7, finger: 3 }], barre: 0 });
    expect(small.bends[3]).toBe(0);
    expect(big.bends[3]).toBeGreaterThan(0);
  });

  it('keeps a fingertip on its string until another string is clearly closer (hysteresis)', () => {
    const spacing = (2 * spreadAt(l, fretMid(5))) / 5;
    const between = at(2, 5, spacing * 0.55);
    const prev = { frets: [], bends: [], presses: [{ string: 2, fret: 5, finger: 1 }], barre: 0 };
    expect(mapFretting(l, hand({ [HandLandmark.indexTip]: between }), prev).presses[0]?.string).toBe(2);
  });
});
