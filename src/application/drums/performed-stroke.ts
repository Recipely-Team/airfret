import type { HandStroke } from '@domain/drums/hand/hand-stroke';
import type { RhythmStroke } from '@domain/drums/hand/rhythms/rhythm-stroke';

/** A stroke of a self-playing rhythm as it lands, for the stage to show: on which head, where, how hard. */
export interface PerformedStroke {
  readonly head: number;
  readonly part: RhythmStroke['part'];
  readonly stroke: HandStroke;
  readonly velocity: number;
}
