import type { Crossing } from '@domain/gesture/crossing';
import { StrumDirection } from '@domain/gesture/strum-direction';
import type { StrumOptions } from '@domain/gesture/strum-options';
import type { Point } from '@domain/fretboard/point';
import { clamp } from '@core/math/clamp';

const DEFAULTS: StrumOptions = { hysteresis: 0.012, minSpeed: 0.12, cooldown: 0.06, dropout: 0.18 };
const MIN_DT = 1e-3;
const ABOVE = -1;
const BELOW = 1;
const UNKNOWN = 0;

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
    const dy = p.y - prev.y;
    const speed = Math.abs(dy) / Math.max(MIN_DT, t - this.prevT) / h;
    const out: Crossing[] = [];
    ys.forEach((y, i) => {
      const crossing = this.cross(i, y, p.y, prev.y, dy, speed, t, band);
      if (crossing) out.push(crossing);
    });
    this.prev = p;
    this.prevT = t;
    return out.sort((a, b) => a.frac - b.frac);
  }

  private arm(p: Point, t: number, ys: readonly number[], band: number): Crossing[] {
    this.side = ys.map((y) => sideOf(p.y, y, band));
    this.lastFire = ys.map(() => -Infinity);
    this.prev = p;
    this.prevT = t;
    return [];
  }

  private cross(i: number, line: number, y: number, prevY: number, dy: number, speed: number, t: number, band: number): Crossing | null {
    const now = sideOf(y, line, band);
    const was = this.side[i] ?? UNKNOWN;
    if (now === UNKNOWN || now === was) return null;
    this.side[i] = now;
    const isTooSlow = speed < this.opts.minSpeed;
    const isCoolingDown = t - (this.lastFire[i] ?? -Infinity) < this.opts.cooldown;
    if (was === UNKNOWN || isTooSlow || isCoolingDown) return null;
    this.lastFire[i] = t;
    const frac = dy === 0 ? 1 : clamp((line - prevY) / dy, 0, 1);
    return { string: i, frac, speed, dir: now === BELOW ? StrumDirection.down : StrumDirection.up };
  }
}

function sideOf(y: number, line: number, band: number): number {
  if (y < line - band) return ABOVE;
  if (y > line + band) return BELOW;
  return UNKNOWN;
}
