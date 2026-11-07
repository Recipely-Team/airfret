import { describe, expect, it } from 'vitest';
import { motionInZone } from '@domain/gesture/motion/motion-in-zone';
import { MotionStrumDetector } from '@domain/gesture/motion/motion-strum-detector';
import { StrumDirection } from '@domain/gesture/strum-direction';

const FPS = 30;
/** Strumming seen as motion: a burst every `period` frames, its change moving down then up the area. */
const strumming = (strokes: number, period: number, rest = 0.4, burst = 6, isClear = true) => {
  const out: { energy: number; cy: number }[] = [];
  for (let k = 0; k < strokes; k++) {
    const isDown = k % 2 === 0;
    for (let f = 0; f < period; f++) {
      const phase = f / (period - 1);
      const energy = rest + burst * Math.max(0, Math.sin(Math.PI * phase));
      const cy = isClear ? (isDown ? 0.2 + 0.6 * phase : 0.8 - 0.6 * phase) : 0.5;
      out.push({ energy, cy });
    }
  }
  return out;
};
const run = (samples: { energy: number; cy: number }[]) => {
  const d = new MotionStrumDetector();
  return samples.map((s, i) => d.update(s, i / FPS)).filter((x) => x !== null);
};

describe('MotionStrumDetector — strokes a blurred strumming hand still makes as motion', () => {
  it('hears every stroke of fast strumming, down and up in turn, even while the motion never settles', () => {
    const strokes = run(strumming(12, 6, 1));
    expect(strokes.length).toBe(12);
    expect(strokes.slice(0, 4)).toEqual([StrumDirection.down, StrumDirection.up, StrumDirection.down, StrumDirection.up]);
  });

  it('alternates when the motion gives no direction, as a strumming hand does', () => {
    const strokes = run(strumming(6, 8, 0.4, 6, false));
    expect(strokes.length).toBe(6);
    for (let i = 1; i < strokes.length; i++) expect(strokes[i]).not.toBe(strokes[i - 1]);
  });

  it('plays nothing for small motion — a hand resting, light changing — or when no motion is measured', () => {
    expect(run(strumming(10, 6, 0.4, 1.2))).toEqual([]);
    const d = new MotionStrumDetector();
    expect(d.update(null, 0)).toBeNull();
  });
});

describe('motionInZone', () => {
  const grid = { width: 10, height: 10, cells: new Uint8Array(100) };
  for (let x = 2; x < 6; x++) for (let y = 6; y < 8; y++) grid.cells[y * 10 + x] = 40;

  it('measures the mean change in the area and where in it the change was', () => {
    const m = motionInZone(grid, { x0: 0.2, y0: 0.4, x1: 0.6, y1: 0.8 })!;
    expect(m.energy).toBeCloseTo((8 * 40) / 16);
    expect(m.cy).toBeGreaterThan(0.5);
    expect(motionInZone(grid, { x0: 0.6, y0: 0.8, x1: 0.2, y1: 0.4 })).toEqual(m);
  });

  it('is empty outside the picture, and centred when nothing moved', () => {
    expect(motionInZone(grid, { x0: 1.2, y0: 0, x1: 1.5, y1: 1 })).toBeNull();
    expect(motionInZone(grid, { x0: 0, y0: 0, x1: 0.1, y1: 0.1 })).toEqual({ energy: 0, cy: 0.5 });
  });
});
