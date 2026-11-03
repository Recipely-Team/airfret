import type { Stick } from '@domain/drums/stick';
import { stickFromHand } from '@domain/drums/stick-from-hand';
import type { Point } from '@domain/fretboard/point';
import { OneEuroFilter } from '@domain/gesture/one-euro-filter';
import { HandLandmark } from '@domain/tracking/hand-landmark';

/** A stick stays visible this long after its hand drops out of tracking (fast strokes blur). */
const HOLD_SECONDS = 0.4;
/** A detected hand belongs to a stick if its wrist moved less than this fraction of the screen width. */
const MAX_JUMP_OF_WIDTH = 0.28;
/** Follows fast strokes closely while killing landmark jitter when still. */
const FILTER = { minCutoff: 2.2, beta: 0.09 } as const;

interface Slot {
  wrist: Point;
  stick: Stick;
  raw: Stick;
  seenAt: number;
  readonly filters: readonly [OneEuroFilter, OneEuroFilter, OneEuroFilter, OneEuroFilter];
}

/**
 * **StickTracker** — keeps each drumstick attached to the same hand, through tracking dropouts.
 *
 * @remarks
 * - Identity: each frame, detected hands are matched to the existing sticks by nearest wrist, so
 *   a hand dropping out never makes the other hand's stick jump over. A new hand takes the free
 *   stick on its side of the screen.
 * - Persistence: an unmatched stick is held where it was for `HOLD_SECONDS`, fading out, instead
 *   of vanishing on a single lost frame.
 * - Smoothing: One-Euro on grip and tip for drawing; hits use the unsmoothed tip, so no latency is added.
 */
export class StickTracker {
  private readonly slots: (Slot | null)[] = [null, null];

  /** Sticks for drawing (smoothed), with an opacity that fades while a stick is held. */
  visible(t: number): { stick: Stick; alpha: number }[] {
    return this.slots.flatMap((s) => (s ? [{ stick: s.stick, alpha: Math.max(0, 1 - (t - s.seenAt) / HOLD_SECONDS) }] : []));
  }

  /**
   * Feeds one camera frame. Returns, per stick slot, the unsmoothed tip seen *this* frame
   * (null while held or absent) — what the hit detectors should consume.
   */
  update(hands: readonly (readonly Point[])[], t: number, width: number): (Point | null)[] {
    const fresh: (Point | null)[] = [null, null];
    const unmatched = [...hands];
    // Match existing sticks to the nearest hand first.
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (!slot) continue;
      let best = -1;
      let bestD = width * MAX_JUMP_OF_WIDTH;
      unmatched.forEach((h, k) => {
        const w = h[HandLandmark.wrist];
        const d = w ? Math.hypot(w.x - slot.wrist.x, w.y - slot.wrist.y) : Infinity;
        if (d < bestD) [best, bestD] = [k, d];
      });
      const hand = best >= 0 ? unmatched.splice(best, 1)[0] : undefined;
      fresh[i] = hand ? this.refresh(i, hand, t) : null;
    }
    // New hands take a free stick, preferring the one on their side of the screen.
    for (const hand of unmatched) {
      const w = hand[HandLandmark.wrist];
      if (!w) continue;
      const side = w.x < width / 2 ? 0 : 1;
      const i = !this.slots[side] ? side : !this.slots[1 - side] ? 1 - side : -1;
      if (i >= 0) fresh[i] = this.refresh(i, hand, t);
    }
    // Drop sticks whose hand has been gone too long.
    this.slots.forEach((s, i) => {
      if (s && t - s.seenAt > HOLD_SECONDS) this.slots[i] = null;
    });
    return fresh;
  }

  private refresh(i: number, hand: readonly Point[], t: number): Point | null {
    const raw = stickFromHand(hand);
    const wrist = hand[HandLandmark.wrist];
    if (!raw || !wrist) return null;
    const slot = this.slots[i] ?? (this.slots[i] = {
      wrist, raw, stick: raw, seenAt: t,
      filters: [0, 1, 2, 3].map(() => new OneEuroFilter(FILTER.minCutoff, FILTER.beta)) as unknown as Slot['filters'],
    });
    const [gx, gy, tx, ty] = slot.filters;
    slot.wrist = wrist;
    slot.raw = raw;
    slot.seenAt = t;
    slot.stick = {
      grip: { x: gx.filter(raw.grip.x, t), y: gy.filter(raw.grip.y, t) },
      tip: { x: tx.filter(raw.tip.x, t), y: ty.filter(raw.tip.y, t) },
    };
    return raw.tip;
  }
}
