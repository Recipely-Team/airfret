import type { MotionSample } from '@domain/gesture/motion/motion-sample';
import type { MotionGrid } from '@domain/tracking/motion-grid';

/**
 * The motion inside one area of the picture (`zone`, as shares of the frame: 0 left/top … 1 right/bottom): its mean
 * change per cell, and where between the area's top and bottom that change was centred.
 */
export function motionInZone(grid: MotionGrid, zone: { readonly x0: number; readonly y0: number; readonly x1: number; readonly y1: number }): MotionSample | null {
  const gx0 = Math.max(0, Math.floor(Math.min(zone.x0, zone.x1) * grid.width));
  const gx1 = Math.min(grid.width, Math.ceil(Math.max(zone.x0, zone.x1) * grid.width));
  const gy0 = Math.max(0, Math.floor(Math.min(zone.y0, zone.y1) * grid.height));
  const gy1 = Math.min(grid.height, Math.ceil(Math.max(zone.y0, zone.y1) * grid.height));
  const cells = (gx1 - gx0) * (gy1 - gy0);
  if (cells <= 0) return null;
  let sum = 0;
  let weighted = 0;
  for (let y = gy0; y < gy1; y++) {
    for (let x = gx0; x < gx1; x++) {
      const d = grid.cells[y * grid.width + x] ?? 0;
      sum += d;
      weighted += d * (y - gy0 + 0.5);
    }
  }
  return { energy: sum / cells, cy: sum > 0 ? weighted / sum / (gy1 - gy0) : 0.5 };
}
