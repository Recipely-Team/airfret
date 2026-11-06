import type { DarbukaPlayer } from '@application/drums/darbuka-player';
import type { Point } from '@domain/fretboard/point';
import { DARBUKA_ID } from '@domain/drums/hand/darbuka-id';
import type { InstrumentStage } from '@presentation/app/stages/instrument-stage';
import type { CameraView } from '@presentation/canvas/camera-view';
import type { StageRenderer } from '@presentation/canvas/stage-renderer';

const MS = 1000;

/** The darbuka's page: `DarbukaPlayer`; a click or tap strikes where it lands (once per press). */
export class DarbukaStage implements InstrumentStage {
  private readonly down = new Set<number>();

  constructor(private readonly darbuka: DarbukaPlayer) {}

  handles(instrumentId: string): boolean {
    return instrumentId === DARBUKA_ID;
  }

  fit(w: number, h: number): void {
    this.darbuka.configure(w, h);
  }

  track(hands: readonly (readonly Point[])[], now: number, audioNow: number): void {
    this.darbuka.updateHands(hands, now, audioNow);
  }

  draw(renderer: StageRenderer, now: number, hint: string | null, camera: CameraView): void {
    renderer.darbuka(this.darbuka, now, hint, camera);
  }

  pointer(id: number, p: Point | null, audioNow: number): void {
    if (!p) {
      this.down.delete(id);
      return;
    }
    if (this.down.has(id)) return;
    this.down.add(id);
    this.darbuka.tap(p, audioNow, performance.now() / MS);
  }

  sustain(): void {
    // A drum has no pedal to hold.
  }
}
