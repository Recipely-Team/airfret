import { describe, expect, it } from 'vitest';
import { StrumDetector } from '@domain/gesture/strum-detector';
import { StrumDirection } from '@domain/gesture/strum-direction';

const H = 800;
const YS = [300, 340, 380, 420, 460, 500];

describe('StrumDetector', () => {
  it('plays every string once, low to high, on a fast downstroke', () => {
    const d = new StrumDetector();
    d.update({ x: 0, y: 250 }, 0, YS, H);
    const out = d.update({ x: 0, y: 560 }, 0.033, YS, H);
    expect(out.map((c) => c.string)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(out.every((c) => c.dir === StrumDirection.down)).toBe(true);
    for (let i = 1; i < out.length; i++) expect(out[i]!.frac).toBeGreaterThan(out[i - 1]!.frac);
  });

  it('plays high to low on an upstroke', () => {
    const d = new StrumDetector();
    d.update({ x: 0, y: 560 }, 0, YS, H);
    expect(d.update({ x: 0, y: 250 }, 0.033, YS, H).map((c) => c.string)).toEqual([5, 4, 3, 2, 1, 0]);
  });

  it('stays silent while a finger jitters on a string', () => {
    const d = new StrumDetector();
    let fired = 0;
    for (let i = 0; i < 60; i++) fired += d.update({ x: 0, y: 380 + (i % 2 ? 4 : -4) }, i / 30, YS, H).length;
    expect(fired).toBe(0);
  });

  it('does not strum when the hand reappears on the other side after being lost', () => {
    const d = new StrumDetector();
    d.update({ x: 0, y: 250 }, 0, YS, H);
    d.update(null, 0.1, YS, H);
    d.update(null, 0.3, YS, H);
    expect(d.update({ x: 0, y: 560 }, 0.33, YS, H)).toEqual([]);
  });

  it('ignores a crawl slower than the minimum speed', () => {
    const d = new StrumDetector();
    d.update({ x: 0, y: 360 }, 0, YS, H);
    expect(d.update({ x: 0, y: 400 }, 10, YS, H)).toEqual([]);
  });
});

describe('StrumDetector with fast strumming', () => {
  const H = 800;
  const ys = [300, 330, 360, 390, 420, 450];
  const strum = (hz: number, fps: number) => {
    const d = new StrumDetector();
    let n = 0;
    for (let i = 0; i < 2 * fps; i++) n += d.update({ x: 600, y: 375 + 140 * Math.sin(2 * Math.PI * hz * (i / fps)) }, i / fps, ys, H).length;
    return n / (hz * 2 * 2 * ys.length);
  };

  it('sounds nearly every string of a fast strum, eight strokes a second each way (a 60 ms cooldown dropped a third)', () => {
    for (const fps of [30, 60]) expect(strum(8, fps), `${fps} fps`).toBeGreaterThan(0.95);
  });

  it('still ignores a hand resting on a string', () => {
    const d = new StrumDetector();
    let n = 0;
    for (let i = 0; i < 120; i++) n += d.update({ x: 600, y: 360 + 6 * Math.sin(i * 1.7) }, i / 60, ys, H).length;
    expect(n).toBe(0);
  });
});
