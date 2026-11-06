import type { HandDrumPlayer } from '@application/drums/hand-drum-player';
import { handDrumFor } from '@domain/drums/hand/hand-drum-catalog';
import type { Point } from '@domain/fretboard/point';
import type { Settings } from '@domain/settings/settings';
import type { InstrumentStage } from '@presentation/app/stages/instrument-stage';
import type { CameraView } from '@presentation/canvas/camera-view';
import type { StageRenderer } from '@presentation/canvas/stage-renderer';

const MS = 1000;

/** Every hand drum's page (darbuka, congas, handpan…): `HandDrumPlayer`; a click or tap strikes once per press. */
export class HandDrumStage implements InstrumentStage {
  private readonly down = new Set<number>();

  constructor(private readonly drums: HandDrumPlayer) {}

  handles(instrumentId: string): boolean {
    return handDrumFor(instrumentId) !== undefined;
  }

  fit(w: number, h: number, st: Settings): void {
    this.drums.configure(st.instrument, w, h);
  }

  track(hands: readonly (readonly Point[])[], now: number, audioNow: number): void {
    this.drums.updateHands(hands, now, audioNow);
  }

  draw(renderer: StageRenderer, now: number, hint: string | null, camera: CameraView): void {
    renderer.handDrum(this.drums, now, hint, camera);
  }

  pointer(id: number, p: Point | null, audioNow: number): void {
    if (!p) {
      this.down.delete(id);
      return;
    }
    if (this.down.has(id)) return;
    this.down.add(id);
    this.drums.tap(p, audioNow, performance.now() / MS);
  }

  sustain(): void {
    // A drum has no pedal to hold.
  }
}
