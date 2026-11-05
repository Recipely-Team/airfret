import { describe, expect, it } from 'vitest';
import { computeLayout } from '@domain/fretboard/compute-layout';
import { mapFretting } from '@domain/fretboard/fretting/map-fretting';
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

/** String spacing at a fret, px. */
const spacingAt = (fret: number) => (2 * spreadAt(l, fretMid(fret))) / (l.strings - 1);

/**
 * A finger laid flat across `fret`, tip on string `tipString`, running towards the higher strings for `length`
 * string spacings (tip → knuckle), tilted `slant` px sideways per px across. Joints at MediaPipe's proportions.
 */
function flatFinger(finger: 'index' | 'middle' | 'ring', tipString: number, fret: number, length: number, slant = 0): Point[] {
  const tip = at(tipString, fret);
  const along = (k: number): Point => ({ x: tip.x + slant * length * spacingAt(fret) * k, y: tip.y + length * spacingAt(fret) * k });
  const pts: Point[] = Array.from({ length: 21 }, () => away);
  const j = {
    index: [HandLandmark.indexMcp, HandLandmark.indexPip, HandLandmark.indexDip, HandLandmark.indexTip],
    middle: [HandLandmark.middleMcp, HandLandmark.middlePip, HandLandmark.middleDip, HandLandmark.middleTip],
    ring: [HandLandmark.ringMcp, HandLandmark.ringPip, HandLandmark.ringDip, HandLandmark.ringTip],
  }[finger];
  [1, 0.55, 0.25, 0].forEach((k, i) => (pts[j[i] ?? 0] = along(k)));
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

  it('one finger laid flat across the strings frets every string, even when the hand looks smaller than the neck', () => {
    // Tip on the low E, knuckle only 2.5 spacings away: the middle joint is over the A–D gap, the knuckle over the D–G gap.
    const f = mapFretting(l, flatFinger('index', 0, 3, 2.5), null);
    expect(f.frets).toEqual([3, 3, 3, 3, 3, 3]);
    expect(f.barre).toBe(3);
  });

  it('reads a partial barre from where the tip lies: tip on the D holds D, G, B and e', () => {
    const f = mapFretting(l, flatFinger('index', 2, 5, 2.5), null);
    expect(f.frets).toEqual([0, 0, 5, 5, 5, 5]);
  });

  it('holds the small F barre — two strings — with one finger', () => {
    const f = mapFretting(l, flatFinger('index', 4, 1, 2.5), null);
    expect(f.frets).toEqual([0, 0, 0, 0, 1, 1]);
  });

  it('lets any finger barre, not only the index (the ring finger across D, G, B in an A-shape chord)', () => {
    const f = mapFretting(l, flatFinger('ring', 2, 4, 2.5), null);
    expect(f.frets.slice(2, 5)).toEqual([4, 4, 4]);
  });

  it('still reads a barre when the finger is rolled a little off the fret wire', () => {
    expect(mapFretting(l, flatFinger('index', 0, 6, 2.5, 0.35), null).barre).toBe(6);
  });

  it('marks every barred string as pressed by that finger, so a sliding barre slides every string', () => {
    const f = mapFretting(l, flatFinger('index', 0, 3, 2.5), null);
    expect(f.presses.map((p) => [p.string, p.fret, p.finger])).toEqual([0, 1, 2, 3, 4, 5].map((s) => [s, 3, 1]));
  });

  it('does not read a finger running along the strings as a barre', () => {
    const tip = at(2, 5);
    const pts = flatFinger('index', 2, 5, 2.5);
    pts[HandLandmark.indexPip] = { x: tip.x + 50, y: tip.y + 4 };
    pts[HandLandmark.indexDip] = { x: tip.x + 25, y: tip.y + 2 };
    pts[HandLandmark.indexMcp] = { x: tip.x + 90, y: tip.y + 6 };
    expect(mapFretting(l, pts, null).barre).toBe(0);
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
