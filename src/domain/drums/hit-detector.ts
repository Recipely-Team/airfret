import type { Point } from '@domain/fretboard/point';

const DEFAULTS = {
  /** Slower downward motion than this (screen heights per second) is not a stroke. */
  minSpeed: 0.35,
  /** Speed (heights/s) that gives a full-strength hit. */
  fullSpeed: 3.2,
  /** A falling tip that slows to this share of its fastest speed (or turns back) has struck. */
  impactSlowdown: 0.35,
  /** After a hit, the tip must lift this far (share of the screen height) before that pad can be hit again. */
  rearm: 0.02,
  /** A tip lost for longer than this (tracking blurs on fast strokes) is forgotten, seconds. */
  dropout: 0.25,
  /** The pad's outline, a little generous: a stroke landing just on its rim still counts. */
  reach: 1.08,
} as const;

type Pad<K extends string> = { readonly piece: K; readonly cx: number; readonly cy: number; readonly rx: number; readonly ry: number };
type Hit<K extends string> = { piece: K; velocity: number; radius: number; frac: number };

/**
 * **HitDetector** — turns one striking tip's path (a stick tip, a fingertip) into drum hits.
 *
 * @remarks
 * - A stroke is a fast downward movement that stops: the hand or stick meets the head and bounces. It fires where
 *   the tip strikes inside a pad — anywhere on it, at any height — when its downward speed collapses or turns back.
 * - A tip that crosses a pad's centre line on its way down fires at once, without waiting for the stop.
 * - After a hit a pad re-arms once the tip has lifted a little (`rearm`), not after climbing back above the head:
 *   fast, small strokes — a roll, a tremolo — each sound. Jitter of a still or resting hand stays far below that.
 * - Fast strokes blur, and tracking may lose the tip for a few frames: a tip that was falling and is found again
 *   lower down has struck.
 * - Where several pads overlap, the highest on screen wins.
 */
export class HitDetector {
  private prev: Point | null = null;
  private prevT = 0;
  /** The fastest downward speed of the current fall (0 when not falling). */
  private peak = 0;
  /** Per pad: the lowest point the tip has reached since its last hit (null: armed). */
  private readonly struckAt = new Map<string, number | null>();

  /**
   * One new sample of the tip; returns the hits it made. Works on any ellipse targets named by `piece` — the
   * kit's pads, a hand drum's heads.
   */
  update<K extends string>(tip: Point | null, t: number, pads: readonly Pad<K>[], h: number): Hit<K>[] {
    if (!tip) {
      if (this.prev && t - this.prevT > DEFAULTS.dropout) {
        this.prev = null;
        this.peak = 0;
      }
      return [];
    }
    // A tip not seen for too long (its hand left the picture) starts afresh.
    const prev = this.prev && t - this.prevT <= DEFAULTS.dropout ? this.prev : null;
    if (!prev) this.peak = 0;
    const dt = Math.max(1e-3, t - this.prevT);
    this.prev = tip;
    this.prevT = t;
    // Judge the movement up to this frame first, then let this frame's lift re-arm the pads for the next stroke.
    const hits = prev ? this.judge(prev, tip, (tip.y - prev.y) / dt / h, pads) : [];
    this.rearm(tip, pads, h);
    return hits;
  }

  private judge<K extends string>(prev: Point, tip: Point, speed: number, pads: readonly Pad<K>[]): Hit<K>[] {
    // On the way down, through a pad's centre line: hit at once.
    if (speed >= DEFAULTS.minSpeed) {
      this.peak = Math.max(this.peak, speed);
      const crossed = this.crossing(prev, tip, pads, speed);
      if (crossed) this.peak = 0;
      return crossed ? [crossed] : [];
    }
    // The fall has stopped (or turned back) — the stroke met the head.
    if (this.peak >= DEFAULTS.minSpeed && speed < this.peak * DEFAULTS.impactSlowdown) {
      const strength = this.peak;
      this.peak = 0;
      const hit = this.impact(speed > 0 ? tip : prev, pads, strength);
      return hit ? [hit] : [];
    }
    if (speed <= 0) this.peak = 0;
    return [];
  }

  /** A pad struck before re-arms once the tip has lifted far enough above the lowest point since. */
  private rearm<K extends string>(tip: Point, pads: readonly Pad<K>[], h: number): void {
    for (const pad of pads) {
      const low = this.struckAt.get(pad.piece);
      if (low === undefined || low === null) continue;
      if (tip.y > low) this.struckAt.set(pad.piece, tip.y);
      else if (low - tip.y >= DEFAULTS.rearm * h) this.struckAt.set(pad.piece, null);
    }
  }

  private crossing<K extends string>(prev: Point, tip: Point, pads: readonly Pad<K>[], speed: number): Hit<K> | null {
    for (const pad of [...pads].sort((a, b) => a.cy - b.cy)) {
      if (!(prev.y < pad.cy && tip.y >= pad.cy) || !this.isArmed(pad.piece)) continue;
      const frac = (pad.cy - prev.y) / (tip.y - prev.y);
      const x = prev.x + (tip.x - prev.x) * frac;
      const across = Math.abs(x - pad.cx) / pad.rx;
      if (across > 1) continue;
      return this.strike(pad, tip.y, speed, across, frac);
    }
    return null;
  }

  private impact<K extends string>(at: Point, pads: readonly Pad<K>[], speed: number): Hit<K> | null {
    for (const pad of [...pads].sort((a, b) => a.cy - b.cy)) {
      const inside = Math.hypot((at.x - pad.cx) / pad.rx, (at.y - pad.cy) / pad.ry);
      if (inside > DEFAULTS.reach || !this.isArmed(pad.piece)) continue;
      // It has already struck by now: sound it at once.
      return this.strike(pad, at.y, speed, Math.min(1, Math.abs(at.x - pad.cx) / pad.rx), 0);
    }
    return null;
  }

  private isArmed(piece: string): boolean {
    return (this.struckAt.get(piece) ?? null) === null;
  }

  private strike<K extends string>(pad: Pad<K>, y: number, speed: number, radius: number, frac: number): Hit<K> {
    this.struckAt.set(pad.piece, y);
    return { piece: pad.piece, velocity: 1 - Math.exp(-speed / DEFAULTS.fullSpeed), radius, frac };
  }
}
