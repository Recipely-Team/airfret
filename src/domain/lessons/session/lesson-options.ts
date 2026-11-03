/** How a lesson is played. */
export interface LessonOptions {
  /** Tempo factor, 0.5–1. */
  readonly tempo: number;
  /** Stop at each target until it is played correctly. */
  readonly shouldWait: boolean;
  readonly isEasy: boolean;
  readonly hasDrums: boolean;
  /** Seconds subtracted from input times (camera + processing delay). */
  readonly latency: number;
}
