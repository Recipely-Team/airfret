import type { StrumMark } from '@domain/lessons/chart/strum-mark';

/** Something the player must play at `beat`: a chord strum or a single note. */
export interface Target {
  readonly index: number;
  readonly beat: number;
  readonly dur: number;
  readonly chord?: string;
  readonly midi?: number;
  readonly strum?: StrumMark;
}
