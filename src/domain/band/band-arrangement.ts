import type { BandSection } from '@domain/band/form/band-section';
import type { BandPlan } from '@domain/band/parts/band-plan';
import type { BandSeat } from '@domain/band/seating/band-seat';
import type { Song } from '@domain/lessons/catalog/song';

/** A band's arrangement of a song: who plays what, the sections as planned, and each member's part. */
export interface BandArrangement {
  readonly seats: readonly BandSeat[];
  readonly sections: readonly BandSection[];
  readonly plan: BandPlan;
  /**
   * Per seat, in order: its part as a song (a drum: the song itself), for a drum its plan bar by bar, and — when the
   * tune passes around — its level per section against its seat's (taking the tune: up; handing it over: down).
   */
  readonly parts: readonly { readonly seat: BandSeat; readonly song: Song; readonly drumPlan?: readonly number[]; readonly levels?: readonly number[] }[];
}
