import type { BandRole } from '@domain/band/band-role';
import type { CompPattern } from '@domain/band/comp-pattern';

/** One instrument's place in the band: its job, how it plays it, and how loud it sits in the mix. */
export interface BandSeat {
  readonly id: string;
  readonly role: BandRole;
  /** How a chord instrument plays the chords. */
  readonly pattern?: CompPattern;
  /** Which held chord tone a counter takes (0: the third, 1: the fifth, 2: the root), so two never double. */
  readonly voice?: number;
  /** The note it sits around (the middle of its range): a counter's line starts there. */
  readonly centre: number;
  /** 0–1: the tune leads, the bass is firm, the chords and lines under it stay back. */
  readonly gain: number;
}
