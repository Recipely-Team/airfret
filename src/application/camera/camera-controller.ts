import type { HandTrackerInterface } from '@domain/tracking/hand-tracker-interface';

/**
 * Keeps the camera matching what is wanted — on while an instrument page is open after Start, unless the player
 * turned it off — and says whether hands are being tracked.
 *
 * @remarks
 * - The first time it is wanted the camera opens and the model loads; after that it is paused and reopened, so
 *   switching it off and on is quick and the camera light really goes out.
 * - A camera that failed to open isn't retried on every settings change — only once it has been unwanted and is
 *   wanted again (the player turns it off and on, or leaves the page and comes back).
 */
export class CameraController {
  private isLoaded = false;
  private isBusy = false;
  private hasFailed = false;
  private wanted = false;
  private on = false;

  constructor(
    private readonly tracker: HandTrackerInterface,
    /** Called when the camera can't open; the player plays with the mouse meanwhile. */
    private readonly onError: () => void,
    /** Called when tracking stops, so the last tracked hands don't stay on the stage. */
    private readonly onOff: () => void,
  ) {}

  /** Hands are being tracked right now. */
  get isOn(): boolean {
    return this.on;
  }

  async sync(isWanted: boolean): Promise<void> {
    this.wanted = isWanted;
    if (this.isBusy) return;
    if (!isWanted) {
      this.hasFailed = false;
      if (this.on) {
        this.tracker.pause();
        this.on = false;
        this.onOff();
      }
      return;
    }
    if (this.on || this.hasFailed) return;
    this.isBusy = true;
    const opened = this.isLoaded ? await this.tracker.resume() : await this.tracker.start();
    this.isBusy = false;
    this.isLoaded ||= opened.isOk;
    this.on = opened.isOk;
    if (!opened.isOk) {
      this.hasFailed = true;
      this.onError();
    }
    // Wanted changed while the camera was opening: settle on the latest wish.
    if (this.wanted !== isWanted) await this.sync(this.wanted);
  }
}
