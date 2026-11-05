import type { Failure } from '@core/failure/failure';
import type { Result } from '@core/result/result';
import type { Clip } from '@domain/recording/clip';

/**
 * Records what the stage shows — the instrument, the hands (or their skeleton), the camera picture unless it is
 * hidden — together with everything the instrument plays.
 */
export interface ClipRecorderInterface {
  /** False where the browser can't record a canvas with sound; the record button isn't offered then. */
  readonly isSupported: boolean;
  readonly isRecording: boolean;
  start(): Result<void, Failure>;
  /** Ends the recording; the clip arrives once the browser has written its last piece. */
  stop(): Promise<Result<Clip, Failure>>;
  /** Frees the memory a clip holds, once it is saved or discarded. */
  release(clip: Clip): void;
}
