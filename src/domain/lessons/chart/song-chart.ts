import type { Segment } from '@domain/lessons/chart/segment';
import type { Target } from '@domain/lessons/chart/target';

/** A song expanded into chord segments and playable targets. */
export interface SongChart {
  readonly segments: readonly Segment[];
  readonly targets: readonly Target[];
  /** Total length in beats. */
  readonly length: number;
}
