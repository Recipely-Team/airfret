import type { DrumHit } from '@domain/drums/drum-hit';
import type { DrumPad } from '@domain/drums/drum-pad';
import type { Point } from '@domain/fretboard/point';

const DEFAULTS = {
  /** Slower downward motion than this (screen heights per second) is not a stroke. */
  minSpeed: 0.35,
  /** The tip must come back above the head by this fraction of the pad's vertical radius before it can hit again. */
  rebound: 0.35,
  /** Speed (heights/s) that gives a full-strength hit. */
  fullSpeed: 3.2,
  /** Tracking gap after which the previous tip position is forgotten, seconds. */
  dropout: 0.15,
} as const;

/**
 * **HitDetector** — turns one stick tip's path into drum hits.
 *
 * @remarks
 * - Each pad has a "head line" through its centre. A hit fires when the tip crosses it *downward*
 *   (screen +y) inside the pad's horizontal extent — immediate, no waiting for the rebound.
 * - The crossing point and time are interpolated within the frame; velocity = 1 − e^(−v/v_full).
 * - After a hit the pad is disarmed until the tip rises back above it (rebound), so a stick resting
 *   on a head doesn't machine-gun.
 * - Where several pads overlap, the one whose head line is crossed first (highest on screen) wins.
 */
export class HitDetector {
  private prev: Point | null = null;
  private prevT = 0;
  private readonly armed = new Map<string, boolean>();

  update(tip: Point | null, t: number, pads: readonly DrumPad[], h: number): DrumHit[] {
    if (!tip) {
      if (this.prev && t - this.prevT > DEFAULTS.dropout) this.prev = null;
      return [];
    }
    const prev = this.prev;
    const dt = Math.max(1e-3, t - this.prevT);
    this.prev = tip;
    this.prevT = t;
    for (const pad of pads) {
      if (tip.y < pad.cy - pad.ry * DEFAULTS.rebound) this.armed.set(pad.piece, true);
    }
    if (!prev) return [];
    const dy = tip.y - prev.y;
    const speed = dy / dt / h;
    if (speed < DEFAULTS.minSpeed) return [];
    const hits: DrumHit[] = [];
    for (const pad of [...pads].sort((a, b) => a.cy - b.cy)) {
      if (this.armed.get(pad.piece) === false) continue;
      if (!(prev.y < pad.cy && tip.y >= pad.cy)) continue;
      const frac = (pad.cy - prev.y) / dy;
      const x = prev.x + (tip.x - prev.x) * frac;
      const across = Math.abs(x - pad.cx) / pad.rx;
      if (across > 1) continue;
      this.armed.set(pad.piece, false);
      hits.push({ piece: pad.piece, velocity: 1 - Math.exp(-speed / DEFAULTS.fullSpeed), radius: across, frac });
      break;
    }
    return hits;
  }
}
