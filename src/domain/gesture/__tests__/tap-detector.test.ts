import { describe, expect, it } from 'vitest';
import { computeLayout } from '@domain/fretboard/compute-layout';
import { strumStringYs } from '@domain/fretboard/neck-geometry';
import { TapDetector } from '@domain/gesture/tap-detector';

const layout = computeLayout(1440, 900, 6, false, 12);
const ys = strumStringYs(layout);
const x = (layout.strumX0 + layout.strumX1) / 2;

function tap(at: { x: number; y: number }, seconds = 0.08, crossed = false) {
  const d = new TapDetector();
  d.update(at, 0, false, layout);
  d.update(at, seconds / 2, crossed, layout);
  return d.update(null, seconds, false, layout);
}

describe('Tapping a string plucks it, as a finger would on a real guitar', () => {
  it('plucks the string under the tap', () => {
    for (let s = 0; s < ys.length; s++) expect(tap({ x, y: ys[s] ?? 0 })?.string).toBe(s);
  });

  it('plucks the nearest string when the tap lands a little beside it', () => {
    expect(tap({ x, y: (ys[3] ?? 0) + 3 })?.string).toBe(3);
  });

  it('plays nothing for a press that is held (a finger resting on a string mutes it instead)', () => {
    expect(tap({ x, y: ys[2] ?? 0 }, 1)).toBeNull();
  });

  it('plays nothing for a press that crossed strings: the strum already played them', () => {
    expect(tap({ x, y: ys[2] ?? 0 }, 0.08, true)).toBeNull();
  });

  it('plays nothing away from the strings', () => {
    expect(tap({ x: layout.w * 0.02, y: layout.h * 0.05 })).toBeNull();
  });

  it('is ready for the next tap after each release', () => {
    const d = new TapDetector();
    for (const s of [0, 5, 2]) {
      d.update({ x, y: ys[s] ?? 0 }, s, false, layout);
      expect(d.update(null, s + 0.05, false, layout)?.string).toBe(s);
    }
  });
});
