import type { MotionStrummer } from '@application/play/motion-strummer';
import type { Player } from '@application/play/player';
import { strumStringYs } from '@domain/fretboard/neck-geometry';
import type { Point } from '@domain/fretboard/point';
import type { HandTrackerInterface } from '@domain/tracking/hand-tracker-interface';
import { screenToVideo } from '@presentation/canvas/screen-mapping';

/** The strumming area reaches this far above the top string and below the bottom one (share of the strings' span). */
const MARGIN_OF_SPAN = 0.3;

/**
 * One camera frame on a fretted instrument: the tracked hands play, and where the strumming hand was lost to motion
 * blur, the motion in the strumming area strums for it (`MotionStrummer`).
 */
export function playHands(
  s: { readonly player: Player; readonly tracker: HandTrackerInterface; readonly motion: MotionStrummer },
  hands: readonly (readonly Point[])[],
  now: number,
  audioNow: number,
  canStrum: boolean,
): void {
  s.player.updateHands(hands, now, audioNow, canStrum);
  if (!canStrum) return;
  const l = s.player.layout;
  const ys = strumStringYs(l);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  const margin = (bottom - top) * MARGIN_OF_SPAN;
  const frame = s.tracker.frameSize();
  const a = screenToVideo({ x: l.strumX0, y: top - margin }, frame, window.innerWidth, window.innerHeight);
  const b = screenToVideo({ x: l.strumX1, y: bottom + margin }, frame, window.innerWidth, window.innerHeight);
  s.motion.update(s.player, s.tracker.motion(), { x0: a.x, y0: a.y, x1: b.x, y1: b.y }, now, audioNow);
}
