import type { StrumMark } from '@domain/lessons/chart/strum-mark';

/** Something the player must play at `beat`: a chord strum or a single note. */
export interface Target {
  readonly index: number;
  readonly beat: number;
  readonly dur: number;
  readonly chord?: string;
  readonly midi?: number;
  /** Other notes sounded with `midi` (bass line, inner voices), highest first; the guide plays them, grading uses `midi`. */
  readonly harmony?: readonly number[];
  readonly strum?: StrumMark;
}
