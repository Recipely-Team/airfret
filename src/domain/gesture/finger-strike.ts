import type { Point } from '@domain/fretboard/point';
import { StrikeSurface } from '@domain/gesture/strike-surface';
import type { StrumDirection } from '@domain/gesture/strum-direction';
import { cross3, dot3, length3, normalize3, scale3, sub3, type Vector3 } from '@domain/gesture/vector3';
import { HandLandmark } from '@domain/tracking/hand-landmark';

/** The tip must reach this much farther from the knuckle than the middle joint does to count as extended. */
const EXTENDED_RATIO = 1.45;
/** cos of the angle above which a finger pointing up (away from the strings) is "reversed". */
const UP_LIMIT = -0.55;
/** cos of the angle above which a finger pointing at the camera is hovering, not touching. */
const CAMERA_LIMIT = -0.7;

/**
 * Which part of the index finger meets the strings on a stroke in `dir`, or `none` when the
 * finger can't play in its current pose.
 *
 * @remarks
 * - `none`: the finger is curled, points upward away from the strings, or points at the camera.
 * - Back-of-hand normal n = (indexMCP − wrist) × (pinkyMCP − wrist). In the mirrored image this
 *   points out of the back of a right hand and out of the palm of a left hand.
 * - The nail faces n projected perpendicular to the finger axis. If the nail faces the direction
 *   of motion the nail strikes (bright); otherwise the fleshy pad does (warm).
 */
export function fingerStrike(hand: readonly Point[], dir: StrumDirection, isRightHand: boolean): StrikeSurface {
  const wrist = hand[HandLandmark.wrist];
  const mcp = hand[HandLandmark.indexMcp];
  const pip = hand[HandLandmark.indexPip];
  const tip = hand[HandLandmark.indexTip];
  const pinky = hand[HandLandmark.pinkyMcp];
  if (!wrist || !mcp || !pip || !tip || !pinky) return StrikeSurface.none;

  const toTip = sub3(tip, mcp);
  if (length3(toTip) < length3(sub3(pip, mcp)) * EXTENDED_RATIO) return StrikeSurface.none;
  const axis = normalize3(toTip);
  if (axis.y < UP_LIMIT || axis.z < CAMERA_LIMIT) return StrikeSurface.none;

  const normal = cross3(sub3(mcp, wrist), sub3(pinky, wrist));
  const back = normalize3(isRightHand ? normal : scale3(normal, -1));
  const nail = normalize3(sub3Vec(back, scale3(axis, dot3(back, axis))));
  const motion: Vector3 = { x: 0, y: dir, z: 0 };
  return dot3(nail, motion) >= 0 ? StrikeSurface.nail : StrikeSurface.pad;
}

function sub3Vec(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
