import type { PianoPlayer } from '@application/keys/piano-player';
import type { Point } from '@domain/fretboard/point';
import { isKeyboard } from '@domain/keys/keyboard-instruments';
import type { Settings } from '@domain/settings/settings';
import type { InstrumentStage } from '@presentation/app/stages/instrument-stage';
import type { CameraView } from '@presentation/canvas/camera-view';
import type { StageRenderer } from '@presentation/canvas/stage-renderer';

/** The keyboard instruments' page (piano, harpsichord): `PianoPlayer` with the selected one's keys. */
export class KeysStage implements InstrumentStage {
  constructor(private readonly piano: PianoPlayer) {}

  handles(instrumentId: string): boolean {
    return isKeyboard(instrumentId);
  }

  fit(w: number, h: number, st: Settings): void {
    this.piano.fit(w, h, st.instrument, st.pianoShift);
  }

  track(hands: readonly (readonly Point[])[], now: number, audioNow: number): void {
    this.piano.updateHands(hands, now, audioNow);
  }

  draw(renderer: StageRenderer, now: number, hint: string | null, camera: CameraView): void {
    renderer.piano(this.piano, now, hint, camera);
  }

  pointer(id: number, p: Point | null, audioNow: number): void {
    this.piano.pointer(id, p, audioNow);
  }

  sustain(isDown: boolean, audioNow: number): void {
    this.piano.setSustain(isDown, audioNow);
  }
}
