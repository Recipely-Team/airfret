/**
 * How much each patch of the camera picture changed since the last frame (0–255), on a coarse grid, mirrored as
 * the player sees it — where a hand moves too fast for the hand model to follow, its motion still shows here.
 */
export interface MotionGrid {
  readonly width: number;
  readonly height: number;
  /** Row by row, top to bottom; x runs left to right on screen. */
  readonly cells: Uint8Array;
}
