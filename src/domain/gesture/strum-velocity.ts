const FLOOR = 0.18;
const SPEED_SCALE = 1.6;

/** Fingertip speed (heights/s) → pluck strength: a gentle brush ≈ 0.25, a hard strum → 1. */
export function speedToAmp(speed: number): number {
  return Math.min(1, FLOOR + (1 - FLOOR) * (1 - Math.exp(-speed / SPEED_SCALE)));
}
