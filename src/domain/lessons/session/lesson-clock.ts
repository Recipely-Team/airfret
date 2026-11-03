/** Wait before the count-in starts, so the first click is never late. */
const START_DELAY = 0.15;

/**
 * **LessonClock** — maps audio time to song beats; can freeze on a beat and resume from it.
 */
export class LessonClock {
  private anchorTime = 0;
  private anchorBeat = 0;
  private paused = false;

  constructor(private readonly bps: number) {}

  get isPaused(): boolean {
    return this.paused;
  }

  start(audioNow: number, firstBeat: number): void {
    this.anchorBeat = firstBeat;
    this.anchorTime = audioNow + START_DELAY;
    this.paused = false;
  }

  beatAt(audioTime: number): number {
    return this.paused ? this.anchorBeat : this.anchorBeat + (audioTime - this.anchorTime) * this.bps;
  }

  timeOfBeat(beat: number): number {
    return this.anchorTime + (beat - this.anchorBeat) / this.bps;
  }

  pauseAt(beat: number): void {
    this.paused = true;
    this.anchorBeat = beat;
  }

  /** Continues from the frozen beat as of `audioNow`. */
  resume(audioNow: number): void {
    this.paused = false;
    this.anchorTime = audioNow;
  }
}
