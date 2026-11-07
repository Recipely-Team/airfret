import type { Player } from '@application/play/player';
import { motionInZone } from '@domain/gesture/motion/motion-in-zone';
import { MotionStrumDetector } from '@domain/gesture/motion/motion-strum-detector';
import { PlayMode } from '@domain/instruments/play-mode';
import type { MotionGrid } from '@domain/tracking/motion-grid';

/** Motion strength (mean change per cell) to strum speed (screen heights a second): stronger motion, harder stroke. */
const SPEED = { base: 0.6, perEnergy: 0.25, min: 0.8, max: 3 } as const;

/**
 * **MotionStrummer** — the strums a fast strumming hand makes while the hand tracker has lost it to motion blur:
 * each burst of motion in the strumming area sweeps every string, down or up. It plays only while the strumming hand
 * isn't tracked (a tracked one strums for itself), not in Notes mode (motion can't tell which string), and not while
 * the instrument plays by itself.
 */
export class MotionStrummer {
  private readonly detector = new MotionStrumDetector();

  /** One camera frame: the picture's motion and the strumming area in it (shares of the frame), or null. */
  update(player: Player, grid: MotionGrid | null, zone: { x0: number; y0: number; x1: number; y1: number } | null, t: number, audioNow: number): void {
    const sample = grid && zone ? motionInZone(grid, zone) : null;
    const dir = this.detector.update(sample, t);
    if (!dir || !sample || player.strumHand || player.mode === PlayMode.note || player.isPerforming) return;
    const speed = Math.min(SPEED.max, Math.max(SPEED.min, SPEED.base + sample.energy * SPEED.perEnergy));
    player.motionStrum(dir, speed, audioNow);
  }
}
