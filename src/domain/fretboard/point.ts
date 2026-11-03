/** A 2-D point; screen pixels unless stated otherwise. */
export interface Point {
  readonly x: number;
  readonly y: number;
  /** Depth in the same units as x, smaller = closer to the camera; present only for tracked landmarks. */
  readonly z?: number;
}
