import type { FretboardLayout } from '@domain/fretboard/fretboard-layout';
import type { Point } from '@domain/fretboard/point';
import { HandLandmark } from '@domain/tracking/hand-landmark';

/** How close to the bridge (fraction of screen width) the palm edge must rest. */
const BRIDGE_ZONE_OF_WIDTH = 0.07;
const STRING_MARGIN_OF_HEIGHT = 0.05;

/**
 * True when the strumming hand's palm edge — between the wrist and the pinky knuckle, the part a
 * guitarist rests on the strings — lies on the strings next to the bridge.
 */
export function isPalmMuting(l: FretboardLayout, hand: readonly Point[] | null): boolean {
  const wrist = hand?.[HandLandmark.wrist];
  const pinky = hand?.[HandLandmark.pinkyMcp];
  if (!wrist || !pinky) return false;
  const edge = { x: (wrist.x + pinky.x) / 2, y: (wrist.y + pinky.y) / 2 };
  return Math.abs(edge.x - l.strumX1) < l.w * BRIDGE_ZONE_OF_WIDTH && Math.abs(edge.y - l.centerY) < l.spreadBody + l.h * STRING_MARGIN_OF_HEIGHT;
}
