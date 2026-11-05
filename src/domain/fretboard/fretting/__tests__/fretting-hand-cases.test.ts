import { describe, expect, it } from 'vitest';
import { computeLayout } from '@domain/fretboard/compute-layout';
import type { Fretting } from '@domain/fretboard/fretting/fretting';
import { mapFretting } from '@domain/fretboard/fretting/map-fretting';
import { spreadAt, stringY } from '@domain/fretboard/neck-geometry';
import type { Point } from '@domain/fretboard/point';
import { HandLandmark } from '@domain/tracking/hand-landmark';

/**
 * What a guitarist's fretting hand really does, beyond one fingertip per string: fingers resting off the
 * strings, bends, fingers placed just behind the wire, arched fingers, crowded chords.
 */
const l = computeLayout(1440, 900, 6, false, 12);
const away: Point = { x: 2000, y: 2000 };
const fretMid = (n: number) => ((l.fretX[n - 1] ?? 0) + (l.fretX[n] ?? 0)) / 2;
/** x at fraction `k` across fret `n`'s zone (0 = its nut-side wire, 1 = its own wire). */
const fretAtK = (n: number, k: number) => (l.fretX[n - 1] ?? 0) + ((l.fretX[n] ?? 0) - (l.fretX[n - 1] ?? 0)) * k;
const spacing = (x: number) => (2 * spreadAt(l, x)) / (l.strings - 1);
const on = (string: number, x: number, dy = 0): Point => ({ x, y: stringY(l, string, x) + dy * spacing(x) });

function hand(tips: Partial<Record<number, Point>>): Point[] {
  const pts: Point[] = Array.from({ length: 21 }, () => away);
  for (const [idx, p] of Object.entries(tips)) if (p) pts[Number(idx)] = p;
  return pts;
}
const press = (string: number, fret: number, finger: number): Fretting => ({ frets: [], bends: [], presses: [{ string, fret, finger }], barre: 0 });

describe('the fretting hand as a guitarist uses it', () => {
  it('a finger resting below the neck, off the strings, does not press the high e', () => {
    // Open G: ring on the high e at fret 3; the idle pinky curls under the neck at fret 4.
    const f = mapFretting(l, hand({
      [HandLandmark.indexTip]: on(1, fretMid(2)),
      [HandLandmark.middleTip]: on(0, fretMid(3)),
      [HandLandmark.ringTip]: on(5, fretMid(3)),
      [HandLandmark.pinkyTip]: on(5, fretMid(4), 1.2),
    }), null);
    expect(f.frets).toEqual([3, 2, 0, 0, 0, 3]);
  });

  it('a whole-step bend keeps the bent string: pushing it most of the way to the next string does not jump there', () => {
    const x = fretMid(7);
    const f = mapFretting(l, hand({ [HandLandmark.ringTip]: on(3, x, 0.7) }), press(3, 7, 3));
    expect(f.presses[0]?.string).toBe(3);
    expect(f.bends[3]).toBeGreaterThan(1.2);
    expect(f.frets[4]).toBe(0);
  });

  it('a finger moved onto the next string at the same fret plays that string — it is not read as a bend', () => {
    const f = mapFretting(l, hand({ [HandLandmark.ringTip]: on(4, fretMid(7), -0.1) }), press(3, 7, 3));
    expect(f.frets).toEqual([0, 0, 0, 0, 7, 0]);
    expect(f.bends[4]).toBe(0);
  });

  it('a finger placed just behind the fret wire does not flicker to the next fret as tracking jitters across it', () => {
    const near = mapFretting(l, hand({ [HandLandmark.indexTip]: on(2, fretAtK(5, 0.95)) }), null);
    expect(near.frets[2]).toBe(5);
    const jitter = mapFretting(l, hand({ [HandLandmark.indexTip]: on(2, fretAtK(6, 0.08)) }), near);
    expect(jitter.frets[2]).toBe(5);
    const moved = mapFretting(l, hand({ [HandLandmark.indexTip]: on(2, fretMid(6)) }), jitter);
    expect(moved.frets[2]).toBe(6);
  });

  it('a finger right on the wire sounds the fret behind the wire, as on a real neck', () => {
    expect(mapFretting(l, hand({ [HandLandmark.indexTip]: on(2, fretAtK(6, 0.04)) }), null).frets[2]).toBe(5);
  });

  it('an arched finger reaching straight across to one string is not a barre, even with its joints over the strings', () => {
    // Seen from the front it looks straight; but its last two segments dive into the neck and look short.
    const x = fretMid(3);
    const f = mapFretting(l, hand({
      [HandLandmark.ringMcp]: on(5, x, 2.6),
      [HandLandmark.ringPip]: on(3, x, 0.2),
      [HandLandmark.ringDip]: on(2, x, 0.1),
      [HandLandmark.ringTip]: on(1, x),
    }), null);
    expect(f.barre).toBe(0);
    expect(f.frets).toEqual([0, 3, 0, 0, 0, 0]);
  });

  it('two fingers crowded onto one fret (an A chord) each keep their own string when one drifts towards the other', () => {
    const x = fretMid(2);
    const f = mapFretting(l, hand({
      [HandLandmark.indexTip]: on(2, x),
      [HandLandmark.middleTip]: on(2, x, 0.45),
      [HandLandmark.ringTip]: on(4, x),
    }), null);
    expect(f.frets).toEqual([0, 0, 2, 2, 2, 0]);
  });
});
