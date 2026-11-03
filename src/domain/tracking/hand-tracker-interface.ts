import type { Failure } from '@core/failure/failure';
import type { Result } from '@core/result/result';
import type { TrackedHand } from '@domain/tracking/tracked-hand';

/**
 * **HandTrackerInterface** — port for camera-based hand tracking.
 *
 * @remarks
 * - `start()` opens the camera and loads the model; it fails instead of throwing.
 * - `detect()` returns null when no new camera frame arrived since the last call.
 */
export interface HandTrackerInterface {
  start(): Promise<Result<void, Failure>>;
  detect(nowMs: number): TrackedHand[] | null;
  /** Size of the camera frame in pixels, for mapping landmarks onto the screen. */
  frameSize(): { width: number; height: number };
}
