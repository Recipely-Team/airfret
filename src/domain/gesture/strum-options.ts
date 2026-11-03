/** Tuning knobs of the strum detector. */
export interface StrumOptions {
  /** Dead band around each string, in screen heights. */
  readonly hysteresis: number;
  /** Slower motion than this (heights/s) doesn't sound. */
  readonly minSpeed: number;
  /** The same string can't fire twice faster than this, seconds. */
  readonly cooldown: number;
  /** A tracking gap longer than this, seconds, forgets the previous position. */
  readonly dropout: number;
}
