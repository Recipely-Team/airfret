// Turns the strumming fingertip's path into string crossings.
//
// Each string has an "armed side". A crossing fires when the fingertip moves
// from clearly above a string to clearly below it (or back), so a hand resting
// on a string can jitter without retriggering it. Several strings crossed in
// one camera frame get sub-frame times from where the path intersects them —
// that's what makes a fast strum sound like a strum and not a block chord.

import type { Point } from '../tracking';

export interface Crossing {
  string: number;
  /** 0–1: where within the last frame interval the string was crossed. */
  frac: number;
  /** Fingertip speed in screen-heights per second. */
  speed: number;
  /** 1 = downstroke (towards the floor), -1 = upstroke. */
  dir: 1 | -1;
}

export interface StrumOptions {
  /** Dead band around each string, in screen heights. */
  hysteresis: number;
  /** Slower motion than this (heights/s) doesn't sound. */
  minSpeed: number;
  /** Same string can't fire twice faster than this, seconds. */
  cooldown: number;
}

const DEFAULTS: StrumOptions = { hysteresis: 0.012, minSpeed: 0.12, cooldown: 0.06 };

export class StrumDetector {
  private prev: Point | null = null;
  private prevT = 0;
  private side: number[] = [];
  private lastFire: number[] = [];
  private opts: StrumOptions;

  constructor(opts: Partial<StrumOptions> = {}) {
    this.opts = { ...DEFAULTS, ...opts };
  }

  reset(): void {
    this.prev = null;
    this.side = [];
  }

  get lastPoint(): Point | null {
    return this.prev;
  }

  /**
   * @param p fingertip in px, or null if the hand isn't visible / allowed to strum
   * @param t seconds
   * @param ys string y positions in px (top to bottom)
   * @param h screen height in px (units for speed and hysteresis)
   */
  update(p: Point | null, t: number, ys: number[], h: number): Crossing[] {
    if (!p) {
      // Short dropouts happen mid-strum (motion blur); keep state briefly.
      if (this.prev && t - this.prevT > 0.18) this.reset();
      return [];
    }
    const band = this.opts.hysteresis * h;
    if (this.side.length !== ys.length) {
      this.side = ys.map((y) => sideOf(p.y, y, band));
      this.lastFire = ys.map(() => -1);
      this.prev = p;
      this.prevT = t;
      return [];
    }
    const prev = this.prev ?? p;
    const dt = Math.max(1e-3, t - this.prevT);
    const dy = p.y - prev.y;
    const speed = Math.abs(dy) / dt / h;
    const out: Crossing[] = [];

    for (let i = 0; i < ys.length; i++) {
      const s = sideOf(p.y, ys[i], band);
      if (s === 0 || s === this.side[i]) continue;
      const was = this.side[i];
      this.side[i] = s;
      if (was === 0) continue; // first time we know which side we're on
      if (speed < this.opts.minSpeed) continue;
      if (t - this.lastFire[i] < this.opts.cooldown) continue;
      this.lastFire[i] = t;
      const frac = dy === 0 ? 1 : Math.min(1, Math.max(0, (ys[i] - prev.y) / dy));
      out.push({ string: i, frac, speed, dir: s > 0 ? 1 : -1 });
    }
    out.sort((a, b) => a.frac - b.frac);
    this.prev = p;
    this.prevT = t;
    return out;
  }
}

function sideOf(y: number, line: number, band: number): number {
  if (y < line - band) return -1;
  if (y > line + band) return 1;
  return 0;
}

/** Map fingertip speed to pluck strength: gentle brush ≈ 0.25, hard strum = 1. */
export function speedToAmp(speed: number): number {
  const a = 0.18 + 0.82 * (1 - Math.exp(-speed / 1.6));
  return Math.min(1, a);
}
