import type { Crossing } from '@domain/gesture/crossing';
import { StrumDirection } from '@domain/gesture/strum-direction';
import type { StrumOptions } from '@domain/gesture/strum-options';
import type { Point } from '@domain/fretboard/point';
import { clamp } from '@core/math/clamp';

const DEFAULTS: StrumOptions = { hysteresis: 0.016, minSpeed: 0.12, cooldown: 0.03, dropout: 0.18 };
const MIN_DT = 1e-3;
const ABOVE = -1;
const BELOW = 1;
const UNKNOWN = 0;
/** A fingertip put down this close to a string (share of the release band) is on it. */
const LANDED_OF_BAND = 0.5;

/**
 * **StrumDetector** — turns the strumming fingertip's path into string crossings.
 *
 * @remarks
 * - Each string has an armed side; it fires only when the tip moves from clearly above to clearly below (or back), so jitter on a string never retriggers it.
 * - Strings crossed within one camera frame get sub-frame times from where the path meets them, which is what makes a fast strum sound like a strum.
 * - A hand that vanishes and reappears elsewhere does not strum: long gaps forget the old position.
 */
export class StrumDetector {
  private prev: Point | null = null;
  private prevT = 0;
  private side: number[] = [];
  private lastFire: number[] = [];
  private readonly opts: StrumOptions;

  constructor(opts: Partial<StrumOptions> = {}) {
    this.opts = { ...DEFAULTS, ...opts };
  }

  reset(): void {
    this.prev = null;
    this.side = [];
  }

  /** Feeds one fingertip sample (null = not visible) and returns the strings it crossed. */
  update(p: Point | null, t: number, ys: readonly number[], h: number): Crossing[] {
    if (!p) {
      if (this.prev && t - this.prevT > this.opts.dropout) this.reset();
      return [];
    }
    const band = this.opts.hysteresis * h;
    if (this.side.length !== ys.length) return this.arm(p, t, ys, band);

    const prev = this.prev ?? p;
    const speed = Math.abs(p.y - prev.y) / Math.max(MIN_DT, t - this.prevT) / h;
    const out: Crossing[] = [];
    ys.forEach((y, i) => {
      const crossing = this.cross(i, y, p, prev, speed, t, band);
      if (crossing) out.push(crossing);
    });
    this.prev = p;
    this.prevT = t;
    return out.sort((a, b) => a.frac - b.frac);
  }

  /**
   * Strings the fingertip is pressing right now: it has crossed the string's line but not yet
   * pushed past the release band, so the string is bent under the finger and about to snap.
   */
  touching(p: Point | null, ys: readonly number[], h: number): number[] {
    if (!p || this.side.length !== ys.length) return [];
    const band = this.opts.hysteresis * h;
    return ys.flatMap((line, i) => {
      const d = p.y - line;
      const armed = this.side[i] ?? UNKNOWN;
      // Pressed in from one side; or landed right on it (a tap, a finger put down on the string).
      const isPressed = armed !== UNKNOWN && Math.sign(d) === -armed && Math.abs(d) <= band;
      return isPressed || (armed === UNKNOWN && Math.abs(d) <= band * LANDED_OF_BAND) ? [i] : [];
    });
  }

  /** Release distance in px: how far a string bends before it snaps off the finger. */
  releaseBand(h: number): number {
    return this.opts.hysteresis * h;
  }

  private arm(p: Point, t: number, ys: readonly number[], band: number): Crossing[] {
    this.side = ys.map((y) => sideOf(p.y, y, band));
    this.lastFire = ys.map(() => -Infinity);
    this.prev = p;
    this.prevT = t;
    return [];
  }

  private cross(i: number, line: number, p: Point, prev: Point, speed: number, t: number, band: number): Crossing | null {
    const now = sideOf(p.y, line, band);
    const was = this.side[i] ?? UNKNOWN;
    if (now === UNKNOWN || now === was) return null;
    this.side[i] = now;
    const isTooSlow = speed < this.opts.minSpeed;
    const isCoolingDown = t - (this.lastFire[i] ?? -Infinity) < this.opts.cooldown;
    if (was === UNKNOWN || isTooSlow || isCoolingDown) return null;
    this.lastFire[i] = t;
    const dy = p.y - prev.y;
    const frac = dy === 0 ? 1 : clamp((line - prev.y) / dy, 0, 1);
    const x = prev.x + (p.x - prev.x) * frac;
    return { string: i, x, frac, speed, dir: now === BELOW ? StrumDirection.down : StrumDirection.up };
  }
}

function sideOf(y: number, line: number, band: number): number {
  if (y < line - band) return ABOVE;
  if (y > line + band) return BELOW;
  return UNKNOWN;
}
