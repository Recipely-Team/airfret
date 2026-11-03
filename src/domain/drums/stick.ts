import type { Point } from '@domain/fretboard/point';

/** A drumstick held in a tracked hand: where it's gripped and where its tip is. */
export interface Stick {
  readonly grip: Point;
  readonly tip: Point;
}
