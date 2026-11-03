import { describe, expect, it } from 'vitest';
import { StickTracker } from '@application/drums/stick-tracker';
import type { Point } from '@domain/fretboard/point';
import { HandLandmark } from '@domain/tracking/hand-landmark';

const W = 1440;

/** A fist with its wrist at (x, y), stick pointing right. */
function fist(x: number, y: number): Point[] {
  const pts: Point[] = Array.from({ length: 21 }, () => ({ x: x + 60, y }));
  pts[HandLandmark.wrist] = { x, y };
  pts[HandLandmark.indexMcp] = { x: x + 60, y: y - 5 };
  pts[HandLandmark.middleMcp] = { x: x + 60, y: y + 5 };
  pts[HandLandmark.thumbIp] = { x: x + 50, y: y - 20 };
  return pts;
}

describe('StickTracker', () => {
  it('keeps a stick visible through a one-frame tracking dropout (it used to vanish)', () => {
    const s = new StickTracker();
    s.update([fist(300, 400), fist(1100, 400)], 0, W);
    s.update([fist(1100, 400)], 0.033, W);
    expect(s.visible(0.033)).toHaveLength(2);
  });

  it('lets a stick go once its hand has been gone for longer than the hold', () => {
    const s = new StickTracker();
    s.update([fist(300, 400), fist(1100, 400)], 0, W);
    s.update([fist(1100, 400)], 0.5, W);
    expect(s.visible(0.5)).toHaveLength(1);
  });

  it('does not swap sticks when the left hand drops out (they used to jump across)', () => {
    const s = new StickTracker();
    s.update([fist(300, 400), fist(1100, 400)], 0, W);
    const fresh = s.update([fist(1105, 402)], 0.033, W);
    expect(fresh[0]).toBeNull();
    expect(fresh[1]).not.toBeNull();
  });

  it('follows each hand by identity even when they cross over', () => {
    const s = new StickTracker();
    s.update([fist(600, 400), fist(800, 400)], 0, W);
    // The hands move towards each other; the detector lists them in the other order.
    const fresh = s.update([fist(780, 400), fist(620, 400)], 0.033, W);
    expect(fresh[0]!.x).toBeLessThan(fresh[1]!.x);
  });

  it('reports only freshly seen tips to the hit detectors, never held ones', () => {
    const s = new StickTracker();
    s.update([fist(300, 400)], 0, W);
    expect(s.update([], 0.033, W)).toEqual([null, null]);
  });
});
