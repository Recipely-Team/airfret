import { StrumDirection } from '@domain/gesture/strum-direction';
import type { MotionSample } from '@domain/gesture/motion/motion-sample';

const DEFAULTS = {
  /** A stroke is motion this many times the area's resting level… */
  overRest: 4,
  /** …and at least this much (mean change per pixel of the area, 0–255). */
  minEnergy: 2,
  /** The resting level follows quieter frames quickly and louder ones slowly (share per frame): it tracks the quiet between strokes. */
  restDown: 0.3,
  restUp: 0.01,
  /** Two strokes are at least this far apart, seconds. */
  refractory: 0.09,
  /** The centre of the change must move this far (share of the area) to tell the direction; else it alternates. */
  minShift: 0.04,
} as const;

/**
 * **MotionStrumDetector** — strokes of a strumming hand the hand tracker can't see.
 *
 * @remarks
 * A fast strum blurs the hand so much that the landmark model loses it, often for most of the frames — the owner's
 * recording lost the strumming hand in 85 % of them. Its motion is still plain: a burst of change in the strumming
 * area, peaking as the hand sweeps the strings. Each burst that rises well above the area's resting level is one
 * stroke, played as its peak passes; its direction is where the change's centre moved (down or up), or the
 * opposite of the last stroke when that isn't clear — a strumming hand alternates.
 */
export class MotionStrumDetector {
  private rest = 0;
  private prev: MotionSample | null = null;
  private before: MotionSample | null = null;
  private lastStroke = -Infinity;
  private lastDirection: StrumDirection = StrumDirection.up;

  /** One frame's motion (null: none measured); returns a stroke's direction as one passes its peak. */
  update(sample: MotionSample | null, t: number): StrumDirection | null {
    if (!sample) {
      this.prev = null;
      this.before = null;
      return null;
    }
    const peak = this.prev;
    const beforePeak = this.before;
    this.before = this.prev;
    this.prev = sample;
    const threshold = Math.max(DEFAULTS.minEnergy, this.rest * DEFAULTS.overRest);
    this.rest += (sample.energy - this.rest) * (sample.energy < this.rest ? DEFAULTS.restDown : DEFAULTS.restUp);
    // The last frame was a peak: above the threshold, and no lower than either neighbour.
    if (!peak || peak.energy < threshold || peak.energy < sample.energy || (beforePeak && peak.energy < beforePeak.energy)) return null;
    if (t - this.lastStroke < DEFAULTS.refractory) return null;
    const shift = sample.cy - (beforePeak?.cy ?? peak.cy);
    const direction = Math.abs(shift) >= DEFAULTS.minShift ? (shift > 0 ? StrumDirection.down : StrumDirection.up) : this.lastDirection === StrumDirection.down ? StrumDirection.up : StrumDirection.down;
    this.lastStroke = t;
    this.lastDirection = direction;
    return direction;
  }
}
