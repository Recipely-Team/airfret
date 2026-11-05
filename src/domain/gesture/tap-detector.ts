import type { FretboardLayout } from '@domain/fretboard/fretboard-layout';
import { inStrumArea, strumStringYs } from '@domain/fretboard/neck-geometry';
import type { Point } from '@domain/fretboard/point';
import type { Crossing } from '@domain/gesture/crossing';
import { StrumDirection } from '@domain/gesture/strum-direction';

/** A tap: down and up within this long, moving less than this far (as a share of the stage height). */
const TAP = { seconds: 0.35, moveOfHeight: 0.02 } as const;
/** How hard a tap plucks, in fingertip speed (heights/s): a medium pluck, about 0.6 of full strength. */
const TAP_SPEED = 1.5;

/**
 * **TapDetector** — a mouse click or a fingertip tap on one string plucks it, as a finger would on a real
 * guitar; on a touch screen a tap is the natural way to play one string.
 *
 * @remarks
 * - Only a press that crossed no string counts: a swipe already plays through `StrumDetector`.
 * - The string is the one nearest the press, within half the gap to its neighbours, inside the strum area.
 */
export class TapDetector {
  private start: { p: Point; t: number } | null = null;
  private isSpent = false;

  /** Feed every pointer sample (null when it lifts); returns the pluck when the pointer lifts after a tap. */
  update(p: Point | null, t: number, hasCrossed: boolean, l: FretboardLayout): Crossing | null {
    if (p) {
      if (!this.start) this.start = { p, t };
      const moved = Math.hypot(p.x - this.start.p.x, p.y - this.start.p.y);
      if (hasCrossed || moved > l.h * TAP.moveOfHeight) this.isSpent = true;
      return null;
    }
    const s = this.start;
    const isTap = s !== null && !this.isSpent && t - s.t <= TAP.seconds;
    this.start = null;
    this.isSpent = false;
    return isTap ? stringAt(l, s.p) : null;
  }
}

function stringAt(l: FretboardLayout, p: Point): Crossing | null {
  if (!inStrumArea(l, p)) return null;
  const ys = strumStringYs(l);
  const gap = ys.length > 1 ? Math.abs((ys[ys.length - 1] ?? 0) - (ys[0] ?? 0)) / (ys.length - 1) : l.h;
  let best = -1;
  ys.forEach((y, i) => {
    if (Math.abs(p.y - y) <= gap / 2 && (best < 0 || Math.abs(p.y - y) < Math.abs(p.y - (ys[best] ?? 0)))) best = i;
  });
  return best < 0 ? null : { string: best, x: p.x, frac: 0, speed: TAP_SPEED, dir: StrumDirection.down };
}
