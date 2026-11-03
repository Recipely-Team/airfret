import type { Point } from '@domain/fretboard/point';
import { HandLandmark } from '@domain/tracking/hand-landmark';

/** A fingertip this much farther from the wrist than its middle joint counts as extended. */
const EXTENDED_RATIO = 1.12;
const FINGERS: readonly [number, number][] = [
  [HandLandmark.indexTip, HandLandmark.indexPip],
  [HandLandmark.middleTip, HandLandmark.middlePip],
  [HandLandmark.ringTip, HandLandmark.ringPip],
  [HandLandmark.pinkyTip, HandLandmark.pinkyPip],
];

/** Euclidean distance. */
export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** How many of the four fingers are extended (the thumb is ignored — it's unreliable). */
export function extendedFingers(hand: readonly Point[]): number {
  const wrist = hand[HandLandmark.wrist];
  if (!wrist) return 0;
  return FINGERS.filter(([tip, pip]) => {
    const t = hand[tip];
    const j = hand[pip];
    return t && j && distance(t, wrist) > distance(j, wrist) * EXTENDED_RATIO;
  }).length;
}
