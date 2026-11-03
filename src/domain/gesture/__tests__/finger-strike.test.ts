import { describe, expect, it } from 'vitest';
import type { Point } from '@domain/fretboard/point';
import { fingerStrike } from '@domain/gesture/finger-strike';
import { StrikeSurface } from '@domain/gesture/strike-surface';
import { StrumDirection } from '@domain/gesture/strum-direction';
import { HandLandmark } from '@domain/tracking/hand-landmark';

/**
 * A hand with the wrist at the origin, index knuckle 60 px to the right and pinky knuckle behind it
 * (z −40), so the back-of-hand normal (indexMCP − wrist) × (pinkyMCP − wrist) points down (+y).
 * The index finger runs from its knuckle through `pip` to `tip`.
 */
function hand(pip: Point, tip: Point): Point[] {
  const pts: Point[] = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
  pts[HandLandmark.indexMcp] = { x: 60, y: 0, z: 0 };
  pts[HandLandmark.pinkyMcp] = { x: 60, y: 0, z: -40 };
  pts[HandLandmark.indexPip] = pip;
  pts[HandLandmark.indexTip] = tip;
  return pts;
}

const straight = hand({ x: 90, y: 0, z: 0 }, { x: 130, y: 0, z: 0 });

describe('fingerStrike', () => {
  it('strikes with the nail when the nail faces the direction of the stroke', () => {
    expect(fingerStrike(straight, StrumDirection.down, true)).toBe(StrikeSurface.nail);
  });

  it('strikes with the fleshy pad on the stroke back', () => {
    expect(fingerStrike(straight, StrumDirection.up, true)).toBe(StrikeSurface.pad);
  });

  it('mirrors for the left hand, whose computed normal points out of the palm', () => {
    expect(fingerStrike(straight, StrumDirection.down, false)).toBe(StrikeSurface.pad);
  });

  it('does not play with a curled finger', () => {
    expect(fingerStrike(hand({ x: 90, y: 0, z: 0 }, { x: 95, y: 10, z: 0 }), StrumDirection.down, true)).toBe(StrikeSurface.none);
  });

  it('does not play when the finger points up, away from the strings', () => {
    expect(fingerStrike(hand({ x: 60, y: -30, z: 0 }, { x: 60, y: -70, z: 0 }), StrumDirection.down, true)).toBe(StrikeSurface.none);
  });

  it('does not play when the finger points at the camera (hovering)', () => {
    expect(fingerStrike(hand({ x: 60, y: 0, z: -30 }, { x: 60, y: 0, z: -70 }), StrumDirection.down, true)).toBe(StrikeSurface.none);
  });
});
