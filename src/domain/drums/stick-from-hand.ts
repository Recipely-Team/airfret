import type { Stick } from '@domain/drums/stick';
import type { Point } from '@domain/fretboard/point';
import { HandLandmark } from '@domain/tracking/hand-landmark';

/** A 16" stick is about 2.3× the wrist-to-knuckle span of an adult hand. */
const STICK_OF_HAND = 2.3;
/** Grip point: between the thumb and the index knuckle, where a stick sits in a matched grip. */
const GRIP_BLEND = 0.5;

/**
 * Where the stick is, from the hand holding it.
 *
 * @remarks
 * - Direction d = normalize(knuckles − wrist), knuckles = midpoint of the index and middle MCPs —
 *   the stick leaves a closed fist along the forearm-to-knuckle line.
 * - Grip = midpoint of the thumb IP joint and the index knuckle; tip = grip + d · L, L = 2.3 · |knuckles − wrist|.
 */
export function stickFromHand(hand: readonly Point[]): Stick | null {
  const wrist = hand[HandLandmark.wrist];
  const index = hand[HandLandmark.indexMcp];
  const middle = hand[HandLandmark.middleMcp];
  const thumb = hand[HandLandmark.thumbIp];
  if (!wrist || !index || !middle || !thumb) return null;
  const k = { x: (index.x + middle.x) / 2, y: (index.y + middle.y) / 2 };
  const dx = k.x - wrist.x;
  const dy = k.y - wrist.y;
  const span = Math.hypot(dx, dy);
  if (span < 1e-6) return null;
  const grip = { x: thumb.x + (index.x - thumb.x) * GRIP_BLEND, y: thumb.y + (index.y - thumb.y) * GRIP_BLEND };
  const len = span * STICK_OF_HAND;
  return { grip, tip: { x: grip.x + (dx / span) * len, y: grip.y + (dy / span) * len } };
}
