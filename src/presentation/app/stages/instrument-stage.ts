import type { Point } from '@domain/fretboard/point';
import type { Settings } from '@domain/settings/settings';
import type { CameraView } from '@presentation/canvas/camera-view';
import type { StagePerformance } from '@presentation/app/stages/stage-performance';
import type { StageRenderer } from '@presentation/canvas/stage-renderer';

/**
 * An instrument page that isn't a fretted instrument (the keyboards, the darbuka): it sizes itself, takes the
 * tracked hands and the pointer, and draws its own frame. The app asks the stage that `handles` the selected
 * instrument; fretted instruments go through the `Player` instead.
 */
export interface InstrumentStage {
  handles(instrumentId: string): boolean;
  fit(w: number, h: number, st: Settings): void;
  track(hands: readonly (readonly Point[])[], now: number, audioNow: number): void;
  draw(renderer: StageRenderer, now: number, hint: string | null, camera: CameraView): void;
  /** A pointer (mouse button or touch) down at, moving to, or lifted from (null) a point. */
  pointer(id: number, p: Point | null, audioNow: number): void;
  /** Space held or let go (the piano's sustain pedal). */
  sustain(isDown: boolean, audioNow: number): void;
  /** Playing by itself, where the instrument can. */
  readonly performance?: StagePerformance;
}
