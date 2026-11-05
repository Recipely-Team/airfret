import type { PlayEvent } from '@application/play/play-event';
import type { Player } from '@application/play/player';
import { TourSession } from '@application/tour/tour-session';
import type { TourBar } from '@presentation/ui/tour-bar';

/** Runs the guided tour: starts it, feeds it frames and strums, and ends it into the first lesson. */
export class TourController {
  session: TourSession | null = null;

  constructor(
    private readonly bar: TourBar,
    /** The tour locks the mode switch like a lesson: on its end the whole UI must re-render, not only the instrument. */
    private readonly onEnded: () => void,
    private readonly onFinished: () => void,
  ) {}

  start(hasCamera: boolean): void {
    this.session = new TourSession(hasCamera);
    this.bar.show(true);
  }

  end(): void {
    if (!this.session) return;
    this.session = null;
    this.bar.show(false);
    this.onEnded();
  }

  /** Skips a step; on the last card, ends the tour and moves on. */
  skip(): void {
    if (this.session?.isDone) {
      this.end();
      this.onFinished();
    } else {
      this.session?.skip();
    }
  }

  tick(player: Player, now: number): void {
    this.session?.update(player, now);
  }

  onEvent(e: PlayEvent): void {
    this.session?.onEvent(e);
  }
}
